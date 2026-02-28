/**
 * Mistake Pattern Service — F-003
 * Rule-based anti-pattern detector that analyses completed MissionAttempts.
 * 8 rules across 5 dimensions: scalability, consistency, reliability, api-design, data-modelling.
 * Refreshed idempotently after each simulation submission.
 * A pattern is "resolved" when it hasn't appeared in the last 3 completed missions.
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type Dimension = 'scalability' | 'consistency' | 'reliability' | 'api-design' | 'data-modelling';

interface ArchData {
  components: Array<{ type: string; [key: string]: unknown }>;
  connections: unknown[];
}

interface MissionData {
  slug: string;
  title: string;
  description: string;
  requirements: string; // JSON string
  components: string;   // JSON string
}

interface PatternRule {
  slug: string;
  name: string;
  dimension: Dimension;
  conceptSlug: string;
  detect(arch: ArchData, mission: MissionData, score: number): boolean;
}

// ── Anti-pattern detection rules ────────────────────────────────────────────────

const PATTERN_RULES: PatternRule[] = [
  // ── Scalability ──────────────────────────────────────────────────────────────
  {
    slug: 'missing-load-balancer',
    name: 'Missing Load Balancer',
    dimension: 'scalability',
    conceptSlug: 'load-balancing',
    detect(arch, mission, score) {
      try {
        const req = JSON.parse(mission.requirements);
        const hasLB = arch.components.some((c) => c.type === 'loadbalancer');
        const needsLB = (req.traffic?.concurrent ?? 0) >= 5000;
        return !hasLB && needsLB && score < 85;
      } catch { return false; }
    },
  },
  {
    slug: 'missing-cache',
    name: 'Missing Caching Layer',
    dimension: 'scalability',
    conceptSlug: 'caching-strategies',
    detect(arch, mission, score) {
      try {
        const req = JSON.parse(mission.requirements);
        const hasCache = arch.components.some((c) => c.type === 'cache');
        const needsCache = (req.performance?.latencyMs ?? 999) <= 170;
        return !hasCache && needsCache && score < 85;
      } catch { return false; }
    },
  },
  {
    slug: 'missing-cdn',
    name: 'Missing CDN for Global Scale',
    dimension: 'scalability',
    conceptSlug: 'cdn-basics',
    detect(arch, mission, score) {
      try {
        const req = JSON.parse(mission.requirements);
        const hasCDN = arch.components.some((c) => c.type === 'cdn');
        const needsCDN =
          (req.traffic?.concurrent ?? 0) >= 80000 ||
          mission.description?.toLowerCase().includes('global') ||
          mission.description?.toLowerCase().includes('continent');
        return !hasCDN && needsCDN && score < 85;
      } catch { return false; }
    },
  },
  // ── Reliability ───────────────────────────────────────────────────────────────
  {
    slug: 'missing-monitoring',
    name: 'No Monitoring / Observability',
    dimension: 'reliability',
    conceptSlug: 'monitoring-observability',
    detect(arch, _mission, score) {
      const hasMonitoring = arch.components.some((c) => c.type === 'monitoring');
      return !hasMonitoring && score < 90;
    },
  },
  {
    slug: 'single-point-of-failure',
    name: 'Single Point of Failure (SPOF)',
    dimension: 'reliability',
    conceptSlug: 'load-balancing',
    detect(arch, mission, score) {
      try {
        const req = JSON.parse(mission.requirements);
        const serverCount = arch.components.filter((c) => c.type === 'server').length;
        const hasLB = arch.components.some((c) => c.type === 'loadbalancer');
        const highAvail = (req.performance?.availability ?? 0) >= 99.9;
        return serverCount === 1 && !hasLB && highAvail && score < 90;
      } catch { return false; }
    },
  },
  // ── API Design ────────────────────────────────────────────────────────────────
  {
    slug: 'missing-api-gateway',
    name: 'Missing API Gateway',
    dimension: 'api-design',
    conceptSlug: 'api-gateway-pattern',
    detect(arch, mission, score) {
      try {
        const comps = JSON.parse(mission.components);
        const gatewayInAvailable = (comps.available ?? []).includes('apigateway');
        const hasGateway = arch.components.some((c) => c.type === 'apigateway');
        return !hasGateway && gatewayInAvailable && score < 80;
      } catch { return false; }
    },
  },
  // ── Consistency ───────────────────────────────────────────────────────────────
  {
    slug: 'missing-message-queue',
    name: 'Missing Async Message Queue',
    dimension: 'consistency',
    conceptSlug: 'message-queues',
    detect(arch, mission, score) {
      try {
        const req = JSON.parse(mission.requirements);
        const hasQueue = arch.components.some((c) => c.type === 'queue');
        const requiresQueue = (req.required ?? []).includes('queue');
        return !hasQueue && requiresQueue && score < 80;
      } catch { return false; }
    },
  },
  // ── Data Modelling ────────────────────────────────────────────────────────────
  {
    slug: 'binary-data-in-database',
    name: 'Storing Binary Data in Database',
    dimension: 'data-modelling',
    conceptSlug: 'object-storage',
    detect(arch, mission, score) {
      const mediaKeywords = ['video', 'file', 'instagram', 'youtube', 'photo', 'image', 'media', 'converter', 'upload', 'blob'];
      const hasBinaryContext = mediaKeywords.some(
        (kw) =>
          mission.title?.toLowerCase().includes(kw) ||
          mission.description?.toLowerCase().includes(kw),
      );
      const hasStorage = arch.components.some((c) => c.type === 'storage');
      return hasBinaryContext && !hasStorage && score < 80;
    },
  },
];

// ── Public API ──────────────────────────────────────────────────────────────────

/**
 * Analyses all completed MissionAttempts for a user and upserts MistakePattern records.
 * Idempotent — safe to call on every simulation submission.
 * A pattern is marked resolved when it hasn't appeared in the last 3 completed missions.
 */
