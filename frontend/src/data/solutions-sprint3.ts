/**
 * solutions-sprint3.ts
 * Sprint 3 reference solutions — missions 26-40
 * Import SPRINT3_SOLUTIONS and spread into MISSION_SOLUTIONS in solutions.ts
 */
import { Architecture } from './types';

export interface MissionSolution {
  architecture: Architecture;
  steps: string[];
  explanation: string;
}

export const SPRINT3_SOLUTIONS: Record<string, MissionSolution> = {

  // ── Mission 26: Shard or Die ──────────────────────────────────────────────
  'shard-or-die': {
    architecture: {
      components: [
        { id: 'sol-client',   type: 'client',       x: 300, y: 40  },
        { id: 'sol-apigw',   type: 'apigateway',   x: 300, y: 160 },
        { id: 'sol-lb',      type: 'loadbalancer',  x: 300, y: 280 },
        { id: 'sol-server1', type: 'server',        x: 80,  y: 400 },
        { id: 'sol-server2', type: 'server',        x: 300, y: 400 },
        { id: 'sol-cache1',  type: 'cache',         x: 80,  y: 520 },
        { id: 'sol-cache2',  type: 'cache',         x: 300, y: 520 },
        { id: 'sol-db1',     type: 'database',      x: 60,  y: 640 },
        { id: 'sol-db2',     type: 'database',      x: 220, y: 640 },
        { id: 'sol-db3',     type: 'database',      x: 380, y: 640 },
        { id: 'sol-mon',     type: 'monitoring',    x: 580, y: 400 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-server1',to: 'sol-cache1'  },
        { id: 'sc6',  from: 'sol-server2',to: 'sol-cache2'  },
        { id: 'sc7',  from: 'sol-cache1', to: 'sol-db1'     },
        { id: 'sc8',  from: 'sol-cache1', to: 'sol-db2'     },
        { id: 'sc9',  from: 'sol-cache2', to: 'sol-db2'     },
        { id: 'sc10', from: 'sol-cache2', to: 'sol-db3'     },
        { id: 'sc11', from: 'sol-mon',    to: 'sol-server1' },
        { id: 'sc12', from: 'sol-mon',    to: 'sol-server2' },
      ],
    },
    steps: [
      'Client → API Gateway → Load Balancer (shard router: hash(user_id) % 3) → 2 App Servers',
      'Each App Server → Cache (absorbs 95% of user profile reads)',
      'Cache → 3 DB Shards: shard 1 (0–666M), shard 2 (667M–1.33B), shard 3 (1.33B–2B)',
      'Same user always hits same shard. Add Monitoring for hotspot detection.',
    ],
    explanation: 'Three DB shards distribute 2B user rows by user_id range. Cache absorbs 95% of reads. Load Balancer routes via hash(user_id) % 3. Monitoring detects shard hotspots that signal when to reshard.',
  },

  // ── Mission 27: How YouTube Works (Deep Read) ─────────────────────────────
  'youtube-deep-read': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-cdn',    type: 'cdn',          x: 580, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway',  x: 300, y: 140 },
        { id: 'sol-lb',     type: 'loadbalancer', x: 300, y: 260 },
        { id: 'sol-srv1',   type: 'server',       x: 100, y: 380 },
        { id: 'sol-srv2',   type: 'server',       x: 300, y: 380 },
        { id: 'sol-srv3',   type: 'server',       x: 500, y: 380 },
        { id: 'sol-mon',    type: 'monitoring',   x: 700, y: 380 },
        { id: 'sol-cache1', type: 'cache',        x: 100, y: 500 },
        { id: 'sol-cache2', type: 'cache',        x: 300, y: 500 },
        { id: 'sol-queue',  type: 'queue',        x: 500, y: 500 },
        { id: 'sol-db',     type: 'database',     x: 100, y: 620 },
        { id: 'sol-storage',type: 'storage',      x: 400, y: 620 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'    },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc3',  from: 'sol-cdn',     to: 'sol-storage'},
        { id: 'sc4',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-srv1'   },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-srv2'   },
        { id: 'sc7',  from: 'sol-lb',      to: 'sol-srv3'   },
        { id: 'sc8',  from: 'sol-srv1',    to: 'sol-cache1' },
        { id: 'sc9',  from: 'sol-srv2',    to: 'sol-cache2' },
        { id: 'sc10', from: 'sol-srv3',    to: 'sol-queue'  },
        { id: 'sc11', from: 'sol-cache1',  to: 'sol-db'     },
        { id: 'sc12', from: 'sol-cache2',  to: 'sol-db'     },
        { id: 'sc13', from: 'sol-queue',   to: 'sol-storage'},
        { id: 'sc14', from: 'sol-mon',     to: 'sol-srv1'   },
        { id: 'sc15', from: 'sol-mon',     to: 'sol-srv2'   },
      ],
    },
    steps: [
      'Client → CDN: ALL video bytes from CDN edge. CDN ← Storage origin. App servers never touch video bytes.',
      'Client → API Gateway → LB → 3 Servers for metadata (watch page, recs, comments)',
      'Cache 1: video metadata. Cache 2: personalised recommendation lists.',
      'Server 3 → Queue → async transcoding workers → Storage (HLS chunks in 5 resolutions)',
    ],
    explanation: 'Read path: CDN→Client (video). App servers handle metadata only. Two caches serve metadata and recommendations. Queue drives async transcoding. Monitoring tracks CDN hit rate and transcoding lag.',
  },

  // ── Mission 28: How Bluesky Works ─────────────────────────────────────────
  'how-bluesky-works': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway',  x: 300, y: 150 },
        { id: 'sol-lb',     type: 'loadbalancer', x: 300, y: 270 },
        { id: 'sol-pds1',   type: 'server',       x: 80,  y: 390 },
        { id: 'sol-pds2',   type: 'server',       x: 260, y: 390 },
        { id: 'sol-appview',type: 'server',       x: 440, y: 390 },
        { id: 'sol-mon',    type: 'monitoring',   x: 640, y: 390 },
        { id: 'sol-db1',    type: 'database',     x: 80,  y: 510 },
        { id: 'sol-db2',    type: 'database',     x: 260, y: 510 },
        { id: 'sol-queue',  type: 'queue',        x: 440, y: 510 },
        { id: 'sol-cache',  type: 'cache',        x: 440, y: 630 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-pds1'   },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-pds2'   },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-appview'},
        { id: 'sc6',  from: 'sol-pds1',    to: 'sol-db1'    },
        { id: 'sc7',  from: 'sol-pds2',    to: 'sol-db2'    },
        { id: 'sc8',  from: 'sol-pds1',    to: 'sol-queue'  },
        { id: 'sc9',  from: 'sol-pds2',    to: 'sol-queue'  },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-appview'},
        { id: 'sc11', from: 'sol-appview', to: 'sol-cache'  },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-pds1'   },
      ],
    },
    steps: [
      'Client → API Gateway (DID resolution) → LB → 2 PDS + 1 AppView servers',
      'PDS nodes: each user owns their data. PDS 1 → DB 1, PDS 2 → DB 2.',
      'PDS events (posts/likes/follows) publish to Relay Queue (Firehose)',
      'AppView subscribes to Queue → assembles timelines → stores in Cache for fast reads',
    ],
    explanation: 'AT Protocol: each user owns data on their PDS. Events flow to global Firehose (Queue). AppView assembles timelines from the Firehose and caches results. API Gateway resolves DIDs for routing.',
  },

  // ── Mission 29: The Live Scoreboard ──────────────────────────────────────
  'sports-leaderboard': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-cdn',    type: 'cdn',          x: 580, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway',  x: 300, y: 150 },
        { id: 'sol-lb',     type: 'loadbalancer', x: 300, y: 270 },
        { id: 'sol-srv1',   type: 'server',       x: 80,  y: 390 },
        { id: 'sol-srv2',   type: 'server',       x: 260, y: 390 },
        { id: 'sol-srv3',   type: 'server',       x: 440, y: 390 },
        { id: 'sol-mon',    type: 'monitoring',   x: 640, y: 390 },
        { id: 'sol-queue',  type: 'queue',        x: 150, y: 510 },
        { id: 'sol-cache',  type: 'cache',        x: 380, y: 510 },
        { id: 'sol-db',     type: 'database',     x: 270, y: 630 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'    },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-srv1'   },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-srv2'   },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-srv3'   },
        { id: 'sc7',  from: 'sol-srv1',    to: 'sol-queue'  },
        { id: 'sc8',  from: 'sol-srv2',    to: 'sol-cache'  },
        { id: 'sc9',  from: 'sol-srv3',    to: 'sol-cache'  },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-cache'  },
        { id: 'sc11', from: 'sol-queue',   to: 'sol-db'     },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-srv1'   },
      ],
    },
    steps: [
      'Client → CDN (static assets) + API Gateway → LB (sticky sessions, IP hash)',
      'Server 1 (ingestion): receives score updates → publishes to Queue (Pub/Sub)',
      'Queue → Cache (latest score) + DB (match history). Servers 2 & 3 serve WebSocket clients from Cache.',
    ],
    explanation: '5M viewers read from Cache — one key updated every 30s. Queue fans out score updates. Sticky sessions keep WebSocket connections on the same server.',
  },

  // ── Mission 30: Circuit Breaker Pattern ──────────────────────────────────
  'circuit-breaker': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway',  x: 300, y: 150 },
        { id: 'sol-lb',     type: 'loadbalancer', x: 300, y: 270 },
        { id: 'sol-pay',    type: 'server',       x: 80,  y: 390 },
        { id: 'sol-inv',    type: 'server',       x: 260, y: 390 },
        { id: 'sol-ship',   type: 'server',       x: 440, y: 390 },
        { id: 'sol-mon',    type: 'monitoring',   x: 640, y: 390 },
        { id: 'sol-cache',  type: 'cache',        x: 150, y: 510 },
        { id: 'sol-queue',  type: 'queue',        x: 350, y: 510 },
        { id: 'sol-db',     type: 'database',     x: 250, y: 630 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-pay'    },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-inv'    },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-ship'   },
        { id: 'sc6',  from: 'sol-pay',     to: 'sol-cache'  },
        { id: 'sc7',  from: 'sol-inv',     to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-ship',    to: 'sol-queue'  },
        { id: 'sc9',  from: 'sol-cache',   to: 'sol-db'     },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-db'     },
        { id: 'sc11', from: 'sol-mon',     to: 'sol-pay'    },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-inv'    },
      ],
    },
    steps: [
      'Client → API Gateway (circuit-state routing) → LB → 3 Microservices',
      'Payment + Inventory → Cache for OPEN-circuit fallback responses',
      'Shipping → Queue for async retry during HALF-OPEN recovery',
      'Monitoring tracks error rates and triggers CLOSED→OPEN transitions',
    ],
    explanation: 'Circuit breaker at API Gateway layer. OPEN state returns cached fallbacks (not 503). Monitoring triggers transitions. Bulkhead isolates thread pools so one service failure never starves another.',
  },

  // ── Mission 31: Notification Engine ────────────────────────────────────
  'notification-engine': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-srv1',   type: 'server',      x: 120, y: 280 },
        { id: 'sol-srv2',   type: 'server',      x: 480, y: 280 },
        { id: 'sol-mon',    type: 'monitoring',  x: 680, y: 280 },
        { id: 'sol-queue1', type: 'queue',       x: 120, y: 400 },
        { id: 'sol-queue2', type: 'queue',       x: 380, y: 400 },
        { id: 'sol-cache',  type: 'cache',       x: 200, y: 520 },
        { id: 'sol-db',     type: 'database',    x: 420, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-srv1'   },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-srv2'   },
        { id: 'sc4',  from: 'sol-srv1',    to: 'sol-queue1' },
        { id: 'sc5',  from: 'sol-srv2',    to: 'sol-queue2' },
        { id: 'sc6',  from: 'sol-queue1',  to: 'sol-cache'  },
        { id: 'sc7',  from: 'sol-queue2',  to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-cache',   to: 'sol-db'     },
        { id: 'sc9',  from: 'sol-mon',     to: 'sol-srv1'   },
      ],
    },
    steps: [
      'Client → API Gateway (rate limit per sender) → 2 Ingestion Servers returning 202',
      'Servers → Queue 1 (primary delivery). Queue 2 = Dead Letter Queue for failed retries.',
      'Workers: Queue → Cache (device tokens) → push/email/SMS delivery → DB audit log',
    ],
    explanation: 'Async notification: API returns 202 immediately, delivery happens out-of-band via Queue. DLQ captures failures after 3 retries. Cache serves device tokens without DB lookups.',
  },

  // ── Mission 32: REST vs GraphQL Showdown ─────────────────────────────────
  'rest-vs-graphql': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-srv1',   type: 'server',      x: 120, y: 300 },
        { id: 'sol-srv2',   type: 'server',      x: 480, y: 300 },
        { id: 'sol-mon',    type: 'monitoring',  x: 680, y: 300 },
        { id: 'sol-cache',  type: 'cache',       x: 200, y: 430 },
        { id: 'sol-db',     type: 'database',    x: 400, y: 430 },
      ],
      connections: [
        { id: 'sc1', from: 'sol-client',  to: 'sol-apigw' },
        { id: 'sc2', from: 'sol-apigw',   to: 'sol-srv1'  },
        { id: 'sc3', from: 'sol-apigw',   to: 'sol-srv2'  },
        { id: 'sc4', from: 'sol-srv1',    to: 'sol-cache' },
        { id: 'sc5', from: 'sol-srv2',    to: 'sol-cache' },
        { id: 'sc6', from: 'sol-cache',   to: 'sol-db'    },
        { id: 'sc7', from: 'sol-mon',     to: 'sol-srv1'  },
      ],
    },
    steps: [
      'Client → API Gateway (GraphQL gateway — parses single query, routes to resolvers)',
      '2 Resolver Servers: User resolver + Feed resolver, share normalised Cache',
      'DataLoader batches entity fetches into bulk DB queries — eliminates N+1',
    ],
    explanation: 'API Gateway is the GraphQL gateway. DataLoader eliminates N+1. Normalised Cache by entity ID. Monitoring tracks resolver latency.',
  },

  // ── Mission 33: Event-Driven Microservice ─────────────────────────────────
  'event-driven-microservice': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 140 },
        { id: 'sol-order',  type: 'server',      x: 80,  y: 260 },
        { id: 'sol-inv',    type: 'server',      x: 240, y: 260 },
        { id: 'sol-pay',    type: 'server',      x: 400, y: 260 },
        { id: 'sol-ship',   type: 'server',      x: 560, y: 260 },
        { id: 'sol-mon',    type: 'monitoring',  x: 720, y: 260 },
        { id: 'sol-queue',  type: 'queue',       x: 300, y: 390 },
        { id: 'sol-db1',    type: 'database',    x: 80,  y: 510 },
        { id: 'sol-db2',    type: 'database',    x: 400, y: 510 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw' },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-order' },
        { id: 'sc3',  from: 'sol-order',  to: 'sol-queue' },
        { id: 'sc4',  from: 'sol-queue',  to: 'sol-inv'   },
        { id: 'sc5',  from: 'sol-queue',  to: 'sol-pay'   },
        { id: 'sc6',  from: 'sol-queue',  to: 'sol-ship'  },
        { id: 'sc7',  from: 'sol-inv',    to: 'sol-queue' },
        { id: 'sc8',  from: 'sol-pay',    to: 'sol-queue' },
        { id: 'sc9',  from: 'sol-order',  to: 'sol-db1'   },
        { id: 'sc10', from: 'sol-pay',    to: 'sol-db2'   },
        { id: 'sc11', from: 'sol-mon',    to: 'sol-queue' },
      ],
    },
    steps: [
      'Client → API GW → Order Service: publishes OrderPlaced to Queue',
      'Queue → Inventory (reserves) → publishes InventoryReserved → Queue → Payment → Queue → Shipping',
      'Each service owns its own DB partition. Monitoring tracks event lag per service.',
    ],
    explanation: 'Queue is the Event Bus. Services communicate only via events. Total decoupling enables independent scaling and deployment. Monitor event lag to spot cascading slowdowns early.',
  },

  // ── Mission 34: Presence at Scale ─────────────────────────────────────────
  'presence-at-scale': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-srv1',   type: 'server',      x: 100, y: 400 },
        { id: 'sol-srv2',   type: 'server',      x: 500, y: 400 },
        { id: 'sol-mon',    type: 'monitoring',  x: 700, y: 400 },
        { id: 'sol-cache',  type: 'cache',       x: 200, y: 520 },
        { id: 'sol-queue',  type: 'queue',       x: 420, y: 520 },
        { id: 'sol-db',     type: 'database',    x: 300, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw' },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'    },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-srv1'  },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-srv2'  },
        { id: 'sc5',  from: 'sol-srv1',   to: 'sol-cache' },
        { id: 'sc6',  from: 'sol-srv2',   to: 'sol-cache' },
        { id: 'sc7',  from: 'sol-srv1',   to: 'sol-queue' },
        { id: 'sc8',  from: 'sol-cache',  to: 'sol-db'    },
        { id: 'sc9',  from: 'sol-queue',  to: 'sol-db'    },
        { id: 'sc10', from: 'sol-mon',    to: 'sol-srv1'  },
      ],
    },
    steps: [
      'Client → API GW → LB (consistent hash by user_id) → 2 Servers',
      'Heartbeat every 15s: SET user:{id}:online EX 30 in Cache. TTL expiry = offline.',
      'Status change → Queue → fan-out to online contacts only. DB: last-seen 30-day retention.',
    ],
    explanation: 'TTL-based presence: Redis key expires if no heartbeat in 30s. No explicit offline event needed. Fan-out notifies only online contacts. Consistent-hash LB keeps heartbeats on same server.',
  },

  // ── Mission 35: Multiplayer Game Server ─────────────────────────────────
  'multiplayer-game-server': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 30  },
        { id: 'sol-cdn',    type: 'cdn',         x: 580, y: 30  },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 150 },
        { id: 'sol-gs1',    type: 'server',      x: 60,  y: 280 },
        { id: 'sol-gs2',    type: 'server',      x: 200, y: 280 },
        { id: 'sol-gs3',    type: 'server',      x: 340, y: 280 },
        { id: 'sol-gs4',    type: 'server',      x: 480, y: 280 },
        { id: 'sol-mon',    type: 'monitoring',  x: 640, y: 280 },
        { id: 'sol-cache',  type: 'cache',       x: 200, y: 410 },
        { id: 'sol-queue',  type: 'queue',       x: 420, y: 410 },
        { id: 'sol-db',     type: 'database',    x: 310, y: 530 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-cdn'   },
        { id: 'sc2',  from: 'sol-client', to: 'sol-lb'    },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-gs1'   },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-gs2'   },
        { id: 'sc5',  from: 'sol-lb',     to: 'sol-gs3'   },
        { id: 'sc6',  from: 'sol-lb',     to: 'sol-gs4'   },
        { id: 'sc7',  from: 'sol-gs1',    to: 'sol-cache' },
        { id: 'sc8',  from: 'sol-gs2',    to: 'sol-cache' },
        { id: 'sc9',  from: 'sol-gs3',    to: 'sol-queue' },
        { id: 'sc10', from: 'sol-cache',  to: 'sol-db'    },
        { id: 'sc11', from: 'sol-queue',  to: 'sol-db'    },
        { id: 'sc12', from: 'sol-mon',    to: 'sol-gs1'   },
      ],
    },
    steps: [
      'Client → CDN (assets) + LB (consistent hash by session_id → 4 Game Servers)',
      'All 10 players in a session land on the same server. Each tick: state → Cache.',
      'Queue: matchmaking + end-of-game DB writes. DB: final results only.',
    ],
    explanation: 'Game state lives in server memory, not DB. Consistent-hash LB keeps sessions on one server. Cache stores snapshots for crash recovery. DB receives only final game results.',
  },

  // ── Mission 36: Observability at Scale ────────────────────────────────────
  'observability-at-scale': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 30  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 140 },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 260 },
        { id: 'sol-ingest', type: 'server',      x: 80,  y: 380 },
        { id: 'sol-proc',   type: 'server',      x: 280, y: 380 },
        { id: 'sol-query',  type: 'server',      x: 480, y: 380 },
        { id: 'sol-mon',    type: 'monitoring',  x: 680, y: 380 },
        { id: 'sol-queue',  type: 'queue',       x: 150, y: 500 },
        { id: 'sol-cache',  type: 'cache',       x: 380, y: 500 },
        { id: 'sol-tsdb',   type: 'database',    x: 150, y: 620 },
        { id: 'sol-storage',type: 'storage',     x: 400, y: 620 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-ingest' },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-query'  },
        { id: 'sc5',  from: 'sol-ingest', to: 'sol-queue'  },
        { id: 'sc6',  from: 'sol-queue',  to: 'sol-proc'   },
        { id: 'sc7',  from: 'sol-proc',   to: 'sol-tsdb'   },
        { id: 'sc8',  from: 'sol-proc',   to: 'sol-storage'},
        { id: 'sc9',  from: 'sol-query',  to: 'sol-cache'  },
        { id: 'sc10', from: 'sol-cache',  to: 'sol-tsdb'   },
        { id: 'sc11', from: 'sol-mon',    to: 'sol-queue'  },
      ],
    },
    steps: [
      'Agents → API GW → LB → Ingestion Server → Queue (absorbs 10M metrics/sec burst)',
      'Queue → Processing Server → TSDB (rollups) + Storage (raw)',
      'Query Server → Cache (dashboard queries) → TSDB on cache miss',
      'Monitoring observes the pipeline: queue depth, ingest lag, query P99',
    ],
    explanation: 'Queue absorbs burst traffic before processing. Three specialised servers scale independently. TSDB stores rollups; Storage holds raw data. Cache serves pre-computed dashboards.',
  },

  // ── Mission 37: Distributed Locks Deep Dive ───────────────────────────────
  'distributed-locks-deep-dive': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-svc1',   type: 'server',      x: 80,  y: 400 },
        { id: 'sol-svc2',   type: 'server',      x: 280, y: 400 },
        { id: 'sol-svc3',   type: 'server',      x: 480, y: 400 },
        { id: 'sol-mon',    type: 'monitoring',  x: 680, y: 400 },
        { id: 'sol-redis1', type: 'cache',       x: 80,  y: 530 },
        { id: 'sol-redis2', type: 'cache',       x: 280, y: 530 },
        { id: 'sol-db',     type: 'database',    x: 480, y: 530 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-svc1'   },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-svc2'   },
        { id: 'sc5',  from: 'sol-lb',     to: 'sol-svc3'   },
        { id: 'sc6',  from: 'sol-svc1',   to: 'sol-redis1' },
        { id: 'sc7',  from: 'sol-svc1',   to: 'sol-redis2' },
        { id: 'sc8',  from: 'sol-svc2',   to: 'sol-redis1' },
        { id: 'sc9',  from: 'sol-svc2',   to: 'sol-redis2' },
        { id: 'sc10', from: 'sol-svc3',   to: 'sol-redis1' },
        { id: 'sc11', from: 'sol-svc3',   to: 'sol-redis2' },
        { id: 'sc12', from: 'sol-svc1',   to: 'sol-db'     },
        { id: 'sc13', from: 'sol-mon',    to: 'sol-redis1' },
      ],
    },
    steps: [
      'LB → 3 Services (all compete for lock). Each service → SET NX PX on both Redis nodes.',
      'Redlock: success requires 2/2 acquired within clock-drift window.',
      'Lock holder executes critical section → DEL on both Redis nodes. Fencing token prevents stale writes.',
    ],
    explanation: 'Redlock: quorum (2/2) across independent Redis nodes. Fencing tokens prevent stale lock holders from committing. Monitoring tracks contention rate.',
  },

  // ── Mission 38: Concurrency vs Parallelism ────────────────────────────────
  'concurrency-vs-parallelism': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 280 },
        { id: 'sol-io',     type: 'server',      x: 80,  y: 400 },
        { id: 'sol-cpu',    type: 'server',      x: 280, y: 400 },
        { id: 'sol-coord',  type: 'server',      x: 480, y: 400 },
        { id: 'sol-mon',    type: 'monitoring',  x: 660, y: 400 },
        { id: 'sol-queue',  type: 'queue',       x: 180, y: 520 },
        { id: 'sol-storage',type: 'storage',     x: 380, y: 520 },
        { id: 'sol-db',     type: 'database',    x: 280, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-io'     },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-cpu'    },
        { id: 'sc5',  from: 'sol-lb',     to: 'sol-coord'  },
        { id: 'sc6',  from: 'sol-io',     to: 'sol-queue'  },
        { id: 'sc7',  from: 'sol-cpu',    to: 'sol-storage'},
        { id: 'sc8',  from: 'sol-coord',  to: 'sol-queue'  },
        { id: 'sc9',  from: 'sol-queue',  to: 'sol-db'     },
        { id: 'sc10', from: 'sol-storage',to: 'sol-db'     },
        { id: 'sc11', from: 'sol-mon',    to: 'sol-io'     },
        { id: 'sc12', from: 'sol-mon',    to: 'sol-queue'  },
      ],
    },
    steps: [
      'LB routes tasks by type: I/O tasks → I/O Server (async event loop), CPU tasks → CPU Server (core-count pool)',
      'Coordinator Server routes tasks to correct pool. I/O → Queue. CPU → Storage workers.',
      'Monitoring tracks thread pool utilisation + queue depth per worker type.',
    ],
    explanation: 'I/O-bound = concurrent (one thread handles thousands via async). CPU-bound = parallel (N cores = N simultaneous). Separate pools prevent CPU work from starving I/O threads.',
  },

  // ── Mission 39: Two-Phase Commit in Practice ──────────────────────────────
  'two-phase-commit-practice': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 40  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 160 },
        { id: 'sol-coord',  type: 'server',      x: 160, y: 290 },
        { id: 'sol-part',   type: 'server',      x: 440, y: 290 },
        { id: 'sol-mon',    type: 'monitoring',  x: 640, y: 290 },
        { id: 'sol-db1',    type: 'database',    x: 80,  y: 430 },
        { id: 'sol-db2',    type: 'database',    x: 250, y: 430 },
        { id: 'sol-db3',    type: 'database',    x: 420, y: 430 },
        { id: 'sol-queue',  type: 'queue',       x: 300, y: 560 },
      ],
      connections: [
        { id: 'sc1', from: 'sol-client', to: 'sol-apigw'  },
        { id: 'sc2', from: 'sol-apigw',  to: 'sol-coord'  },
        { id: 'sc3', from: 'sol-coord',  to: 'sol-db1'    },
        { id: 'sc4', from: 'sol-coord',  to: 'sol-db2'    },
        { id: 'sc5', from: 'sol-coord',  to: 'sol-db3'    },
        { id: 'sc6', from: 'sol-coord',  to: 'sol-queue'  },
        { id: 'sc7', from: 'sol-mon',    to: 'sol-coord'  },
        { id: 'sc8', from: 'sol-mon',    to: 'sol-db1'    },
      ],
    },
    steps: [
      'Client → API GW → Coordinator. Phase 1: PREPARE to all 3 DBs. They lock and vote.',
      'Phase 2: all YES → COMMIT all. Any NO → ROLLBACK all.',
      'Coordinator writes decision to WAL Queue BEFORE Phase 2 (crash recovery). Monitoring: 2PC latency.',
    ],
    explanation: '2PC: participants hold locks from Phase 1 until Phase 2 completes (blocking). Coordinator WAL enables crash recovery. Monitoring participant latency is critical — slow Phase 2 holds ALL locks.',
  },

  // ── Mission 40: Full-Stack Observability Capstone ─────────────────────────
  'full-stack-observability-capstone': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',     x: 300, y: 20  },
        { id: 'sol-cdn',    type: 'cdn',         x: 580, y: 20  },
        { id: 'sol-apigw',  type: 'apigateway', x: 300, y: 120 },
        { id: 'sol-lb',     type: 'loadbalancer',x: 300, y: 230 },
        { id: 'sol-svc1',   type: 'server',      x: 50,  y: 350 },
        { id: 'sol-svc2',   type: 'server',      x: 200, y: 350 },
        { id: 'sol-svc3',   type: 'server',      x: 350, y: 350 },
        { id: 'sol-svc4',   type: 'server',      x: 500, y: 350 },
        { id: 'sol-mon',    type: 'monitoring',  x: 680, y: 350 },
        { id: 'sol-cache1', type: 'cache',       x: 100, y: 470 },
        { id: 'sol-cache2', type: 'cache',       x: 300, y: 470 },
        { id: 'sol-queue',  type: 'queue',       x: 500, y: 470 },
        { id: 'sol-db1',    type: 'database',    x: 100, y: 590 },
        { id: 'sol-db2',    type: 'database',    x: 300, y: 590 },
        { id: 'sol-storage',type: 'storage',     x: 500, y: 590 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'    },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc3',  from: 'sol-cdn',     to: 'sol-storage'},
        { id: 'sc4',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-svc1'   },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-svc2'   },
        { id: 'sc7',  from: 'sol-lb',      to: 'sol-svc3'   },
        { id: 'sc8',  from: 'sol-lb',      to: 'sol-svc4'   },
        { id: 'sc9',  from: 'sol-svc1',    to: 'sol-cache1' },
        { id: 'sc10', from: 'sol-svc2',    to: 'sol-cache1' },
        { id: 'sc11', from: 'sol-svc3',    to: 'sol-cache2' },
        { id: 'sc12', from: 'sol-svc4',    to: 'sol-queue'  },
        { id: 'sc13', from: 'sol-cache1',  to: 'sol-db1'    },
        { id: 'sc14', from: 'sol-cache2',  to: 'sol-db2'    },
        { id: 'sc15', from: 'sol-queue',   to: 'sol-storage'},
        { id: 'sc16', from: 'sol-mon',     to: 'sol-svc1'   },
        { id: 'sc17', from: 'sol-mon',     to: 'sol-queue'  },
        { id: 'sc18', from: 'sol-mon',     to: 'sol-db1'    },
      ],
    },
    steps: [
      'Client → CDN (media via Storage) + API Gateway (auth/rate-limit) → LB → 4 App Servers',
      'Cache 1: user/session data. Cache 2: computed feeds/recs. Queue: all async workloads.',
      'DB1: transactional. DB2: analytics. Storage: blobs/media. Monitoring: all layers.',
    ],
    explanation: 'All 10 component types used. CDN→API GW→LB→Servers→Cache→DB→Storage→Queue→Monitoring. Every layer has a clear role. Monitoring provides full observability across the entire platform.',
  },

};
