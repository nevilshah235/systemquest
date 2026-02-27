import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { scoreLLDSubmission } from '../services/lldScorer';

export const lldRouter = Router();
const prisma = new PrismaClient();

// ── GET /api/lld/:slug — check LLD availability and get reference (post-HLD-completion) ──
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

    res.json({
      missionSlug: mission.slug,
      missionTitle: mission.title,
      hldCompleted: !!hldCompleted,
      lldContent: hldCompleted && mission.lldContent ? JSON.parse(mission.lldContent) : null,
      previousAttempt: prevAttempt
        ? {
            classDesign: prevAttempt.classDesign,
            apiContracts: prevAttempt.apiContracts,
            dataSchema: prevAttempt.dataSchema,
            score: prevAttempt.score,
            feedback: JSON.parse(prevAttempt.feedback),
          }
        : null,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch LLD data' });
  }
});

// ── POST /api/lld/:slug/submit — submit and score an LLD attempt ──────────────
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

    // Require HLD to be completed first
    const hldCompleted = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: true },
    });
    if (!hldCompleted) {
      res.status(403).json({ error: 'Complete the HLD (architecture) phase first before submitting LLD' });
      return;
    }

    const scoreResult = scoreLLDSubmission({ classDesign, apiContracts, dataSchema }, mission.slug);

    // Upsert LLD attempt (one per user per mission — always overwrite with latest)
    const existing = await prisma.lLDAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id },
    });

    if (existing) {
      await prisma.lLDAttempt.update({
        where: { id: existing.id },
        data: {
          classDesign, apiContracts, dataSchema,
          score: scoreResult.score,
          feedback: JSON.stringify(scoreResult.feedback),
          xpEarned: scoreResult.xpEarned,
        },
      });
    } else {
      await prisma.lLDAttempt.create({
        data: {
          userId: req.userId!,
          missionId: mission.id,
          classDesign, apiContracts, dataSchema,
          score: scoreResult.score,
          feedback: JSON.stringify(scoreResult.feedback),
          xpEarned: scoreResult.xpEarned,
        },
      });
    }

    // Award XP for LLD
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
