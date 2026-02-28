/**
 * seed-sprint3.ts
 * Sprint 3 mission seed — adds missions 26–40 (50-mission full platform)
 * Run: npx ts-node src/prisma/seed-sprint3.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sprint 3 missions (26–40)...');

  // ── M-026: Shard or Die (H-07) ──────────────────────────────────────────
  const shardComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'cache'],
    hints: [
      'Add 3 Database shards — each owns a user_id range (shard 1: 0–666M, shard 2: 667M–1.33B, shard 3: 1.33B–2B)',
      'The Load Balancer acts as shard router: hash(user_id) % 3 directs each query to the correct shard',
      'Add Cache in front of each shard — user profile reads are ~95% of traffic',
      'Add Monitoring to detect shard hotspots — imbalanced shards are the #1 failure mode',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'shard-or-die' },
    update: { components: shardComponents, learningPath: 'high-read', skillLevel: 'advanced' },
    create: {
      slug: 'shard-or-die', title: 'Mission 26: Shard or Die',
      difficulty: 4, estimatedTime: '35-45 min', xpReward: 425, order: 26,
      learningPath: 'high-read', skillLevel: 'advanced',
      description: 'Design a sharding strategy for a 2-billion-row user table that distributes load evenly and allows future resharding without downtime.',
      scenario: "Your social network has 2 billion users. The user table is timing out — P99 latency is 4 seconds. The primary DB is at 95% CPU. Design a sharding strategy in the next hour.",
      objectives: JSON.stringify(['Distribute 2B user rows across 3 database shards by user_id range','Implement shard routing so queries always hit the correct shard','Add caching to absorb 95% of user profile reads','Achieve P99 latency under 50ms for profile lookups','Support resharding without downtime']),
      requirements: JSON.stringify({ traffic: { concurrent: 500000, daily: 50000000 }, performance: { latencyMs: 50, availability: 99.9 }, budget: 8000, growth: '2B users, resharding-ready', required: ['client', 'server', 'database', 'cache'], bonus: [{ component: 'monitoring', xp: 35, label: 'Add shard hotspot monitoring (+35 XP)' },{ component: 'queue', xp: 40, label: 'Add async resharding queue (+40 XP)' },{ component: 'loadbalancer', xp: 30, label: 'Add shard-aware load balancer (+30 XP)' }] }),
      components: shardComponents,
      feedbackData: JSON.stringify({ learned: ['Range-based sharding by user_id is predictable but creates hotspots at high-ID ranges','Hash-based sharding distributes evenly but makes range queries expensive','Virtual nodes (vnodes) allow resharding by remapping hash-ring token subsets','Cross-shard transactions require 2PC or should be avoided by designing data locality into the shard key'], nextMission: 'youtube-deep-read', nextPreview: 'YouTube serves 500M daily viewers — how does CDN + sharding combine at scale?' }),
    },
  });

  // ── M-027: How YouTube Works Deep Read (H-08) ────────────────────────────
  const ytComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'cdn', 'server', 'database', 'cache', 'storage'],
    hints: [
      'CDN is the most critical component — video bytes must NEVER come from origin servers directly',
      'Storage holds all video segments (HLS chunks) — CDN pre-warms from Storage for popular videos',
      'Cache stores video metadata (title, thumbnail, view count, recommendations) — NOT the video bytes',
      'Queue handles async transcoding: one upload spawns 5+ encoding jobs (360p, 480p, 720p, 1080p, 4K)',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'youtube-deep-read' },
    update: { components: ytComponents, learningPath: 'high-read', skillLevel: 'advanced' },
    create: {
      slug: 'youtube-deep-read', title: 'Mission 27: How YouTube Works (Deep Read)',
      difficulty: 5, estimatedTime: '40-50 min', xpReward: 500, order: 27,
      learningPath: 'high-read', skillLevel: 'advanced',
      description: "Design YouTube's video serving infrastructure: 500M daily viewers, 720K hours uploaded daily, sub-2s start time globally.",
      scenario: "Redesign YouTube's video delivery to support 500M daily viewers with a 2-second start time guarantee globally. Today the architecture hits origin servers on CDN cache miss — that's the bottleneck.",
      objectives: JSON.stringify(['Serve 500M daily viewers with under 2s video start time globally','Handle 720K hours uploaded per day through async transcoding','Achieve 95%+ CDN cache hit rate for top-10% videos','Store video metadata with under 100ms retrieval latency','Maintain 99.99% availability for the video delivery path']),
      requirements: JSON.stringify({ traffic: { concurrent: 1000000, daily: 500000000 }, performance: { latencyMs: 100, availability: 99.99 }, budget: 50000, growth: '500M DAV, 720K hours/day upload', required: ['client', 'cdn', 'server', 'database', 'cache', 'storage'], bonus: [{ component: 'queue', xp: 50, label: 'Add async transcoding queue (+50 XP)' },{ component: 'monitoring', xp: 35, label: 'Add CDN hit-rate monitoring (+35 XP)' },{ component: 'loadbalancer', xp: 30, label: 'Add load balancer for metadata servers (+30 XP)' }] }),
      components: ytComponents,
      feedbackData: JSON.stringify({ learned: ['ABR (Adaptive Bitrate): client switches quality based on bandwidth — no rebuffering','CDN pre-warming: for new viral videos, proactively push to edge PoPs before organic traffic','Recommendation cache: offline ML jobs compute recs — store as user_id→[video_ids] in Redis, never on-demand','View count: Bigtable counters batch-flush to DB every 60 seconds — eventually consistent'], nextMission: 'how-bluesky-works', nextPreview: 'How does a decentralised social network work?' }),
    },
  });

  // ── M-028: How Bluesky Works (R-05) ──────────────────────────────────────
  const blueskyComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'queue'],
    hints: [
      "Each user's data lives on their own Personal Data Server (PDS) — model as Server + Database pairs",
      'The Relay (Firehose) aggregates events from all PDSes into a global stream — model as Queue',
      'The AppView subscribes to the Relay and builds the social graph/timeline — Cache-backed Server',
      'Add API Gateway for AT Protocol identity (DID) resolution and routing to the correct PDS',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'how-bluesky-works' },
    update: { components: blueskyComponents, learningPath: 'real-time', skillLevel: 'advanced' },
    create: {
      slug: 'how-bluesky-works', title: 'Mission 28: How Bluesky Works',
      difficulty: 5, estimatedTime: '40-50 min', xpReward: 475, order: 28,
      learningPath: 'real-time', skillLevel: 'advanced',
      description: 'Design a federated social network (AT Protocol/Bluesky) where users own their data on personal servers but follow users across the network.',
      scenario: "Design the infrastructure for a federated social network. Users own their data on Personal Data Servers (PDS). A global Relay aggregates posts into a Firehose. AppViews build timelines. Design for 10M cross-server interactions per day.",
      objectives: JSON.stringify(['Route 10M daily cross-server interactions through AT Protocol','Allow users to migrate between PDS providers without losing identity','Serve timelines with under 200ms latency despite federation','Stream all events through a global Firehose Relay','Support custom feed generators consuming the Firehose']),
      requirements: JSON.stringify({ traffic: { concurrent: 50000, daily: 10000000 }, performance: { latencyMs: 200, availability: 99.9 }, budget: 15000, growth: '10M cross-server interactions/day', required: ['client', 'server', 'database', 'queue'], bonus: [{ component: 'cache', xp: 40, label: 'Add AppView cache for timeline assembly (+40 XP)' },{ component: 'monitoring', xp: 30, label: 'Add federation health monitoring (+30 XP)' },{ component: 'apigateway', xp: 35, label: 'Add API Gateway for DID resolution (+35 XP)' }] }),
      components: blueskyComponents,
      feedbackData: JSON.stringify({ learned: ['AT Protocol DIDs are user-owned identity — portable across servers','The Firehose is an append-only event stream: every post/like/follow is an event consumed by AppViews','Federation creates eventual consistency: a post on one PDS reaches another server timeline in seconds','Lexicon schemas define data format — all AT Protocol records are self-describing JSON blobs'], nextMission: 'sports-leaderboard', nextPreview: 'Build a real-time scoreboard for 5M concurrent World Cup viewers!' }),
    },
  });

  // ── M-029: The Live Scoreboard (R-06) ────────────────────────────────────
  const slComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'cache', 'queue'],
    hints: [
      'Cache is the primary read path — 5M viewers should NEVER trigger 5M database reads per score update',
      'Queue acts as Pub/Sub — score updates fan out to all WebSocket server connections instantly',
      'Load Balancer must support sticky sessions (IP hash) so WebSocket connections stay on one server',
      'CDN handles all static assets — freeing servers to only handle live data',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'sports-leaderboard' },
    update: { components: slComponents, learningPath: 'real-time', skillLevel: 'intermediate' },
    create: {
      slug: 'sports-leaderboard', title: 'Mission 29: The Live Scoreboard',
      difficulty: 3, estimatedTime: '30-40 min', xpReward: 400, order: 29,
      learningPath: 'real-time', skillLevel: 'intermediate',
      description: 'Build a live sports scoreboard serving 5M concurrent World Cup viewers — scores update every 30 seconds, leaderboard rankings update in real-time.',
      scenario: "The FIFA World Cup final just kicked off. Your scoreboard platform has 5M concurrent viewers. Every 30 seconds the score server ingests a live data feed. Your current polling architecture is melting — redesign with WebSockets and Pub/Sub.",
      objectives: JSON.stringify(['Serve 5M concurrent viewers with real-time score updates under 1 second','Handle score updates every 30 seconds without DB reads per viewer','Maintain WebSocket connections for all 5M clients','Update leaderboard rankings within 2 seconds of each score change','Achieve 99.9% availability during the 90-minute match window']),
      requirements: JSON.stringify({ traffic: { concurrent: 5000000, daily: 10000000 }, performance: { latencyMs: 100, availability: 99.9 }, budget: 5000, growth: '5M concurrent viewers, 30s updates', required: ['client', 'server', 'cache', 'queue'], bonus: [{ component: 'cdn', xp: 30, label: 'Add CDN for static match assets (+30 XP)' },{ component: 'loadbalancer', xp: 35, label: 'Add sticky-session load balancer (+35 XP)' },{ component: 'monitoring', xp: 25, label: 'Add WebSocket connection monitoring (+25 XP)' }] }),
      components: slComponents,
      feedbackData: JSON.stringify({ learned: ['Pub/Sub fan-out: score update→Queue→all WebSocket servers→all clients. One write, millions of reads.','Sticky sessions (IP hash) are required for WebSocket load balancing — reconnecting clients must land on same server','Cache-first reads: leaderboard pre-computed and stored in Redis — never recomputed from DB on each request','Backpressure: stagger WebSocket writes with small delays to avoid thundering herd on 5M simultaneous sends'], nextMission: 'circuit-breaker', nextPreview: 'What happens when one microservice fails? Design a circuit breaker.' }),
    },
  });

  // ── M-030: Circuit Breaker Pattern (SC-06) ────────────────────────────────
  const cbComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database', 'monitoring'],
    hints: [
      'Model each microservice as a separate Server — circuit breaker sits between them at API Gateway/LB level',
      'Add Cache for fallback responses — OPEN circuit returns cached stale data instead of 503',
      'Monitoring is essential — circuit state transitions must be observable and alertable',
      'Add Queue to buffer requests during OPEN state — drain buffer on CLOSED transition',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'circuit-breaker' },
    update: { components: cbComponents, learningPath: 'scale-streaming', skillLevel: 'advanced' },
    create: {
      slug: 'circuit-breaker', title: 'Mission 30: Circuit Breaker Pattern',
      difficulty: 4, estimatedTime: '35-45 min', xpReward: 500, order: 30,
      learningPath: 'scale-streaming', skillLevel: 'advanced',
      description: 'Design a resilient payment microservice using circuit breakers, fallbacks, and bulkheads to prevent cascade failures when downstream services fail.',
      scenario: "At 3pm on Black Friday, the inventory service started timing out. Within 30 seconds, cascading failures took down payments, checkout, and the homepage. Design a circuit breaker architecture so one slow service never takes down the platform again.",
      objectives: JSON.stringify(['Implement circuit breaker between payment service and all downstream dependencies','Return cached fallback responses within 200ms when circuit is OPEN','Auto-recover via HALF-OPEN state after 10 seconds of recovery','Isolate failures with bulkhead — one service failure affects only its thread pool','Monitor circuit state transitions and alert on OPEN threshold exceeded']),
      requirements: JSON.stringify({ traffic: { concurrent: 10000, daily: 5000000 }, performance: { latencyMs: 200, availability: 99.99 }, budget: 6000, growth: '12 microservices, Black Friday scale', required: ['client', 'server', 'database', 'monitoring'], bonus: [{ component: 'cache', xp: 45, label: 'Add fallback cache for OPEN circuit responses (+45 XP)' },{ component: 'queue', xp: 40, label: 'Add retry queue for buffered requests (+40 XP)' },{ component: 'apigateway', xp: 35, label: 'Add API Gateway for circuit state routing (+35 XP)' }] }),
      components: cbComponents,
      feedbackData: JSON.stringify({ learned: ['Circuit states: CLOSED (normal), OPEN (block calls + return fallback), HALF-OPEN (test recovery)','Failure threshold: 50% error rate in 10s trips to OPEN. After 10s timeout → HALF-OPEN → probe.','Bulkhead: each downstream gets its own thread pool — exhausting one never starves another','Timeout + circuit breaker: timeout prevents slow threads; circuit breaker prevents retrying broken services'], nextMission: 'notification-engine', nextPreview: 'Build a notification engine delivering 5M push/email/SMS per day!' }),
    },
  });

  // ── M-031: The Notification Engine (F-08) ────────────────────────────────
  const notifComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database'],
    hints: [
      'Use Queue to decouple the API (accepts requests) from workers (actually send push/email/SMS)',
      'Add a second Queue or dead-letter queue for retries — failed deliveries retry 3x with exponential backoff',
      'Cache stores device tokens and user preferences — avoids DB lookup per notification',
      'API Gateway handles rate limiting — a single caller cannot flood the queue',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'notification-engine' },
    update: { components: notifComponents, learningPath: 'foundations', skillLevel: 'beginner' },
    create: {
      slug: 'notification-engine', title: 'Mission 31: The Notification Engine',
      difficulty: 2, estimatedTime: '25-35 min', xpReward: 250, order: 31,
      learningPath: 'foundations', skillLevel: 'beginner',
      description: 'Build a notification system delivering 5M push, email, and SMS notifications per day with guaranteed delivery and deduplication.',
      scenario: "Your SaaS sends 5M notifications per day. Today all sends are synchronous — the API blocks until SMTP responds. On Tuesday a marketing blast caused a 47-second API timeout. Design an async notification engine that never blocks.",
      objectives: JSON.stringify(['Accept notification requests and return 202 immediately (async)','Deliver 5M notifications/day across push, email, and SMS channels','Retry failed deliveries up to 3 times with exponential backoff','Deduplicate — never send the same notification twice','Monitor delivery success rate and alert if below 99%']),
      requirements: JSON.stringify({ traffic: { concurrent: 5000, daily: 5000000 }, performance: { latencyMs: 300, availability: 99.5 }, budget: 2000, growth: '5M notifications/day, 3-channel delivery', required: ['client', 'server', 'queue', 'database'], bonus: [{ component: 'cache', xp: 30, label: 'Add device token cache (+30 XP)' },{ component: 'monitoring', xp: 25, label: 'Add delivery rate monitoring (+25 XP)' },{ component: 'apigateway', xp: 20, label: 'Add API Gateway rate limiter (+20 XP)' }] }),
      components: notifComponents,
      feedbackData: JSON.stringify({ learned: ['Async: API publishes to Queue, returns 202 — delivery happens out-of-band','DLQ: messages that fail all retries park in Dead Letter Queue for manual inspection — never silently dropped','Idempotency key: notification_id prevents sending the same message twice on retry','Fanout: "send to all users" spawns N individual queue messages — workers process independently'], nextMission: 'rest-vs-graphql', nextPreview: 'Why does your mobile app make 12 API calls to load one screen? Learn GraphQL.' }),
    },
  });

  // ── M-032: REST vs GraphQL Showdown (F-10) ───────────────────────────────
  const gqlComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'apigateway', 'server', 'database'],
    hints: [
      'The API Gateway IS the GraphQL gateway — receives queries and routes to resolver services',
      'Add Cache at gateway level — GraphQL response caching requires normalised caching (not URL-based)',
      'Add 2 Servers for different resolvers: one for user data, one for feed data — share a Database',
      'Monitoring is essential — track resolver execution time and N+1 query patterns',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'rest-vs-graphql' },
    update: { components: gqlComponents, learningPath: 'foundations', skillLevel: 'beginner' },
    create: {
      slug: 'rest-vs-graphql', title: 'Mission 32: REST vs GraphQL Showdown',
      difficulty: 2, estimatedTime: '25-30 min', xpReward: 225, order: 32,
      learningPath: 'foundations', skillLevel: 'beginner',
      description: 'Your mobile app makes 12 REST calls to render one feed screen. Migrate to GraphQL to cut API calls by 80% and eliminate over-fetching.',
      scenario: "The mobile team is frustrated: the feed screen takes 3.2s because it makes 12 sequential REST calls. Half the data in each response is unused. The backend team is tired of building custom endpoints for every mobile screen. Migrate to GraphQL.",
      objectives: JSON.stringify(['Reduce feed screen API calls from 12 to 1 GraphQL query','Eliminate over-fetching — clients request only fields they need','Keep feed load time under 200ms with GraphQL response caching','Prevent N+1 query problems with DataLoader batching','Support real-time subscriptions for live feed updates']),
      requirements: JSON.stringify({ traffic: { concurrent: 20000, daily: 2000000 }, performance: { latencyMs: 200, availability: 99.9 }, budget: 2500, growth: 'Mobile-first, 12→1 API calls', required: ['client', 'apigateway', 'server', 'database'], bonus: [{ component: 'cache', xp: 30, label: 'Add GraphQL normalised cache (+30 XP)' },{ component: 'monitoring', xp: 25, label: 'Add resolver performance monitoring (+25 XP)' },{ component: 'loadbalancer', xp: 20, label: 'Add load balancer for resolver services (+20 XP)' }] }),
      components: gqlComponents,
      feedbackData: JSON.stringify({ learned: ['GraphQL solves over-fetching (REST returns full objects) and under-fetching (REST requires multiple calls)','N+1 problem: 10 posts + 10 authors = 11 queries without DataLoader — DataLoader batches into 2 queries','GraphQL persisted queries: send hash instead of full query text — enables CDN caching','REST is better for: public APIs, file uploads, CDN caching (URL-based), binary data'], nextMission: 'event-driven-microservice', nextPreview: 'Rebuild a monolithic order system as event-driven microservices!' }),
    },
  });

  // ── M-033: The Event-Driven Microservice (A-08) ───────────────────────────
  const edmComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database'],
    hints: [
      'Model 4 microservices as 4 Servers: Order, Inventory, Payment, Shipping',
      'Queue is the Event Bus — services publish and subscribe without direct coupling',
      'Each service owns its own Database partition (database-per-service) — no shared DB',
      'Add Monitoring to track event processing lag — backed-up queue = service falling behind',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'event-driven-microservice' },
    update: { components: edmComponents, learningPath: 'async-queues', skillLevel: 'intermediate' },
    create: {
      slug: 'event-driven-microservice', title: 'Mission 33: The Event-Driven Microservice',
      difficulty: 3, estimatedTime: '35-45 min', xpReward: 400, order: 33,
      learningPath: 'async-queues', skillLevel: 'intermediate',
      description: 'Decompose a monolithic e-commerce order system into event-driven microservices: order placed → inventory reserved → payment charged → shipping triggered, all via events.',
      scenario: "Your e-commerce monolith handles order, inventory, payment, and shipping in one transaction. When the payment gateway slows down, the entire flow locks up. Design an event-driven architecture where each service reacts independently.",
      objectives: JSON.stringify(['Publish OrderPlaced event triggering inventory reservation flow','Publish InventoryReserved triggering payment charge','Publish PaymentCharged triggering shipping label generation','Handle failures with compensating events for rollback','Process 50,000 orders/day with each service scaling independently']),
      requirements: JSON.stringify({ traffic: { concurrent: 5000, daily: 50000 }, performance: { latencyMs: 500, availability: 99.9 }, budget: 4000, growth: '50k orders/day, 4-service choreography', required: ['client', 'server', 'queue', 'database'], bonus: [{ component: 'monitoring', xp: 35, label: 'Add event lag monitoring per service (+35 XP)' },{ component: 'cache', xp: 30, label: 'Add idempotency key cache (+30 XP)' },{ component: 'apigateway', xp: 25, label: 'Add API Gateway for order entry (+25 XP)' }] }),
      components: edmComponents,
      feedbackData: JSON.stringify({ learned: ['Choreography vs Orchestration: choreography = each service reacts independently; orchestration = central coordinator directs','At-least-once delivery: services must be idempotent — processing the same event twice has no side effect','Event schema evolution: adding fields is backward-compatible; removing is a breaking change','Outbox pattern: write event to local DB table atomically with business op, then relay publishes — prevents lost events'], nextMission: 'presence-at-scale', nextPreview: 'How does WhatsApp show last seen accurately for 500M users without polling?' }),
    },
  });

  // ── M-034: Presence at Scale (R-07) ──────────────────────────────────────
  const presComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'cache', 'database'],
    hints: [
      'Cache (Redis) stores presence: user_id → { status, lastSeen, ttl: 30s }',
      'Clients send heartbeat every 15s — no heartbeat for 30s → user marked offline via TTL expiry',
      'Add Queue for presence change events — fan-out to all online contacts when status changes',
      'Load Balancer must use consistent hashing — presence connection always lands on same server (stateful)',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'presence-at-scale' },
    update: { components: presComponents, learningPath: 'real-time', skillLevel: 'intermediate' },
    create: {
      slug: 'presence-at-scale', title: 'Mission 34: Presence at Scale',
      difficulty: 3, estimatedTime: '30-40 min', xpReward: 400, order: 34,
      learningPath: 'real-time', skillLevel: 'intermediate',
      description: 'Design an online presence system for 500M users — accurate online/offline status within 5 seconds, without polling every user every second.',
      scenario: "500M users poll the API every 5 seconds to check friend status — that's 100M requests/second. This is killing the database. Design a heartbeat-based system accurate within 5 seconds that scales to 500M users.",
      objectives: JSON.stringify(['Track online/offline state for 500M users with under 5s staleness','Use heartbeat + push instead of client polling','Fan-out presence changes only to contacts currently online','Handle 50M simultaneous reconnections after server restart gracefully','Store last-seen timestamps for offline users with 30-day retention']),
      requirements: JSON.stringify({ traffic: { concurrent: 50000000, daily: 500000000 }, performance: { latencyMs: 150, availability: 99.9 }, budget: 12000, growth: '500M users, 5s staleness SLA', required: ['client', 'server', 'cache', 'database'], bonus: [{ component: 'queue', xp: 40, label: 'Add presence fan-out queue (+40 XP)' },{ component: 'loadbalancer', xp: 35, label: 'Add consistent-hash load balancer (+35 XP)' },{ component: 'monitoring', xp: 25, label: 'Add heartbeat latency monitoring (+25 XP)' }] }),
      components: presComponents,
      feedbackData: JSON.stringify({ learned: ['TTL-based presence: Redis key TTL = heartbeat_interval × 2 — expiry = offline. No explicit offline event needed.','Fan-out on status change: only notify online contacts, not all 500M users. Pre-compute contact lists.','Thundering herd on reconnect: add jitter (random 0-5s) to client reconnect timers after server restart','Privacy: many users opt-out of sharing presence per-contact — not globally visible'], nextMission: 'multiplayer-game-server', nextPreview: 'Design a real-time multiplayer game server for 100K simultaneous sessions!' }),
    },
  });

  // ── M-035: The Multiplayer Game Server (R-08) ──────────────────────────────
  const gsComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'database', 'cache'],
    hints: [
      'Add 4 Servers — each Game Server hosts up to 25K sessions',
      'Consistent hashing at Load Balancer assigns all 10 players of a session to the SAME game server',
      'Cache stores live game state — each 50ms tick writes to Cache, NOT Database',
      'Database only persists final game results and player stats — not the live state',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'multiplayer-game-server' },
    update: { components: gsComponents, learningPath: 'real-time', skillLevel: 'advanced' },
    create: {
      slug: 'multiplayer-game-server', title: 'Mission 35: The Multiplayer Game Server',
      difficulty: 4, estimatedTime: '35-45 min', xpReward: 450, order: 35,
      learningPath: 'real-time', skillLevel: 'advanced',
      description: 'Design a real-time multiplayer game server for 100K simultaneous sessions — 10 players per session, game state sync every 50ms, under 100ms latency.',
      scenario: "Design the game server infrastructure for a real-time multiplayer shooter. 100K simultaneous sessions, 10 players each = 1M concurrent connections. Game state must sync every 50ms. Latency above 100ms causes visible lag.",
      objectives: JSON.stringify(['Host 100K simultaneous game sessions across a server fleet','Sync game state to 10 players every 50ms with under 100ms latency','Assign all players in a session to the same game server (stateful)','Handle server crashes — migrate sessions within 2 seconds','Persist final game results and player stats to database']),
      requirements: JSON.stringify({ traffic: { concurrent: 1000000, daily: 10000000 }, performance: { latencyMs: 100, availability: 99.9 }, budget: 20000, growth: '100K sessions, 50ms tick rate', required: ['client', 'loadbalancer', 'server', 'database', 'cache'], bonus: [{ component: 'monitoring', xp: 35, label: 'Add tick latency monitoring (+35 XP)' },{ component: 'queue', xp: 40, label: 'Add matchmaking queue (+40 XP)' },{ component: 'cdn', xp: 25, label: 'Add CDN for game asset delivery (+25 XP)' }] }),
      components: gsComponents,
      feedbackData: JSON.stringify({ learned: ['Game state is NOT in the DB during a session — it lives in memory. DB writes only at game end.','Authoritative server: server is source of truth — clients predict locally, server reconciles conflicts','Dead reckoning: extrapolate player position from last known velocity on packet loss — reduces visible lag','Session migration on crash: snapshot game state to Cache periodically so another server can resume'], nextMission: 'observability-at-scale', nextPreview: 'How does Datadog ingest 10M metrics/second? Build an observability platform!' }),
    },
  });

  // ── M-036: Observability at Scale (SC-08 full) ────────────────────────────
  const obsComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database', 'storage', 'monitoring'],
    hints: [
      'Queue is the ingestion buffer — 10M metrics/sec cannot write directly to DB',
      'Add 3 Servers: ingestion, log processing, query engine — each scales independently',
      'Storage holds raw time-series data; Database holds aggregated rollups and alert rules',
      'Cache stores pre-computed dashboard queries — 20 charts × 10s refresh = 120 DB queries/min without it',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'observability-at-scale' },
    update: { components: obsComponents, learningPath: 'scale-streaming', skillLevel: 'advanced' },
    create: {
      slug: 'observability-at-scale', title: 'Mission 36: Observability at Scale',
      difficulty: 5, estimatedTime: '45-55 min', xpReward: 600, order: 36,
      learningPath: 'scale-streaming', skillLevel: 'advanced',
      description: 'Design a production monitoring platform (like Datadog) ingesting 10M metrics/second, 1M log lines/second, 100K traces/second — all queryable within 2 seconds.',
      scenario: "500 companies send your monitoring platform 10M metrics/second, 1M log lines/second, and 100K traces/second. Every metric must be queryable within 2 seconds. Alert evaluation runs every 30 seconds across 100K rules. Design this.",
      objectives: JSON.stringify(['Ingest 10M metrics/second with under 30 seconds of lag','Make any metric queryable within 2 seconds of ingestion','Evaluate 100K alert rules every 30 seconds without falling behind','Store 15 months of metrics at 10-second resolution','Serve real-time dashboards with 10-second refresh under 500ms latency']),
      requirements: JSON.stringify({ traffic: { concurrent: 500000, daily: 864000000000 }, performance: { latencyMs: 500, availability: 99.99 }, budget: 100000, growth: '10M metrics/sec, 100K alert rules', required: ['client', 'server', 'queue', 'database', 'storage', 'monitoring'], bonus: [{ component: 'cache', xp: 50, label: 'Add dashboard query cache (+50 XP)' },{ component: 'loadbalancer', xp: 35, label: 'Add ingestion load balancer (+35 XP)' },{ component: 'apigateway', xp: 30, label: 'Add API Gateway for query routing (+30 XP)' }] }),
      components: obsComponents,
      feedbackData: JSON.stringify({ learned: ['Time-series databases store data columnar by metric+labels — 100x compressed for sequential time data','Downsampling: raw 7 days → 1-min rollups 3 months → hourly 15 months — 100x storage reduction','Three pillars: Metrics (what), Logs (why), Traces (where across services)','Cardinality explosion: millions of unique label combinations kills TSDB — enforce label cardinality limits'], nextMission: 'distributed-locks-deep-dive', nextPreview: 'How does Redis Redlock provide distributed exclusivity?' }),
    },
  });

  // ── M-037: Distributed Locks Deep Dive (C-02 ext) ────────────────────────
  const dllComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'cache', 'database'],
    hints: [
      'Add 2 Cache nodes (Redis replicas) — Redlock requires quorum across N/2+1 independent Redis instances',
      'Add 3 Servers to simulate distributed system — multiple processes competing for the same lock',
      'Database persists the final result of the locked operation — never the lock itself',
      'Monitoring: track lock acquisition latency and lock contention rate',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'distributed-locks-deep-dive' },
    update: { components: dllComponents, learningPath: 'consistency', skillLevel: 'advanced' },
    create: {
      slug: 'distributed-locks-deep-dive', title: 'Mission 37: Distributed Locks Deep Dive',
      difficulty: 5, estimatedTime: '40-50 min', xpReward: 500, order: 37,
      learningPath: 'consistency', skillLevel: 'advanced',
      description: 'Design a distributed locking system using Redis Redlock — ensuring exclusive access across 3 service instances without race conditions or split-brain.',
      scenario: "Your inventory reservation system runs on 3 servers. All 3 can receive a request to reserve the last item in stock simultaneously. Without a lock, all 3 will read stock:1, decrement, and confirm 3 orders. Design Redis Redlock to prevent this.",
      objectives: JSON.stringify(['Acquire distributed lock using Redlock quorum (2 of 2 Redis nodes)','Prevent race conditions when 3 service instances compete for the same resource','Auto-expire locks after 30s if holder crashes','Implement fencing tokens to prevent stale lock holders from causing damage','Achieve lock acquisition latency under 10ms']),
      requirements: JSON.stringify({ traffic: { concurrent: 1000, daily: 500000 }, performance: { latencyMs: 10, availability: 99.9 }, budget: 3000, growth: '3 service instances, zero race conditions', required: ['client', 'server', 'cache', 'database'], bonus: [{ component: 'monitoring', xp: 40, label: 'Add lock contention monitoring (+40 XP)' },{ component: 'queue', xp: 35, label: 'Add lock request queue for waiters (+35 XP)' },{ component: 'loadbalancer', xp: 30, label: 'Add load balancer across lock-acquiring services (+30 XP)' }] }),
      components: dllComponents,
      feedbackData: JSON.stringify({ learned: ['Redlock: SET NX PX on N Redis nodes — succeed only if majority (N/2+1) acquired within lock_expiry/10 time','Fencing tokens: monotonically increasing counter returned with lock. Storage checks token before write — stale holders rejected.','Split-brain risk: two processes both hold lock (partition + clock skew) — fencing tokens prevent double-write','Lease expiry: set TTL to MAX expected critical section duration, not average'], nextMission: 'concurrency-vs-parallelism', nextPreview: "What's the difference between concurrency and parallelism? Design a thread pool." }),
    },
  });

  // ── M-038: Concurrency vs Parallelism (A-04 ext) ─────────────────────────
  const cvpComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database'],
    hints: [
      'Add 3 Servers for the thread pool: I/O server (async loop), CPU server (core-count pool), Coordinator',
      'Queue is the work queue feeding thread pools — producers enqueue, workers pull and execute',
      'Add Storage for I/O-bound tasks — reading/writing files in parallel vs sequentially',
      'Cache reduces contention — concurrent threads share cache instead of DB, avoiding lock contention',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'concurrency-vs-parallelism' },
    update: { components: cvpComponents, learningPath: 'async-queues', skillLevel: 'intermediate' },
    create: {
      slug: 'concurrency-vs-parallelism', title: 'Mission 38: Concurrency vs Parallelism',
      difficulty: 3, estimatedTime: '30-40 min', xpReward: 400, order: 38,
      learningPath: 'async-queues', skillLevel: 'intermediate',
      description: 'Design a thread pool system handling both I/O-bound and CPU-bound tasks efficiently — demonstrating the difference between concurrent and parallel execution.',
      scenario: "Your data platform has two job types: (1) I/O-bound: reading 10GB files from S3 — lots of waiting, little CPU. (2) CPU-bound: compressing video — 100% CPU. Using one thread pool for both causes CPU-bound jobs to starve I/O-bound ones. Design separate pools.",
      objectives: JSON.stringify(['Design separate thread pools for I/O-bound vs CPU-bound tasks','Handle 10K concurrent I/O-bound tasks with minimal thread overhead','Process 100 CPU-bound tasks in true parallelism (one per core)','Implement backpressure — reject new tasks when queue is full instead of OOM','Monitor thread pool utilisation and queue depth per pool']),
      requirements: JSON.stringify({ traffic: { concurrent: 10000, daily: 1000000 }, performance: { latencyMs: 250, availability: 99.5 }, budget: 3500, growth: '10k concurrent I/O tasks, 100 CPU tasks', required: ['client', 'server', 'queue', 'database'], bonus: [{ component: 'monitoring', xp: 35, label: 'Add thread pool utilisation monitoring (+35 XP)' },{ component: 'cache', xp: 30, label: 'Add result cache (+30 XP)' },{ component: 'loadbalancer', xp: 25, label: 'Add load balancer across workers (+25 XP)' }] }),
      components: cvpComponents,
      feedbackData: JSON.stringify({ learned: ['Concurrency: many tasks in progress at once (interleaved); Parallelism: multiple executing simultaneously on different CPUs','I/O-bound: async/await or large thread pool — threads spend most time waiting, thousands without CPU overhead','CPU-bound: thread pool sized to cpu_count() — more threads = context switching overhead with no gain','Backpressure: bounded queue + rejection policy (CallerRuns, DiscardOldest, HTTP 429)'], nextMission: 'two-phase-commit-practice', nextPreview: 'When does 2PC make sense? Design a distributed DB with Two-Phase Commit.' }),
    },
  });

  // ── M-039: Two-Phase Commit in Practice (H-06 ext) ────────────────────────
  const tpcComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'database'],
    hints: [
      'Add 3 Database nodes — 2PC needs a Coordinator (Server) and Participants (DB nodes that vote)',
      'Phase 1 (Prepare): Coordinator sends PREPARE — participants lock resources and vote YES or NO',
      'Phase 2 (Commit): ALL YES → COMMIT to all. ANY NO → ROLLBACK to all.',
      'Add Monitoring to track 2PC latency — slow participant blocks ALL until protocol completes',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'two-phase-commit-practice' },
    update: { components: tpcComponents, learningPath: 'high-read', skillLevel: 'advanced' },
    create: {
      slug: 'two-phase-commit-practice', title: 'Mission 39: Two-Phase Commit in Practice',
      difficulty: 5, estimatedTime: '40-50 min', xpReward: 450, order: 39,
      learningPath: 'high-read', skillLevel: 'advanced',
      description: 'Design a distributed database transaction across 3 nodes using Two-Phase Commit — handling coordinator failure and understanding when 2PC is worth the cost.',
      scenario: "You're building a cross-region bank transfer: debit US-East, credit EU-West atomically. A simple single-DB transaction won't work across regions. You need 2PC. But the coordinator can crash after Phase 1, leaving participants with locks held indefinitely. Design the full protocol with recovery.",
      objectives: JSON.stringify(['Coordinate atomic write across 3 database nodes using 2PC','Handle coordinator crash after Phase 1 — participants must not hold locks forever','Implement coordinator recovery by reading transaction log on restart','Complete 2PC round trip within 200ms under normal conditions','Demonstrate the blocking problem — show what breaks when a participant is slow']),
      requirements: JSON.stringify({ traffic: { concurrent: 500, daily: 100000 }, performance: { latencyMs: 200, availability: 99.9 }, budget: 4000, growth: '3 database nodes, cross-region', required: ['client', 'server', 'database'], bonus: [{ component: 'monitoring', xp: 40, label: 'Add 2PC transaction state monitoring (+40 XP)' },{ component: 'queue', xp: 35, label: 'Add async compensating transaction queue (+35 XP)' },{ component: 'cache', xp: 25, label: 'Add coordinator state cache (+25 XP)' }] }),
      components: tpcComponents,
      feedbackData: JSON.stringify({ learned: ['2PC is blocking: participants hold locks from Phase 1 until Phase 2. Coordinator crash = indefinite block.','Coordinator recovery: writes to WAL before each phase. On restart, re-reads log and re-sends Phase 2.','3PC adds a third phase to avoid blocking — more round trips, rarely used in practice','When to use 2PC: cross-DB atomic writes where Saga eventual consistency is not acceptable (banks, airlines)'], nextMission: 'full-stack-observability-capstone', nextPreview: 'CAPSTONE: Design a full production platform combining all 6 learning paths!' }),
    },
  });

  // ── M-040: Full-Stack Observability Capstone (SC-08 cap) ──────────────────
  const capComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'cdn', 'apigateway', 'loadbalancer', 'server', 'cache', 'queue', 'database', 'storage', 'monitoring'],
    hints: [
      'This is the capstone — all 10 component types must be used and justified.',
      'CDN → API Gateway → Load Balancer → App Servers is the traffic path. Do not skip any layer.',
      'Queue connects servers to async workers. Monitoring watches everything.',
      'Cache sits between servers and DB. Storage holds binary artifacts.',
    ],
  });
  await prisma.mission.upsert({
    where: { slug: 'full-stack-observability-capstone' },
    update: { components: capComponents, learningPath: 'scale-streaming', skillLevel: 'advanced' },
    create: {
      slug: 'full-stack-observability-capstone', title: 'Mission 40: The Full-Stack Observability Capstone',
      difficulty: 5, estimatedTime: '55-70 min', xpReward: 700, order: 40,
      learningPath: 'scale-streaming', skillLevel: 'advanced',
      description: 'CAPSTONE: Design the complete production platform for a FAANG-scale service — applying all 6 learning paths simultaneously with full observability.',
      scenario: "You are now the lead architect for a 500M-user production platform. It handles real-time messaging, video streaming, payments, async notifications, global CDN delivery, and full observability. Use everything you've learned across all 6 paths to achieve 99.99% availability at global scale.",
      objectives: JSON.stringify(['Design a platform serving 500M users across all 6 architectural domains','Use all 10 component types in a coherent justified architecture','Achieve 99.99% availability with no single point of failure','Demonstrate full observability — metrics, logs, traces all visible','Keep monthly infrastructure cost under $50,000']),
      requirements: JSON.stringify({ traffic: { concurrent: 5000000, daily: 500000000 }, performance: { latencyMs: 150, availability: 99.99 }, budget: 50000, growth: '500M users, all paths combined', required: ['client', 'cdn', 'apigateway', 'loadbalancer', 'server', 'cache', 'queue', 'database', 'storage', 'monitoring'], bonus: [] }),
      components: capComponents,
      feedbackData: JSON.stringify({ learned: ['Full-stack: CDN→API GW→LB→Servers→Cache→DB→Storage→Queue→Monitoring. Each layer has a clear role.','Every decision is a trade-off: more caching = more staleness, more sharding = more operational complexity','The golden rule: measure before optimising. Add components when data shows they are needed.','You now have the vocabulary, patterns, and instincts to ace any FAANG system design interview. Go build something great.'], nextMission: null, nextPreview: "You've completed all 40 missions. You're FAANG-ready. 🎉" }),
    },
  });

  console.log('✅ Sprint 3 seed complete! 15 missions added (orders 26–40). Platform total: 38 missions.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
