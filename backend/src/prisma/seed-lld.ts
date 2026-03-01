/**
 * seed-lld.ts — Enable LLD phase for all missions with design prompts
 *
 * Sets lldEnabled=true and lldContent for every mission so the LLD
 * phase tab is accessible after completing the HLD phase.
 *
 * Run: npx ts-node src/prisma/seed-lld.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface LLDContent {
  prompt: string;
  keyEntities: string[];
  apiHints: string[];
}

const LLD_DATA: Record<string, LLDContent> = {
  'mvp-launch': {
    prompt: 'Design the core entities, REST API, and database schema for a basic social product MVP — user accounts, posts, and a simple feed.',
    keyEntities: ['User', 'Post', 'Session', 'Follow'],
    apiHints: [
      'POST /api/auth/register — create account',
      'POST /api/auth/login — returns JWT',
      'POST /api/posts — create post',
      'GET /api/feed — paginated feed for current user',
    ],
  },
  'scaling-up': {
    prompt: 'Design the data layer and API contracts for a read-heavy service that uses caching and load balancing to handle 10k concurrent users.',
    keyEntities: ['User', 'Post', 'CacheEntry', 'Session'],
    apiHints: [
      'GET /api/posts/:id — cached read with TTL',
      'POST /api/posts — write through cache',
      'GET /api/users/:id/feed?cursor= — cursor-paginated feed',
    ],
  },
  'global-expansion': {
    prompt: 'Design multi-region data models, API routing, and CDN cache-key strategy for a globally distributed content platform.',
    keyEntities: ['User', 'Content', 'Region', 'CDNEdge', 'ReplicationLog'],
    apiHints: [
      'GET /api/content/:id — region-aware read with CDN headers',
      'POST /api/content — origin write + async replication',
      'GET /api/regions — list available regions and latencies',
    ],
  },
  'file-converter': {
    prompt: 'Design the job queue, worker contracts, and storage schema for an async file conversion service.',
    keyEntities: ['ConversionJob', 'FileAsset', 'Worker', 'JobResult'],
    apiHints: [
      'POST /api/jobs — submit conversion job, returns jobId',
      'GET /api/jobs/:id — poll status (queued | processing | done | failed)',
      'GET /api/jobs/:id/download — presigned S3 URL for result',
    ],
  },
  'url-shortener': {
    prompt: 'Design the URL mapping, redirect engine, and analytics schema for a high-throughput URL shortener.',
    keyEntities: ['ShortURL', 'ClickEvent', 'User', 'Analytics'],
    apiHints: [
      'POST /api/shorten — body: { longUrl, customSlug? } → { shortCode }',
      'GET /:shortCode — 301/302 redirect (logged async)',
      'GET /api/stats/:shortCode — click count, top referrers, geo breakdown',
    ],
  },
  'live-scoreboard': {
    prompt: 'Design the real-time score update pipeline, WebSocket contract, and leaderboard data model.',
    keyEntities: ['Game', 'Player', 'ScoreEvent', 'Leaderboard', 'WebSocketSession'],
    apiHints: [
      'WS /ws/game/:gameId — subscribe to score updates',
      'POST /api/scores — ingest score event (server-to-server)',
      'GET /api/leaderboard/:gameId?top=100 — ranked player list',
    ],
  },
  'code-judge': {
    prompt: 'Design the sandboxed execution pipeline, submission model, and result delivery contracts for an online code judge.',
    keyEntities: ['Submission', 'TestCase', 'ExecutionSandbox', 'JudgeResult', 'Problem'],
    apiHints: [
      'POST /api/submit — { problemId, code, language } → { submissionId }',
      'GET /api/submissions/:id — status + per-test-case results',
      'GET /api/problems/:id/testcases — public examples only',
    ],
  },
  'search-engine': {
    prompt: 'Design the document ingestion pipeline, inverted index schema, and search query API for a full-text search service.',
    keyEntities: ['Document', 'IndexEntry', 'SearchQuery', 'RankingScore', 'Crawler'],
    apiHints: [
      'POST /api/index — ingest document { url, title, body }',
      'GET /api/search?q=&limit=&offset= — ranked results with snippets',
      'DELETE /api/index/:docId — remove document from index',
    ],
  },
  'booking-system': {
    prompt: 'Design the reservation entity model, availability check API, and payment hold flow for a concurrent booking system.',
    keyEntities: ['Booking', 'Resource', 'TimeSlot', 'PaymentHold', 'User'],
    apiHints: [
      'GET /api/availability/:resourceId?date= — available time slots',
      'POST /api/bookings — optimistic lock + payment hold',
      'DELETE /api/bookings/:id — cancel and release hold',
    ],
  },
  'social-feed': {
    prompt: 'Design the fan-out write model, feed storage schema, and pagination API for a social media feed system.',
    keyEntities: ['Post', 'User', 'Follow', 'FeedItem', 'NotificationEvent'],
    apiHints: [
      'POST /api/posts — create post, fan-out to followers',
      'GET /api/feed?cursor= — chronological paginated feed',
      'POST /api/follow/:userId — follow/unfollow with feed backfill',
    ],
  },
  'ride-hailing': {
    prompt: 'Design the real-time driver location model, matching algorithm API, and trip state machine schema.',
    keyEntities: ['Driver', 'Rider', 'Trip', 'LocationEvent', 'MatchRequest'],
    apiHints: [
      'POST /api/trips/request — rider requests ride → matchId',
      'PATCH /api/drivers/:id/location — driver pushes GPS update',
      'WS /ws/trips/:tripId — real-time location and status stream',
    ],
  },
  'video-streaming': {
    prompt: 'Design the video ingestion pipeline, transcoding job model, and adaptive bitrate manifest API for a video platform.',
    keyEntities: ['Video', 'TranscodeJob', 'Rendition', 'Segment', 'Playlist'],
    apiHints: [
      'POST /api/videos/upload — multipart upload initiation',
      'GET /api/videos/:id/manifest.m3u8 — HLS adaptive bitrate manifest',
      'GET /api/videos/:id/status — transcoding progress',
    ],
  },
  'payment-processing': {
    prompt: 'Design the payment intent model, idempotency key schema, and webhook delivery system for a payment processor.',
    keyEntities: ['PaymentIntent', 'Charge', 'Refund', 'WebhookEvent', 'IdempotencyKey'],
    apiHints: [
      'POST /api/payments/intents — create payment intent with idempotency-key header',
      'POST /api/payments/intents/:id/confirm — capture payment',
      'POST /api/payments/intents/:id/refund — partial or full refund',
    ],
  },
  'design-whatsapp': {
    prompt: 'Design the messaging data model, end-to-end delivery guarantee system, and group chat schema for a chat application.',
    keyEntities: ['User', 'Message', 'Chat', 'GroupMember', 'DeliveryReceipt'],
    apiHints: [
      'POST /api/messages — send message { chatId, content, type }',
      'GET /api/chats/:id/messages?before=&limit= — paginated message history',
      'PATCH /api/messages/:id/receipts — update delivery/read status',
    ],
  },
  'design-instagram': {
    prompt: 'Design the media upload pipeline, follow graph model, and infinite-scroll feed API for a photo sharing platform.',
    keyEntities: ['User', 'Post', 'Media', 'Follow', 'Like', 'Comment'],
    apiHints: [
      'POST /api/posts — multipart media upload + caption',
      'GET /api/feed?cursor= — ranked feed with media URLs',
      'POST /api/posts/:id/likes — like/unlike toggle',
    ],
  },
  'how-reddit-works': {
    prompt: 'Design the post/comment tree model, vote aggregation schema, and hot-ranking API for a community platform.',
    keyEntities: ['Post', 'Comment', 'Vote', 'Subreddit', 'User', 'HotScore'],
    apiHints: [
      'POST /api/posts — submit post to subreddit',
      'POST /api/posts/:id/vote — upvote/downvote with idempotency',
      'GET /api/r/:subreddit?sort=hot&after= — ranked post listing',
    ],
  },
  'how-amazon-s3-works': {
    prompt: 'Design the object storage data model, multipart upload protocol, and bucket policy schema for a blob storage service.',
    keyEntities: ['Bucket', 'Object', 'MultipartUpload', 'ObjectPart', 'AccessPolicy'],
    apiHints: [
      'PUT /api/buckets/:bucket/:key — single-part upload',
      'POST /api/multipart/:bucket/:key/initiate — start multipart upload',
      'POST /api/multipart/:uploadId/complete — assemble parts',
    ],
  },
  'change-data-capture': {
    prompt: 'Design the CDC event schema, consumer offset tracking model, and debezium-style connector API for streaming DB changes.',
    keyEntities: ['CDCEvent', 'ConnectorConfig', 'ConsumerOffset', 'ChangeLog', 'DeadLetterQueue'],
    apiHints: [
      'POST /api/connectors — register new CDC connector',
      'GET /api/events?table=&after=lsn: — paginated change log',
      'POST /api/consumers/:groupId/commit — commit consumer offset',
    ],
  },
  'the-saga-pattern': {
    prompt: 'Design the saga orchestration state machine, compensation action schema, and distributed transaction log for a multi-service workflow.',
    keyEntities: ['Saga', 'SagaStep', 'CompensationAction', 'SagaLog', 'Participant'],
    apiHints: [
      'POST /api/sagas — start saga instance with ordered steps',
      'PATCH /api/sagas/:id/steps/:step — report step result (success/fail)',
      'GET /api/sagas/:id — saga state with per-step status',
    ],
  },
  'secure-the-gates': {
    prompt: 'Design the auth token schema, RBAC permission model, and API key rotation system for a secure API gateway.',
    keyEntities: ['User', 'Role', 'Permission', 'ApiKey', 'AuditLog', 'RefreshToken'],
    apiHints: [
      'POST /api/auth/token — exchange credentials for JWT + refresh token',
      'POST /api/auth/refresh — rotate refresh token',
      'POST /api/apikeys — generate scoped API key with expiry',
    ],
  },
  'bloom-filter-guardian': {
    prompt: 'Design the probabilistic membership data structure, false-positive budget schema, and query API for a bloom filter service.',
    keyEntities: ['BloomFilter', 'FilterConfig', 'MembershipQuery', 'FalsePositiveLog'],
    apiHints: [
      'POST /api/filters — create filter with capacity and error rate',
      'POST /api/filters/:id/add — add item to filter',
      'GET /api/filters/:id/check?item= — membership query (may false-positive)',
    ],
  },
  'db-replication-deep-dive': {
    prompt: 'Design the replication lag monitor, read replica routing schema, and failover promotion API for a database replication system.',
    keyEntities: ['Primary', 'Replica', 'ReplicationLag', 'WALEntry', 'FailoverEvent'],
    apiHints: [
      'GET /api/replication/status — lag per replica in ms',
      'POST /api/replication/failover — promote replica to primary',
      'GET /api/replication/wal?from=lsn — WAL replay entries',
    ],
  },
  'service-mesh-microservices': {
    prompt: 'Design the service registry, sidecar proxy config schema, and circuit breaker state model for a microservices mesh.',
    keyEntities: ['Service', 'ServiceInstance', 'SidecarProxy', 'CircuitBreaker', 'TrafficPolicy'],
    apiHints: [
      'POST /api/registry/services — register service with health endpoint',
      'GET /api/registry/services/:name/instances — list healthy instances',
      'PATCH /api/circuit-breakers/:service — update threshold config',
    ],
  },
  'cqrs-event-sourcing': {
    prompt: 'Design the event store schema, command handler model, and read-model projection API for a CQRS/ES system.',
    keyEntities: ['Event', 'Aggregate', 'Command', 'Projection', 'Snapshot'],
    apiHints: [
      'POST /api/commands — dispatch command to aggregate',
      'GET /api/events/:aggregateId?after=version — event stream',
      'GET /api/projections/:name/:id — materialized read model',
    ],
  },
};

async function main() {
  console.log('🌱 Seeding LLD content for all missions...');

  // Fetch all missions
  const missions = await prisma.mission.findMany({
    select: { id: true, slug: true, title: true },
  });

  let enabled = 0;
  let skipped = 0;

  for (const mission of missions) {
    const lldContent = LLD_DATA[mission.slug];

    if (lldContent) {
      await prisma.mission.update({
        where: { id: mission.id },
        data: {
          lldEnabled: true,
          lldContent: JSON.stringify(lldContent),
        },
      });
      enabled++;
    } else {
      // Enable LLD with a generic prompt for missions without specific content
      await prisma.mission.update({
        where: { id: mission.id },
        data: {
          lldEnabled: true,
          lldContent: JSON.stringify({
            prompt: `Design the core classes, REST API contracts, and database schema for the "${mission.title}" system. Focus on the key entities and how they interact.`,
            keyEntities: ['User', 'Resource', 'Event', 'Result'],
            apiHints: [
              `POST /api/${mission.slug}/create — create main resource`,
              `GET /api/${mission.slug}/:id — fetch resource by id`,
              `PATCH /api/${mission.slug}/:id — update resource`,
            ],
          }),
        },
      });
      skipped++;
    }
  }

  console.log(`✅ LLD seed complete! ${enabled} missions with full content, ${skipped} with generic prompt. Total: ${enabled + skipped}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
