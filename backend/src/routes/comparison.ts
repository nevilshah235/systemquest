import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';

export const comparisonRouter = Router();
const prisma = new PrismaClient();

// ── Types ──────────────────────────────────────────────────────────────────────────
interface RefComponent { type: string; }
interface RefConnection { from: string; to: string; }
interface ReferenceSolution {
  components: RefComponent[];
  connections: RefConnection[];
  keyInsights: string[];
  tradeoffs: Array<{ decision: string; reason: string }>;
  antiPatterns: string[];
}

interface UserComponent { type: string; id: string; }
interface UserConnection { from: string; to: string; id: string; }
interface UserArchitecture {
  components: UserComponent[];
  connections: UserConnection[];
}

// ── GET /api/comparison/:slug ─────────────────────────────────────────────────────
// Compare the user's best completed attempt against the mission reference solution.
comparisonRouter.get('/:slug', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: req.params.slug } });
    if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }
    if (!mission.referenceSolution) {
      res.status(404).json({ error: 'No reference solution available for this mission yet' });
      return;
    }

    // Get user's best completed attempt
    const attempt = await prisma.missionAttempt.findFirst({
      where: { userId: req.userId!, missionId: mission.id, completed: true },
      orderBy: { score: 'desc' },
    });
    if (!attempt) {
      res.status(404).json({ error: 'No completed attempt found — complete the mission first' });
      return;
    }

    const ref: ReferenceSolution = JSON.parse(mission.referenceSolution);
    const userArch: UserArchitecture = JSON.parse(attempt.architecture);

    // Normalise to sets of component types
    const refTypes  = new Set(ref.components.map((c) => c.type));
    const userTypes = new Set((userArch.components ?? []).map((c) => c.type));

    const matched: string[]  = [];
    const missing: string[]  = [];
    const extra: string[]    = [];

    for (const t of refTypes)  { (userTypes.has(t) ? matched : missing).push(t); }
    for (const t of userTypes) { if (!refTypes.has(t)) extra.push(t); }

    // Connection diff — compare as "from-type → to-type" pairs using component type lookup
    const userTypeMap = new Map((userArch.components ?? []).map((c) => [c.id, c.type]));
    const userConnPairs = new Set(
      (userArch.connections ?? []).map((c) => `${userTypeMap.get(c.from)}→${userTypeMap.get(c.to)}`),
    );
    const refConnPairs  = new Set(ref.connections.map((c) => `${c.from}→${c.to}`));

    const matchedConns  = [...refConnPairs].filter((p) => userConnPairs.has(p));
    const missingConns  = [...refConnPairs].filter((p) => !userConnPairs.has(p));

    // Mark comparison as viewed
    await prisma.missionAttempt.update({
      where: { id: attempt.id },
      data: { comparisonViewed: true },
    });

    res.json({
      attemptScore: attempt.score,
      components: { matched, missing, extra },
      connections: { matched: matchedConns, missing: missingConns },
      keyInsights: ref.keyInsights,
      tradeoffs: ref.tradeoffs,
      antiPatterns: ref.antiPatterns,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Comparison failed' });
  }
});
