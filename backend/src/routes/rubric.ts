/**
 * Rubric routes — Living Rubrics Phase 4
 *
 * POST /api/rubric/evaluate
 *   Body: { missionSlug, missionTitle, requirements, topology, architecture }
 *   Returns: RubricScore (or 204 when AI unavailable)
 *
 * GET  /api/rubric/:missionSlug
 *   Returns: { version, items } — the current approved rubric (read-only)
 */

import { Router, Request, Response } from 'express';
import { evaluateArchitecture, getRubric } from '../services/rubricService';

export const rubricRouter = Router();

// ── POST /api/rubric/evaluate ───────────────────────────────────────────────

rubricRouter.post('/evaluate', async (req: Request, res: Response) => {
  const {
    missionSlug,
    missionTitle,
    requirements,
    topology,      // SolutionTopology: { componentTypes, connections }
    architecture,  // UserArchitecture:  { components, connections }
  } = req.body;

  if (!missionSlug || !missionTitle || !requirements || !topology || !architecture) {
    return res.status(400).json({ error: 'missionSlug, missionTitle, requirements, topology and architecture are required' });
  }

  const result = await evaluateArchitecture(
    missionSlug,
    missionTitle,
    requirements,
    topology,
    architecture,
  );

  if (!result) {
    // AI unavailable — caller uses static fallback
    return res.status(204).send();
  }

  return res.json(result);
});

// ── GET /api/rubric/:missionSlug ──────────────────────────────────────────────

rubricRouter.get('/:missionSlug', async (req: Request, res: Response) => {
  const { missionSlug } = req.params;
  const rubric = await getRubric(missionSlug);

  if (!rubric) {
    return res.status(404).json({ error: 'No approved rubric found for this mission' });
  }

  return res.json(rubric);
});
