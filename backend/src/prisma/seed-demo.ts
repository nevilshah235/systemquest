/**
 * seed-demo.ts — SystemQuest Demo Video Data Seed
 *
 * Creates a ready-to-demo user state for the SystemQuest demo video.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Demo Login
 *    Email:    demo@systemquest.io
 *    Password: Demo@2026!
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  State seeded:
 *
 *  ✅ COMPLETED (unlocked paths & prerequisites)
 *     MVP Launch · Scaling Up · Global Expansion · ChatGPT Backend
 *       → completes Foundations path → unlocks ALL other paths
 *     URL Shortener (high-read, score 91) — perfect reference design shown
 *     Live Scoreboard · Ride Hailing (real-time) → unlocks Design WhatsApp
 *     Booking System (consistency)              → unlocks Payment Processing
 *
 *  🎨 PREFILLED IN-PROGRESS (showcased on the drag-and-drop canvas)
 *     Design WhatsApp   — WebSocket + Queue + Cassandra architecture
 *     Payment Processing — Stripe-style idempotency + ACID design
 *
 *  🔒 LOCKED (server-side sequential lock — prerequisites not met)
 *     Design Slack          — locked until WhatsApp is completed
 *     How Stock Exchange Works — new capstone mission (600 XP, order 50)
 *
 *  ⚠️  MISTAKE PATTERNS (4 active — populates Mistakes Tracker panel)
 *     Missing Rate Limiter · Single DB SPOF
 *     Synchronous Payment Call · No Dead Letter Queue
 *
 * Usage:
 *   npx ts-node src/prisma/seed-demo.ts
 *   -- or --
 *   npm run prisma:seed-demo
 *
 * Prerequisites: run seed.ts first so base missions exist.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Architecture JSON payloads
// Format: { components: ArchitectureComponent[], connections: Connection[] }
// ─────────────────────────────────────────────────────────────────────────────

/** URL Shortener — completed, near-perfect design (score ~91, all bonuses) */
const urlShortenerArch = {
  components: [
    { id: 'u1', type: 'client',       x: 80,   y: 300 },
    { id: 'u2', type: 'apigateway',   x: 280,  y: 300 },
    { id: 'u3', type: 'loadbalancer', x: 480,  y: 300 },
    { id: 'u4', type: 'server',       x: 680,  y: 180 },
    { id: 'u5', type: 'server',       x: 680,  y: 420 },
    { id: 'u6', type: 'cache',        x: 900,  y: 180 },
    { id: 'u7', type: 'database',     x: 900,  y: 420 },
    { id: 'u8', type: 'monitoring',   x: 680,  y: 600 },
  ],
  connections: [
    { from: 'u1', to: 'u2' },
    { from: 'u2', to: 'u3' },
    { from: 'u3', to: 'u4' },
    { from: 'u3', to: 'u5' },
    { from: 'u4', to: 'u6' },
    { from: 'u5', to: 'u6' },
    { from: 'u6', to: 'u7' },
    { from: 'u4', to: 'u8' },
    { from: 'u5', to: 'u8' },
  ],
};

/**
 * WhatsApp Design — prefilled, complex real-time messaging architecture.
 * Intentional omission: no monitoring → triggers "Single DB SPOF" &
 * "No Dead Letter Queue" mistake patterns for demo showcase.
 */
