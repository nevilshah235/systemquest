/**
 * seed-demo.ts — SystemQuest Demo Video Data Seed
 *
 * Creates a ready-to-demo user state for the SystemQuest demo video.
 *
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *  Credentials are loaded from environment variables — never hardcoded.
 *  Copy backend/.env.demo.example → backend/.env.local and fill in values.
 *
 *    DEMO_SEED_EMAIL=...      (e.g. demo@your-domain.com)
 *    DEMO_SEED_PASSWORD=...   (strong password, ≥12 chars)
 * ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
 *
 *  State seeded:
 *
 *  ✅ COMPLETED (13 missions — rich unlocked state across all path cards)
 *     Foundations:       MVP Launch · Scaling Up · Global Expansion
 *                          → completes Foundations path → unlocks ALL other paths
 *     Async Queues:      File Converter · Code Judge · ChatGPT Backend
 *                          → 3 modules unlocked on Async card
 *     High-Read:         URL Shortener (score 91) · Search Engine
 *                          → 2 modules unlocked on High-Read card
 *     Real-Time:         Live Scoreboard · Ride Hailing
 *                          → 2 modules unlocked → unlocks Design WhatsApp
 *     Scale & Streaming: Social Feed · Video Streaming
 *                          → 2 modules unlocked on Scale card
 *     Consistency:       Booking System
 *                          → unlocks Payment Processing
 *
 *  🎨 PREFILLED IN-PROGRESS (showcased on the drag-and-drop canvas)
 *     Design WhatsApp    — WebSocket + Queue + Cassandra architecture
 *     Payment Processing — Stripe-style idempotency + ACID design
 *
 *  🔒 LOCKED (server-side sequential lock — prerequisites not met)
 *     Design Slack             — locked until WhatsApp is completed
 *     How Stock Exchange Works — new capstone mission (600 XP, order 50)
 *
 *  ⚠️  MISTAKE PATTERNS (4 active — populates Mistakes Tracker panel)
 *     Missing Rate Limiter · Single DB SPOF
 *     Synchronous Payment Call · No Dead Letter Queue
 *
 * Usage:
 *   cp backend/.env.demo.example backend/.env.local
 *   # edit .env.local with real credentials
 *   npm run prisma:seed        # run base seed first
 *   npm run prisma:seed-demo   # then this
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Load .env.local first (demo-specific overrides), then fall back to .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env.local') });
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Validate required env vars before doing anything
// ─────────────────────────────────────────────────────────────────────────────

function requireEnv(key: string): string {
  const val = process.env[key];
  if (!val || val.trim() === '') {
    throw new Error(
      `[seed-demo] Missing required environment variable: ${key}\n` +
      `  Copy backend/.env.demo.example → backend/.env.local and set a value.`,
    );
  }
  return val.trim();
}

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
// Helpers
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

  // ── Validate credentials from env (fail fast, never use defaults) ───────────
  const DEMO_EMAIL    = requireEnv('DEMO_SEED_EMAIL');
  const DEMO_PASSWORD = requireEnv('DEMO_SEED_PASSWORD');
  const DEMO_USERNAME = process.env.DEMO_SEED_USERNAME ?? 'SysQuestDemo';

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

  // XP earned from 13 completed missions (score/100 × xpReward, rounded)
  // Foundations (3) + Async Queues (3) + High-Read (2) + Real-Time (2) + Scale & Streaming (2) + Consistency (1)
  const totalXp = 5720;
  const level   = calculateLevel(totalXp); // → 20

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: { passwordHash, xp: totalXp, level, skillLevel: 'advanced', username: DEMO_USERNAME },
    create: {
      email: DEMO_EMAIL,
      username: DEMO_USERNAME,
      passwordHash,
      xp: totalXp,
      level,
      skillLevel: 'advanced',
    },
  });
  console.log(`  ✅  ${DEMO_USERNAME} — Level ${level} | ${totalXp} XP | advanced\n`);

  // ── Step 3: Fetch missions needed for attempts ───────────────────────────────

  console.log('🔍  Step 3 — Resolving mission IDs…');
  const targetSlugs = [
    // Foundations (3 completed)
    'mvp-launch', 'scaling-up', 'global-expansion',
    // Async Queues (3 completed)
    'file-converter', 'code-judge', 'design-chatgpt',
    // High-Read (2 completed)
    'url-shortener', 'search-engine',
    // Real-Time (2 completed → unlocks WhatsApp)
    'live-scoreboard', 'ride-hailing',
    // Scale & Streaming (2 completed)
    'social-feed', 'video-streaming',
    // Consistency (1 completed → unlocks Payment Processing)
    'booking-system',
    // In-progress (canvas prefill)
    'design-whatsapp', 'payment-processing',
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
    // ── Foundations ──────────────────────────────────────────────────────────
    { slug: 'mvp-launch',       score: 92, arch: makeSimpleArch(['client', 'server', 'database']) },
    { slug: 'scaling-up',       score: 88, arch: makeSimpleArch(['client', 'loadbalancer', 'server', 'server', 'cache', 'database']) },
    { slug: 'global-expansion', score: 85, arch: makeSimpleArch(['client', 'cdn', 'loadbalancer', 'server', 'cache', 'database']) },

    // ── Async Queues (3 unlocked) ─────────────────────────────────────────────
    // file-converter: async worker + queue + S3 — classic producer/consumer pattern
    { slug: 'file-converter',   score: 85, arch: makeSimpleArch(['client', 'apigateway', 'server', 'queue', 'server', 'storage', 'database']) },
    // code-judge: sandboxed workers drained from a queue — 3 bonus components
    { slug: 'code-judge',       score: 82, arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'queue', 'server', 'database', 'monitoring']) },
    // design-chatgpt: LLM gateway with token-budget cache + streaming queue
    { slug: 'design-chatgpt',   score: 82, arch: makeSimpleArch(['client', 'apigateway', 'server', 'cache', 'queue', 'server', 'database', 'monitoring']) },

    // ── High-Read (2 unlocked) ────────────────────────────────────────────────
    { slug: 'url-shortener',    score: 91, arch: urlShortenerArch }, // showcase — near-perfect design
    // search-engine: inverted-index reads, heavy cache layer, Elasticsearch-style
    { slug: 'search-engine',    score: 80, arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'cache', 'database', 'storage']) },

    // ── Real-Time (2 unlocked → prerequisite for Design WhatsApp) ────────────
    { slug: 'live-scoreboard',  score: 79, arch: makeSimpleArch(['client', 'loadbalancer', 'server', 'server', 'cache', 'queue', 'database']) },
    { slug: 'ride-hailing',     score: 78, arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'server', 'cache', 'database', 'queue']) },

    // ── Scale & Streaming (2 unlocked) ───────────────────────────────────────
    // social-feed: fan-out-on-write, CDN, high read:write ratio
    { slug: 'social-feed',      score: 78, arch: makeSimpleArch(['client', 'cdn', 'apigateway', 'loadbalancer', 'server', 'cache', 'queue', 'database', 'storage']) },
    // video-streaming: CDN-heavy, chunked storage, transcoding queue
    { slug: 'video-streaming',  score: 79, arch: makeSimpleArch(['client', 'cdn', 'loadbalancer', 'server', 'queue', 'storage', 'database', 'monitoring']) },

    // ── Consistency (1 completed → prerequisite for Payment Processing) ──────
    { slug: 'booking-system',   score: 82, arch: makeSimpleArch(['client', 'apigateway', 'loadbalancer', 'server', 'server', 'cache', 'database', 'monitoring']) },
  ];

  for (const { slug, score, arch } of completedMissions) {
    const mission = missionMap.get(slug);
    if (!mission) continue;
    const xpEarned = Math.round((score / 100) * mission.xpReward);
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
    { slug: 'design-whatsapp',    arch: whatsappArch, label: 'Design WhatsApp — WebSocket + Queue + Cassandra + S3' },
    { slug: 'payment-processing', arch: paymentArch,  label: 'Payment Processing — Stripe-style idempotency + ACID' },
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
      dimension: 'api-design', patternSlug: 'missing-rate-limiter',
      patternName: 'Missing Rate Limiter', frequency: 3,
      affectedMissions: JSON.stringify(['url-shortener', 'mvp-launch', 'global-expansion']),
      conceptSlug: 'rate-limiting', isResolved: false,
    },
    {
      dimension: 'reliability', patternSlug: 'single-database-spof',
      patternName: 'Single Database — No Read Replica', frequency: 2,
      affectedMissions: JSON.stringify(['design-whatsapp', 'live-scoreboard']),
      conceptSlug: 'availability', isResolved: false,
    },
    {
      dimension: 'consistency', patternSlug: 'synchronous-critical-path',
      patternName: 'Synchronous Payment Call (Queue Missing)', frequency: 2,
      affectedMissions: JSON.stringify(['payment-processing', 'booking-system']),
      conceptSlug: 'saga-pattern', isResolved: false,
    },
    {
      dimension: 'reliability', patternSlug: 'no-dead-letter-queue',
      patternName: 'No Dead Letter Queue for Failed Events', frequency: 2,
      affectedMissions: JSON.stringify(['live-scoreboard', 'ride-hailing']),
      conceptSlug: 'message-queues', isResolved: false,
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

  Login:     ${DEMO_EMAIL}  (password from DEMO_SEED_PASSWORD)
  User:      ${DEMO_USERNAME}  |  Level ${level}  |  ${totalXp} XP  |  advanced

  ✅  Completed (13 missions — 2-3 unlocked per path card)
       Foundations (3):        MVP Launch · Scaling Up · Global Expansion
       Async Queues (3):       File Converter · Code Judge · ChatGPT Backend
       High-Read (2):          URL Shortener (score 91) · Search Engine
       Real-Time (2):          Live Scoreboard · Ride Hailing → unlocks WhatsApp
       Scale & Streaming (2):  Social Feed · Video Streaming
       Consistency (1):        Booking System → unlocks Payment Processing

  🎨  Prefilled In-Progress (opens with rich canvas for demo video)
       Design WhatsApp      (real-time / intermediate)
       Payment Processing   (consistency / advanced)

  🔒  Locked (sequential prerequisite not met — shows lock UI naturally)
       Design Slack              — needs Design WhatsApp completed first
       How Stock Exchange Works  — new capstone (order 50, 600 XP)

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
