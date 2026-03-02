import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

export const missionRouter = Router();
const prisma = new PrismaClient();

// ── GET /api/missions/stats — public, no auth required ────────────────────────────
// Returns platform-wide totals for landing page counters.
missionRouter.get('/stats', async (_req, res: Response): Promise<void> => {
  try {
    const [total, xpSum] = await Promise.all([
      prisma.mission.count(),
      prisma.mission.aggregate({ _sum: { xpReward: true } }),
    ]);
    res.json({
      totalMissions: total,
      totalXP: xpSum._sum.xpReward ?? 0,
    });
  } catch {
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ── Server-side path unlock logic ─────────────────────────────────────────────────
/**
 * Determines lock status for every mission based on:
 *  1. Foundations path: sequential — first mission always open; next requires previous complete
 *  2. Non-foundations paths: fully locked until the Foundations path is 100% complete
 *  3. Within an unlocked non-foundations path: sequential unlock
 */
function computeLockedStatus(
  missions: Array<{ id: number; order: number; learningPath: string }>,
  completedIds: Set<number>,
): Map<number, { isLocked: boolean; lockReason: string | null }> {
  const result = new Map<number, { isLocked: boolean; lockReason: string | null }>();

  // Group by path, sorted by global `order` (preserves within-path sequence)
  const byPath = new Map<string, typeof missions>();
  for (const m of missions) {
    const group = byPath.get(m.learningPath) ?? [];
    group.push(m);
    byPath.set(m.learningPath, group);
  }
  for (const [path, group] of byPath) {
    group.sort((a, b) => a.order - b.order);
    byPath.set(path, group);
  }

  // Is the entire foundations path finished?
  const foundationsMissions = byPath.get('foundations') ?? [];
  const foundationsComplete =
    foundationsMissions.length > 0 &&
    foundationsMissions.every((m) => completedIds.has(m.id));

  for (const [path, group] of byPath) {
    if (path === 'foundations') {
      // Sequential unlock within foundations
      group.forEach((m, idx) => {
        if (idx === 0) {
          result.set(m.id, { isLocked: false, lockReason: null });
        } else {
          const prevDone = completedIds.has(group[idx - 1].id);
          result.set(m.id, {
            isLocked: !prevDone,
            lockReason: prevDone ? null : 'Complete the previous mission to unlock this one',
          });
        }
      });
    } else {
      if (!foundationsComplete) {
        // Gate: entire non-foundations path is locked until Foundations finishes
        group.forEach((m) =>
          result.set(m.id, {
            isLocked: true,
            lockReason: 'Complete the Foundations path to unlock this learning path',
          }),
        );
      } else {
        // Sequential unlock within the now-open path
        group.forEach((m, idx) => {
          if (idx === 0) {
            result.set(m.id, { isLocked: false, lockReason: null });
          } else {
            const prevDone = completedIds.has(group[idx - 1].id);
            result.set(m.id, {
              isLocked: !prevDone,
              lockReason: prevDone ? null : 'Complete the previous mission in this path to unlock',
            });
          }
        });
      }
    }
  }

  return result;
}

// ── GET /api/missions ─────────────────────────────────────────────────────────────
// List all missions with user progress + server-enforced isLocked / lockReason fields
missionRouter.get('/', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const missions = await prisma.mission.findMany({ orderBy: { order: 'asc' } });
    const attempts = await prisma.missionAttempt.findMany({
      where: { userId: req.userId! },
      orderBy: { updatedAt: 'desc' },
    });

    const completedIds = new Set<number>(
      attempts.filter((a) => a.completed).map((a) => a.missionId),
    );
    const lockStatus = computeLockedStatus(
      missions.map((m) => ({ id: m.id, order: m.order, learningPath: m.learningPath })),
      completedIds,
    );

    const missionsWithProgress = missions.map((m) => {
      const userAttempts = attempts.filter((a) => a.missionId === m.id);
      const bestAttempt = userAttempts.find((a) => a.completed);
      const lock = lockStatus.get(m.id) ?? { isLocked: false, lockReason: null };
      return {
        ...m,
        objectives: JSON.parse(m.objectives),
        requirements: JSON.parse(m.requirements),
        components: JSON.parse(m.components),
        feedbackData: JSON.parse(m.feedbackData),
        isLocked: lock.isLocked,
        lockReason: lock.lockReason,
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

// ── GET /api/missions/:slug ───────────────────────────────────────────────────────
// Single mission detail — returns 403 Forbidden if the mission is locked
missionRouter.get('/:slug', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) {
      res.status(404).json({ error: 'Mission not found' });
      return;
    }

    // Re-derive lock status across all missions to enforce the gate server-side
    const allMissions = await prisma.mission.findMany({ orderBy: { order: 'asc' } });
    const attempts = await prisma.missionAttempt.findMany({ where: { userId: req.userId! } });
    const completedIds = new Set<number>(
      attempts.filter((a) => a.completed).map((a) => a.missionId),
    );
    const lockStatus = computeLockedStatus(
      allMissions.map((m) => ({ id: m.id, order: m.order, learningPath: m.learningPath })),
      completedIds,
    );

    const lock = lockStatus.get(mission.id) ?? { isLocked: false, lockReason: null };
    if (lock.isLocked) {
      res.status(403).json({ error: 'Mission locked', lockReason: lock.lockReason });
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

// ── POST /api/missions/:slug/save ─────────────────────────────────────────────────
// Auto-save architecture draft
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