const whatsappArch = {
  components: [
    { id: 'w1', type: 'client',       x: 80,   y: 360 },
    { id: 'w2', type: 'apigateway',   x: 280,  y: 360 },
    { id: 'w3', type: 'loadbalancer', x: 480,  y: 360 },
    { id: 'w4', type: 'server',       x: 700,  y: 200 },
    { id: 'w5', type: 'server',       x: 700,  y: 520 },
    { id: 'w6', type: 'queue',        x: 920,  y: 360 },
    { id: 'w7', type: 'cache',        x: 1140, y: 200 },
    { id: 'w8', type: 'database',     x: 1140, y: 520 },
    { id: 'w9', type: 'storage',      x: 1360, y: 360 },
  ],
  connections: [
    { from: 'w1', to: 'w2' },
    { from: 'w2', to: 'w3' },
    { from: 'w3', to: 'w4' },
    { from: 'w3', to: 'w5' },
    { from: 'w4', to: 'w6' },
    { from: 'w5', to: 'w6' },
    { from: 'w6', to: 'w8' },
    { from: 'w4', to: 'w7' },
    { from: 'w5', to: 'w7' },
    { from: 'w4', to: 'w9' },
  ],
};

/**
 * Payment Processing — prefilled, Stripe-style advanced design.
 * Intentional omission: no queue → triggers "Synchronous Payment Call"
 * mistake pattern for demo showcase.
 */
const paymentArch = {
  components: [
    { id: 'p1', type: 'client',       x: 80,   y: 360 },
    { id: 'p2', type: 'apigateway',   x: 280,  y: 360 },
    { id: 'p3', type: 'loadbalancer', x: 480,  y: 360 },
    { id: 'p4', type: 'server',       x: 700,  y: 200 },
    { id: 'p5', type: 'server',       x: 700,  y: 520 },
    { id: 'p6', type: 'cache',        x: 920,  y: 200 },
    { id: 'p7', type: 'database',     x: 920,  y: 520 },
    { id: 'p8', type: 'monitoring',   x: 1140, y: 360 },
  ],
  connections: [
    { from: 'p1', to: 'p2' },
    { from: 'p2', to: 'p3' },
    { from: 'p3', to: 'p4' },
    { from: 'p3', to: 'p5' },
    { from: 'p4', to: 'p6' },
    { from: 'p4', to: 'p7' },
    { from: 'p5', to: 'p7' },
    { from: 'p4', to: 'p8' },
    { from: 'p5', to: 'p8' },
  ],
};

// ─────────────────────────────────────────────────────────────────────────────
// Simple architecture helpers for prerequisite missions
// ─────────────────────────────────────────────────────────────────────────────

function makeSimpleArch(types: string[]) {
  const components = types.map((type, i) => ({
    id: `s${i + 1}`,
    type,
    x: 100 + i * 220,
    y: 300,
  }));
  const connections = components.slice(0, -1).map((c, i) => ({
    from: c.id,
    to: components[i + 1].id,
  }));
  return { components, connections };
}

// ─────────────────────────────────────────────────────────────────────────────
// XP → Level (mirrors simulationEngine / routes/simulation.ts)
// ─────────────────────────────────────────────────────────────────────────────