export async function refreshMistakePatterns(userId: string): Promise<void> {
  const attempts = await prisma.missionAttempt.findMany({
    where: { userId, completed: true },
    include: { mission: true },
    orderBy: { createdAt: 'desc' }, // index 0 = most recent
  });

  if (attempts.length < 3) return; // not enough data yet

  // patternSlug → { frequency, affectedMissions, mostRecentIdx }
  const seen = new Map<string, { frequency: number; affectedMissions: Set<string>; mostRecentIdx: number }>();

  attempts.forEach((attempt, idx) => {
    let arch: ArchData;
    try {
      const parsed = JSON.parse(attempt.architecture);
      arch = { components: parsed.components ?? [], connections: parsed.connections ?? [] };
    } catch {
      return;
    }

    for (const rule of PATTERN_RULES) {
      if (rule.detect(arch, attempt.mission, attempt.score)) {
        const entry = seen.get(rule.slug) ?? { frequency: 0, affectedMissions: new Set(), mostRecentIdx: idx };
        entry.frequency += 1;
        entry.affectedMissions.add(attempt.mission.slug);
        // Keep track of the most recent occurrence (lowest idx = most recent)
        if (idx < entry.mostRecentIdx) entry.mostRecentIdx = idx;
        seen.set(rule.slug, entry);
      }
    }
  });

  // Upsert all detected patterns
  for (const [patternSlug, data] of seen.entries()) {
    const rule = PATTERN_RULES.find((r) => r.slug === patternSlug)!;
    // Resolved = pattern not seen in most recent 3 missions (idx 0,1,2)
    const isResolved = data.mostRecentIdx >= 3;
    const lastAttemptDate = attempts[data.mostRecentIdx]?.createdAt ?? new Date();

    await prisma.mistakePattern.upsert({
      where: { userId_patternSlug: { userId, patternSlug } },
      update: {
        frequency: data.frequency,
        affectedMissions: JSON.stringify([...data.affectedMissions]),
        isResolved,
        lastSeenAt: lastAttemptDate,
        updatedAt: new Date(),
      },
      create: {
        userId,
        dimension: rule.dimension,
        patternSlug,
        patternName: rule.name,
        frequency: data.frequency,
        affectedMissions: JSON.stringify([...data.affectedMissions]),
        conceptSlug: rule.conceptSlug,
        isResolved,
        lastSeenAt: lastAttemptDate,
      },
    });
  }
}

/** Returns all mistake patterns for a user, active ones first, sorted by frequency. */
export async function getMistakePatterns(userId: string) {
  const patterns = await prisma.mistakePattern.findMany({
    where: { userId },
    orderBy: [
      { isResolved: 'asc' },
      { frequency: 'desc' },
      { lastSeenAt: 'desc' },
    ],
  });

  return patterns.map((p) => ({
    ...p,
    affectedMissions: JSON.parse(p.affectedMissions) as string[],
  }));
}
