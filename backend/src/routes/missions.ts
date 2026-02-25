import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

export const missionRouter = Router();
const prisma = new PrismaClient();

// GET /api/missions — list all missions with user progress
missionRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const missions = await prisma.mission.findMany({ orderBy: { order: 'asc' } });
    const attempts = await prisma.missionAttempt.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
    });

    const missionsWithProgress = missions.map((m) => {
      const userAttempts = attempts.filter((a) => a.missionId === m.id);
      const bestAttempt = userAttempts.find((a) => a.completed);
      return {
        ...m,
        objectives: JSON.parse(m.objectives),
        requirements: JSON.parse(m.requirements),
        components: JSON.parse(m.components),
        feedbackData: JSON.parse(m.feedbackData),
        userProgress: {
          completed: !!bestAttempt,
          bestScore: bestAttempt?.score ?? null,
          xpEarned: bestAttempt?.xpEarned ?? null,
          attempts: userAttempts.length,
        },
      };
    });

    res.json(missionsWithProgress);
  } catch {
    res.status(500).json({ error: 'Failed to fetch missions' });
  }
});

// GET /api/missions/:slug — single mission detail
missionRouter.get('/:slug', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    // Get latest attempt for auto-save restore
    const latestAttempt = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id },
      orderBy: { updatedAt: 'desc' },
    });

    res.json({
      ...mission,
      objectives: JSON.parse(mission.objectives),
      requirements: JSON.parse(mission.requirements),
      components: JSON.parse(mission.components),
      feedbackData: JSON.parse(mission.feedbackData),
      savedArchitecture: latestAttempt?.architecture ? JSON.parse(latestAttempt.architecture) : null,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch mission' });
  }
});

// POST /api/missions/:slug/save — auto-save architecture
missionRouter.post('/:slug/save', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    const existing = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: false },
    });

    if (existing) {
      await prisma.missionAttempt.update({
        where: { id: existing.id },
        data: { architecture: JSON.stringify(req.body.architecture) },
      });
    } else {
      await prisma.missionAttempt.create({
        data: {
          userId: req.userId!,
          missionId: mission.id,
          architecture: JSON.stringify(req.body.architecture),
        },
      });
    }

    res.json({ saved: true });
  } catch {
    res.status(500).json({ error: 'Failed to save architecture' });
  }
});
