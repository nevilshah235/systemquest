import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scoreLLDSubmission as scoreLegacy } from '../services/lldScorer';
import {
  scoreLLDSubmission,
  type LLDBuilderSubmission,
  type LLDMissionConfig,
  type AttemptRecord,
} from '../services/LLDScoringService';

export const lldRouter = Router();
const prisma = new PrismaClient();

// ── GET /api/lld/:slug — LLD availability, config, and previous attempt ───────
lldRouter.get('/:slug', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
    if (!mission.lldEnabled) {
      res.status(404).json({ error: 'LLD phase not available for this mission yet' });
      return;
    }

    // Check if user has completed HLD first
    const hldCompleted = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: true },
    });

    // Get previous LLD attempt if any
    const prevAttempt = await prisma.lLDAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id },
      orderBy: { updatedAt: 'desc' },
    });

    // Parse lldConfig if present (drives the interactive builder)
    const lldConfig = mission.lldConfig ? JSON.parse(mission.lldConfig) : null;

    res.json({
      missionSlug: mission.slug,
      missionTitle: mission.title,
      hldCompleted: !!hldCompleted,
      // Legacy hints (used when lldConfig is absent)
      lldContent: hldCompleted && mission.lldContent ? JSON.parse(mission.lldContent) : null,
      // Interactive builder config (present → use new LLDBuilder UI)
      lldConfig: hldCompleted ? lldConfig : null,
      previousAttempt: prevAttempt
        ? (() => {
            // lldState may be { submission, attemptHistory } (new format) or raw submission (legacy)
            let lldState: Record<string, unknown> | null = null;
            let attemptHistory: AttemptRecord[] = [];
            if (prevAttempt.lldState) {
              const parsed = JSON.parse(prevAttempt.lldState);
              if (parsed && typeof parsed === 'object' && 'submission' in parsed) {
                lldState = parsed.submission; // new format — extract builder state
                attemptHistory = parsed.attemptHistory ?? [];
              } else {
                lldState = parsed; // legacy format — raw state
              }
            }
            return {
              classDesign: prevAttempt.classDesign,
              apiContracts: prevAttempt.apiContracts,
              dataSchema: prevAttempt.dataSchema,
              lldState,
              score: prevAttempt.score,
              feedback: JSON.parse(prevAttempt.feedback),
              attemptHistory,
            };
          })()
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch LLD data' });
  }
});

