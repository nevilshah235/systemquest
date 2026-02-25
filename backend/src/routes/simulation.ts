import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { runSimulation, Architecture } from '../services/simulationEngine';

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

    // Save/update attempt if score qualifies (> 50)
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

      // Award XP if mission completed
      if (completed) {
        await prisma.user.update({
          where: { id: req.userId! },
          data: {
            xp: { increment: xpEarned },
            level: { set: calculateLevel(xpEarned) },
          },
        });
      }
    }

    res.json({ metrics, missionTitle: mission.title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Simulation failed' });
  }
});

function calculateLevel(xp: number): number {
  if (xp < 100) return 1;
  if (xp < 300) return 2;
  if (xp < 600) return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  return Math.floor(xp / 300) + 1;
}
