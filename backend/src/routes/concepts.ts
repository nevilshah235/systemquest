import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { CONCEPTS, rankConceptsByGap, STARTER_CONCEPTS } from '../data/concepts';

export const conceptsRouter = Router();
const prisma = new PrismaClient();

// GET /api/concepts/recommendations
// Returns personalised concept gap cards ranked by performance history.
conceptsRouter.get('/recommendations', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const attempts = await prisma.missionAttempt.findMany({
      where: { userId: req.userId! },
      include: { mission: { select: { slug: true, skillLevel: true } } },
      orderBy: { updatedAt: 'desc' },
    });

    if (attempts.length === 0) {
      // Brand-new user — return curated starter concepts
      res.json({ concepts: STARTER_CONCEPTS.slice(0, 6), source: 'starter' });
      return;
    }

    // Missions attempted with score < 90 (struggling)
    const weakSlugs = attempts
      .filter((a) => a.score < 90)
      .map((a) => a.mission.slug);

    // Missions the user has never touched — find all mission slugs from DB
    const allMissions = await prisma.mission.findMany({ select: { slug: true } });
    const attemptedSlugs = new Set(attempts.map((a) => a.mission.slug));
    const notAttemptedSlugs = allMissions
      .map((m) => m.slug)
      .filter((s) => !attemptedSlugs.has(s));

    const ranked = rankConceptsByGap(weakSlugs, notAttemptedSlugs);

    // Cap at 8 recommendations; if none from gap analysis, fall back to starters
    const concepts = ranked.length > 0 ? ranked.slice(0, 8) : STARTER_CONCEPTS.slice(0, 6);

    res.json({ concepts, source: ranked.length > 0 ? 'gap-analysis' : 'starter' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate recommendations' });
  }
});

// GET /api/concepts — full taxonomy (for browsing)
conceptsRouter.get('/', authenticate, (_req: AuthRequest, res: Response) => {
  res.json({ concepts: CONCEPTS });
});
