import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

export const progressRouter = Router();
const prisma = new PrismaClient();

// GET /api/progress — user's overall progress
progressRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        missionAttempts: {
          where: { completed: true },
          include: { mission: true },
          orderBy: { updatedAt: 'desc' },
        },
        achievements: { include: { achievement: true } },
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const totalXp = user.xp;
    const level = user.level;
    const xpToNextLevel = levelThreshold(level + 1) - totalXp;

    res.json({
      xp: totalXp,
      level,
      xpToNextLevel: Math.max(0, xpToNextLevel),
      xpThisLevel: totalXp - levelThreshold(level),
      xpForLevel: levelThreshold(level + 1) - levelThreshold(level),
      completedMissions: user.missionAttempts.map((a) => ({
        missionSlug: a.mission.slug,
        missionTitle: a.mission.title,
        score: a.score,
        xpEarned: a.xpEarned,
        completedAt: a.updatedAt,
      })),
      achievements: user.achievements.map((ua) => ({
        slug: ua.achievement.slug,
        title: ua.achievement.title,
        description: ua.achievement.description,
        icon: ua.achievement.icon,
        unlockedAt: ua.unlockedAt,
      })),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

function levelThreshold(level: number): number {
  const thresholds: Record<number, number> = {
    1: 0, 2: 100, 3: 300, 4: 600, 5: 1000, 6: 1500,
  };
  return thresholds[level] ?? level * 300;
}
