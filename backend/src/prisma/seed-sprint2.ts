/**
 * Sprint 2 Seed — 10 new missions (P0 + P1)
 * Run with: ts-node src/prisma/seed-sprint2.ts
 *
 * P0 (Core Distributed Systems): how-reddit-works, how-amazon-s3-works,
 *    change-data-capture, the-saga-pattern
 * P1 (Concept Depth): secure-the-gates, the-file-converter,
 *    bloom-filter-guardian, db-replication-deep-dive,
 *    service-mesh-microservices, cqrs-event-sourcing
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const ALL = ['client','loadbalancer','server','database','cache','cdn','queue','storage','monitoring','apigateway'];

async function main() {
  console.log('🌱 Seeding Sprint 2 missions...');

  // ── P0: How Reddit Works (A-05) ─────────────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'how-reddit-works' },
    update: {},
    create: {
      slug: 'how-reddit-works',
      title: 'Mission 20: How Reddit Works',
      difficulty: 3,
      estimatedTime: '25–30 min',
      xpReward: 500,
      order: 20,
      learningPath: 'async-queues',
      skillLevel: 'intermediate',
      description: "Design Reddit's vote-tallying and feed pipeline handling 1.5B daily vote events without write-heavy bottlenecks.",
      scenario: "You're the lead architect at Reddit. 1.5M active users are voting, posting, and reading threads simultaneously. The current system falls over during AMAs and breaking news events. Design the async vote pipeline and hot-post feed.",
      objectives: JSON.stringify([
        'Handle 30,000 concurrent users',
        'Maintain 99.9% availability',
        'Response under 180ms',
        'Stay within $5,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 30000, daily: 1500000 },
        performance: { latencyMs: 180, availability: 99.9 },
        budget: 5000,
        growth: '3x during major AMAs and breaking news',
        required: ['client', 'server', 'database', 'cache', 'queue'],
        bonus: [
          { component: 'loadbalancer', xp: 35, label: 'Add Load Balancer (+35 XP)' },
          { component: 'apigateway',  xp: 30, label: 'Add API Gateway (+30 XP)' },
          { component: 'monitoring',  xp: 25, label: 'Add Monitoring (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'cache', 'queue'],
        hints: [
          'Queue absorbs vote storms — tallying millions of votes synchronously would kill your DB',
          'Cache stores hot post scores and comment threads — DB should never be polled per page load',
          'Load Balancer distributes 30k concurrent users across multiple app servers',
          'Monitoring detects viral posts early and scales queue workers before the system degrades',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Vote events fan out through a queue so DB writes are batched, not per-click',
          'Cache-aside for hot posts eliminates repeated DB queries for viral threads',
          'DB sharding by subreddit ID prevents hotspot writes during breaking news events',
        ],
        nextMission: 'how-amazon-s3-works',
        nextPreview: 'Reddit conquered! Now design the object storage layer behind Amazon S3.',
      }),
    },
  });

  // ── P0: How Amazon S3 Works (H-04) ─────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'how-amazon-s3-works' },
    update: {},
    create: {
      slug: 'how-amazon-s3-works',
      title: 'Mission 21: How Amazon S3 Works',
      difficulty: 5,
      estimatedTime: '35–40 min',
      xpReward: 800,
      order: 21,
      learningPath: 'high-read',
      skillLevel: 'advanced',
      description: 'Design a distributed object storage system achieving 11-nines (99.999999999%) durability with consistent hashing, multi-region replication, and CDN integration.',
      scenario: "You're architecting a cloud object storage service. Trillions of objects. 11-9s durability. Petabytes globally distributed. Millions of concurrent reads from customers worldwide.",
      objectives: JSON.stringify([
        'Handle 100,000 concurrent object requests',
        'Achieve 99.999% availability',
        'Serve objects under 120ms globally',
        'Stay within $20,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 100000, daily: 10000000 },
        performance: { latencyMs: 120, availability: 99.999 },
        budget: 20000,
        growth: 'Petabyte-scale catalog growing 15% monthly',
        required: ['client', 'server', 'storage', 'database', 'cdn'],
        bonus: [
          { component: 'loadbalancer', xp: 45, label: 'Add Load Balancer with consistent hashing (+45 XP)' },
          { component: 'cache',       xp: 35, label: 'Add metadata cache (+35 XP)' },
          { component: 'monitoring',  xp: 30, label: 'Add replication monitoring (+30 XP)' },
          { component: 'queue',       xp: 25, label: 'Add replication event queue (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'storage', 'database', 'cdn'],
        hints: [
          'Storage is the backbone — objects are striped across many physical drives using erasure coding for 11-9s durability',
          'CDN serves frequently accessed objects at edge nodes — origin cannot serve 100k simultaneous reads directly',
          'Load Balancer routes requests across storage nodes using consistent hashing to minimise redistribution on node changes',
          'Monitoring tracks replication lag and triggers automatic re-replication if a node falls behind or fails',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Consistent hashing maps objects to storage nodes — adding nodes only remaps a fraction of keys',
          'Erasure coding (not just replication) achieves 11-9s durability at 1.5x storage overhead vs 3x for triple-replication',
          'CDN offloads 95%+ of read traffic from origin — essential at petabyte scale',
        ],
        nextMission: 'change-data-capture',
        nextPreview: 'S3 designed! Now stream database changes in real time with CDC.',
      }),
    },
  });

  // ── P0: Change Data Capture (C-04) ──────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'change-data-capture' },
    update: {},
    create: {
      slug: 'change-data-capture',
      title: 'Mission 22: Change Data Capture',
      difficulty: 4,
      estimatedTime: '30–35 min',
      xpReward: 700,
      order: 22,
      learningPath: 'consistency',
      skillLevel: 'advanced',
      description: 'Design a real-time change propagation pipeline that streams every DB write to search index, analytics, and cache within 500ms using CDC.',
      scenario: "You're building a real-time sync pipeline for a global e-commerce platform. Product price and inventory updates in MySQL must propagate to Elasticsearch, analytics warehouse, and Redis cache within 500ms — without polling.",
      objectives: JSON.stringify([
        'Propagate DB changes within 500ms end-to-end',
        'Maintain 99.9% pipeline availability',
        'API response under 200ms',
        'Stay within $4,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 10000, daily: 5000000 },
        performance: { latencyMs: 200, availability: 99.9 },
        budget: 4000,
        growth: 'Event volume 5x during flash sales',
        required: ['client', 'server', 'database', 'queue'],
        bonus: [
          { component: 'cache',       xp: 35, label: 'Add read-path cache (+35 XP)' },
          { component: 'loadbalancer',xp: 30, label: 'Add Load Balancer (+30 XP)' },
          { component: 'monitoring',  xp: 30, label: 'Add CDC lag monitoring (+30 XP)' },
          { component: 'storage',     xp: 25, label: 'Add cold event archive (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'queue'],
        hints: [
          'Queue (Kafka) is the CDC backbone — Debezium tails the DB transaction log and streams events to Kafka topics',
          'Cache holds the projected latest state for fast reads — downstream CDC consumers update cache on every event',
          'Load Balancer distributes the consumer worker instances as event volume grows',
          'Monitoring tracks CDC lag (ms from DB write to downstream consumption) — must stay under 500ms',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'CDC reads the DB transaction log — zero read load on source DB, guaranteed ordering within partitions',
          'Kafka topics act as durable event bus — consumers can replay from any offset for index rebuilds',
          'Monitoring CDC lag is critical — silent lag accumulation during flash sales causes stale prices in search',
        ],
        nextMission: 'the-saga-pattern',
        nextPreview: 'CDC mastered! Now coordinate multi-service checkout with the Saga Pattern.',
      }),
    },
  });

  // ── P0: The Saga Pattern (C-07) ─────────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'the-saga-pattern' },
    update: {},
    create: {
      slug: 'the-saga-pattern',
      title: 'Mission 23: The Saga Pattern',
      difficulty: 5,
      estimatedTime: '35–45 min',
      xpReward: 750,
      order: 23,
      learningPath: 'consistency',
      skillLevel: 'advanced',
      description: 'Design an e-commerce checkout spanning 5 microservices with distributed rollback using the Saga orchestration pattern.',
      scenario: "You're designing the checkout system for a global marketplace. A single order flows through payment, inventory, fulfilment, notification, and loyalty services. Any step can fail — you need guaranteed rollback without 2PC blocking.",
      objectives: JSON.stringify([
        'Handle 8,000 concurrent checkouts',
        'Maintain 99.99% availability',
        'Checkout response under 280ms',
        'Stay within $6,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 8000, daily: 800000 },
        performance: { latencyMs: 280, availability: 99.99 },
        budget: 6000,
        growth: '10x during Black Friday — must scale horizontally',
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        bonus: [
          { component: 'apigateway',  xp: 45, label: 'Add API Gateway for idempotency (+45 XP)' },
          { component: 'loadbalancer',xp: 35, label: 'Add Load Balancer (+35 XP)' },
          { component: 'cache',       xp: 25, label: 'Add saga state cache (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'queue', 'monitoring'],
        hints: [
          'Queue is the Saga coordinator — each checkout step publishes a success/failure event; failures trigger compensating rollback events',
          'Monitoring is REQUIRED — every failed saga step (payment declined, out of stock) must trigger immediate alerts and dead-letter queue inspection',
          'Database stores saga state log for idempotent replay — network retries must not double-charge customers',
          'API Gateway enforces idempotency keys on checkout endpoints — duplicate POST retries return cached saga state',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Saga pattern uses compensating transactions for rollback — no distributed locks, no 2PC blocking',
          'Choreography vs Orchestration: orchestration gives a single saga log to debug; choreography avoids central coordinator as SPOF',
          'Idempotency keys stored with saga state prevent double-charges when clients retry after network timeouts',
        ],
        nextMission: null,
        nextPreview: 'Consistency & Transactions path complete! You are a distributed systems expert!',
      }),
    },
  });

  // ── P1: Secure the Gates (F-03) ──────────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'secure-the-gates' },
    update: {},
    create: {
      slug: 'secure-the-gates',
      title: 'Mission 24: Secure the Gates',
      difficulty: 2,
      estimatedTime: '20–25 min',
      xpReward: 350,
      order: 24,
      learningPath: 'foundations',
      skillLevel: 'beginner',
      description: 'Design a secure authentication system with JWT tokens, API gateway rate limiting, and a stateless login flow.',
      scenario: "Your startup is growing fast and needs a proper auth system. Users are complaining about session issues and the security team flagged credential stuffing attacks. Design a stateless JWT auth system with rate limiting.",
      objectives: JSON.stringify([
        'Handle 5,000 concurrent auth requests',
        'Maintain 99.9% availability',
        'Login response under 200ms',
        'Stay within $800/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 5000, daily: 100000 },
        performance: { latencyMs: 200, availability: 99.9 },
        budget: 800,
        growth: '5x after public launch',
        required: ['client', 'server', 'database', 'apigateway'],
        bonus: [
          { component: 'cache',       xp: 35, label: 'Add token cache (+35 XP)' },
          { component: 'loadbalancer',xp: 30, label: 'Add Load Balancer (+30 XP)' },
          { component: 'monitoring',  xp: 25, label: 'Add security monitoring (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'apigateway'],
        hints: [
          'API Gateway enforces rate limiting and JWT validation before requests reach your app servers',
          'Cache stores validated token metadata for fast auth checks — avoids DB round-trips on every request',
          'Load Balancer distributes auth requests across multiple servers — auth service must NOT be a SPOF',
          'Database stores user credentials (hashed with bcrypt), refresh tokens, and session revocation list',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'JWTs are stateless — any server can validate without DB lookup; cache the public key, not the token',
          'API Gateway rate limiting stops credential stuffing at the perimeter — before any compute is wasted',
          'Refresh token rotation: short-lived access tokens (15min) + long-lived refresh tokens stored in DB for revocation',
        ],
        nextMission: 'the-file-converter',
        nextPreview: 'Auth secured! Now build a file conversion service for paying users.',
      }),
    },
  });

  // ── P1: The File Converter (F-05) ───────────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'the-file-converter' },
    update: {},
    create: {
      slug: 'the-file-converter',
      title: 'Mission 25: The File Converter',
      difficulty: 2,
      estimatedTime: '20–25 min',
      xpReward: 350,
      order: 25,
      learningPath: 'foundations',
      skillLevel: 'beginner',
      description: 'Design a simple file conversion service — users upload a file, it converts asynchronously, paying users get persistent storage.',
      scenario: "You're building a file converter like Zamzar. Free users upload and download immediately; paid users store files in the cloud. The conversion takes 10-30 seconds — never block the API waiting for it.",
      objectives: JSON.stringify([
        'Handle 3,000 concurrent upload requests',
        'Maintain 99% availability',
        'API response under 250ms',
        'Stay within $500/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 3000, daily: 50000 },
        performance: { latencyMs: 250, availability: 99.0 },
        budget: 500,
        growth: '3x after Product Hunt launch',
        required: ['client', 'server', 'queue', 'storage'],
        bonus: [
          { component: 'database',    xp: 30, label: 'Add job tracking database (+30 XP)' },
          { component: 'loadbalancer',xp: 25, label: 'Add Load Balancer (+25 XP)' },
          { component: 'monitoring',  xp: 20, label: 'Add monitoring (+20 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'queue', 'storage'],
        hints: [
          'Queue decouples upload ingestion from conversion workers — API returns job ID immediately, workers convert asynchronously',
          'Storage holds original and converted files — never store binary files in your relational database',
          'Load Balancer distributes upload requests across multiple app servers to prevent the API becoming a bottleneck',
          'Database tracks job status (pending, processing, complete, failed) and paid user file metadata with expiry dates',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Async queue pattern: POST /convert returns jobId immediately; client polls GET /jobs/{id} or receives webhook on completion',
          'Object storage (S3) for binary files: never store blobs in SQL — store only the S3 key reference',
          'Worker scaling: queue depth drives auto-scaling of conversion workers during traffic spikes',
        ],
        nextMission: null,
        nextPreview: 'Foundations path complete! You have mastered the building blocks of system design!',
      }),
    },
  });

  // ── P1: The Bloom Filter Guardian (H-05) ────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'bloom-filter-guardian' },
    update: {},
    create: {
      slug: 'bloom-filter-guardian',
      title: 'Mission 26: The Bloom Filter Guardian',
      difficulty: 3,
      estimatedTime: '25–30 min',
      xpReward: 550,
      order: 26,
      learningPath: 'high-read',
      skillLevel: 'intermediate',
      description: 'Design a spam detection and URL safety check system using Bloom Filters to gate billions of lookups without unnecessary database queries.',
      scenario: "You're building the URL safety checker for a browser extension with 100M users. Every URL visit must be checked against a 500M-entry blocklist in under 50ms — without querying a database on every click.",
      objectives: JSON.stringify([
        'Handle 40,000 concurrent lookup requests',
        'Maintain 99.9% availability',
        'Respond under 150ms',
        'Stay within $2,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 40000, daily: 4000000 },
        performance: { latencyMs: 150, availability: 99.9 },
        budget: 2000,
        growth: '2x user base per quarter',
        required: ['client', 'server', 'database', 'cache'],
        bonus: [
          { component: 'loadbalancer',xp: 35, label: 'Add Load Balancer (+35 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway (+30 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add Monitoring (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'cache'],
        hints: [
          'Cache is where Bloom Filters live — a 500M-entry filter fits in ~600MB of Redis memory, gating billions of lookups',
          'Load Balancer distributes 40k concurrent safety checks across multiple application servers',
          'Database stores the ground-truth blocklist — only consulted when the Bloom Filter returns a positive (false positive rate ~1%)',
          'API Gateway rate-limits bulk lookup requests from clients to prevent abuse of the safety check endpoint',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Bloom filter: zero false negatives — if it says “not blocked” the URL is definitely safe; if it says “blocked”, verify in DB',
          '600MB Redis filter gates 99% of 4B daily lookups before any DB query fires — massive latency and cost reduction',
          'False positive rate vs memory: 1% FPR needs ~10 bits/element; 0.1% FPR needs ~15 bits/element',
        ],
        nextMission: 'db-replication-deep-dive',
        nextPreview: 'Bloom Filters mastered! Now design a globally replicated database system.',
      }),
    },
  });

  // ── P1: Database Replication Deep Dive (H-06) ───────────────────────
  await prisma.mission.upsert({
    where: { slug: 'db-replication-deep-dive' },
    update: {},
    create: {
      slug: 'db-replication-deep-dive',
      title: 'Mission 27: Database Replication Deep Dive',
      difficulty: 4,
      estimatedTime: '30–35 min',
      xpReward: 650,
      order: 27,
      learningPath: 'high-read',
      skillLevel: 'advanced',
      description: 'Design a globally replicated database system with read replicas, CDC-based lag monitoring, and CAP theorem trade-offs for a financial data product.',
      scenario: "You're building the data layer for a global fintech dashboard. 95% of traffic is reads; writes come from one primary region. Replicas in EU and APAC must serve reads under 140ms globally with zero cross-region write amplification.",
      objectives: JSON.stringify([
        'Handle 50,000 concurrent reads globally',
        'Maintain 99.99% availability',
        'Serve reads under 140ms globally',
        'Stay within $8,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 50000, daily: 5000000 },
        performance: { latencyMs: 140, availability: 99.99 },
        budget: 8000,
        growth: 'New regions added quarterly',
        required: ['client', 'server', 'database', 'cache', 'queue'],
        bonus: [
          { component: 'loadbalancer',xp: 40, label: 'Add smart read-routing Load Balancer (+40 XP)' },
          { component: 'monitoring',  xp: 35, label: 'Add replication lag monitoring (+35 XP)' },
          { component: 'apigateway', xp: 25, label: 'Add API Gateway (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'cache', 'queue'],
        hints: [
          'Cache absorbs 80% of reads before they hit any replica — the DB tier handles only cache misses and writes',
          'Queue powers CDC-based replication lag tracking — Kafka receives WAL events and measures propagation delay per replica',
          'Load Balancer routes all reads to healthy replicas and all writes to the primary; fails over to primary on replica lag spike',
          'Monitoring tracks replication lag per replica and alerts when any replica exceeds 10s lag or goes offline',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'CAP trade-off: asynchronous replication (AP) gives high availability but allows stale reads; synchronous (CP) adds write latency',
          'CDC via WAL tailing monitors replication lag in real time — much more accurate than periodic pg_stat_replication polling',
          'Cache dramatically reduces replica read load — replicas become a fallback for cache misses, not the primary read path',
        ],
        nextMission: null,
        nextPreview: 'High-Read Systems path complete! You have mastered every read-scaling pattern.',
      }),
    },
  });

  // ── P1: Service Mesh & Microservices (SC-05) ────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'service-mesh-microservices' },
    update: {},
    create: {
      slug: 'service-mesh-microservices',
      title: 'Mission 28: Service Mesh & Microservices',
      difficulty: 5,
      estimatedTime: '35–45 min',
      xpReward: 900,
      order: 28,
      learningPath: 'scale-streaming',
      skillLevel: 'advanced',
      description: "Design the service mesh and circuit breaker architecture for a Netflix-scale streaming platform across 50+ microservices with zero cascading failures.",
      scenario: "Netflix runs 700+ microservices. One bad deploy in the subtitle service should never take down video playback. Design the resilience layer: service mesh, circuit breakers, bulkheads, and observability that keep playback available at 99.99%.",
      objectives: JSON.stringify([
        'Handle 200,000 concurrent service-to-service requests',
        'Maintain 99.99% availability',
        'Inter-service latency under 150ms',
        'Stay within $25,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 200000, daily: 20000000 },
        performance: { latencyMs: 150, availability: 99.99 },
        budget: 25000,
        growth: '50+ services, new ones added weekly',
        required: ['client', 'loadbalancer', 'server', 'database', 'cache', 'monitoring'],
        bonus: [
          { component: 'apigateway', xp: 45, label: 'Add API Gateway (mesh ingress) (+45 XP)' },
          { component: 'queue',      xp: 30, label: 'Add async event bus (+30 XP)' },
          { component: 'storage',    xp: 25, label: 'Add artifact storage (+25 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'loadbalancer', 'server', 'database', 'cache', 'monitoring'],
        hints: [
          'Monitoring is REQUIRED — a service mesh without distributed tracing is blind; Jaeger/Zipkin catches cascading failures before users notice',
          'Load Balancer manages external ingress before the service mesh sidecars (Envoy) take over inter-service routing',
          'Cache reduces inter-service round-trips for config, feature flags, and shared state — cuts average service call latency by 40%',
          'API Gateway acts as the mesh ingress controller — handles mTLS termination, canary routing, and external-to-internal authentication',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Service mesh sidecar (Envoy): circuit breaker, retry with jitter, mTLS — all without modifying application code',
          'Bulkhead pattern: each service gets a separate thread pool / connection pool so one slow service cannot exhaust shared resources',
          'Distributed tracing (Jaeger) essential at 50+ services — trace IDs propagate through all service calls for end-to-end visibility',
        ],
        nextMission: 'cqrs-event-sourcing',
        nextPreview: 'Service mesh conquered! Now design an event-sourced banking ledger with CQRS.',
      }),
    },
  });

  // ── P1: CQRS + Event Sourcing (SC-07) ──────────────────────────────
  await prisma.mission.upsert({
    where: { slug: 'cqrs-event-sourcing' },
    update: {},
    create: {
      slug: 'cqrs-event-sourcing',
      title: 'Mission 29: CQRS + Event Sourcing',
      difficulty: 5,
      estimatedTime: '40–50 min',
      xpReward: 950,
      order: 29,
      learningPath: 'scale-streaming',
      skillLevel: 'advanced',
      description: 'Design an event-sourced banking ledger with CQRS separation — every transaction is an immutable event; balance read models are real-time projections.',
      scenario: "You're building the core ledger for a neobank. Every debit, credit, and transfer is an immutable event. Auditors need the full history; customers need their balance in under 180ms. Design the CQRS + Event Sourcing system that satisfies both.",
      objectives: JSON.stringify([
        'Handle 15,000 concurrent transactions',
        'Maintain 99.99% availability',
        'Balance reads under 180ms',
        'Stay within $12,000/month budget',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 15000, daily: 1500000 },
        performance: { latencyMs: 180, availability: 99.99 },
        budget: 12000,
        growth: 'Regulatory requirement: full event history forever',
        required: ['client', 'server', 'database', 'queue', 'storage'],
        bonus: [
          { component: 'cache',       xp: 45, label: 'Add CQRS read-model cache (+45 XP)' },
          { component: 'loadbalancer',xp: 35, label: 'Add Load Balancer (+35 XP)' },
          { component: 'monitoring',  xp: 35, label: 'Add event lag monitoring (+35 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway (+30 XP)' },
        ],
      }),
      components: JSON.stringify({
        available: ALL,
        required: ['client', 'server', 'database', 'queue', 'storage'],
        hints: [
          'Queue is the event bus — every transaction (debit, credit, transfer) is published as an immutable event; read-model projectors subscribe',
          'Storage holds the immutable event log archive — regulators can replay the entire ledger from day one for compliance audits',
          'Cache stores pre-computed CQRS read model projections (current balance per account) — balance queries never touch the event log',
          'Monitoring tracks projection lag — alerts if read models fall more than 5 events behind the write side',
        ],
      }),
      feedbackData: JSON.stringify({
        learned: [
          'Event sourcing: state = replay of events. Current balance = sum of all debit/credit events for accountId. Snapshots speed up replay.',
          'CQRS separation: write side appends events to the event store; read side projects events into materialised views optimised for queries',
          'Immutable event log satisfies regulators — no UPDATE/DELETE ever, full audit trail, point-in-time account state reconstruction',
        ],
        nextMission: null,
        nextPreview: 'Scale & Streaming path complete! You are a certified distributed systems architect!',
      }),
    },
  });

  console.log('✅ Sprint 2 seed complete! 10 new missions added (orders 20–29).');
  console.log('   P0: how-reddit-works, how-amazon-s3-works, change-data-capture, the-saga-pattern');
  console.log('   P1: secure-the-gates, the-file-converter, bloom-filter-guardian,');
  console.log('       db-replication-deep-dive, service-mesh-microservices, cqrs-event-sourcing');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
