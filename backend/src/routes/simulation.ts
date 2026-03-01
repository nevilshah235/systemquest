import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { runSimulation, Architecture } from '../services/simulationEngine';
import { promoteIfEarned, SkillLevel } from '../services/skillService';
import { upsertSRItem } from '../services/spacedRepetitionService';
import { refreshMistakePatterns } from '../services/mistakePatternService';

export const simulationRouter = Router();
const prisma = new PrismaClient();

// POST /api/simulation/run
simulationRouter.post('/run', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { missionSlug, architecture } = req.body as { missionSlug: string; architecture: Architecture };

  if (!missionSlug || !architecture) {
    res.status(400).json({ error: 'missionSlug and architecture required' });
    return;
  }

  try {
    const mission = await prisma.mission.findUnique({ where: { slug: missionSlug } });
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    const requirements = JSON.parse(mission.requirements);
    const metrics = runSimulation(architecture, {
      latencyMs: requirements.performance.latencyMs,
      availability: requirements.performance.availability,
      throughput: requirements.traffic.concurrent,
      budget: requirements.budget,
      baseXp: mission.xpReward,
      bonusComponents: requirements.bonus,
    });

    // ── Persist attempt ──────────────────────────────────────────────────────
    let skillPromotion: { promoted: boolean; newLevel: SkillLevel; derivedSkillLevel: SkillLevel } | null = null;
    let xpGranted = 0; // only set when XP is actually awarded (first completion only)

    if (metrics.score > 0) {
      const completed = metrics.score >= 60;

      // Check if the user has ALREADY completed this mission (any prior passing attempt)
      const priorCompletion = await prisma.missionAttempt.findFirst({
        where: { userId: req.userId!, missionId: mission.id, completed: true },
      });
      const isReplay = !!priorCompletion;

      // XP is only awarded on the FIRST completion — never on replays
      const xpEarned = completed && !isReplay ? metrics.xpEarned + metrics.bonusXp : 0;

      // Upsert: update the existing in-progress attempt, or create a new one
      const inProgress = await prisma.missionAttempt.findFirst({
        where: { userId: req.userId!, missionId: mission.id, completed: false },
      });

      if (inProgress) {
        await prisma.missionAttempt.update({
          where: { id: inProgress.id },
          data: {
            score: metrics.score,
            xpEarned,
            completed,
            architecture: JSON.stringify(architecture),
            metrics: JSON.stringify(metrics),
          },
        });
      } else if (!isReplay) {
        // Only create a new attempt record if this is not a replay of an already-completed mission
        await prisma.missionAttempt.create({
          data: {
            userId: req.userId!,
            missionId: mission.id,
            score: metrics.score,
            xpEarned,
            completed,
            architecture: JSON.stringify(architecture),
            metrics: JSON.stringify(metrics),
          },
        });
      } else {
        // Replay of a completed mission — update the best score if improved
        if (metrics.score > priorCompletion.score) {
          await prisma.missionAttempt.update({
            where: { id: priorCompletion.id },
            data: {
              score: metrics.score,
              architecture: JSON.stringify(architecture),
              metrics: JSON.stringify(metrics),
            },
          });
        }
      }

      // ── F-005: Spaced Repetition — update SR queue (fire-and-forget) ──────
      upsertSRItem(req.userId!, mission.id, metrics.score).catch((err) => {
        console.error('[SR] upsertSRItem failed:', err?.message);
      });

      if (completed && !isReplay) {
        // Award XP only on first completion — set outer xpGranted for the response
        xpGranted = xpEarned;
        const updatedUser = await prisma.user.update({
          where: { id: req.userId! },
          data: { xp: { increment: xpEarned } },
          select: { xp: true },
        });
        const newLevel = calculateLevel(updatedUser.xp);
        await prisma.user.update({
          where: { id: req.userId! },
          data: { level: newLevel },
        });

        // ── Adaptive skill promotion ──────────────────────────────────────────
        const promotion = await promoteIfEarned(req.userId!);
        skillPromotion = promotion;

        // ── F-003: Mistake Patterns — refresh report async ───────────────────
        refreshMistakePatterns(req.userId!).catch((err) => {
          console.error('[Patterns] refresh failed:', err?.message);
        });
      }
    }

    res.json({
      metrics,
      missionTitle: mission.title,
      skillPromotion,
      xpGranted, // 0 on replays, actual XP on first completion
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

// ── XP → Level threshold ──────────────────────────────────────────────────────────
function calculateLevel(totalXp: number): number {
  if (totalXp < 100)  return 1;
  if (totalXp < 300)  return 2;
  if (totalXp < 600)  return 3;
  if (totalXp < 1000) return 4;
  if (totalXp < 1500) return 5;
  return Math.floor(totalXp / 300) + 1;
}
