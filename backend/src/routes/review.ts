/**
 * Spaced Repetition Review Routes — F-005
 * GET  /api/review/queue          — returns all due-for-review items
 * GET  /api/review/queue/all      — returns full queue (including future items)
 * POST /api/review/:slug/snooze   — snooze item by 3 days
 */
import { Router, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { getReviewQueue, getFullQueue, snoozeItem } from '../services/spacedRepetitionService';

export const reviewRouter = Router();

// GET /api/review/queue — items due now (nextReviewAt <= now)
reviewRouter.get('/queue', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queue = await getReviewQueue(req.userId!);
    res.json({ queue, count: queue.length });
  } catch {
    res.status(500).json({ error: 'Failed to fetch review queue' });
  }
});

// GET /api/review/queue/all — all active items including future ones
reviewRouter.get('/queue/all', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const queue = await getFullQueue(req.userId!);
    const dueCount = queue.filter((i) => i.isDue).length;
    res.json({ queue, count: queue.length, dueCount });
  } catch {
    res.status(500).json({ error: 'Failed to fetch full queue' });
  }
});

// POST /api/review/:slug/snooze — push review date by 3 days
reviewRouter.post('/:slug/snooze', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await snoozeItem(req.userId!, req.params.slug);
    res.json({ snoozed: true, message: 'Review pushed back 3 days' });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Failed to snooze item';
    res.status(400).json({ error: msg });
  }
});
