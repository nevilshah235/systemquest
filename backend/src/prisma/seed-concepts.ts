/**
 * seed-concepts.ts
 * Sprint 3 Concept Depth missions: F-03, F-05, A-05, H-04, C-04, C-07, SC-05, SC-07
 * Run: npx ts-node src/prisma/seed-concepts.ts
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Sprint 3 Concept Depth missions (41–48)...');

  // ── M-041: Secure the Gates (F-03) ─────────────────────────────────────────
  const stgComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'apigateway', 'server', 'cache', 'database'],
    hints: [
      'API Gateway is your JWT validator — every inbound request is authenticated here before reaching app servers',
      'Cache stores refresh token blacklist — revoked tokens are checked in O(1) before any DB lookup',
      'Add a dedicated Auth Server separate from business logic — single responsibility for security',
      'Database stores hashed passwords (bcrypt) and active refresh token records — never plaintext credentials',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'secure-the-gates' },
    update: { components: stgComponents, learningPath: 'foundations', skillLevel: 'beginner' },
    create: {
      slug: 'secure-the-gates',
      title: 'Mission 41: Secure the Gates',
      difficulty: 2,
      estimatedTime: '25-35 min',
      xpReward: 175,
      order: 41,
      learningPath: 'foundations',
      skillLevel: 'beginner',
      description: 'Design a secure authentication system with JWT refresh token rotation and rate limiting for a 100K-user SaaS platform under active brute-force attack.',
      scenario: "Your SaaS platform is under attack — 10K failed login attempts in the last hour from rotating IP addresses. Your current auth checks credentials directly against the database with zero rate limiting. The security team has 48 hours to design JWT refresh token rotation and brute-force protection.",
      objectives: JSON.stringify([
        'Implement JWT access tokens (15-min TTL) + refresh tokens (7-day TTL) with rotation',
        'Add rate limiting: max 5 failed logins per IP per minute, auto-lockout after 10 consecutive failures',
        'Validate every API request at the Gateway — app servers trust the gateway, never re-validate',
        'Maintain a refresh token blacklist in Cache — O(1) revocation, TTL equals max token expiry',
        'Block brute-force: IP-based sliding window counter in Redis with 15-minute cooldown',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 5000, daily: 100000 },
        performance: { latencyMs: 150, availability: 99.9 },
        budget: 1800,
        growth: '100K users, brute-force protection required',
        required: ['client', 'apigateway', 'server', 'cache', 'database'],
        bonus: [
          { component: 'monitoring', xp: 30, label: 'Add login anomaly monitoring (+30 XP)' },
          { component: 'loadbalancer', xp: 25, label: 'Add load balancer for auth servers (+25 XP)' },
          { component: 'queue', xp: 20, label: 'Add async security event audit queue (+20 XP)' },
        ],
      }),
      components: stgComponents,
      feedbackData: JSON.stringify({
        learned: [
          'JWT access tokens: short-lived (15 min), stateless — server validates signature without DB lookup',
          'Refresh tokens: long-lived (7 days), stored in DB — revocation requires DB update + blacklist cache entry',
          'Token rotation: every refresh issues a new refresh token + invalidates old one — limits replay attack window',
          'Rate limiting: sliding window counter in Redis tracks failed attempts per IP. INCR + EXPIRE per window.',
        ],
        nextMission: 'the-file-converter',
        nextPreview: 'Build an async file conversion service handling 50K conversions/day!',
      }),
    },
  });

  // ── M-042: The File Converter (F-05) ────────────────────────────────────────
  const tfcComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'queue', 'storage', 'database'],
    hints: [
      'Queue decouples fast upload from slow CPU-intensive conversion — API returns job_id within 500ms',
      'Storage holds ALL binary files (original + converted) — Database only stores job metadata (status, owner, expiry)',
      'Use 2 Servers: Upload Server (receives file, creates job) and Worker Server (consumes queue, runs conversion)',
      'Add CDN to serve converted files from edge — paid users get persistent URLs, free users 24-hour pre-signed',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'the-file-converter' },
    update: { components: tfcComponents, learningPath: 'foundations', skillLevel: 'beginner' },
    create: {
      slug: 'the-file-converter',
      title: 'Mission 42: The File Converter',
      difficulty: 2,
      estimatedTime: '30-40 min',
      xpReward: 225,
      order: 42,
      learningPath: 'foundations',
      skillLevel: 'beginner',
      description: 'Build an async file conversion service (JPG→PDF, MP4→MP3) handling 50K conversions/day with separate tiers for paid (persistent storage) and free (24-hour links) users.',
      scenario: "A file conversion service handles 50K conversions/day. The current synchronous API blocks for up to 3 minutes during large MP4→MP3 conversions, causing 504 Gateway Timeouts. Paid users expect their converted files to persist forever; free users get 24-hour download links. Redesign with async processing and object storage.",
      objectives: JSON.stringify([
        'Accept file uploads and return job_id within 500ms — never block on conversion work',
        'Process 50K conversions/day via message queue with auto-scaling workers',
        'Store original + converted files in object storage with pre-signed URLs',
        'Paid users: files persist indefinitely; free users: 24-hour TTL with auto-delete',
        'Retry failed conversions 3x; dead letter queue captures permanent failures',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 3000, daily: 50000 },
        performance: { latencyMs: 500, availability: 99.5 },
        budget: 2200,
        growth: '50K conversions/day, paid + free tiers',
        required: ['client', 'loadbalancer', 'server', 'queue', 'storage', 'database'],
        bonus: [
          { component: 'cdn', xp: 25, label: 'Add CDN for fast converted file delivery (+25 XP)' },
          { component: 'cache', xp: 20, label: 'Add cache for job status polling (+20 XP)' },
          { component: 'monitoring', xp: 25, label: 'Add queue depth + worker health monitoring (+25 XP)' },
        ],
      }),
      components: tfcComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Async upload pattern: POST /convert → 202 Accepted + { jobId }. Client polls GET /jobs/{jobId} for status.',
          'Storage vs DB: binary files go to Storage; job records (status, userId, expiresAt) go to DB.',
          'Pre-signed URLs: Storage generates time-limited HMAC-signed URL — server never proxies file bytes.',
          'Dead Letter Queue: after 3 conversion failures, job moves to DLQ for manual review + webhook to user.',
        ],
        nextMission: 'how-reddit-works',
        nextPreview: "Design Reddit's viral voting system — 50K upvotes/second without losing a single vote!",
      }),
    },
  });

  // ── M-043: How Reddit Works (A-05) ──────────────────────────────────────────
  const redditComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'cache', 'queue', 'database'],
    hints: [
      'Cache (Redis) stores vote counts — INCR/DECR is atomic and O(1). Never write votes directly to DB under load.',
      'Queue absorbs burst: 50K upvotes/sec into queue → batch writer drains to DB every 30 seconds',
      'Add Storage for Search Index — Reddit search uses Elasticsearch, completely separate from PostgreSQL',
      'Load Balancer splits: write path (votes) → write servers, read path (feed) → Cache-backed read servers',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'how-reddit-works' },
    update: { components: redditComponents, learningPath: 'async-queues', skillLevel: 'intermediate' },
    create: {
      slug: 'how-reddit-works',
      title: 'Mission 43: How Reddit Works',
      difficulty: 3,
      estimatedTime: '35-45 min',
      xpReward: 350,
      order: 43,
      learningPath: 'async-queues',
      skillLevel: 'intermediate',
      description: "Design Reddit's feed and voting system — handling 50K upvotes/second during viral moments with eventually-consistent vote counts that never lose a single vote.",
      scenario: "r/worldnews breaks a major story. The top post receives 50K upvotes/second. Your current system writes vote_count++ directly to PostgreSQL — it deadlocks at 500 votes/second. Votes must NEVER be lost. Feed pages time out at 8 seconds. Redesign the vote pipeline for viral scale.",
      objectives: JSON.stringify([
        'Handle 50K upvotes/second without database deadlocks or lost votes',
        'Serve feed pages with under 200ms latency to 1M concurrent readers',
        'Vote counts eventually consistent: new votes visible within 30 seconds',
        'Sort feed by hot score without full-table scans on each request',
        'Full-text search across 500M posts with under 500ms response time',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000000, daily: 100000000 },
        performance: { latencyMs: 200, availability: 99.9 },
        budget: 8000,
        growth: '50K upvotes/sec, 1M concurrent readers',
        required: ['client', 'loadbalancer', 'server', 'cache', 'queue', 'database'],
        bonus: [
          { component: 'storage', xp: 35, label: 'Add Elasticsearch search index (+35 XP)' },
          { component: 'monitoring', xp: 30, label: 'Add vote pipeline lag monitoring (+30 XP)' },
          { component: 'cdn', xp: 25, label: 'Add CDN for media delivery (+25 XP)' },
        ],
      }),
      components: redditComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Vote counter in Redis: INCR post:{id}:votes atomically. Periodic batch writer flushes to DB every 30s.',
          'Hot score formula: score / (age_hours + 2)^1.8 — pre-computed in Cache on each vote, not on-demand.',
          'Write/read path separation: POST /vote → write server → Queue; GET /feed → read server → Cache.',
          'Elasticsearch for search: async index update via Queue. Never block vote writes on search indexing.',
        ],
        nextMission: 'how-amazon-s3-works',
        nextPreview: 'Design Amazon S3 — store 1 trillion objects with 11 nines durability!',
      }),
    },
  });

  // ── M-044: How Amazon S3 Works (H-04) ───────────────────────────────────────
  const s3Components = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'storage', 'database', 'cdn'],
    hints: [
      'Server is the Metadata Service — routes GET/PUT to the correct Storage node via consistent hash ring',
      'Storage represents distributed storage nodes — each object is replicated 3x across 3 availability zones',
      'CDN sits in front of Storage for GET requests — 90% of reads hit CDN edge, never reaching Storage origin',
      'Database stores bucket configs, object keys, checksums, and which Storage nodes hold each replica',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'how-amazon-s3-works' },
    update: { components: s3Components, learningPath: 'high-read', skillLevel: 'advanced' },
    create: {
      slug: 'how-amazon-s3-works',
      title: 'Mission 44: How Amazon S3 Works',
      difficulty: 4,
      estimatedTime: '40-50 min',
      xpReward: 450,
      order: 44,
      learningPath: 'high-read',
      skillLevel: 'advanced',
      description: 'Design a distributed object storage system (like Amazon S3) storing 1 trillion objects with 11 nines of durability — objects from 1KB to 5TB, serving 1M GET requests/second globally.',
      scenario: "Design the internals of Amazon S3. The system stores 1 trillion objects with 99.999999999% (11 nines) durability. A single data center failure must not lose any object. 1M GET requests/second must be served globally under 100ms. Objects range from 1KB config files to 5TB database backups requiring multipart upload.",
      objectives: JSON.stringify([
        'Route PUT/GET requests to storage nodes via consistent hash ring — uniform distribution',
        'Achieve 11 nines durability: 3x replication across 3+ availability zones with checksum verification',
        'Serve 1M GET requests/second globally under 100ms using CDN edge caching',
        'Support multipart upload for objects up to 5TB — split into 5MB parts, parallel upload',
        'Detect and repair silent data corruption via periodic checksum scrubbing of all replicas',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000000, daily: 86400000000 },
        performance: { latencyMs: 100, availability: 99.99 },
        budget: 40000,
        growth: '1 trillion objects, 1M GET/sec, 11-nines durability',
        required: ['client', 'loadbalancer', 'server', 'storage', 'database', 'cdn'],
        bonus: [
          { component: 'monitoring', xp: 40, label: 'Add replication health monitoring (+40 XP)' },
          { component: 'queue', xp: 35, label: 'Add async replication queue (+35 XP)' },
          { component: 'cache', xp: 30, label: 'Add metadata cache for hot object lookups (+30 XP)' },
        ],
      }),
      components: s3Components,
      feedbackData: JSON.stringify({
        learned: [
          'Consistent hash ring: object key → hash → storage node. Adding nodes only remaps the adjacent arc segment.',
          '11 nines durability = 3 copies × 3 AZs + periodic checksum scrubbing to detect silent bit rot.',
          'Metadata Service stores WHERE an object lives; Storage Nodes store the actual bytes — two separate systems.',
          'Multipart upload: split 5TB into ~1000 parts → parallel upload → atomic server-side assembly.',
        ],
        nextMission: 'change-data-capture',
        nextPreview: 'Stream 10M production DB changes/day to a data warehouse with zero production impact!',
      }),
    },
  });

  // ── M-045: Change Data Capture (C-04) ───────────────────────────────────────
  const cdcComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['database', 'server', 'queue', 'monitoring'],
    hints: [
      'Server is the CDC Connector (Debezium) — reads the DB binary log (WAL/binlog), NOT application queries',
      'Queue is Kafka — high-throughput append-only event stream between production DB and all downstream consumers',
      'Add a second Database node as the Data Warehouse — separate analytical schema for aggregation queries',
      'Monitoring tracks replication lag — alert immediately if pipeline is more than 60 seconds behind production',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'change-data-capture' },
    update: { components: cdcComponents, learningPath: 'consistency', skillLevel: 'advanced' },
    create: {
      slug: 'change-data-capture',
      title: 'Mission 45: Change Data Capture',
      difficulty: 4,
      estimatedTime: '35-45 min',
      xpReward: 450,
      order: 45,
      learningPath: 'consistency',
      skillLevel: 'advanced',
      description: 'Design a real-time CDC pipeline syncing 10M production DB row changes/day to a data warehouse with under 30 seconds lag and zero impact on production performance.',
      scenario: "Your analytics team runs nightly batch jobs copying production PostgreSQL data to BigQuery — 12-hour lag means executives decide on yesterday's data. Direct SELECT queries on production killed DB performance. Design a CDC pipeline that reads from the binary write-ahead log without touching production query capacity.",
      objectives: JSON.stringify([
        'Stream 10M row changes/day to data warehouse with under 30 seconds end-to-end lag',
        'Zero performance impact on production DB — read binary log, not execute queries',
        'Handle schema evolution: new columns, renamed tables without pipeline restart',
        'At-least-once delivery with idempotent consumers — no duplicate rows in warehouse',
        'Monitor pipeline health: lag, throughput, error rate with on-call level alerts',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 500, daily: 10000000 },
        performance: { latencyMs: 30000, availability: 99.9 },
        budget: 4500,
        growth: '10M row changes/day, <30s lag',
        required: ['database', 'server', 'queue', 'monitoring'],
        bonus: [
          { component: 'cache', xp: 35, label: 'Add schema registry cache (+35 XP)' },
          { component: 'storage', xp: 30, label: 'Add raw event archive for replay (+30 XP)' },
          { component: 'loadbalancer', xp: 25, label: 'Add load balancer for multiple consumers (+25 XP)' },
        ],
      }),
      components: cdcComponents,
      feedbackData: JSON.stringify({
        learned: [
          'CDC reads binary log (WAL) position-based — Debezium uses logical replication slot in Postgres.',
          'Event envelope: { op: "c/u/d", before: {...}, after: {...}, source: { lsn, ts_ms } }',
          'At-least-once delivery: consumer idempotency key = source LSN + table + primary key.',
          'Schema registry: Confluent Schema Registry stores Avro/Protobuf schemas — consumers validate on read.',
        ],
        nextMission: 'the-saga-pattern',
        nextPreview: 'Replace 2PC with the Saga Pattern — distributed checkout without deadlocks!',
      }),
    },
  });

  // ── M-046: The Saga Pattern (C-07) ──────────────────────────────────────────
  const sagaComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database'],
    hints: [
      'Use 4+ Servers: Saga Orchestrator + one service each for Inventory, Payment, and Shipping',
      'Queue is the Event Bus — Orchestrator publishes commands; services reply with success or failure events',
      'Each service owns its own Database partition — no cross-service DB access, no shared transactions ever',
      'Add Monitoring to track saga completion rate, average step latency, and compensation trigger frequency',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'the-saga-pattern' },
    update: { components: sagaComponents, learningPath: 'consistency', skillLevel: 'advanced' },
    create: {
      slug: 'the-saga-pattern',
      title: 'Mission 46: The Saga Pattern',
      difficulty: 4,
      estimatedTime: '40-50 min',
      xpReward: 525,
      order: 46,
      learningPath: 'consistency',
      skillLevel: 'advanced',
      description: 'Replace a deadlock-prone 2PC checkout with an orchestrated Saga: reserve → charge → confirm → ship, with graceful compensation on any step failure.',
      scenario: "Your e-commerce platform processes 10K orders/day with a 4-step checkout. The current 2PC implementation holds DB locks for 500ms and deadlocks under Black Friday load — 200 orders abandoned in 10 minutes. Design a Saga Orchestrator that eliminates deadlocks while guaranteeing eventual consistency and graceful rollback on any failure.",
      objectives: JSON.stringify([
        'Orchestrate 4-step checkout saga without distributed transactions',
        'Compensate any step failure with reverse operations (release inventory, refund payment)',
        'Eliminate database deadlocks — no cross-service transactions ever',
        'Process 10K checkouts/day with each saga step completing within 200ms',
        'Support idempotent retries: same saga step executed twice produces identical result',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 500, daily: 10000 },
        performance: { latencyMs: 800, availability: 99.9 },
        budget: 4000,
        growth: '10K checkouts/day, Black Friday 10x surge',
        required: ['client', 'server', 'queue', 'database'],
        bonus: [
          { component: 'monitoring', xp: 40, label: 'Add saga state flow monitoring (+40 XP)' },
          { component: 'cache', xp: 30, label: 'Add idempotency key cache (+30 XP)' },
          { component: 'apigateway', xp: 25, label: 'Add API Gateway for checkout entry (+25 XP)' },
        ],
      }),
      components: sagaComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Saga vs 2PC: Saga = sequence of local transactions + compensating events. No distributed locks.',
          'Orchestration: central Orchestrator sends commands and awaits outcome events per step.',
          'Compensating transactions are best-effort and non-atomic — design for idempotency.',
          'Saga state machine: STARTED → INV_RESERVED → PAYMENT_CHARGED → ORDER_CONFIRMED → COMPLETED.',
        ],
        nextMission: 'service-mesh-microservices',
        nextPreview: 'Stop cascading failures across 200 microservices with a Service Mesh!',
      }),
    },
  });

  // ── M-047: Service Mesh & Microservices (SC-05) ──────────────────────────────
  const smComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'loadbalancer', 'server', 'monitoring', 'apigateway'],
    hints: [
      'API Gateway is the single ingress point — handles auth, rate limiting, and routing into the service mesh',
      'Multiple Server nodes represent microservices — each gets an Envoy sidecar proxy injected automatically',
      'Monitoring IS the service mesh nervous system: distributed traces, service latency heatmaps, circuit state',
      'Load Balancer performs weighted traffic splitting for canary: 10% to v2, auto-rollback on error spike',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'service-mesh-microservices' },
    update: { components: smComponents, learningPath: 'scale-streaming', skillLevel: 'advanced' },
    create: {
      slug: 'service-mesh-microservices',
      title: 'Mission 47: Service Mesh & Microservices',
      difficulty: 5,
      estimatedTime: '45-55 min',
      xpReward: 550,
      order: 47,
      learningPath: 'scale-streaming',
      skillLevel: 'advanced',
      description: 'Stop cascading failures across your 200-microservice Netflix-style platform using a service mesh with circuit breakers, distributed tracing, and canary deployments to achieve 99.99% availability.',
      scenario: "It's 8pm Friday. Your recommendation service slows to 2s. In 30 seconds: homepage times out, auth service thread pool exhausts, and streaming degrades for 3M users. Design an Istio-based service mesh so no single slow service ever takes down another service again.",
      objectives: JSON.stringify([
        'Deploy Envoy sidecar proxies to all microservices — zero app code changes needed',
        'Implement circuit breakers between all service call paths — OPEN on 50% error rate in 10s',
        'Add distributed tracing to identify latency hot spots across service call chains',
        'Enable canary deployments: route 10% to new version, auto-rollback on error spike above 1%',
        'Achieve 99.99% platform availability despite individual service failures',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 3000000, daily: 50000000 },
        performance: { latencyMs: 200, availability: 99.99 },
        budget: 25000,
        growth: '200 microservices, Netflix-scale',
        required: ['client', 'loadbalancer', 'server', 'monitoring', 'apigateway'],
        bonus: [
          { component: 'cache', xp: 45, label: 'Add circuit breaker fallback cache (+45 XP)' },
          { component: 'queue', xp: 35, label: 'Add async retry and DLQ queue (+35 XP)' },
          { component: 'database', xp: 30, label: 'Add service registry database (+30 XP)' },
        ],
      }),
      components: smComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Service mesh = infrastructure layer for service-to-service comms. App code never implements retries/mTLS.',
          'Sidecar pattern: Envoy proxy injected next to each service pod — intercepts and observes all traffic.',
          'Canary deployment: 10% → v2. Watch error rate + p99 latency for 10 min. Promote or auto-rollback.',
          'Distributed traces: trace_id injected by API Gateway, propagated via HTTP headers to all downstream calls.',
        ],
        nextMission: 'cqrs-event-sourcing',
        nextPreview: 'Design a banking audit system where every state change is an immutable event!',
      }),
    },
  });

  // ── M-048: CQRS + Event Sourcing (SC-07) ────────────────────────────────────
  const cqrsComponents = JSON.stringify({
    available: ['client', 'loadbalancer', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'apigateway'],
    required: ['client', 'server', 'queue', 'database', 'cache'],
    hints: [
      'Add 2 Servers: Command Handler (write side) and Query Handler (read side) — completely separate models',
      'Queue IS the Event Store — append-only, immutable event log. Events are never updated or deleted.',
      'Database stores the Read Model (current projected balance) — optimized for fast balance queries',
      'Cache serves real-time balance queries under 10ms — projector keeps it warm from the Event Store',
    ],
  });

  await prisma.mission.upsert({
    where: { slug: 'cqrs-event-sourcing' },
    update: { components: cqrsComponents, learningPath: 'scale-streaming', skillLevel: 'advanced' },
    create: {
      slug: 'cqrs-event-sourcing',
      title: 'Mission 48: CQRS + Event Sourcing',
      difficulty: 5,
      estimatedTime: '45-55 min',
      xpReward: 575,
      order: 48,
      learningPath: 'scale-streaming',
      skillLevel: 'advanced',
      description: 'Design a banking audit system where every account change is stored as an immutable event — reconstruct any historical state, serve real-time balances, and scale reads/writes independently.',
      scenario: "Your bank is under regulatory audit. Auditors need to reconstruct the exact balance of any account at any point in the last 10 years. Your database stores only current balance. Design an Event Sourcing system where current state is derived from an immutable log and any historical state can be reconstructed on demand.",
      objectives: JSON.stringify([
        'Store every account change as an immutable event: Deposited, Withdrawn, TransferCompleted',
        'Derive current balance by replaying the event log — no mutable state in command model',
        'Answer temporal queries: reconstruct balance for any account on any past date',
        'Serve real-time balance queries under 50ms via Read Model projection in Cache',
        'Scale read replicas independently from Event Store — completely separated read/write paths',
      ]),
      requirements: JSON.stringify({
        traffic: { concurrent: 10000, daily: 1000000 },
        performance: { latencyMs: 50, availability: 99.99 },
        budget: 15000,
        growth: '10M events/day, 10-year audit retention',
        required: ['client', 'server', 'queue', 'database', 'cache'],
        bonus: [
          { component: 'monitoring', xp: 40, label: 'Add event replay lag monitoring (+40 XP)' },
          { component: 'storage', xp: 35, label: 'Add cold event archive storage (+35 XP)' },
          { component: 'apigateway', xp: 30, label: 'Add API Gateway for command/query routing (+30 XP)' },
        ],
      }),
      components: cqrsComponents,
      feedbackData: JSON.stringify({
        learned: [
          'Event Store: append-only log of domain events. Events are immutable facts — never update or delete.',
          'CQRS: Command side validates + appends events. Query side reads projections. Completely separate models.',
          'Projection: worker replays events → builds Read Model. Eventual consistency between write + read sides.',
          'Snapshots: after N events, save a state snapshot. Replay from snapshot + delta for fast reconstruction.',
        ],
        nextMission: null,
        nextPreview: "You've completed all 8 Sprint 3 Concept missions. FAANG-level architecture mastery achieved! 🎯",
      }),
    },
  });

  console.log('✅ Sprint 3 Concept Depth missions seeded! 8 missions added (orders 41–48). Platform total: 48 missions.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