function calculateLevel(xp: number): number {
  if (xp < 100)  return 1;
  if (xp < 300)  return 2;
  if (xp < 600)  return 3;
  if (xp < 1000) return 4;
  if (xp < 1500) return 5;
  return Math.floor(xp / 300) + 1;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🎬  SystemQuest — Demo Data Seed\n');

  // ── Step 1: Create the Stock Exchange capstone mission (locked in demo) ──────

  console.log('📋  Step 1 — Creating "How Stock Exchange Works" capstone mission…');
  await prisma.mission.upsert({
    where: { slug: 'how-stock-exchange-works' },
    update: {},
    create: {
      slug: 'how-stock-exchange-works',
      title: 'Mission 50: How Stock Exchange Works',
      difficulty: 5,
      estimatedTime: '50–60 min',
      xpReward: 600,
      order: 50,
      learningPath: 'consistency',
      skillLevel: 'advanced',
      description:
        'Design a stock exchange order matching engine (like NYSE) processing 1M orders/second with microsecond latency, strict FIFO guarantee, and zero duplicate executions.',
      scenario:
        "You're the lead architect for NYSE's next-generation trading platform. 1M orders/second. " +
        'Microsecond matching latency. Zero tolerance for lost or duplicated orders. ' +
        'Circuit breakers must halt trading during market disruptions. Design the full order processing pipeline.',
      objectives: JSON.stringify([
        'Process 1M orders/second with under 1ms matching latency',
        'Guarantee FIFO order matching per price level — no race conditions',
        'Achieve 99.999% availability with zero order loss',
        'Implement circuit breaker for market halt within 50ms',
        'Maintain complete immutable audit log of every trade',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000000, daily: 500000000 },
        performance: { latencyMs: 1, availability: 99.999 },
        budget: 100000,
        growth: '1M orders/sec, microsecond SLA — NYSE-scale',
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        bonus: [
          { component: 'cache',        xp: 50, label: 'Add order-book cache for market data feed (+50 XP)' },
          { component: 'storage',      xp: 45, label: 'Add immutable audit-log storage (+45 XP)' },
          { component: 'apigateway',   xp: 40, label: 'Add API Gateway for FIX protocol ingress (+40 XP)' },
          { component: 'loadbalancer', xp: 35, label: 'Add Load Balancer for market data fanout (+35 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: [
          'client', 'loadbalancer', 'server', 'database', 'cache',
          'cdn', 'queue', 'storage', 'monitoring', 'apigateway',
        ],
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        hints: [
          'Queue is the order ingestion layer — 1M orders/sec land in Kafka before any matching begins',
          'Matching Engine (Server) is single-threaded per symbol — sequential FIFO, no locks needed',
          'Database stores the settled order book + trade history — must be ACID compliant',
          'Monitoring is REQUIRED — circuit breaker fires when error rate > 0.01% or latency > 5ms',
          'Cache holds the live order book (bid/ask levels) for real-time market data feed consumers',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Order matching is single-threaded by design — sequential processing eliminates lock contention',
          'Event sourcing: every order-state change is immutable — replay the log to reconstruct any historical order book',
          'NYSE Limit Up / Limit Down: circuit breaker halts a stock when price moves > 5% in 5 minutes',
          'CQRS: write side (matching engine) is fully separate from read side (market data feed, analytics dashboards)',
        ],
        nextMission: null,
        nextPreview: 'Consistency & Transactions complete — you are a distributed systems architect!',
      }),
    },
  });
  console.log('  ✅  how-stock-exchange-works (order 50, 600 XP) — consistency / advanced\n');

  // ── Step 2: Upsert demo user ─────────────────────────────────────────────────

  console.log('👤  Step 2 — Creating demo user…');

  // XP earned from 8 completed missions (score/100 × xpReward, rounded)
  //   mvp-launch(92→138) + scaling-up(88→264) + global-expansion(85→425)
  //   + design-chatgpt(82→246) + live-scoreboard(79→474) + ride-hailing(78→546)
  //   + booking-system(82→451) + url-shortener(91→455)
  const totalXp = 2999;
  const level   = calculateLevel(totalXp); // → 10

  const passwordHash = await bcrypt.hash('Demo@2026!', 10);

  const demoUser = await prisma.user.upsert({
    where: { email: 'demo@systemquest.io' },
    update: { passwordHash, xp: totalXp, level, skillLevel: 'advanced', username: 'SysQuestDemo' },
    create: {
      email: 'demo@systemquest.io',
      username: 'SysQuestDemo',
      passwordHash,
      xp: totalXp,
      level,
      skillLevel: 'advanced',
    },
  });
  console.log(`  ✅  SysQuestDemo — Level ${level} | ${totalXp} XP | advanced\n`);

  // ── Step 3: Fetch missions needed for attempts ───────────────────────────────

  console.log('🔍  Step 3 — Resolving mission IDs…');
  const targetSlugs = [
    'mvp-launch', 'scaling-up', 'global-expansion', 'design-chatgpt',
    'live-scoreboard', 'ride-hailing', 'booking-system',
    'url-shortener', 'design-whatsapp', 'payment-processing',
  ];
  const found = await prisma.mission.findMany({
    where: { slug: { in: targetSlugs } },
    select: { id: true, slug: true, xpReward: true, title: true },
  });
  const missionMap = new Map(found.map((m) => [m.slug, m]));
  const missing = targetSlugs.filter((s) => !missionMap.has(s));
  if (missing.length) {
    console.warn(`  ⚠️   Missing from DB (run seed.ts first): ${missing.join(', ')}`);
  }
  console.log(`  ✅  ${found.length}/${targetSlugs.length} missions resolved\n`);

  // ── Step 4: Completed mission attempts ──────────────────────────────────────

  console.log('🎮  Step 4 — Seeding completed mission attempts…');

  const completedMissions: Array<{
    slug: string;
    score: number;
    arch: ReturnType<typeof makeSimpleArch> | typeof urlShortenerArch;
  }> = [
    {
      slug: 'mvp-launch',
      score: 92,
      arch: makeSimpleArch(['client', 'server', 'database']),
    },
    {
      slug: 'scaling-up',
      score: 88,
      arch: makeSimpleArch(['client', 'loadbalancer', 'server', 'server', 'cache', 'database']),
    },
    {
      slug: 'global-expansion',
      score: 85,
      arch: makeSimpleArch(['client', 'cdn', 'loadbalancer', 'server', 'cache', 'database']),
    },
    {
      slug: 'design-chatgpt',
      score: 82,
      arch: makeSimpleArch(['client', 'apigateway', 'server', 'cache', 'database', 'monitoring']),
    },
    {
      slug: 'live-scoreboard',
      score: 79,
      arch: makeSimpleArch(['client', 'loadbalancer', 'server', 'server', 'cache', 'queue', 'database']),
    },
    {
      slug: 'ride-hailing',
      score: 78,
      arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'server', 'cache', 'database', 'queue']),
    },
    {
      slug: 'booking-system',
      score: 82,
      arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'server', 'cache', 'database', 'monitoring']),
    },
    {
      // Showcase mission — perfect design for URL Shortener demo
      slug: 'url-shortener',
      score: 91,
      arch: urlShortenerArch,
    },
  ];

  for (const { slug, score, arch } of completedMissions) {
    const mission = missionMap.get(slug);
    if (!mission) continue;

    const xpEarned = Math.round((score / 100) * mission.xpReward);
    // Clean slate for this user+mission combo
    await prisma.missionAttempt.deleteMany({ where: { userId: demoUser.id, missionId: mission.id } });
    await prisma.missionAttempt.create({
      data: {
        userId:           demoUser.id,
        missionId:        mission.id,
        score,
        xpEarned,
        completed:        true,
        comparisonViewed: true,
        architecture:     JSON.stringify(arch),
        metrics: JSON.stringify({
          latencyMs:     Math.max(50, 320 - score * 2),
          availability:  parseFloat(Math.min(99.9, 95 + score * 0.049).toFixed(2)),
          throughput:    score * 110,
          monthlyCost:   300 + score * 5,
          score,
          allMetricsMet: score >= 80,
          xpEarned,
          bonusXp:       score >= 85 ? 50 : 0,
          feedback:      [],
          achievements:  score >= 80 ? ['first-architecture'] : [],
        }),
      },
    });
    console.log(`  ✅  ${mission.title.padEnd(42)} score: ${score}  xp: ${xpEarned}`);
  }

  // ── Step 5: Prefilled in-progress architectures (demo canvas showcase) ───────

  console.log('\n🎨  Step 5 — Saving prefilled in-progress architectures…');

  const inProgress: Array<{ slug: string; arch: object; label: string }> = [
    {
      slug:  'design-whatsapp',
      arch:  whatsappArch,
      label: 'Design WhatsApp — WebSocket + Queue + Cassandra + S3',
    },
    {
      slug:  'payment-processing',
      arch:  paymentArch,
      label: 'Payment Processing — Stripe-style idempotency + ACID',
    },
  ];

  for (const { slug, arch, label } of inProgress) {
    const mission = missionMap.get(slug);
    if (!mission) continue;

    await prisma.missionAttempt.deleteMany({ where: { userId: demoUser.id, missionId: mission.id } });
    await prisma.missionAttempt.create({
      data: {
        userId:       demoUser.id,
        missionId:    mission.id,
        score:        0,
        xpEarned:     0,
        completed:    false,
        architecture: JSON.stringify(arch),
        metrics:      JSON.stringify({}),
      },
    });
    console.log(`  🎨  ${label}`);
  }

  // ── Step 6: Mistake Patterns (Mistakes Tracker panel demo) ──────────────────

  console.log('\n⚠️   Step 6 — Seeding Mistake Patterns…');

  const patterns = [
    {
      dimension:        'api-design',
      patternSlug:      'missing-rate-limiter',
      patternName:      'Missing Rate Limiter',
      frequency:        3,
      affectedMissions: JSON.stringify(['url-shortener', 'mvp-launch', 'global-expansion']),
      conceptSlug:      'rate-limiting',
      isResolved:       false,
    },
    {
      dimension:        'reliability',
      patternSlug:      'single-database-spof',
      patternName:      'Single Database — No Read Replica',
      frequency:        2,
      affectedMissions: JSON.stringify(['design-whatsapp', 'live-scoreboard']),
      conceptSlug:      'availability',
      isResolved:       false,
    },
    {
      dimension:        'consistency',
      patternSlug:      'synchronous-critical-path',
      patternName:      'Synchronous Payment Call (Queue Missing)',
      frequency:        2,
      affectedMissions: JSON.stringify(['payment-processing', 'booking-system']),
      conceptSlug:      'saga-pattern',
      isResolved:       false,
    },
    {
      dimension:        'reliability',
      patternSlug:      'no-dead-letter-queue',
      patternName:      'No Dead Letter Queue for Failed Events',
      frequency:        2,
      affectedMissions: JSON.stringify(['live-scoreboard', 'ride-hailing']),
      conceptSlug:      'message-queues',
      isResolved:       false,
    },
  ];

  for (const p of patterns) {
    await prisma.mistakePattern.upsert({
      where:  { userId_patternSlug: { userId: demoUser.id, patternSlug: p.patternSlug } },
      update: { frequency: p.frequency, affectedMissions: p.affectedMissions, isResolved: false, lastSeenAt: new Date() },
      create: { userId: demoUser.id, ...p },
    });
    console.log(`  ⚠️   ${p.patternName.padEnd(42)} (${p.dimension})  freq: ${p.frequency}`);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎬  DEMO SEED COMPLETE

  Login:     demo@systemquest.io  /  Demo@2026!
  User:      SysQuestDemo  |  Level ${level}  |  ${totalXp} XP  |  advanced

  ✅  Completed (8 missions — unlocks all paths + prerequisites)
       Foundations:  MVP Launch · Scaling Up · Global Expansion · ChatGPT Backend
       High-Read:    URL Shortener (score 91 — reference design shown on canvas)
       Real-Time:    Live Scoreboard · Ride Hailing → unlocks WhatsApp
       Consistency:  Booking System              → unlocks Payment Processing

  🎨  Prefilled In-Progress (opens with rich canvas for demo video)
       Design WhatsApp      (real-time / intermediate)
       Payment Processing   (consistency / advanced)

  🔒  Locked (sequential prerequisite not met — shows lock UI naturally)
       Design Slack          — needs Design WhatsApp completed first
       How Stock Exchange Works — new capstone (order 50, 600 XP)

  ⚠️   Mistake Patterns (4 active — populates Mistakes Tracker panel)
       Missing Rate Limiter        (api-design)   freq 3
       Single Database SPOF        (reliability)  freq 2
       Synchronous Payment Call    (consistency)  freq 2
       No Dead Letter Queue        (reliability)  freq 2
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
