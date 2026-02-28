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

    if (metrics.score > 0) {
      const existing = await prisma.missionAttempt.findFirst({
        where: { userId: req.userId!, missionId: mission.id, completed: false },
      });

      const completed = metrics.score >= 60;
      const xpEarned = metrics.xpEarned + metrics.bonusXp;

      if (existing) {
        await prisma.missionAttempt.update({
          where: { id: existing.id },
          data: {
            score: metrics.score,
            xpEarned,
            completed,
            architecture: JSON.stringify(architecture),
            metrics: JSON.stringify(metrics),
          },
        });
      } else {
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
      }

      // ── F-005: Spaced Repetition — update SR queue (fire-and-forget) ──────
      upsertSRItem(req.userId!, mission.id, metrics.score).catch((err) => {
        console.error('[SR] upsertSRItem failed:', err?.message);
      });

      if (completed) {
        // Award XP and recalculate level
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
