import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export type SkillLevel = 'beginner' | 'intermediate' | 'advanced';

/** Ordered lowest → highest for comparison arithmetic */
const SKILL_ORDER: SkillLevel[] = ['beginner', 'intermediate', 'advanced'];

/**
 * Number of completed missions with score ≥ 90 at a given skill level
 * required before the user is considered to have earned that level.
 */
const PROMOTION_THRESHOLD = 3;

// ── computeDerivedSkillLevel ──────────────────────────────────────────────────────
/**
 * Derives a skill level purely from performance history — no stored state is read.
 *
 * Algorithm:
 *   1. Fetch all completed attempts where score >= 90.
 *   2. Count them per mission.skillLevel bucket.
 *   3. Highest bucket that meets PROMOTION_THRESHOLD wins.
 *
 * This is intentionally pure (no side-effects) so it can be called freely
 * for display without risking accidental writes.
 */
export async function computeDerivedSkillLevel(userId: string): Promise<SkillLevel> {
  const attempts = await prisma.missionAttempt.findMany({
    where: { userId, completed: true, score: { gte: 90 } },
    include: { mission: { select: { skillLevel: true } } },
  });

  const counts: Record<SkillLevel, number> = { beginner: 0, intermediate: 0, advanced: 0 };
  for (const a of attempts) {
    const lvl = a.mission.skillLevel as SkillLevel;
    if (lvl in counts) counts[lvl]++;
  }

  // Check highest tier first so 'advanced' wins over 'intermediate'
  if (counts.advanced >= PROMOTION_THRESHOLD) return 'advanced';
  if (counts.intermediate >= PROMOTION_THRESHOLD) return 'intermediate';
  return 'beginner';
}

// ── effectiveSkillLevel ───────────────────────────────────────────────────────────
/**
 * Returns the higher of `derived` (performance) and `stored` (self-declared).
 * Performance can only promote, never demote — this prevents a stored override
 * from hiding earned progress.
 */
export function effectiveSkillLevel(derived: SkillLevel, stored: string): SkillLevel {
  const safeStored = SKILL_ORDER.includes(stored as SkillLevel)
    ? (stored as SkillLevel)
    : 'beginner';
  return SKILL_ORDER[Math.max(SKILL_ORDER.indexOf(derived), SKILL_ORDER.indexOf(safeStored))];
}

// ── promoteIfEarned ───────────────────────────────────────────────────────────────
/**
 * Should be called after every mission completion.
 *
 * 1. Recomputes derived skill level from the full attempt history.
 * 2. Compares against the stored User.skillLevel.
 * 3. If performance has outpaced the stored level, upgrades User.skillLevel.
 *
 * Returns:
 *   - derivedSkillLevel: what pure performance history says
 *   - promoted: true if the stored level was just upgraded
 *   - newLevel: the effective level after the call (stored field value going forward)
 */
export async function promoteIfEarned(userId: string): Promise<{
  derivedSkillLevel: SkillLevel;
  promoted: boolean;
  newLevel: SkillLevel;
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { skillLevel: true },
  });

  const storedLevel = (user?.skillLevel ?? 'beginner') as SkillLevel;
  const derived = await computeDerivedSkillLevel(userId);
  const newLevel = effectiveSkillLevel(derived, storedLevel);
  const promoted =
    SKILL_ORDER.indexOf(newLevel) > SKILL_ORDER.indexOf(storedLevel);

  if (promoted) {
    await prisma.user.update({
      where: { id: userId },
      data: { skillLevel: newLevel },
    });
  }

  return { derivedSkillLevel: derived, promoted, newLevel };
}
