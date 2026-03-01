/**
 * Mistake Patterns Routes — F-003
 * GET  /api/patterns         — fetch pattern report (auto-refreshes if stale)
 * POST /api/patterns/refresh — force refresh (called after mission submission)
 */
import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { refreshMistakePatterns, getMistakePatterns } from '../services/mistakePatternService';

export const patternsRouter = Router();
const prisma = new PrismaClient();

// GET /api/patterns — returns pattern report for the authenticated user
patternsRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const completedCount = await prisma.missionAttempt.count({
      where: { userId: req.userId!, completed: true },
    });

    if (completedCount < 3) {
      res.json({
        patterns: [],
        hasEnoughData: false,
        completedCount,
        requiredCount: 3,
      });
      return;
    }

    // Refresh on every view (idempotent upsert — cheap enough for SQLite)
    await refreshMistakePatterns(req.userId!);
    const patterns = await getMistakePatterns(req.userId!);

    res.json({
      patterns,
      hasEnoughData: true,
      completedCount,
      refreshedAt: new Date().toISOString(),
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch mistake patterns' });
  }
});

// POST /api/patterns/refresh — force a full pattern recompute
patternsRouter.post('/refresh', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await refreshMistakePatterns(req.userId!);
    const patterns = await getMistakePatterns(req.userId!);
    res.json({ patterns, refreshedAt: new Date().toISOString() });
  } catch {
    res.status(500).json({ error: 'Failed to refresh patterns' });
  }
});
