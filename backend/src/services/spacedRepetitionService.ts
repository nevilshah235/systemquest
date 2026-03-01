/**
 * Spaced Repetition Service — F-005
 * Implements the SM-2 algorithm to schedule mission re-attempts at optimal intervals.
 * - score < 80  → add/update SR queue item
 * - score >= 80 on re-attempt → graduate (remove from active queue)
 * - snooze → push nextReviewAt by 3 days
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SM2State {
  interval: number;
  repetition: number;
  easeFactor: number;
}

/**
 * Maps a 0-100 mission score to SM-2 quality (0-5).
 * >=80: perfect (5) | 60-79: correct but hard (3) | 40-59: difficult (2) | <40: blackout (1)
 */
function scoreToQuality(score: number): number {
  if (score >= 80) return 5;
  if (score >= 60) return 3;
  if (score >= 40) return 2;
  return 1;
}

/**
 * SM-2 core algorithm.
 * Returns updated interval (days), repetition count, and ease factor.
 */
function sm2Update(state: SM2State, quality: number): SM2State {
  let { interval, repetition, easeFactor } = state;

  if (quality >= 3) {
    // Correct response path
    if (repetition === 0) {
      interval = 1;
    } else if (repetition === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetition += 1;
    // Update ease factor — penalises for correct-but-hard answers
    easeFactor = Math.max(
      1.3,
      easeFactor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    );
  } else {
    // Incorrect response — reset interval and repetition
    interval = 1;
    repetition = 0;
    // easeFactor is not changed on failure per SM-2 spec
  }

  return { interval, repetition, easeFactor };
}

/**
 * Called after every mission simulation run.
 * - score < 80  → upsert SR item with new SM-2 state
 * - score >= 80 on existing item → graduate it out of the active queue
 * - score >= 80 on first attempt → nothing to do
 */
export async function upsertSRItem(
  userId: string,
  missionId: string,
  score: number,
): Promise<void> {
  const existing = await prisma.spacedRepetitionItem.findUnique({
    where: { userId_missionId: { userId, missionId } },
  });

  if (score >= 80) {
    if (existing && !existing.graduated) {
      // Graduate: user has mastered this mission on re-attempt
      await prisma.spacedRepetitionItem.update({
        where: { id: existing.id },
        data: { graduated: true, lastScore: score, updatedAt: new Date() },
      });
    }
    // If no existing item or already graduated — nothing to do
    return;
  }

  // score < 80: schedule a review
  const currentState: SM2State = existing
    ? { interval: existing.interval, repetition: existing.repetition, easeFactor: existing.easeFactor }
    : { interval: 1, repetition: 0, easeFactor: 2.5 };

  const quality = scoreToQuality(score);
  const newState = sm2Update(currentState, quality);

  const nextReviewAt = new Date();
  nextReviewAt.setDate(nextReviewAt.getDate() + newState.interval);

  if (existing) {
    await prisma.spacedRepetitionItem.update({
      where: { id: existing.id },
      data: {
        interval: newState.interval,
        repetition: newState.repetition,
        easeFactor: newState.easeFactor,
        nextReviewAt,
        lastScore: score,
        graduated: false,
        updatedAt: new Date(),
      },
    });
  } else {
    await prisma.spacedRepetitionItem.create({
      data: {
        userId,
        missionId,
        interval: newState.interval,
        repetition: newState.repetition,
        easeFactor: newState.easeFactor,
        nextReviewAt,
        lastScore: score,
      },
    });
  }
}

/** Returns all active due-for-review items for a user, enriched with mission data. */
export async function getReviewQueue(userId: string) {
  const now = new Date();
  const items = await prisma.spacedRepetitionItem.findMany({
    where: { userId, graduated: false, nextReviewAt: { lte: now } },
    include: { mission: true },
    orderBy: { nextReviewAt: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    missionSlug: item.mission.slug,
    missionTitle: item.mission.title,
    missionPath: item.mission.learningPath,
    lastScore: item.lastScore,
    interval: item.interval,
    dueAt: item.nextReviewAt.toISOString(),
    snoozeCount: item.snoozeCount,
  }));
}

/** Returns ALL SR items (including future) for queue count display on dashboard. */
export async function getFullQueue(userId: string) {
  const items = await prisma.spacedRepetitionItem.findMany({
    where: { userId, graduated: false },
    include: { mission: true },
    orderBy: { nextReviewAt: 'asc' },
  });

  return items.map((item) => ({
    id: item.id,
    missionSlug: item.mission.slug,
    missionTitle: item.mission.title,
    missionPath: item.mission.learningPath,
    lastScore: item.lastScore,
    interval: item.interval,
    dueAt: item.nextReviewAt.toISOString(),
    snoozeCount: item.snoozeCount,
    isDue: item.nextReviewAt <= new Date(),
  }));
}

/**
 * Snooze an SR item — pushes nextReviewAt forward by 3 days.
 * Increments snoozeCount (informational; no hard cap enforced server-side).
 */
export async function snoozeItem(userId: string, missionSlug: string): Promise<void> {
  const mission = await prisma.mission.findUnique({ where: { slug: missionSlug } });
  if (!mission) throw new Error('Mission not found');

  const item = await prisma.spacedRepetitionItem.findUnique({
    where: { userId_missionId: { userId, missionId: mission.id } },
  });
  if (!item) throw new Error('Review item not found');

  const snoozeUntil = new Date();
  snoozeUntil.setDate(snoozeUntil.getDate() + 3);

  await prisma.spacedRepetitionItem.update({
    where: { id: item.id },
    data: {
      nextReviewAt: snoozeUntil,
      snoozeCount: item.snoozeCount + 1,
      updatedAt: new Date(),
    },
  });
}