// ── POST /api/lld/:slug/score — structured interactive builder submission ─────
lldRouter.post('/:slug/score', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const submission = req.body as LLDBuilderSubmission;

    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
    if (!mission.lldEnabled) {
      res.status(403).json({ error: 'LLD phase not available for this mission' });
      return;
    }
    if (!mission.lldConfig) {
      res.status(400).json({ error: 'Mission has no LLD config — use /submit for legacy scoring' });
      return;
    }

    // Require HLD completion
    const hldCompleted = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: true },
    });
    if (!hldCompleted) {
      res.status(403).json({ error: 'Complete the HLD (architecture) phase first' });
      return;
    }

    const config: LLDMissionConfig = JSON.parse(mission.lldConfig);
    const result = await scoreLLDSubmission(submission, config);

    // ── Attempt history tracking (US-LLD-03) ─────────────────────────────────
    const existing = await prisma.lLDAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id },
    });

    let previousScore: number | undefined;
    let attemptHistory: AttemptRecord[] = [];
    let incrementalXP = result.xpEarned;

    if (existing) {
      previousScore = existing.score;
      // Parse existing lldState to extract attempt history
      if (existing.lldState) {
        const parsedState = JSON.parse(existing.lldState);
        if (parsedState && typeof parsedState === 'object' && 'attemptHistory' in parsedState) {
          attemptHistory = parsedState.attemptHistory ?? [];
        }
      }
      // Only award XP above the learner's previous best (no farming on resubmit)
      incrementalXP = Math.max(0, result.xpEarned - existing.xpEarned);
    }

    const newAttemptRecord: AttemptRecord = {
      attempt: attemptHistory.length + 1,
      score: result.score,
      xpEarned: result.xpEarned,
      timestamp: Date.now(),
    };
    const updatedHistory = [...attemptHistory, newAttemptRecord].slice(-10); // keep last 10

    // Enrich result with attempt tracking fields
    const scoreDelta = previousScore !== undefined ? result.score - previousScore : undefined;
    result.previousScore   = previousScore;
    result.scoreDelta      = scoreDelta;
    result.attemptNumber   = newAttemptRecord.attempt;
    result.attemptHistory  = updatedHistory;

    // Derive human-readable text for legacy columns (search/display use)
    const classDesignText = submission.entities
      .map(e => `${e.name}: ${e.fields.map(f => `${f.name} (${f.type}${f.isPrimaryKey ? ', PK' : ''})`).join(', ')}`)
      .join('\n');
    const apiContractsText = submission.restEndpoints
      .map(ep => `${ep.method} ${ep.path} → ${JSON.stringify(ep.responseShape)}`)
      .join('\n');
    const dataSchemaText = submission.entities
      .map(e => {
        const idx = e.fields.filter(f => f.hasIndex).map(f => f.name).join(', ');
        return `${e.name}(${e.fields.map(f => `${f.name} ${f.type}`).join(', ')})${idx ? ` INDEX ON (${idx})` : ''}`;
      })
      .join('\n');

    // Store { submission, attemptHistory } in lldState for future retrieval
    const data = {
      classDesign: classDesignText,
      apiContracts: apiContractsText,
      dataSchema: dataSchemaText,
      lldState: JSON.stringify({ submission, attemptHistory: updatedHistory }),
      score: result.score,
      feedback: JSON.stringify(result.feedback),
      xpEarned: result.xpEarned, // store best xpEarned for incremental calc
    };

    if (existing) {
      await prisma.lLDAttempt.update({ where: { id: existing.id }, data });
    } else {
      await prisma.lLDAttempt.create({
        data: { userId: req.userId!, missionId: mission.id, ...data },
      });
    }

    // Award only incremental XP (delta above previous best)
    if (incrementalXP > 0) {
      await prisma.user.update({
        where: { id: req.userId! },
        data: { xp: { increment: incrementalXP } },
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LLD scoring failed' });
  }
});

// ── POST /api/lld/:slug/submit — legacy textarea submission (preserved) ───────
lldRouter.post('/:slug/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { classDesign, apiContracts, dataSchema } = req.body as {
      classDesign: string; apiContracts: string; dataSchema: string;
    };

    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
    if (!mission.lldEnabled) {
      res.status(403).json({ error: 'LLD phase not available for this mission' });
      return;
    }

    const hldCompleted = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: true },
    });
    if (!hldCompleted) {
      res.status(403).json({ error: 'Complete the HLD (architecture) phase first before submitting LLD' });
      return;
    }

    const scoreResult = scoreLegacy({ classDesign, apiContracts, dataSchema }, mission.slug);

    const existing = await prisma.lLDAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id },
    });

    const data = {
      classDesign, apiContracts, dataSchema,
      score: scoreResult.score,
      feedback: JSON.stringify(scoreResult.feedback),
      xpEarned: scoreResult.xpEarned,
    };

    if (existing) {
      await prisma.lLDAttempt.update({ where: { id: existing.id }, data });
    } else {
      await prisma.lLDAttempt.create({
        data: { userId: req.userId!, missionId: mission.id, ...data },
      });
    }

    await prisma.user.update({
      where: { id: req.userId! },
      data: { xp: { increment: scoreResult.xpEarned } },
    });

    res.json({
      score: scoreResult.score,
      xpEarned: scoreResult.xpEarned,
      feedback: scoreResult.feedback,
      breakdown: scoreResult.breakdown,
      referenceUnlocked: scoreResult.score >= 50 && !!mission.lldContent,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'LLD submission failed' });
  }
});
