/**
 * solutions-sprint3-concepts.ts
 * Reference solutions for Sprint 3 concept-depth missions 41–48
 * (F-03, F-05, A-05, H-04, C-04, C-07, SC-05, SC-07)
 */
import { Architecture } from './types';
import { MissionSolution } from './solutions-sprint3';

export const SPRINT3_CONCEPT_SOLUTIONS: Record<string, MissionSolution> = {

  // ── Mission 41: Secure the Gates (F-03) ────────────────────────────────────
  'secure-the-gates': {
    architecture: {
      components: [
        { id: 'sol-client',   type: 'client',      x: 300, y: 40  },
        { id: 'sol-apigw',   type: 'apigateway',  x: 300, y: 160 },
        { id: 'sol-lb',      type: 'loadbalancer', x: 300, y: 280 },
        { id: 'sol-auth',    type: 'server',       x: 160, y: 400 },
        { id: 'sol-app',     type: 'server',       x: 440, y: 400 },
        { id: 'sol-mon',     type: 'monitoring',   x: 640, y: 400 },
        { id: 'sol-cache',   type: 'cache',        x: 160, y: 520 },
        { id: 'sol-db',      type: 'database',     x: 380, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',     to: 'sol-auth'   },
        { id: 'sc4',  from: 'sol-lb',     to: 'sol-app'    },
        { id: 'sc5',  from: 'sol-auth',   to: 'sol-cache'  },
        { id: 'sc6',  from: 'sol-auth',   to: 'sol-db'     },
        { id: 'sc7',  from: 'sol-apigw',  to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-mon',    to: 'sol-auth'   },
        { id: 'sc9',  from: 'sol-mon',    to: 'sol-apigw'  },
      ],
    },
    steps: [
      'Client → API Gateway: rate limiting (sliding window in Redis) + JWT signature validation on every request',
      'API Gateway → Load Balancer → Auth Server (login/refresh) + App Server (business logic)',
      'Auth Server → Cache: refresh token blacklist (O(1) revocation check); Auth Server → DB: credential + token store',
      'Monitoring tracks failed login attempts per IP and fires alerts on anomaly spikes',
    ],
    explanation: 'API Gateway is the security perimeter — all JWT validation and rate limiting happens here. Auth Server is isolated from business logic. Cache holds the refresh token blacklist for O(1) revocation. Short-lived access tokens (15 min) + rotating refresh tokens (7 days) limit the blast radius of any theft.',
  },

  // ── Mission 42: The File Converter (F-05) ─────────────────────────────────
  'the-file-converter': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',       x: 300, y: 40  },
        { id: 'sol-lb',      type: 'loadbalancer',  x: 300, y: 160 },
        { id: 'sol-upload',  type: 'server',        x: 140, y: 290 },
        { id: 'sol-worker',  type: 'server',        x: 460, y: 290 },
        { id: 'sol-mon',     type: 'monitoring',    x: 660, y: 290 },
        { id: 'sol-queue',   type: 'queue',         x: 300, y: 420 },
        { id: 'sol-storage', type: 'storage',       x: 120, y: 540 },
        { id: 'sol-cdn',     type: 'cdn',           x: 340, y: 540 },
        { id: 'sol-db',      type: 'database',      x: 560, y: 420 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-lb'      },
        { id: 'sc2',  from: 'sol-lb',      to: 'sol-upload'  },
        { id: 'sc3',  from: 'sol-upload',  to: 'sol-queue'   },
        { id: 'sc4',  from: 'sol-upload',  to: 'sol-db'      },
        { id: 'sc5',  from: 'sol-queue',   to: 'sol-worker'  },
        { id: 'sc6',  from: 'sol-worker',  to: 'sol-storage' },
        { id: 'sol-worker',  from: 'sol-worker',  to: 'sol-db'     },
        { id: 'sc7',  from: 'sol-storage', to: 'sol-cdn'     },
        { id: 'sc8',  from: 'sol-mon',     to: 'sol-queue'   },
        { id: 'sc9',  from: 'sol-mon',     to: 'sol-worker'  },
      ],
    },
    steps: [
      'Client → Load Balancer → Upload Server: accepts file, creates job record in DB, publishes job to Queue. Returns 202 + jobId.',
      'Queue → Worker Server: pulls job, runs conversion (CPU work), writes output to Storage',
      'Storage → CDN: converted files cached at edge. Paid users get persistent CDN URLs; free users get 24-hour pre-signed URLs.',
      'Monitoring watches queue depth and worker health — alerts if queue grows faster than drain rate',
    ],
    explanation: 'Queue decouples the fast upload path from slow CPU-intensive conversion. API returns 202 immediately. Upload Server handles ingestion; Worker Server handles conversion — scale them independently. Storage holds all binary files; DB tracks metadata only. CDN serves converted files at the edge without proxying through app servers.',
  },

  // ── Mission 43: How Reddit Works (A-05) ───────────────────────────────────
  'how-reddit-works': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',       x: 300, y: 30  },
        { id: 'sol-apigw',   type: 'apigateway',   x: 300, y: 140 },
        { id: 'sol-lb',      type: 'loadbalancer',  x: 300, y: 260 },
        { id: 'sol-write',   type: 'server',        x: 80,  y: 380 },
        { id: 'sol-read',    type: 'server',        x: 300, y: 380 },
        { id: 'sol-batch',   type: 'server',        x: 520, y: 380 },
        { id: 'sol-mon',     type: 'monitoring',    x: 700, y: 380 },
        { id: 'sol-cache',   type: 'cache',         x: 150, y: 500 },
        { id: 'sol-queue',   type: 'queue',         x: 370, y: 500 },
        { id: 'sol-db',      type: 'database',      x: 150, y: 620 },
        { id: 'sol-storage', type: 'storage',       x: 520, y: 500 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-write'  },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-read'   },
        { id: 'sc5',  from: 'sol-write',   to: 'sol-cache'  },
        { id: 'sc6',  from: 'sol-write',   to: 'sol-queue'  },
        { id: 'sc7',  from: 'sol-read',    to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-queue',   to: 'sol-batch'  },
        { id: 'sc9',  from: 'sol-batch',   to: 'sol-db'     },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-storage'},
        { id: 'sc11', from: 'sol-cache',   to: 'sol-db'     },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-queue'  },
      ],
    },
    steps: [
      'Client → API Gateway (rate limit votes) → LB routes: writes → Write Server, reads → Read Server',
      'Write Server: Redis INCR on vote counter + publish vote event to Queue',
      'Queue → Batch Writer Server: aggregates votes and flushes to DB every 30s (1 DB write per post)',
      'Queue → Storage (Elasticsearch): async search index updates. Read Server serves feeds from Cache.',
      'Monitoring tracks queue depth and Cache hit rate — alert if batch writer falls behind',
    ],
    explanation: 'Redis atomic INCR absorbs 50K votes/second without DB deadlocks. Batch Writer flushes aggregated counts every 30s — eventual consistency with zero vote loss. Read path is Cache-only for sub-200ms feed loads. Elasticsearch updates happen asynchronously via Queue.',
  },

  // ── Mission 44: How Amazon S3 Works (H-04) ────────────────────────────────
  'how-amazon-s3-works': {
    architecture: {
      components: [
        { id: 'sol-client',   type: 'client',       x: 300, y: 30  },
        { id: 'sol-cdn',      type: 'cdn',           x: 580, y: 30  },
        { id: 'sol-lb',       type: 'loadbalancer',  x: 300, y: 150 },
        { id: 'sol-meta',     type: 'server',        x: 160, y: 280 },
        { id: 'sol-upload',   type: 'server',        x: 440, y: 280 },
        { id: 'sol-mon',      type: 'monitoring',    x: 640, y: 280 },
        { id: 'sol-db',       type: 'database',      x: 160, y: 410 },
        { id: 'sol-storage',  type: 'storage',       x: 400, y: 410 },
        { id: 'sol-queue',    type: 'queue',         x: 160, y: 530 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-lb'      },
        { id: 'sc3',  from: 'sol-cdn',     to: 'sol-storage' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-meta'    },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-upload'  },
        { id: 'sc6',  from: 'sol-meta',    to: 'sol-db'      },
        { id: 'sc7',  from: 'sol-meta',    to: 'sol-storage' },
        { id: 'sc8',  from: 'sol-upload',  to: 'sol-storage' },
        { id: 'sc9',  from: 'sol-storage', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc11', from: 'sol-mon',     to: 'sol-storage' },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-queue'   },
      ],
    },
    steps: [
      'GET: Client → CDN (90% of reads served at edge). CDN miss → Storage origin.',
      'PUT: Client → LB → Metadata Server (consistent hash lookup) → Storage node placement',
      'Metadata Server → DB: store object key, size, checksum, and node locations',
      'Storage → Queue: async replication events fan out to 2 additional AZ replicas',
      'Monitoring tracks replication lag and checksums — alerts on durability SLA breach',
    ],
    explanation: 'Metadata Service routes requests via consistent hash ring; Storage Nodes hold actual bytes. CDN serves 90% of GETs at edge. Queue drives async 3x replication across AZs for 11-nines durability. Monitoring detects bit rot via periodic checksum scrubbing.',
  },

  // ── Mission 45: Change Data Capture (C-04) ─────────────────────────────────
  'change-data-capture': {
    architecture: {
      components: [
        { id: 'sol-proddb',  type: 'database',    x: 100, y: 80  },
        { id: 'sol-cdc',     type: 'server',       x: 100, y: 220 },
        { id: 'sol-queue',   type: 'queue',        x: 100, y: 360 },
        { id: 'sol-consumer',type: 'server',       x: 300, y: 360 },
        { id: 'sol-dw',      type: 'database',     x: 500, y: 360 },
        { id: 'sol-storage', type: 'storage',      x: 300, y: 490 },
        { id: 'sol-mon',     type: 'monitoring',   x: 560, y: 200 },
      ],
      connections: [
        { id: 'sc1', from: 'sol-proddb',   to: 'sol-cdc'      },
        { id: 'sc2', from: 'sol-cdc',      to: 'sol-queue'    },
        { id: 'sc3', from: 'sol-queue',    to: 'sol-consumer' },
        { id: 'sc4', from: 'sol-consumer', to: 'sol-dw'       },
        { id: 'sc5', from: 'sol-consumer', to: 'sol-storage'  },
        { id: 'sc6', from: 'sol-mon',      to: 'sol-cdc'      },
        { id: 'sc7', from: 'sol-mon',      to: 'sol-queue'    },
      ],
    },
    steps: [
      'Production DB WAL → CDC Connector (Debezium): reads binary log via logical replication slot — zero query impact',
      'CDC Connector → Kafka Queue: publishes change events at source transaction speed',
      'Queue → Consumer Server: transforms events and writes to Data Warehouse DB',
      'Consumer → Storage: archives raw events for replay and compliance',
      'Monitoring tracks replication lag (target: <30s) and consumer throughput — alerts on slot bloat',
    ],
    explanation: 'CDC reads the binary WAL log — not SQL queries — so production performance is unaffected. Kafka provides high-throughput, ordered event delivery. Consumer transforms events for the analytical schema. Storage archives raw events for full replay capability. Monitoring is critical: an unconsumed replication slot can bloat Postgres WAL storage.',
  },

  // ── Mission 46: The Saga Pattern (C-07) ───────────────────────────────────
  'the-saga-pattern': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-apigw',   type: 'apigateway',  x: 300, y: 140 },
        { id: 'sol-orch',    type: 'server',       x: 160, y: 270 },
        { id: 'sol-inv',     type: 'server',       x: 380, y: 270 },
        { id: 'sol-pay',     type: 'server',       x: 560, y: 270 },
        { id: 'sol-mon',     type: 'monitoring',   x: 700, y: 270 },
        { id: 'sol-queue',   type: 'queue',        x: 300, y: 400 },
        { id: 'sol-db1',     type: 'database',     x: 80,  y: 520 },
        { id: 'sol-db2',     type: 'database',     x: 300, y: 520 },
        { id: 'sol-cache',   type: 'cache',        x: 520, y: 400 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client', to: 'sol-apigw' },
        { id: 'sc2',  from: 'sol-apigw',  to: 'sol-orch'  },
        { id: 'sc3',  from: 'sol-orch',   to: 'sol-queue' },
        { id: 'sc4',  from: 'sol-queue',  to: 'sol-inv'   },
        { id: 'sc5',  from: 'sol-queue',  to: 'sol-pay'   },
        { id: 'sc6',  from: 'sol-inv',    to: 'sol-queue' },
        { id: 'sc7',  from: 'sol-pay',    to: 'sol-queue' },
        { id: 'sc8',  from: 'sol-orch',   to: 'sol-db1'   },
        { id: 'sc9',  from: 'sol-inv',    to: 'sol-db2'   },
        { id: 'sc10', from: 'sol-orch',   to: 'sol-cache' },
        { id: 'sc11', from: 'sol-mon',    to: 'sol-orch'  },
        { id: 'sc12', from: 'sol-mon',    to: 'sol-queue' },
      ],
    },
    steps: [
      'Client → API Gateway → Saga Orchestrator: creates saga record in DB1 with state STARTED',
      'Orchestrator → Queue: publishes ReserveInventory command',
      'Inventory Service consumes, reserves stock in DB2, publishes InventoryReserved back to Queue',
      'Orchestrator receives event, advances state, publishes ChargePayment command',
      'On any failure: Orchestrator publishes compensating commands in reverse order. Cache holds idempotency keys.',
    ],
    explanation: 'Saga Orchestrator is the state machine — it tracks saga progress in DB and coordinates services via Queue. No distributed locks; each service owns its DB. Cache holds idempotency keys to prevent double-execution on retry. Monitoring tracks step completion rate and flags stuck sagas.',
  },

  // ── Mission 47: Service Mesh & Microservices (SC-05) ───────────────────────
  'service-mesh-microservices': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',       x: 300, y: 30  },
        { id: 'sol-apigw',   type: 'apigateway',   x: 300, y: 140 },
        { id: 'sol-lb',      type: 'loadbalancer',  x: 300, y: 260 },
        { id: 'sol-svc1',    type: 'server',        x: 60,  y: 390 },
        { id: 'sol-svc2',    type: 'server',        x: 220, y: 390 },
        { id: 'sol-svc3',    type: 'server',        x: 380, y: 390 },
        { id: 'sol-svc4',    type: 'server',        x: 540, y: 390 },
        { id: 'sol-mon',     type: 'monitoring',    x: 700, y: 390 },
        { id: 'sol-cache',   type: 'cache',         x: 140, y: 520 },
        { id: 'sol-queue',   type: 'queue',         x: 420, y: 520 },
        { id: 'sol-db',      type: 'database',      x: 280, y: 520 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-lb'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-svc1'   },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-svc2'   },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-svc3'   },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-svc4'   },
        { id: 'sc7',  from: 'sol-svc1',    to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-svc2',    to: 'sol-db'     },
        { id: 'sc9',  from: 'sol-svc3',    to: 'sol-queue'  },
        { id: 'sc10', from: 'sol-svc4',    to: 'sol-cache'  },
        { id: 'sc11', from: 'sol-mon',     to: 'sol-svc1'   },
        { id: 'sc12', from: 'sol-mon',     to: 'sol-svc2'   },
        { id: 'sc13', from: 'sol-mon',     to: 'sol-svc3'   },
        { id: 'sc14', from: 'sol-mon',     to: 'sol-svc4'   },
      ],
    },
    steps: [
      'Client → API Gateway (auth, rate limit, trace_id injection) → Load Balancer (weighted canary routing)',
      'LB → 4 Microservices: each has Envoy sidecar injected — handles retries, circuit breaking, mTLS',
      'Circuit breaker fallbacks: Svc1 → Cache (stale responses). Queue buffers async retries.',
      'DB stores service registry. Monitoring collects distributed traces + circuit state from all sidecars.',
    ],
    explanation: 'API Gateway injects trace_id; Envoy sidecars propagate it across all service hops for distributed tracing. Load Balancer splits 10% to canary version. Cache serves circuit breaker fallback responses. Monitoring is the nervous system — it aggregates traces, metrics, and circuit states from all 4 service sidecars.',
  },

  // ── Mission 48: CQRS + Event Sourcing (SC-07) ──────────────────────────────
  'cqrs-event-sourcing': {
    architecture: {
      components: [
        { id: 'sol-client',  type: 'client',      x: 300, y: 30  },
        { id: 'sol-apigw',   type: 'apigateway',  x: 300, y: 140 },
        { id: 'sol-cmd',     type: 'server',       x: 120, y: 270 },
        { id: 'sol-proj',    type: 'server',       x: 360, y: 270 },
        { id: 'sol-query',   type: 'server',       x: 560, y: 270 },
        { id: 'sol-mon',     type: 'monitoring',   x: 720, y: 270 },
        { id: 'sol-queue',   type: 'queue',        x: 200, y: 400 },
        { id: 'sol-db',      type: 'database',     x: 420, y: 400 },
        { id: 'sol-cache',   type: 'cache',        x: 580, y: 400 },
        { id: 'sol-storage', type: 'storage',      x: 200, y: 530 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'  },
        { id: 'sc2',  from: 'sol-apigw',   to: 'sol-cmd'    },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-query'  },
        { id: 'sc4',  from: 'sol-cmd',     to: 'sol-queue'  },
        { id: 'sc5',  from: 'sol-queue',   to: 'sol-proj'   },
        { id: 'sc6',  from: 'sol-proj',    to: 'sol-db'     },
        { id: 'sc7',  from: 'sol-proj',    to: 'sol-cache'  },
        { id: 'sc8',  from: 'sol-query',   to: 'sol-cache'  },
        { id: 'sc9',  from: 'sol-queue',   to: 'sol-storage'},
        { id: 'sc10', from: 'sol-mon',     to: 'sol-cmd'    },
        { id: 'sc11', from: 'sol-mon',     to: 'sol-queue'  },
      ],
    },
    steps: [
      'Commands (POST /deposit): Client → API Gateway → Command Handler → appends immutable event to Queue (Event Store)',
      'Queue → Projector: replays events, updates Read Model in DB (current balance) + Cache (hot balances)',
      'Queries (GET /balance): Client → API Gateway → Query Handler → Cache hit (<10ms) or DB fallback',
      'Queue → Storage: all events archived for temporal queries and compliance replay',
      'Monitoring tracks event replay lag and projection staleness',
    ],
    explanation: 'Command side appends immutable events to the Queue (Event Store) — never mutates state. Projector derives Read Model by replaying events. Query side reads from Cache for <10ms balance lookups. Storage archives all events for full 10-year temporal replay. CQRS allows read and write paths to scale completely independently.',
  },

};
