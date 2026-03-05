/**
 * seed-reference-solutions.ts — Seeds the `referenceSolution` JSON field on missions.
 *
 * Each ReferenceSolution powers the Compare panel where users compare their
 * HLD architecture against an ideal reference design.
 *
 * Usage:
 *   npx ts-node src/prisma/seed-reference-solutions.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface ReferenceSolution {
  components: Array<{ type: string }>;
  connections: Array<{ from: string; to: string }>;
  keyInsights: string[];
  tradeoffs: Array<{ decision: string; reason: string }>;
  antiPatterns: string[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Reference Solutions — keyed by mission slug
// ─────────────────────────────────────────────────────────────────────────────

const REFERENCE_SOLUTIONS: Record<string, ReferenceSolution> = {

  // ═══════════════════════════════════════════════════════════════════════════
  // FOUNDATIONS PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'mvp-launch': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Start with Client → Server → Database — the minimum viable architecture; add layers only when bottlenecks appear',
      'A cache-aside pattern in front of the database can reduce DB load by 80%+ for read-heavy pages',
      'Load balancers eliminate single-server SPOF and enable zero-downtime deployments via rolling restarts',
      'Monitoring from day one prevents "flying blind" — you cannot optimize what you do not measure',
    ],
    tradeoffs: [
      { decision: 'Single database vs read replicas', reason: 'Single DB is simpler to operate for an MVP; add replicas only when read latency degrades' },
      { decision: 'Add caching early vs later', reason: 'Early caching reduces DB costs but adds cache-invalidation complexity; worth it at 1K concurrent users' },
      { decision: 'Managed load balancer vs DNS round-robin', reason: 'Managed LB adds cost but provides health checks, SSL termination, and sticky sessions out of the box' },
    ],
    antiPatterns: [
      'Over-engineering the MVP with microservices — a monolith is the right choice for <10K users',
      'Skipping monitoring and debugging production issues by reading raw server logs',
      'Putting the database on the same machine as the application server — one crash takes down both',
    ],
  },

  'scaling-up': {
    components: [
      { type: 'client' },
      { type: 'loadbalancer' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cdn' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Horizontal scaling (adding servers behind a load balancer) is preferred over vertical scaling (bigger machines) for cost-linear growth',
      'Cache-aside with TTL-based invalidation handles 90%+ of read traffic without touching the database',
      'Message queues decouple time-sensitive API responses from heavy background work like emails and image resizing',
      'CDN offloads static assets (JS, CSS, images) entirely from application servers — often 60–70% of total requests',
      'Database read replicas separate read traffic from write traffic, preventing write contention under load',
    ],
    tradeoffs: [
      { decision: 'Horizontal vs vertical scaling', reason: 'Horizontal is more resilient and cost-efficient at scale but requires stateless servers and session externalization' },
      { decision: 'Redis cache vs application-level in-memory cache', reason: 'Redis is shared across server instances and survives restarts; in-memory is faster but per-instance only' },
      { decision: 'Sync processing vs async via queue', reason: 'Queues add infrastructure but prevent request timeouts and allow retry logic for flaky downstream services' },
      { decision: 'CDN for dynamic content', reason: 'CDN is trivial for static assets; caching dynamic API responses requires careful cache-key design and invalidation' },
    ],
    antiPatterns: [
      'Storing session state in-memory on application servers — sessions are lost on restart or when the load balancer routes to a different instance',
      'Scaling the database vertically indefinitely — there is a ceiling; read replicas and caching should come first',
      'Running background jobs synchronously in the request handler — blocks the response and risks timeouts',
      'Ignoring connection pool limits — each server instance needs a bounded pool; 50 servers × unbounded connections can exhaust the database',
    ],
  },

  'global-expansion': {
    components: [
      { type: 'client' },
      { type: 'loadbalancer' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'cdn' },
      { type: 'queue' },
      { type: 'storage' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Multi-region deployment is the only way to achieve sub-100ms latency globally — physics limits speed-of-light round-trips to ~130ms US↔Europe',
      'CDN edge nodes serve both static assets and cacheable API responses close to users, cutting cross-continent round-trips',
      'Database replication across regions introduces the CAP theorem trade-off: you must choose between strong consistency (higher latency) and eventual consistency (lower latency)',
      'Regional failover with health checks enables 99.99% availability — traffic automatically routes to healthy regions when one goes down',
      'Object storage (S3) with CDN in front is the standard pattern for user-uploaded content like images and documents',
    ],
    tradeoffs: [
      { decision: 'Strong consistency vs eventual consistency across regions', reason: 'Eventual consistency gives lower latency (local reads) but risks stale data; strong consistency guarantees freshness at 100–200ms extra per write' },
      { decision: 'Active-active vs active-passive multi-region', reason: 'Active-active serves traffic from all regions simultaneously (lower latency) but requires conflict resolution for concurrent writes' },
      { decision: 'Per-region database vs single primary with replicas', reason: 'Per-region DBs give local write latency but require cross-region sync; single primary simplifies consistency at the cost of write latency' },
      { decision: 'CDN cache duration for dynamic content', reason: 'Longer CDN TTLs reduce origin load but risk serving stale content; short TTLs (5–30s) balance freshness and performance' },
    ],
    antiPatterns: [
      'Deploying in a single region and relying on CDN alone for global latency — CDN only helps for static/cacheable content; API calls still cross the globe',
      'Using synchronous cross-region database writes on every request — adds 100–300ms of latency per write',
      'Ignoring data residency and compliance (GDPR, data sovereignty) — user data may need to stay within a specific region',
      'Running a single global database instance — a region outage takes down the entire platform',
    ],
  },

  'design-chatgpt': {
    components: [
      { type: 'client' },
      { type: 'apigateway' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
      { from: 'apigateway', to: 'cache' },
    ],
    keyInsights: [
      'GPU inference workers are stateful during a request — the KV-cache lives in GPU VRAM; sticky routing keeps a request on the same GPU for its full streaming duration',
      'SSE (Server-Sent Events) is preferred over WebSockets for streaming tokens — unidirectional, works over HTTP/2, and auto-reconnects on drop',
      'Semantic cache: embed prompts into vectors and return cached responses for cosine similarity > 0.95 — a 20% hit rate on a $10M GPU bill saves $2M/month',
      'Rate limiting uses token buckets in Redis (INCR + EXPIRE in a Lua script) — atomic enforcement under concurrent requests from the same API key',
      'Billing metering is always async — token counts flow through a queue and aggregate downstream; never block the GPU inference hot path',
    ],
    tradeoffs: [
      { decision: 'Sticky GPU routing vs stateless load balancing', reason: 'Sticky routing reuses KV-cache across multi-turn conversations but risks uneven GPU utilization for long conversations' },
      { decision: 'SSE vs WebSockets for token streaming', reason: 'SSE is simpler and works over HTTP/2 but cannot receive client messages mid-stream (e.g. "stop generating")' },
      { decision: 'Semantic cache vs exact-match cache', reason: 'Semantic cache catches paraphrase variants with higher hit rates but adds 5–20ms embedding latency and risks false-positive matches' },
      { decision: 'Sync vs async billing', reason: 'Async billing adds eventual consistency to usage dashboards but removes DB latency from the inference hot path' },
    ],
    antiPatterns: [
      'Writing billing records synchronously in the inference handler — adds DB latency to the hot path and risks dropping tokens if the billing write fails',
      'Using WebSockets when SSE is sufficient — WebSockets require bidirectional protocol handling and stateful connection management',
      'Routing all requests without sticky routing — each generation starts from scratch without KV-cache, doubling GPU latency',
      'Storing conversation history in the relational DB and reading it per token — use Redis with TTL instead',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ASYNC & QUEUES PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'file-converter': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'queue' },
      { type: 'storage' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'storage' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Upload and conversion are decoupled by a queue — the API returns a job ID immediately while workers process files asynchronously',
      'Object storage (S3) holds both originals and converted files; never store binary files in a relational database',
      'Worker auto-scaling based on queue depth handles burst traffic without over-provisioning idle workers',
      'Dead letter queues capture failed conversion jobs for manual inspection and retry without blocking the main pipeline',
    ],
    tradeoffs: [
      { decision: 'Polling vs webhooks for job completion', reason: 'Webhooks notify clients instantly but require the client to expose an endpoint; polling is simpler but wastes bandwidth' },
      { decision: 'Pre-signed upload URLs vs server-proxied uploads', reason: 'Pre-signed URLs let clients upload directly to S3, removing the server from the data path; but require short-lived token management' },
      { decision: 'Single-format workers vs multi-format workers', reason: 'Specialized workers are simpler to maintain and scale independently; multi-format workers reduce infrastructure but complicate deployment' },
    ],
    antiPatterns: [
      'Processing file conversions synchronously in the API request handler — blocks the response and risks timeouts for large files',
      'Storing converted files in the database as BLOBs — explodes DB size and degrades query performance',
      'No dead letter queue — poisonous jobs (corrupt files, OOM crashes) retry forever and block the pipeline',
      'Exposing raw S3 URLs without CDN or expiry — allows unlimited bandwidth abuse and hotlinking',
    ],
  },

  'code-judge': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'queue' },
      { type: 'storage' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Queue decouples submission ingestion from code execution — the API returns a submission ID immediately while sandboxed workers evaluate the code',
      'Sandboxed execution environments (containers/VMs with resource limits) prevent malicious code from escaping or consuming unbounded resources',
      'Storage holds source files, test case inputs, expected outputs, and execution artifacts for audit trails',
      'Queue depth monitoring is critical during programming contests — a 10x traffic spike can cause minutes of queue backlog if workers don\'t scale',
    ],
    tradeoffs: [
      { decision: 'Container-per-submission vs pre-warmed worker pool', reason: 'Container-per-submission provides perfect isolation but has 1–3s cold start; pre-warmed pools are faster but share resources' },
      { decision: 'Synchronous verdict vs async with webhook/polling', reason: 'Async is mandatory for longer test suites (5s+) to avoid HTTP timeouts; websocket streaming shows real-time test progress' },
      { decision: 'Time/memory limits enforcement', reason: 'Strict cgroup limits prevent resource abuse but may fail legitimate solutions that are slightly over the threshold' },
    ],
    antiPatterns: [
      'Executing user code on the same server as the API — a fork bomb or infinite loop takes down the entire platform',
      'No resource limits on execution containers — a single malicious submission can consume all available CPU/memory',
      'Storing test case expected outputs alongside the submission response — leaks answer data to clever users',
      'Using synchronous HTTP for submissions during a contest with 10K participants — the server will timeout under load',
    ],
  },

  'design-kafka': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'storage' },
      { type: 'queue' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'storage' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
      { from: 'apigateway', to: 'server' },
    ],
    keyInsights: [
      'The append-only log is the core abstraction — producers write to the tail, consumers read from any offset; this enables replay, time-travel debugging, and multiple independent consumers',
      'Partitions are the unit of parallelism: one consumer per partition per consumer group; more partitions = more consumer throughput',
      'Consumer groups independently track their own offsets in __consumer_offsets — a slow analytics consumer never blocks a fast payments consumer on the same topic',
      'ISR (in-sync replicas) replication: a message is only acknowledged when all ISR members have written it — this is the durability guarantee preventing data loss',
      'Kafka is a log not a queue — messages are not deleted on consumption; they expire based on time or size retention policy',
    ],
    tradeoffs: [
      { decision: 'More partitions vs fewer partitions', reason: 'More partitions increase parallelism but also increase broker memory overhead, leader election time, and end-to-end latency' },
      { decision: 'acks=all vs acks=1', reason: 'acks=all guarantees durability (no data loss on broker failure) but adds replication latency; acks=1 is faster but risks losing the latest write' },
      { decision: 'Log compaction vs time-based retention', reason: 'Compaction keeps the latest value per key forever (ideal for changelogs); time-based retention is simpler but loses historical state' },
      { decision: 'KRaft vs ZooKeeper for metadata', reason: 'KRaft eliminates the ZooKeeper dependency and simplifies operations but is newer with less battle-tested failure modes' },
    ],
    antiPatterns: [
      'Using Kafka as a database — Kafka is an event log with limited query capabilities; use it for streaming and event sourcing, not CRUD',
      'Creating one partition per consumer — if the consumer count changes, partition rebalancing causes stop-the-world pauses',
      'Ignoring consumer lag monitoring — undetected lag means events are silently delayed by hours before anyone notices',
      'Setting retention too short — events consumed by a slow consumer may be deleted before they are processed',
    ],
  },

  'design-spotify': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'storage' },
      { type: 'cdn' },
      { type: 'cache' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Audio delivery is entirely a CDN problem — files are pre-encoded at multiple bitrates and cached at edge nodes; the origin server is never contacted during playback',
      'Offline sync uses a delta protocol: the client sends a manifest of cached tracks, the server returns only the diff — never transfer the full catalogue',
      'Listening events flow through Kafka to the recommendation pipeline, fully decoupling real-time playback from batch ML processing (Discover Weekly)',
      'Spotify Connect is a control plane problem — play/pause/seek commands are tiny JSON messages over WebSocket; audio bytes never move between devices',
      'Pre-encoding at 3+ bitrates (96k, 160k, 320k) is a storage trade-off that eliminates real-time transcoding and enables adaptive bitrate switching',
    ],
    tradeoffs: [
      { decision: 'Pre-encode all bitrates vs transcode on demand', reason: 'Pre-encoding uses 3x storage but eliminates transcoding latency and CPU cost; on-demand transcoding saves storage but adds 2–5s startup delay' },
      { decision: 'CDN edge caching vs origin streaming', reason: 'CDN achieves sub-200ms playback start with 95%+ cache hit rate but requires careful cache warming for new releases and long-tail content' },
      { decision: 'Push recommendations vs pull on demand', reason: 'Pre-computing playlists (Discover Weekly) enables instant access but consumes storage; on-demand ranking is fresh but adds latency' },
    ],
    antiPatterns: [
      'Streaming audio from origin servers instead of CDN — origin cannot handle 50M concurrent streams; CDN is mandatory',
      'Syncing the full track catalogue for offline mode instead of deltas — wastes bandwidth and battery on mobile devices',
      'Running recommendation inference in the playback hot path — ML models add seconds of latency; always pre-compute or use async queues',
      'Storing audio binary data in the relational database — use object storage (S3) with CDN for all media files',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // HIGH-READ PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'url-shortener': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'cdn' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Read:write ratio is ~100:1 — the architecture must be optimized for reads with aggressive caching at every layer',
      'Cache-aside pattern: check cache first → on miss, read from DB → populate cache → return. 99% of redirects should never touch the database',
      'Short URL generation uses base62 encoding of an auto-increment ID or a pre-generated ID pool — avoids collision entirely',
      'Analytics (click tracking, geolocation, referrer) should be collected asynchronously via a queue, not in the redirect hot path',
    ],
    tradeoffs: [
      { decision: 'Base62 sequential ID vs random hash', reason: 'Sequential IDs guarantee no collisions but are predictable (enumerable); random hashes need collision checks but are not guessable' },
      { decision: 'Cache TTL: long vs short', reason: 'Long TTLs (hours) maximize cache hit rate but risk serving stale data for updated/deleted links; short TTLs cause more DB reads' },
      { decision: '301 (permanent) vs 302 (temporary) redirect', reason: '301 is cached by browsers, reducing server load; 302 forces every request through the server, enabling accurate click analytics' },
    ],
    antiPatterns: [
      'Querying the database on every redirect without a cache — at 50K concurrent redirects, the DB becomes the bottleneck immediately',
      'Using 301 redirects and wondering why click analytics are inaccurate — browsers cache 301s and skip the server entirely',
      'Generating short URLs by hashing the long URL — different users shortening the same URL get collisions unless you add uniqueness salt',
      'Running click analytics synchronously in the redirect handler — adds latency to every redirect and risks timeouts',
    ],
  },

  'search-engine': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'cdn' },
      { type: 'queue' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
      { from: 'queue', to: 'database' },
    ],
    keyInsights: [
      'Inverted index structures map terms to document postings lists, enabling sub-millisecond full-text lookups across millions of documents',
      'Async indexing via queues decouples write-heavy document ingestion from the read-heavy search serving path',
      'Caching popular queries eliminates repeated expensive index traversals — the top 1% of queries often account for 30%+ of traffic',
      'Relevance scoring combines TF-IDF or BM25 with field boosts, freshness signals, and popularity weights',
      'Sharding the index by document ID range enables parallel scatter-gather query execution across shards',
    ],
    tradeoffs: [
      { decision: 'Elasticsearch vs custom inverted index', reason: 'Elasticsearch provides full-text search out of the box but adds operational overhead; a custom index gives more control at higher engineering cost' },
      { decision: 'Real-time indexing vs batch indexing', reason: 'Real-time indexing makes new documents searchable instantly but increases write amplification; batch indexing is efficient but has a delay' },
      { decision: 'Result caching granularity', reason: 'Caching exact query strings has low collision rate; caching by normalized/stemmed terms improves hit rate but may return slightly different rankings' },
    ],
    antiPatterns: [
      'Using LIKE %keyword% SQL queries instead of an inverted index — O(n) full table scan per query, unusable past 100K documents',
      'Indexing documents synchronously in the write path — blocks the API and degrades write latency',
      'Returning the full document body in search results instead of highlighted snippets — wastes bandwidth and increases response size 10x',
      'No query result caching — the same popular searches re-execute expensive index lookups on every request',
    ],
  },

  'design-google-search': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'cdn' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'storage' },
      { from: 'queue', to: 'storage' },
      { from: 'queue', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'The inverted index inverts document→words into words→documents, enabling sub-millisecond term lookups across 50B pages',
      'Query processing intersects postings lists starting with the rarest term to minimize the working set',
      'Index sharding by document ID enables scatter-gather: all shards queried in parallel, results merged and re-ranked in one aggregator',
      'PageRank is pre-computed offline as a batch job on the full web graph — one signal among hundreds in the ranking model',
      'Bloom filters prevent re-crawling already-indexed URLs: 50B URLs in ~60GB RAM with O(1) lookups and zero false negatives',
    ],
    tradeoffs: [
      { decision: 'Crawl freshness vs crawl completeness', reason: 'Frequent re-crawls keep the index fresh but consume massive bandwidth; prioritize high-value pages and re-crawl by PageRank score' },
      { decision: 'Scatter-gather fan-out width', reason: 'More shards = lower per-shard latency but higher aggregation overhead and tail-latency risk from slow shards' },
      { decision: 'Exact match cache vs semantic search cache', reason: 'Exact caching is simple but misses paraphrases; semantic caching improves hit rates but adds embedding compute per query' },
      { decision: 'Real-time ranking signals vs batch computation', reason: 'Real-time signals (CTR, freshness) improve relevance but add per-query computation cost; batch signals (PageRank) are pre-computed and free at query time' },
    ],
    antiPatterns: [
      'Full table scans instead of inverted indexes — O(n) per query is impossible at 50B documents',
      'Single-node index serving — query latency grows linearly with index size; sharding is mandatory',
      'Computing PageRank in real-time per query — it is a graph computation over the entire web; always pre-compute as a batch job',
      'Crawling without deduplication — without Bloom filters, the crawler re-fetches billions of already-indexed pages',
    ],
  },

  'how-amazon-s3-works': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'storage' },
      { type: 'database' },
      { type: 'cdn' },
      { type: 'loadbalancer' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'queue' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'S3 separates metadata (bucket, key, ACL, versioning) from data (binary object bytes) — metadata is stored in a fast key-value store while data lives on distributed storage nodes',
      'Objects are split into chunks, erasure-coded, and distributed across multiple availability zones for 11 nines (99.999999999%) durability',
      'Pre-signed URLs allow clients to upload/download directly to storage, bypassing the application server entirely and reducing bandwidth costs',
      'Eventual consistency for list operations means a newly written object may not appear in bucket listings immediately, even though GET-after-PUT is strongly consistent',
      'CDN integration (CloudFront) caches frequently accessed objects at edge nodes, reducing storage egress costs and latency globally',
    ],
    tradeoffs: [
      { decision: 'Erasure coding vs full replication', reason: 'Erasure coding achieves the same durability with 1.5x storage overhead vs 3x for full replication, but requires CPU-intensive encoding/decoding' },
      { decision: 'Strong consistency vs eventual consistency', reason: 'S3 provides strong read-after-write consistency for PUTs but eventual consistency for LIST — applications must handle stale listings' },
      { decision: 'Storage classes (Standard, IA, Glacier)', reason: 'Tiered storage dramatically reduces cost for infrequently accessed data but adds retrieval latency (minutes for Glacier)' },
    ],
    antiPatterns: [
      'Storing all objects in Standard storage class regardless of access frequency — moving cold data to Infrequent Access or Glacier saves 60–90% on storage',
      'Proxying all downloads through the application server instead of using pre-signed URLs or CDN — server becomes a bandwidth bottleneck',
      'Relying on LIST operations for consistency checks immediately after writes — eventual consistency may return stale results',
      'No lifecycle policies — objects accumulate forever without automatic tiering or expiry, inflating storage costs',
    ],
  },

  'shard-or-die': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'queue' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'Consistent hashing distributes data across shards while minimizing redistribution when shards are added/removed — only K/n keys move on average',
      'The shard key determines data locality: a good shard key distributes data evenly and keeps related queries on the same shard to avoid cross-shard joins',
      'Hot shards occur when a single shard key value receives disproportionate traffic (celebrity accounts, popular products) — solving this requires key splitting or caching',
      'Cross-shard queries are expensive — they require scatter-gather across all shards; schema design should minimize their frequency',
    ],
    tradeoffs: [
      { decision: 'Hash-based vs range-based sharding', reason: 'Hash-based distributes evenly but makes range queries expensive; range-based preserves ordering but risks hot shards on popular ranges' },
      { decision: 'Fewer large shards vs many small shards', reason: 'Fewer shards are simpler to operate but risk hotspots; more shards distribute load but increase coordination overhead and cross-shard query cost' },
      { decision: 'Application-level sharding vs database-native sharding', reason: 'Application-level gives full control but requires routing logic in every service; native sharding (Vitess, Citus) is transparent but limits flexibility' },
    ],
    antiPatterns: [
      'Choosing a shard key with low cardinality (e.g. country code with 200 values) — creates massive imbalance as most users are in a few countries',
      'Using auto-increment IDs as shard keys — all recent writes hit the same shard, creating a write hotspot',
      'Cross-shard joins in the hot path — these degrade to O(n) where n is the number of shards; denormalize or use a cache instead',
      'No monitoring of per-shard size and query latency — shard imbalance grows silently until one shard becomes a bottleneck',
    ],
  },

  'youtube-deep-read': {
    components: [
      { type: 'client' },
      { type: 'cdn' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Video delivery is read-dominated (1000:1 read:write) — CDN edge nodes serve 95%+ of video bytes; origin servers handle uploads and metadata only',
      'Adaptive bitrate streaming (HLS/DASH) lets the client switch quality tiers mid-stream based on network conditions — requires pre-encoding to multiple resolutions',
      'View counts use eventual consistency (Redis INCR → async flush to DB) to avoid write contention at millions of views per second on viral videos',
      'Recommendation signals (watch time, likes, click-through) are collected asynchronously via Kafka and fed into the ML ranking pipeline',
      'Video metadata (title, description, thumbnails) is cached in Redis with long TTLs since it changes rarely but is read millions of times per second',
    ],
    tradeoffs: [
      { decision: 'Pre-encode all resolutions vs adaptive on-demand transcoding', reason: 'Pre-encoding uses 6–10x storage but enables instant quality switching; on-demand saves storage but adds startup latency' },
      { decision: 'Exact view counts vs approximate counts', reason: 'Approximate counts via Redis are fast and sufficient for display; exact counts require expensive distributed counters or eventual DB reconciliation' },
      { decision: 'Push-based CDN warming vs pull-based caching', reason: 'Push warming preloads popular/new content to edge nodes before viewers request it; pull caching is simpler but has cold-start latency for new content' },
    ],
    antiPatterns: [
      'Serving video bytes from origin servers — a single viral video could generate terabytes/sec of traffic that no origin can handle',
      'Encoding videos synchronously during upload — blocks the upload API; always use async queue-based transcoding workers',
      'Using a relational DB for view count writes at YouTube scale — use Redis with periodic DB flushes for eventual persistence',
      'Single-resolution video delivery — forces users on slow networks to buffer constantly; adaptive bitrate is mandatory',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // REAL-TIME PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'live-scoreboard': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'queue' },
      { type: 'cache' },
      { type: 'database' },
      { type: 'cdn' },
      { type: 'apigateway' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Queue (pub/sub) broadcasts score-update events to all connected app servers simultaneously — never poll the DB for updates',
      'Cache stores the latest scores so 80K concurrent viewers read from memory, not the database',
      'WebSocket or SSE connections push updates to clients in real time — eliminates the latency and waste of client polling',
      'Horizontal server scaling behind a load balancer absorbs unpredictable traffic spikes during match finals',
    ],
    tradeoffs: [
      { decision: 'WebSocket vs SSE for score updates', reason: 'SSE is simpler for unidirectional push (server→client); WebSockets allow bidirectional communication (chat, reactions) but add connection management complexity' },
      { decision: 'Fan-out on write vs fan-out on read', reason: 'Fan-out on write pushes updates to all connections immediately (low latency) but is expensive for channels with millions of subscribers' },
      { decision: 'In-memory cache vs database for current scores', reason: 'Cache is orders of magnitude faster for reads but loses data on restart; the DB is the durable source of truth' },
    ],
    antiPatterns: [
      'Polling the database every second from each client — 80K clients × 1 QPS = 80K DB queries/sec for data that changes once every few minutes',
      'Single server handling all WebSocket connections — one server crash disconnects every viewer',
      'Storing live scores only in the database without a cache layer — the DB becomes the bottleneck during peak viewership',
      'Not planning for traffic spikes — a World Cup final can bring 100x normal traffic in seconds',
    ],
  },

  'ride-hailing': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'cdn' },
      { type: 'apigateway' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'In-memory geo-indexes (Redis GEOSEARCH) power sub-second driver proximity queries — SQL range scans on lat/lng are too slow for real-time matching',
      'Driver locations update every 3–4 seconds with TTL-based expiry — stale drivers are automatically marked unavailable without explicit deletion',
      'Event-driven matching via queues scales elastically with demand: ride-request events are consumed by matching workers that can auto-scale',
      'CDN serves map tiles from edge nodes — map rendering must be instant; tiles cannot be fetched from a single origin server',
    ],
    tradeoffs: [
      { decision: 'Geohash vs R-tree for spatial indexing', reason: 'Geohash is simpler and works with standard key-value stores (Redis); R-trees are more accurate for radius queries but require specialized databases' },
      { decision: 'ETA pre-computation vs on-demand calculation', reason: 'Pre-computed road graph with traffic overlays gives fast ETA at the cost of staleness; on-demand Dijkstra is accurate but slow at scale' },
      { decision: 'Push-based matching vs pull-based', reason: 'Push (server assigns driver) is faster; pull (driver accepts/rejects) gives drivers control but adds round-trip latency to matching' },
    ],
    antiPatterns: [
      'Using SQL queries with ST_Distance on every ride request — full table scans cannot handle 25K concurrent matching requests',
      'Not expiring stale driver locations — showing drivers who went offline 10 minutes ago degrades the user experience',
      'Matching drivers synchronously in the ride-request API — blocks the response; use event-driven matching with queue workers',
      'Serving map tiles from application servers instead of CDN — maps will not render fast enough on mobile devices',
    ],
  },

  'design-whatsapp': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'storage' },
      { type: 'cdn' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'client', to: 'storage' },
      { from: 'storage', to: 'cdn' },
      { from: 'cdn', to: 'client' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Chat servers are stateful — each holds active WebSocket connections; the presence cache maps user→server for message routing',
      'Cassandra\'s wide-column model is ideal for message storage: partition by chat_id, cluster by timestamp for efficient range reads',
      'Offline delivery: the queue persists undelivered messages until the recipient reconnects and polls their inbox',
      'Media upload goes client→S3 directly via pre-signed URL; message payload carries only the S3 object key, not the binary data',
    ],
    tradeoffs: [
      { decision: 'Kafka for message routing vs direct server-to-server', reason: 'Kafka provides durability and replay capability but adds latency; direct routing is faster but loses messages on server failure' },
      { decision: 'Cassandra vs PostgreSQL for messages', reason: 'Cassandra handles write-heavy chat workloads at massive scale; PostgreSQL offers joins and strong consistency but struggles at WhatsApp\'s write volume' },
      { decision: 'Stateful chat servers vs stateless', reason: 'Stateful servers avoid a round-trip to the presence store per message but require graceful reconnect logic on server failure' },
      { decision: 'End-to-end encryption at the server', reason: 'E2E encryption means servers cannot read messages (privacy); but makes server-side search and moderation impossible' },
    ],
    antiPatterns: [
      'Storing media blobs inside the message database — explodes storage costs and degrades query performance',
      'Polling the database for new messages instead of using push/WebSocket — cannot scale past 10K users',
      'Single monolithic server for all connections — one crash disconnects 2B users',
      'Delivering messages synchronously in the HTTP request cycle — blocks the sender until the recipient confirms delivery',
    ],
  },

  'design-slack': {
    components: [
      { type: 'client' },
      { type: 'loadbalancer' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cdn' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
      { from: 'apigateway', to: 'server' },
    ],
    keyInsights: [
      'WebSocket fan-out at scale requires a pub/sub intermediary (Redis Pub/Sub or Kafka) — direct server-to-server push does not scale past ~10K connections per node',
      'Sharding by workspace_id gives strong tenant isolation — cross-workspace queries are rare and handled by a separate search index',
      'Cursor-based pagination (keyset) is mandatory for chat history — OFFSET degrades to O(n) at large offsets',
      'Presence uses TTL-based heartbeats in Redis: every client heartbeats every 30s to reset the TTL — no persistent connection tracking',
      'Thread reply fan-out is separate from channel fan-out — replies notify only thread participants, not the full channel',
    ],
    tradeoffs: [
      { decision: 'Sticky WebSocket routing vs stateless', reason: 'Sticky routing keeps sessions on the same gateway node, preserving state; stateless requires an external session store but simplifies scaling' },
      { decision: 'Per-workspace DB sharding vs shared DB', reason: 'Per-workspace shards give tenant isolation and compliance but increase operational complexity; shared DB is simpler but risks noisy neighbors' },
      { decision: 'Redis Pub/Sub vs Kafka for message fan-out', reason: 'Redis is lower latency but fire-and-forget (no durability); Kafka provides replay and durability but adds 5–50ms latency' },
    ],
    antiPatterns: [
      'Direct server-to-server message push without a pub/sub layer — breaks at scale when channels have members across many gateway nodes',
      'OFFSET-based pagination for channel history — at offset 10K the query degrades to a full scan',
      'Tracking presence via persistent WebSocket connection state — requires complex disconnect detection; TTL heartbeats are simpler and more reliable',
      'Storing file attachments in the chat database — use object storage with CDN for all media',
    ],
  },

  'how-bluesky-works': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'cache' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'AT Protocol separates identity (DIDs), data hosting (PDS), and feed generation into independent layers — users can migrate their data between hosts',
      'The firehose is a real-time stream of all public events — feed generators subscribe to it and build custom algorithmic timelines without access to the core infrastructure',
      'Content-addressable storage using CIDs (Content Identifiers) means data integrity is cryptographically verified — tampering is detectable without trusting the host',
      'Decentralized moderation: labeling services tag content independently, and clients choose which labels to apply — no single entity controls what is visible',
    ],
    tradeoffs: [
      { decision: 'Decentralized hosting vs centralized', reason: 'Decentralization gives users data sovereignty and censorship resistance but increases complexity and makes global search harder' },
      { decision: 'Firehose-based feed generation vs server-side fan-out', reason: 'Firehose enables third-party custom feeds (innovation) but requires each feed generator to process the full event stream' },
      { decision: 'DID-based identity vs username-based', reason: 'DIDs are portable across hosts and cryptographically owned; but are opaque to users and require a handle resolution layer' },
    ],
    antiPatterns: [
      'Building a centralized feed algorithm and calling it decentralized — the AT Protocol\'s value is that feed generation is open and pluggable',
      'Storing all user data in a single centralized database — defeats the purpose of decentralized personal data servers (PDS)',
      'Ignoring the firehose backpressure problem — a slow feed generator that falls behind the firehose will accumulate unbounded memory',
      'Coupling moderation with data hosting — moderation should be a separate labeling layer that clients opt into',
    ],
  },

  'sports-leaderboard': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'cdn' },
      { type: 'loadbalancer' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Redis Sorted Sets (ZADD/ZRANGEBYSCORE) provide O(log n) rank lookups and O(log n + k) range queries — purpose-built for leaderboards',
      'Score updates flow through a queue to decouple ingestion from ranking computation — prevents write storms from blocking read queries',
      'Leaderboard reads vastly outnumber writes — aggressive caching of top-N results handles 99% of requests without touching the sorted set',
      'CDN serves static assets (team logos, player photos) and cacheable leaderboard snapshots to reduce origin load during peak viewership',
    ],
    tradeoffs: [
      { decision: 'Redis Sorted Set vs database ORDER BY', reason: 'Redis gives O(log n) rank queries vs O(n log n) for SQL ORDER BY; but Redis is volatile and needs periodic DB persistence for durability' },
      { decision: 'Real-time rank vs periodic snapshot', reason: 'Real-time ranking provides up-to-the-second accuracy but requires more compute; periodic snapshots (every 5s) are cheaper and sufficient for most use cases' },
      { decision: 'Global leaderboard vs regional sharding', reason: 'Global gives one true ranking but requires cross-region replication; regional sharding reduces latency but fragments the leaderboard' },
    ],
    antiPatterns: [
      'Computing rankings with SQL ORDER BY on every request — O(n log n) per query is unacceptable at scale',
      'Updating the leaderboard synchronously on every score event — write storms during finals overwhelm the system',
      'Not caching the top-N results — the top 100 is requested by 99% of viewers and changes only every few seconds',
    ],
  },

  'presence-at-scale': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
      { from: 'apigateway', to: 'server' },
    ],
    keyInsights: [
      'Presence is a TTL problem not a connection-tracking problem — each client heartbeats every 30s; Redis EXPIRE auto-marks users offline when heartbeats stop',
      'Fan-out of presence changes uses pub/sub: when a user goes online/offline, only their contacts\' connected servers are notified — not every server in the fleet',
      'Presence status is eventually consistent by design — a 5–10 second delay in showing online/offline is acceptable and dramatically reduces system load',
      'Batch presence queries (fetch status for 100 friends at once) are served from cache in a single MGET, not 100 individual queries',
    ],
    tradeoffs: [
      { decision: 'Heartbeat interval: 10s vs 30s vs 60s', reason: 'Shorter intervals detect offline faster but generate more network traffic; 30s is the industry standard balancing accuracy and cost' },
      { decision: 'Push presence changes vs poll on demand', reason: 'Push notifies contacts instantly but generates massive fan-out for popular users; polling on demand only queries when the friend list is visible' },
      { decision: 'Per-user TTL keys vs Bloom filter for online set', reason: 'Per-user TTLs are precise but use more memory; a Bloom filter uses constant space but has false positives (showing offline users as online)' },
    ],
    antiPatterns: [
      'Tracking presence by monitoring WebSocket disconnect events — disconnects are unreliable (mobile network changes, battery death) and generate phantom offline events',
      'Querying the database for presence status — presence changes millions of times per second; only in-memory stores can handle this volume',
      'Broadcasting presence changes to all servers — only notify servers that have connected clients who are friends of the changed user',
      'Requiring real-time precision for presence — sub-second accuracy is unnecessary and prohibitively expensive; 5–10s eventual consistency is standard',
    ],
  },

  'multiplayer-game-server': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'cdn' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Game servers are authoritative — the server owns game state and validates all client inputs to prevent cheating; clients predict locally and reconcile with server state',
      'Tick rate (e.g. 60Hz) determines how often the server processes inputs and sends state updates — higher tick rates give smoother gameplay but increase bandwidth and CPU cost',
      'Matchmaking uses a queue to pair players by skill rating (ELO/MMR) — matching is decoupled from game sessions and can enforce fairness constraints',
      'Client-side prediction with server reconciliation: the client immediately applies inputs locally, then corrects when the server sends the authoritative state — hides network latency from the player',
      'Game state snapshots are persisted to the database periodically (not every tick) for replay, analytics, and crash recovery',
    ],
    tradeoffs: [
      { decision: 'Higher tick rate vs lower bandwidth', reason: '60Hz gives smooth gameplay but 60 updates/sec × 100 players = 6K packets/sec per server; 20Hz saves bandwidth but feels laggy for fast-paced games' },
      { decision: 'Authoritative server vs peer-to-peer', reason: 'Authoritative prevents cheating but requires dedicated server infrastructure; P2P eliminates server cost but is vulnerable to manipulation' },
      { decision: 'UDP vs TCP for game state', reason: 'UDP has lower latency (no head-of-line blocking, no retransmission delay) but requires custom reliability for critical events like kills and item pickups' },
    ],
    antiPatterns: [
      'Trusting client-reported game state — clients will cheat; the server must validate every input and own the authoritative state',
      'Sending the full game state every tick — use delta compression to send only what changed since the last acknowledged state',
      'Storing game state exclusively in memory with no persistence — server crashes lose the entire match state',
      'Running matchmaking synchronously in the game server — matchmaking should be a separate queue-driven service that feeds matched groups to game servers',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CONSISTENCY PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'booking-system': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'apigateway' },
      { type: 'monitoring' },
      { type: 'storage' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'storage' },
    ],
    keyInsights: [
      'Cache-based distributed locks (Redis SETNX with TTL) prevent two users from booking the same property — the lock holds during the payment window',
      'ACID transactions in the database guarantee that availability decrement and booking creation happen atomically — no partial state',
      'Queue serialization for the same property eliminates thundering-herd race conditions during flash sales — concurrent requests are processed sequentially per resource',
      'Idempotency keys on booking requests prevent duplicate reservations from retried network requests',
    ],
    tradeoffs: [
      { decision: 'Pessimistic locking vs optimistic concurrency', reason: 'Pessimistic locks (SELECT FOR UPDATE) prevent conflicts but reduce throughput; optimistic concurrency (version checks) allows parallel reads but fails on write conflicts' },
      { decision: 'Strict consistency vs eventual with compensation', reason: 'Strict consistency prevents overbooking but requires distributed locks; eventual consistency is faster but needs compensation (refund) for conflicts' },
      { decision: 'Pre-authorization hold vs charge-on-book', reason: 'Pre-auth holds funds without charging, allowing cancellation; charge-on-book is simpler but requires refund flows for cancellations' },
    ],
    antiPatterns: [
      'Checking availability and creating a booking in separate non-atomic operations — race condition causes double bookings',
      'No distributed lock for concurrent requests on the same property — two users can book the same date simultaneously',
      'Infinite lock TTL — if the booking service crashes while holding a lock, the property is locked forever',
      'Processing payment synchronously in the booking handler — a slow payment gateway blocks the response; use a queue for async payment confirmation',
    ],
  },

  'payment-processing': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
      { type: 'cache' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Idempotency keys (stored in a cache or DB) ensure exactly-once payment processing — retried requests with the same key return the original result without re-charging',
      'Monitoring is non-negotiable for payment systems — every failure must trigger an immediate alert; audit logs are a regulatory requirement',
      'ACID database transactions prevent partial payment states — the debit, credit, and ledger entry must succeed or fail atomically',
      'Queue-based processing decouples payment initiation from settlement — the API returns a pending status while the queue ensures reliable delivery to the payment gateway',
      'Two-phase commit or saga pattern coordinates multi-step payments (debit account → charge card → update ledger) with compensation on failure',
    ],
    tradeoffs: [
      { decision: 'Synchronous vs asynchronous payment flow', reason: 'Sync gives instant confirmation but blocks on slow gateways; async returns pending status and confirms via webhook, improving availability' },
      { decision: 'Single ledger database vs event-sourced ledger', reason: 'Event sourcing provides a complete audit trail and enables replaying the payment history; a single ledger is simpler but makes auditability harder' },
      { decision: 'Build vs buy payment gateway integration', reason: 'Stripe/Adyen handle PCI compliance and card network complexity; building in-house gives control but requires PCI-DSS certification' },
    ],
    antiPatterns: [
      'Processing payments without idempotency keys — network retries cause double charges, the most common payment bug',
      'No monitoring or alerting for payment failures — silent failures accumulate until customers complain',
      'Storing credit card numbers in your own database — PCI-DSS violation; use a tokenized payment gateway',
      'Using eventual consistency for the payment ledger — the ledger must be strictly consistent to prevent accounting discrepancies',
    ],
  },

  'design-uber-eta': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Geohashing converts 2D coordinates into a 1D string — nearby drivers share the same geohash prefix, enabling O(1) proximity lookups without radius scans',
      'Redis GEOSEARCH is purpose-built for this: GEOSEARCH key FROMLONLAT lon lat BYRADIUS 2 km returns nearest drivers in microseconds',
      'Location updates flow through Kafka before hitting the geo store — buffering 1.25M pings/sec prevents overwhelming the cache during peak hours',
      'ETA uses a pre-computed road graph with real-time traffic overlays updated every 60s — not Dijkstra from scratch per request',
      'Stale driver detection: each entry has a 10s TTL in Redis — if no ping arrives within the TTL, the driver is auto-removed from the available set',
    ],
    tradeoffs: [
      { decision: 'Geohash precision level', reason: 'Precision 6 (~1.2km cells) gives good proximity grouping; lower precision has fewer cells to search but more drivers per cell; higher precision has more cells with fewer matches' },
      { decision: 'Road graph update frequency', reason: 'More frequent updates (every 30s) improve ETA accuracy but increase computation cost; less frequent (every 5min) saves cost but ETAs drift during traffic changes' },
      { decision: 'Single geo store vs geo-partitioned by city', reason: 'Partitioning by city keeps data local and reduces cross-region latency; a single store is simpler but adds latency for distributed deployments' },
    ],
    antiPatterns: [
      'Running SQL range queries on lat/lng columns for proximity search — O(n) full scan cannot handle 1.25M pings/sec',
      'Computing shortest path from scratch per ETA request — pre-compute the road graph and overlay real-time traffic',
      'No TTL on driver location entries — drivers who turned off the app still appear as available for rides',
      'Processing location updates synchronously without a queue buffer — peak traffic overwhelms the geo store directly',
    ],
  },

  'circuit-breaker': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'Circuit breaker has three states: Closed (normal flow), Open (fast-fail, no calls to downstream), Half-Open (probe with limited traffic to test recovery)',
      'Failure threshold triggers the transition from Closed→Open — e.g. 5 failures in 10 seconds; this prevents cascading failures to upstream callers',
      'The half-open state sends a small percentage of requests to the downstream to detect recovery — if those succeed, the circuit closes; if they fail, it reopens',
      'Monitoring is essential — circuit state changes must be observable in dashboards and trigger alerts so operators know which dependency is degraded',
    ],
    tradeoffs: [
      { decision: 'Aggressive threshold vs conservative threshold', reason: 'Opening too quickly on transient errors causes unnecessary outages; opening too slowly lets cascading failures propagate' },
      { decision: 'Fallback response vs error propagation', reason: 'Returning a cached/default response when the circuit is open improves UX but may serve stale data; propagating the error is honest but degrades UX' },
      { decision: 'Per-host vs per-service circuit breaker', reason: 'Per-host isolates individual bad instances; per-service is simpler but one bad instance can trip the breaker for all healthy instances' },
    ],
    antiPatterns: [
      'No circuit breaker on external service calls — a slow downstream service ties up all threads, cascading failures across the entire system',
      'Setting the failure threshold too high (e.g. 1000 failures) — by the time the circuit opens, the calling service is already overwhelmed',
      'Never transitioning to half-open — the circuit stays open indefinitely even after the downstream recovers',
      'No monitoring of circuit state — operators are unaware that a circuit has opened and half the system is returning fallbacks',
    ],
  },

  'distributed-locks-deep-dive': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'queue' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'Redis SETNX with TTL is the simplest distributed lock — but it is unsafe under network partitions because Redis is not consensus-based',
      'Redlock (Redis) uses N independent Redis instances: a lock is acquired only if the majority (N/2+1) respond — tolerates individual instance failures',
      'Fencing tokens solve the problem of expired locks: the lock includes a monotonically increasing token; the protected resource rejects any operation with an older token',
      'Lock TTL must be longer than the maximum expected operation time — if the operation takes longer, the lock expires and another process acquires it, causing a split-brain',
    ],
    tradeoffs: [
      { decision: 'Redis-based lock vs ZooKeeper-based lock', reason: 'Redis is faster and simpler but not consensus-based (unsafe under partitions); ZooKeeper provides true consensus but is slower and operationally heavier' },
      { decision: 'Short TTL vs long TTL', reason: 'Short TTLs release locks quickly if the holder crashes but risk premature expiry on slow operations; long TTLs block other processes longer on holder failure' },
      { decision: 'Advisory lock vs fenced lock', reason: 'Advisory locks are simpler but rely on all participants respecting the lock voluntarily; fenced locks enforce correctness via tokens but require resource-side validation' },
    ],
    antiPatterns: [
      'Using SETNX without a TTL — if the lock holder crashes, the lock is held forever (deadlock)',
      'Assuming Redis single-instance locks are safe under network partitions — Redis replication is async; a failover can grant the same lock to two processes',
      'No fencing token — a process whose lock expired but still runs can corrupt the shared resource',
      'Using distributed locks for performance optimization instead of correctness — locks add latency; use them only when correctness requires mutual exclusion',
    ],
  },

  'two-phase-commit-practice': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'cache' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'cache' },
    ],
    keyInsights: [
      'Two-phase commit (2PC) ensures atomicity across multiple databases: Phase 1 (Prepare) asks all participants to vote; Phase 2 (Commit/Abort) makes it final',
      'The coordinator is a single point of failure — if it crashes between Prepare and Commit, participants are left in a blocked (uncertain) state until it recovers',
      'Participants must write their vote to a durable log before responding to Prepare — this enables recovery after a crash without data loss',
      'In practice, 2PC is avoided in favor of saga patterns or eventual consistency because it blocks resources during the protocol and does not tolerate coordinator failure well',
    ],
    tradeoffs: [
      { decision: '2PC vs saga pattern', reason: '2PC provides strict atomicity across services but blocks resources during voting; sagas use compensating transactions and eventual consistency but are more complex to implement' },
      { decision: 'Synchronous 2PC vs async with outbox pattern', reason: 'Synchronous 2PC blocks until all participants commit; the outbox pattern is non-blocking but trades strict atomicity for eventual consistency' },
      { decision: 'Single coordinator vs distributed consensus (Paxos/Raft)', reason: '2PC coordinator is simple but a SPOF; Paxos/Raft replicate the coordinator state for fault tolerance at higher complexity' },
    ],
    antiPatterns: [
      'Using 2PC across microservices over the network — network partitions can leave participants in a blocked state indefinitely',
      'No durable write-ahead log for participant votes — a crash after voting YES but before committing leaves the participant in an unrecoverable state',
      'Holding database locks during the entire 2PC protocol — this blocks other transactions and degrades throughput',
      'Not implementing a timeout on the coordinator — a slow participant can block the entire transaction indefinitely',
    ],
  },

  'how-stock-exchange-works': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'The matching engine is single-threaded per symbol — sequential processing eliminates lock contention and guarantees strict FIFO ordering',
      'Orders flow through Kafka before matching — the queue absorbs 1M orders/sec bursts while the matching engine processes at a steady rate',
      'Event sourcing: every order-state change is immutable — replay the log to reconstruct any historical order book at any point in time',
      'CQRS: the write side (matching engine) is separate from the read side (market data feed, analytics dashboards) — they scale independently',
      'Circuit breakers halt trading when price moves > 5% in 5 minutes or error rate exceeds threshold — monitoring triggers the halt within 50ms',
    ],
    tradeoffs: [
      { decision: 'Single-threaded matching vs multi-threaded', reason: 'Single-threaded guarantees FIFO ordering per symbol with zero lock overhead; multi-threaded needs distributed coordination and risks order reordering' },
      { decision: 'In-memory order book vs persistent order book', reason: 'In-memory gives microsecond matching latency but requires event-sourced recovery on restart; persistent is slower but immediately consistent' },
      { decision: 'Event sourcing vs traditional CRUD', reason: 'Event sourcing provides complete audit trail and replay capability (regulatory requirement); CRUD is simpler but loses the change history' },
    ],
    antiPatterns: [
      'Multi-threaded matching engine without strict ordering guarantees — orders get matched out of FIFO sequence, violating exchange regulations',
      'Synchronous database writes in the matching hot path — disk I/O adds milliseconds; write to the event log and flush to DB asynchronously',
      'No circuit breaker — a flash crash cascades through the entire market without automated trading halts',
      'Processing orders directly without a queue buffer — traffic spikes from algorithmic trading overwhelm the matching engine',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SCALE & STREAMING PATH
  // ═══════════════════════════════════════════════════════════════════════════

  'social-feed': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'cdn' },
      { type: 'storage' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'cache' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Fan-out on write pre-computes timelines: when a user posts, the post ID is pushed to every follower\'s timeline cache — reads are O(1) cache lookups',
      'Cache is the primary read store for timelines — the database is the source of truth only; timeline reads should never hit the DB',
      'CDN + object storage offload all media (images, videos) entirely from app servers — media never flows through the API layer',
      'Hybrid fan-out for celebrity accounts: push to regular followers on write, merge celebrity posts on read to avoid catastrophic write amplification',
    ],
    tradeoffs: [
      { decision: 'Fan-out on write vs fan-out on read', reason: 'Write fan-out gives instant reads but is expensive for celebrities (50M writes per post); read fan-out is cheap on write but slow on read (N queries per timeline load)' },
      { decision: 'Timeline cache stores post IDs vs full posts', reason: 'Storing IDs only decouples fan-out from content updates (edits, deletes); storing full posts avoids a second lookup but complicates invalidation' },
      { decision: 'Chronological feed vs algorithmic ranking', reason: 'Chronological is simple and real-time; algorithmic increases engagement but adds ML inference latency and complexity' },
    ],
    antiPatterns: [
      'Querying the database for every timeline load — N follower joins per request at 500K concurrent readers will melt any database',
      'Fan-out on write for all accounts including celebrities — a 50M-follower post generates 50M cache writes, taking minutes to propagate',
      'Storing media blobs in the database instead of object storage — explodes DB size and makes backups impractical',
      'No queue between the write path and fan-out workers — a viral post directly hammers the fan-out service',
    ],
  },

  'video-streaming': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'cdn' },
      { type: 'storage' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'cache' },
      { type: 'monitoring' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'CDN is the backbone — video bytes must never travel from origin on every play request; edge nodes serve 95%+ of traffic',
      'Async transcoding via queue workers handles multi-resolution encoding (480p→4K) without blocking uploads',
      'Adaptive bitrate streaming (HLS/DASH) lets clients switch quality tiers mid-stream based on network bandwidth',
      'Cache stores video metadata, thumbnails, and watch progress — these are read millions of times per second and change rarely',
    ],
    tradeoffs: [
      { decision: 'Pre-encode all resolutions vs just-in-time transcoding', reason: 'Pre-encoding uses 6–10x storage but enables instant playback at any quality; JIT saves storage but adds startup delay and transcoding compute' },
      { decision: 'CDN push vs CDN pull caching', reason: 'Push pre-loads content at edges before viewers request it (instant for new releases); pull caches on first request (cold start for new content)' },
      { decision: 'Chunked upload vs single-file upload', reason: 'Chunked allows resume on network failure and parallel upload; single-file is simpler but fails completely on interruption' },
    ],
    antiPatterns: [
      'Serving video bytes from origin servers — even a single viral video at 4K can generate terabytes/sec that no origin can handle',
      'Encoding videos synchronously during upload — blocks the upload API; always use async queue-based transcoding',
      'No adaptive bitrate — forces users on slow networks to buffer constantly; HLS/DASH is mandatory for any video platform',
      'Storing video files in the database — use object storage (S3) for all binary content',
    ],
  },

  'design-instagram': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'cdn' },
      { type: 'queue' },
      { type: 'loadbalancer' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'storage' },
      { from: 'queue', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Photo upload: client → pre-signed S3 URL → async queue notification → CDN propagation. The server never handles photo bytes directly.',
      'Fan-out on write pre-computes feeds; hybrid strategy for celebrity accounts avoids writing to 50M+ follower caches per post',
      'Feed cache stores ordered post-ID lists per user, not full post objects — decouples fan-out writes from post content updates',
      'CDN image resizing at edge eliminates separate thumbnail generation infrastructure — request-time transforms via query params (?w=200&h=200)',
      'The user graph (followers/following) is stored in a graph database or adjacency list in the relational DB; post metadata is separate from photo storage',
    ],
    tradeoffs: [
      { decision: 'Pre-signed upload vs server-proxied upload', reason: 'Pre-signed URLs bypass the server for uploads, reducing bandwidth costs; but require short-lived token management and CORS configuration' },
      { decision: 'Fan-out on write vs on read for feed', reason: 'Write fan-out gives O(1) feed reads but is catastrophic for celebrities; hybrid is the industry standard' },
      { decision: 'Edge image resizing vs pre-generated thumbnails', reason: 'Edge resizing is flexible (any size) but adds CDN compute cost; pre-generated thumbnails are instant but require storage for each size variant' },
      { decision: 'Chronological vs ranked feed', reason: 'Chronological is simple and real-time; ranked feed increases engagement but adds ML complexity and user perception of missed content' },
    ],
    antiPatterns: [
      'Proxying photo uploads through the application server — the server becomes a bandwidth bottleneck and wastes compute on I/O',
      'Storing photos in the relational database as BLOBs — makes the DB unmanageably large and backups impractical',
      'Pure fan-out on write for all accounts — a celebrity post to 50M followers takes minutes to propagate',
      'No CDN for photo delivery — serving millions of photo requests from a single origin region adds hundreds of ms of latency globally',
    ],
  },

  'design-youtube': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'storage' },
      { type: 'cdn' },
      { type: 'queue' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'loadbalancer' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'cdn', to: 'storage' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'storage' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Upload pipeline: client → chunked upload → raw storage → transcoding queue → 6+ encoded variants → CDN propagation. A viral video is streamable in all quality tiers within minutes.',
      'Transcoding farm uses the queue-worker pattern: each worker handles one resolution; horizontal scaling handles 500 hours/min of uploads',
      'CDN is the entire delivery layer — origin servers never serve video bytes directly to viewers',
      'Metadata DB stores video info; watch history in a wide-column store (Bigtable); Redis for real-time view counts with async DB persistence',
      'Recommendation signals (watch time, completion rate, click-through) flow through Kafka to the ML ranking pipeline — completely decoupled from playback',
    ],
    tradeoffs: [
      { decision: 'Pre-encode all resolutions vs on-demand transcoding', reason: 'Pre-encoding ensures instant quality switching; on-demand saves storage for rarely-watched content but adds seconds of startup delay' },
      { decision: 'CDN cache warming vs pull-on-demand', reason: 'Cache warming pre-loads viral content at all edges but wastes bandwidth for content that does not go viral; pull-on-demand has cold-start latency' },
      { decision: 'Chunked upload vs resumable single upload', reason: 'Chunked enables parallel upload and resume on failure; single upload is simpler but fails completely on network interruption for large files' },
      { decision: 'View count precision vs performance', reason: 'Redis INCR gives approximate real-time counts at scale; strict DB counts require distributed locking and cannot handle millions of increments/sec' },
    ],
    antiPatterns: [
      'Serving video from origin servers instead of CDN — a single viral video can generate petabytes of traffic that no origin can absorb',
      'Synchronous transcoding during upload — blocks the upload completion for minutes; always use async queue-based workers',
      'Storing transcoded videos in the database — use object storage for all media binary data',
      'Running recommendation ML inference in the video playback hot path — pre-compute recommendations and serve from cache',
    ],
  },

  'design-twitter-timeline': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
      { type: 'cdn' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'cache' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Hybrid fan-out is the industry solution: push to all followers with < 1M followers at tweet time; lazy-merge celebrity tweets at read time',
      'Timeline cache stores tweet_id lists not full tweet objects — decouples the fan-out write path from content updates (edits, deletes)',
      'CQRS is implicit: the write model (fan-out service) and read model (timeline cache) are completely separate systems',
      'While-you-were-away is a batch job, not real-time — runs on a separate pipeline and injects a ranked summary into the timeline',
      'Pure fan-out on write breaks for celebrity accounts — writing to 50M timeline caches per tweet takes minutes, not milliseconds',
    ],
    tradeoffs: [
      { decision: 'Fan-out on write vs read vs hybrid', reason: 'Write fan-out gives O(1) reads but is catastrophic for 50M-follower celebrities; read fan-out is cheap on write but O(N) on read; hybrid is the pragmatic solution' },
      { decision: 'Timeline invalidation on tweet delete', reason: 'Removing the tweet ID from millions of timeline caches is expensive; lazy invalidation (skip deleted tweets at read time) is simpler and sufficient' },
      { decision: 'Chronological timeline vs ranked', reason: 'Chronological is simple, predictable, and real-time; ranked increases engagement but adds ML inference cost and user frustration from non-linear ordering' },
    ],
    antiPatterns: [
      'Pure fan-out on write for all accounts — a celebrity with 50M followers triggers 50M cache writes per tweet, taking minutes',
      'Querying the follow graph and joining tweets at read time for every timeline load — O(N_followees) DB queries per request',
      'Storing full tweet objects in the timeline cache — content updates require touching every cache entry; store IDs only',
      'Not implementing the hybrid strategy and choosing one fan-out model for all accounts — neither pure push nor pure pull works at Twitter scale',
    ],
  },

  'rest-vs-graphql': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'REST resources map to URLs (GET /users/123) with standardized HTTP verbs; GraphQL uses a single endpoint with a typed query language — the trade-off is simplicity vs flexibility',
      'GraphQL eliminates over-fetching and under-fetching by letting the client specify exactly which fields it needs — critical for mobile clients on slow networks',
      'REST caching is straightforward (HTTP cache headers, CDN, proxy caches); GraphQL caching is harder because POST requests with variable query shapes bypass standard HTTP caches',
      'The N+1 query problem is GraphQL\'s biggest performance trap — dataloader pattern (batching + deduplication) is mandatory to avoid explosion of database queries',
    ],
    tradeoffs: [
      { decision: 'REST vs GraphQL', reason: 'REST is simpler, well-understood, and cacheable out of the box; GraphQL reduces round-trips and over-fetching but adds query complexity, security concerns (depth attacks), and caching challenges' },
      { decision: 'Single GraphQL gateway vs REST microservices', reason: 'GraphQL gateway provides a unified schema for clients but couples services to the gateway; REST microservices are independently deployable but require client-side orchestration' },
      { decision: 'Persisted queries vs dynamic queries', reason: 'Persisted queries whitelist allowed queries (security + cacheability); dynamic queries give client flexibility but are vulnerable to query complexity attacks' },
    ],
    antiPatterns: [
      'Exposing the database schema directly through GraphQL without a resolver layer — leaks internal data model and allows unbounded recursive queries',
      'No query depth or complexity limits on GraphQL — a malicious nested query can trigger exponential database load',
      'Implementing GraphQL without dataloader — nested resolvers generate O(N) database queries per item in the list',
      'Using GraphQL for simple CRUD APIs that could be served by standard REST — adding unnecessary complexity',
    ],
  },

  'concurrency-vs-parallelism': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Concurrency is about structure (handling many things at once); parallelism is about execution (doing many things simultaneously) — you can have concurrency without parallelism (async I/O on a single core)',
      'Event loops (Node.js, Python asyncio) achieve high concurrency with a single thread by never blocking on I/O — ideal for I/O-bound workloads',
      'Worker queues convert a concurrent problem into a parallel one: N workers consume from a shared queue, each processing one task at a time on separate cores',
      'Thread-pool sizing: for CPU-bound work, threads ≈ CPU cores; for I/O-bound work, threads >> cores because threads spend most time waiting',
    ],
    tradeoffs: [
      { decision: 'Event-loop (async) vs thread pool', reason: 'Event loops handle thousands of concurrent I/O operations efficiently but are unsuitable for CPU-bound work; thread pools parallelize CPU work but have higher memory overhead per thread' },
      { decision: 'Process-per-request vs shared-nothing workers', reason: 'Process-per-request provides perfect isolation but has high memory overhead; shared-nothing workers (queue consumers) are efficient but require careful stateless design' },
      { decision: 'Horizontal scaling vs vertical (more cores)', reason: 'Horizontal scaling adds more machines and is limitless; vertical scaling is simpler but has a ceiling and does not improve fault tolerance' },
    ],
    antiPatterns: [
      'Running CPU-bound computation in a single-threaded event loop (Node.js) — blocks all concurrent I/O operations; use worker threads or a queue',
      'Creating unbounded threads per request — thousands of threads exhaust OS resources; use a thread pool with a bounded size',
      'Assuming parallelism solves all concurrency problems — adding more threads to a lock-contended critical section makes it slower, not faster (Amdahl\'s Law)',
      'No monitoring of queue depth and worker utilization — without visibility, bottlenecks go undetected until the system is overwhelmed',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // CROSS-CUTTING
  // ═══════════════════════════════════════════════════════════════════════════

  'notification-engine': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Notifications must be multi-channel (push, email, SMS, in-app) — the system needs a routing layer that maps user preferences to delivery channels',
      'Queue-based delivery ensures at-least-once delivery: failed notifications are retried with exponential backoff; dead letter queues capture permanently failed messages',
      'User preference cache stores per-user notification settings (channels, frequency, mute rules) — checked before every send to avoid spamming users',
      'Rate limiting per user per channel prevents notification fatigue — e.g. max 3 push notifications per hour per user',
      'Template rendering is decoupled from delivery — templates are versioned and rendered at send time with user-specific data',
    ],
    tradeoffs: [
      { decision: 'At-least-once vs at-most-once delivery', reason: 'At-least-once guarantees delivery but may send duplicates; at-most-once avoids duplicates but may silently lose notifications on transient failures' },
      { decision: 'Push notifications vs polling for in-app', reason: 'Push (WebSocket/SSE) delivers instantly but requires persistent connections; polling is simpler but has inherent latency and wastes bandwidth' },
      { decision: 'Batch notifications vs real-time', reason: 'Batching (digest emails) reduces noise but delays delivery; real-time is instant but risks notification fatigue' },
    ],
    antiPatterns: [
      'Sending notifications synchronously in the API request handler — blocks the response and risks timeouts when the email provider is slow',
      'No user preference check before sending — spamming users with unwanted notifications causes opt-outs and app uninstalls',
      'No dead letter queue for failed notifications — permanently failed messages retry forever, wasting resources',
      'Sending the same notification to all channels simultaneously — respect user preferences for which channels to use and when',
    ],
  },

  'event-driven-microservice': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Events are immutable facts about something that happened (OrderPlaced, PaymentReceived) — services react to events independently without coupling to the producer',
      'The outbox pattern ensures atomic event publishing: write the event to an outbox table in the same DB transaction as the business operation, then publish asynchronously',
      'Event ordering matters: events for the same aggregate (e.g. same order ID) must be processed in sequence; events for different aggregates can be processed in parallel',
      'Idempotent consumers are mandatory: network retries and at-least-once delivery mean every consumer must handle duplicate events gracefully',
    ],
    tradeoffs: [
      { decision: 'Event-driven vs request-driven (REST) communication', reason: 'Event-driven gives loose coupling and temporal decoupling; request-driven is simpler and gives synchronous responses but tightly couples services' },
      { decision: 'Event sourcing vs event notification', reason: 'Event sourcing stores the full state as a sequence of events (complete audit trail); event notification triggers downstream actions but the event payload may not contain the full state' },
      { decision: 'Shared event bus vs point-to-point queues', reason: 'Shared bus (Kafka) enables multiple consumers per event type; point-to-point (SQS) is simpler but requires explicit routing for each consumer' },
    ],
    antiPatterns: [
      'Publishing events outside the database transaction — if the DB write succeeds but the event publish fails, downstream services miss the event; use the outbox pattern',
      'Non-idempotent event consumers — at-least-once delivery means the same event may arrive twice; processing it twice can cause data corruption',
      'Tight coupling through event payloads — including too much data in events couples consumers to the producer\'s schema; use thin events with IDs and let consumers fetch details',
      'No dead letter queue — poison events (malformed, unprocessable) retry forever and block the consumer',
    ],
  },

  'observability-at-scale': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'monitoring', to: 'storage' },
      { from: 'monitoring', to: 'database' },
    ],
    keyInsights: [
      'The three pillars of observability are metrics (what is happening), logs (why it is happening), and traces (how the request flowed through services)',
      'Distributed tracing with correlation IDs (trace_id, span_id) stitches together request flow across microservices — essential for debugging latency in multi-service architectures',
      'Sampling strategies reduce observability cost: collect 100% of error traces and 1–10% of success traces; tail-based sampling captures the interesting outliers',
      'Metrics should be aggregated at the source (counters, histograms) not at the collector — sending raw events at scale overwhelms the monitoring pipeline',
      'Alert on symptoms (latency, error rate, saturation) not causes — high CPU is a cause; high p99 latency is the symptom users feel',
    ],
    tradeoffs: [
      { decision: 'Full logging vs sampled logging', reason: 'Full logs enable complete forensics but generate terabytes/day at scale; sampled logs reduce cost but may miss the one request that failed' },
      { decision: 'Push-based vs pull-based metric collection', reason: 'Push (StatsD) works across firewalls and dynamic environments; pull (Prometheus) is simpler and gives the collector control over scrape frequency' },
      { decision: 'Hot storage vs cold tiering for observability data', reason: 'Hot storage (last 7 days) enables fast queries for recent incidents; cold tiering (S3) retains data for compliance at 90% lower cost' },
    ],
    antiPatterns: [
      'Logging without structured fields (JSON) — grep-based debugging on unstructured text does not scale past a few servers',
      'No distributed tracing — debugging cross-service latency becomes guesswork without trace_id propagation',
      'Alerting on every metric threshold instead of user-facing symptoms — generates alert fatigue and on-call burnout',
      'Storing all observability data in hot storage indefinitely — costs explode; use retention policies and cold tiering',
    ],
  },

  'full-stack-observability-capstone': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'storage' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'monitoring', to: 'storage' },
      { from: 'monitoring', to: 'queue' },
    ],
    keyInsights: [
      'Full-stack observability spans frontend (Core Web Vitals, JS errors), backend (latency, error rate), infrastructure (CPU, memory, disk), and business metrics (conversion, revenue)',
      'SLOs (Service Level Objectives) define the error budget: "99.9% of requests complete in <200ms" — alerting fires when the error budget burn rate is too high, not on individual threshold breaches',
      'OpenTelemetry provides vendor-neutral instrumentation for traces, metrics, and logs — invest in OTel to avoid vendor lock-in with Datadog/New Relic',
      'Runbooks linked to alerts reduce MTTR: when an alert fires, the on-call engineer follows a structured playbook instead of investigating from scratch',
      'Synthetic monitoring (scheduled probes) catches outages before users do — a canary request every 30s from multiple regions detects degradation proactively',
    ],
    tradeoffs: [
      { decision: 'Vendor observability platform vs self-hosted (Prometheus + Grafana + Jaeger)', reason: 'Vendor platforms are turnkey but expensive at scale; self-hosted gives control and lower cost but requires operational expertise' },
      { decision: 'SLO-based alerting vs threshold-based', reason: 'SLO-based alerts fire only when user experience is degrading (actionable); threshold-based alerts fire on infrastructure metrics that may not affect users (noisy)' },
      { decision: 'Centralized vs per-service observability pipelines', reason: 'Centralized gives a unified view but creates a single point of failure; per-service is resilient but makes cross-service correlation harder' },
    ],
    antiPatterns: [
      'No SLOs defined — without an error budget, there is no objective way to decide when to invest in reliability vs ship features',
      'Monitoring infrastructure without monitoring user experience — CPU at 30% means nothing if p99 latency is 5 seconds',
      'No synthetic monitoring — relying solely on real user traffic means outages are detected by customers, not by the team',
      'Alert fatigue from noisy alerts on non-actionable metrics — every alert should have a clear runbook and remediation path',
    ],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SPRINT 2 CONCEPT MISSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  'how-reddit-works': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'cache' },
      { type: 'queue' },
      { type: 'cdn' },
      { type: 'monitoring' },
      { type: 'apigateway' },
    ],
    connections: [
      { from: 'client', to: 'cdn' },
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'Reddit\'s ranking algorithms (hot, best, controversial, top) are pre-computed and cached — sorting millions of posts in real-time per request is impossible at scale',
      'Vote counts use eventual consistency: Redis INCR for real-time display, periodic DB flush for persistence — strict consistency would bottleneck on viral posts',
      'Subreddit-level sharding isolates communities: each subreddit\'s posts and comments can live on different shards, preventing cross-community interference',
      'Comment trees are stored with materialized path or nested set model for efficient thread retrieval — recursive SQL queries are too slow for deep threads',
      'CDN serves user-uploaded media (images, gifs, video) to prevent origin overload during front-page traffic spikes',
    ],
    tradeoffs: [
      { decision: 'Pre-computed rankings vs real-time ranking', reason: 'Pre-computed rankings are O(1) reads from cache; real-time ranking is always fresh but requires sorting millions of posts per request' },
      { decision: 'Denormalized vote counts vs normalized', reason: 'Denormalized counts (stored on the post row) enable fast reads; normalized counts (separate votes table with COUNT) are accurate but expensive at scale' },
      { decision: 'Flat comment storage vs tree structure', reason: 'Flat with materialized paths enables efficient subtree queries; nested set is fast for reads but expensive for inserts in active threads' },
    ],
    antiPatterns: [
      'Computing rankings (hot sort) in real-time on every page load — at Reddit scale, this means sorting millions of posts per request',
      'Updating vote counts synchronously with strict consistency — a viral post receiving 10K votes/sec would bottleneck the database',
      'Storing media in the database — Reddit images and gifs should flow through object storage + CDN',
      'Using recursive SQL queries for deep comment threads — use materialized paths or closure tables for O(1) subtree retrieval',
    ],
  },

  'change-data-capture': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'storage' },
    ],
    connections: [
      { from: 'client', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'database', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'CDC reads the database\'s write-ahead log (WAL/binlog) to capture every INSERT, UPDATE, DELETE as an event — no application code changes required',
      'Debezium is the most popular CDC connector: it reads the Postgres WAL or MySQL binlog and publishes change events to Kafka with exactly-once semantics',
      'CDC enables real-time data synchronization between systems: primary DB → search index, data warehouse, cache invalidation — all from a single source of truth',
      'The outbox pattern combined with CDC guarantees atomic event publishing: write to an outbox table (same DB transaction), CDC captures and publishes the event',
    ],
    tradeoffs: [
      { decision: 'Log-based CDC vs trigger-based CDC', reason: 'Log-based (WAL) has zero overhead on the database but depends on DB replication features; trigger-based works everywhere but adds write overhead and complexity' },
      { decision: 'CDC vs application-level event publishing', reason: 'CDC captures all changes (including direct DB modifications) with no code changes; application events are more semantic but miss changes from migrations, scripts, or other services' },
      { decision: 'Full row snapshot vs delta changes', reason: 'Full snapshots are simpler for consumers (always have complete state) but generate more data; deltas are efficient but require consumers to maintain state' },
    ],
    antiPatterns: [
      'Polling the database for changes with SELECT ... WHERE updated_at > last_poll — misses deletes, has latency, and adds load to the DB',
      'Dual-write pattern (write to DB + publish event in application code) — if one fails, the systems diverge; use CDC or the outbox pattern instead',
      'Not monitoring CDC lag — if the CDC pipeline falls behind the WAL, events are silently delayed and downstream systems have stale data',
      'Using CDC for everything instead of direct event publishing — CDC is great for cross-system sync but lacks business context that application events provide',
    ],
  },

  'the-saga-pattern': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'A saga is a sequence of local transactions: each service completes its step and publishes an event; if any step fails, compensating transactions undo previous steps',
      'Choreography sagas use events: each service listens for events and decides what to do — simple but hard to track the overall flow',
      'Orchestration sagas use a central coordinator: the orchestrator tells each service what to do and handles failures — easier to understand but the orchestrator is a coupling point',
      'Compensating transactions must be idempotent: a compensation might be retried multiple times, so it must produce the same result regardless of how many times it runs',
    ],
    tradeoffs: [
      { decision: 'Choreography vs orchestration', reason: 'Choreography is decoupled and resilient but hard to debug and monitor; orchestration is centralized and visible but introduces a single coordinator that couples services' },
      { decision: 'Saga vs 2PC for distributed transactions', reason: 'Sagas use eventual consistency with compensations (high availability, no locking); 2PC provides strict atomicity but blocks resources during the protocol' },
      { decision: 'Semantic lock vs no lock during saga', reason: 'Semantic locks (marking resources as "pending") prevent conflicting operations during the saga but reduce concurrency; no locks risk conflicting updates' },
    ],
    antiPatterns: [
      'Not implementing compensating transactions — if step 3 of 5 fails, steps 1 and 2 are left in an inconsistent state with no way to undo',
      'Assuming compensations always succeed — compensations can fail too; they need retry logic and dead letter queues',
      'Choreography sagas without a way to observe the overall flow — debugging requires reading events across multiple service logs',
      'Mixing synchronous and asynchronous steps in a saga — async steps can complete out of order, violating saga step dependencies',
    ],
  },

  'secure-the-gates': {
    components: [
      { type: 'client' },
      { type: 'apigateway' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'database' },
      { from: 'apigateway', to: 'cache' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'API Gateway is the single enforcement point for authentication, rate limiting, and request validation — internal services trust the gateway\'s decisions',
      'JWT tokens for stateless authentication: the gateway validates the signature and extracts claims without a database roundtrip; refresh tokens enable token rotation',
      'Rate limiting at the gateway (token bucket per API key) prevents abuse and protects downstream services from traffic spikes',
      'OAuth 2.0 / OIDC for third-party access: authorization code flow for web apps, PKCE for mobile/SPA — never use the implicit flow',
    ],
    tradeoffs: [
      { decision: 'JWT vs opaque session tokens', reason: 'JWTs are stateless and fast to validate (no DB lookup) but cannot be revoked until expiry; opaque tokens require a lookup but can be revoked instantly' },
      { decision: 'Gateway-level auth vs service-level auth', reason: 'Gateway auth centralizes security logic (single enforcement point); service-level auth gives services control but duplicates auth logic across services' },
      { decision: 'Short-lived JWT vs long-lived with refresh', reason: 'Short-lived tokens (15min) limit damage from theft but require frequent refresh; long-lived tokens (hours) reduce refresh overhead but increase the window of compromise' },
    ],
    antiPatterns: [
      'Storing passwords in plain text or with weak hashing (MD5, SHA1) — use bcrypt, scrypt, or Argon2 with salt',
      'Validating JWTs without checking the signature algorithm — algorithm confusion attacks can forge tokens',
      'No rate limiting on authentication endpoints — brute-force attacks can try millions of password combinations',
      'Using the OAuth implicit flow for SPAs — access tokens are exposed in the URL fragment; use PKCE authorization code flow instead',
    ],
  },

  'the-file-converter': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'queue' },
      { type: 'storage' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'apigateway' },
      { type: 'loadbalancer' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'The upload path and conversion path are fully decoupled: upload returns a job ID; a queue worker picks up the job asynchronously and stores results in object storage',
      'Worker auto-scaling based on queue depth ensures cost-efficient resource usage: scale up during bursts, scale to zero during idle periods',
      'Poison message handling: files that crash the converter (corrupt, adversarial) must be moved to a dead letter queue after N retries, not retried forever',
      'Progress tracking via database status updates (pending → processing → completed → failed) gives clients visibility into job state without polling the worker',
    ],
    tradeoffs: [
      { decision: 'Pre-signed upload URL vs server proxy', reason: 'Pre-signed URLs let the client upload directly to storage (faster, cheaper); server proxy allows validation before storage but adds bandwidth cost and latency' },
      { decision: 'FIFO queue vs standard queue', reason: 'FIFO preserves upload order but has lower throughput; standard queue scales better but processes jobs out of order' },
      { decision: 'Synchronous status polling vs WebSocket push', reason: 'Polling is simple but has latency and wastes bandwidth; WebSocket push notifies instantly but adds connection management complexity' },
    ],
    antiPatterns: [
      'Converting files synchronously in the request handler — large files cause HTTP timeouts and block the server for other requests',
      'No file size or type validation before queuing — adversarial uploads (10GB files, executable binaries) waste queue and worker resources',
      'Infinite retries on failed jobs — a corrupt file will never convert; use a dead letter queue after 3 attempts',
      'Storing converted files only in the worker\'s local filesystem — files are lost if the worker crashes; always persist to object storage',
    ],
  },

  'bloom-filter-guardian': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'cache' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'queue' },
    ],
    connections: [
      { from: 'client', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'cache', to: 'database' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'A Bloom filter answers "is this element in the set?" with zero false negatives but a configurable false positive rate — it never says "yes" incorrectly as "no"',
      'Space efficiency: a Bloom filter for 1B elements at 1% false positive rate uses ~1.2GB — orders of magnitude less than storing the actual elements',
      'Bloom filters are used as a cache guard: check the filter before the DB — if "not in set," skip the DB query entirely; this prevents cache penetration attacks',
      'The filter cannot delete elements (standard variant) — adding a remove operation requires a Counting Bloom Filter (CBF) with integer counters instead of bits',
    ],
    tradeoffs: [
      { decision: 'Lower false positive rate vs memory usage', reason: 'Lower FP rate requires more bits per element (more memory); higher FP rate uses less memory but causes unnecessary DB queries on false positives' },
      { decision: 'Bloom filter vs hash set', reason: 'Hash sets have zero false positives but use 10–100x more memory; Bloom filters trade accuracy for dramatic space savings' },
      { decision: 'Standard Bloom vs Counting Bloom', reason: 'Standard uses 1 bit per hash position (smallest); Counting Bloom uses 4 bits per position (supports deletion) but uses 4x more memory' },
    ],
    antiPatterns: [
      'Using a Bloom filter where false positives cause correctness issues — Bloom filters should only be used for optimization (skip DB queries), not for correctness-critical decisions',
      'Not rebuilding the filter when it becomes too full — the false positive rate degrades as the fill ratio increases past 50%',
      'Using a hash set for billions of elements — memory consumption makes this impractical; a Bloom filter achieves the same negative-lookup guarantee in 1% of the space',
    ],
  },

  'db-replication-deep-dive': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'loadbalancer' },
      { type: 'queue' },
    ],
    connections: [
      { from: 'client', to: 'loadbalancer' },
      { from: 'loadbalancer', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'Primary-replica replication: all writes go to the primary; replicas receive a copy of the WAL/binlog and serve read traffic — scales reads horizontally',
      'Replication lag is the delay between a write on the primary and its appearance on the replica — reading from a replica immediately after a write may return stale data',
      'Synchronous replication guarantees zero data loss (replica confirms before commit) but adds latency; asynchronous replication is faster but risks losing the latest writes on primary failure',
      'Monitoring replication lag is critical: a replica that falls minutes behind is a time bomb — queries return stale data and failover would lose recent writes',
    ],
    tradeoffs: [
      { decision: 'Synchronous vs asynchronous replication', reason: 'Sync guarantees durability (no data loss on failover) but adds round-trip latency to every write; async is faster but may lose the last few seconds of writes on primary crash' },
      { decision: 'Single primary vs multi-primary', reason: 'Single primary simplifies conflict resolution (one writer); multi-primary allows writes in multiple regions but requires conflict detection and resolution' },
      { decision: 'Read from replica vs read from primary', reason: 'Replica reads scale horizontally but may be stale; primary reads are always fresh but don\'t scale and add load to the write path' },
    ],
    antiPatterns: [
      'Reading from replicas immediately after a write and expecting the latest data — replication lag causes read-your-writes inconsistency; route post-write reads to the primary',
      'No replication lag monitoring — a replica that falls hours behind silently serves stale data to users',
      'Using asynchronous replication for financial data — data loss on primary failure is unacceptable; use synchronous replication for critical data',
      'Promoting a replica to primary without checking lag — if the replica is behind, the promotion loses all uncommitted data',
    ],
  },

  'service-mesh-microservices': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'monitoring' },
      { type: 'cache' },
      { type: 'apigateway' },
      { type: 'queue' },
    ],
    connections: [
      { from: 'client', to: 'apigateway' },
      { from: 'apigateway', to: 'server' },
      { from: 'server', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'monitoring' },
      { from: 'server', to: 'queue' },
    ],
    keyInsights: [
      'A service mesh (Istio, Linkerd) moves cross-cutting concerns (mTLS, retries, circuit breaking, observability) from application code into sidecar proxies — services focus on business logic only',
      'mTLS between all services ensures encrypted, authenticated communication with zero application code changes — the sidecar proxy handles certificate rotation and TLS handshakes',
      'Traffic management (canary deployments, A/B testing, fault injection) is configured declaratively in the mesh control plane, not in application code',
      'Distributed tracing headers are automatically propagated by the sidecar proxies — every service-to-service call is captured in the trace without manual instrumentation',
    ],
    tradeoffs: [
      { decision: 'Service mesh vs library-based (Hystrix, resilience4j)', reason: 'Service mesh is language-agnostic and transparent; libraries are lighter but must be integrated into every service in the correct language' },
      { decision: 'Sidecar proxy vs proxyless mesh', reason: 'Sidecar proxy is transparent but adds ~1ms latency per hop and consumes memory; proxyless (gRPC native) is faster but requires language-specific integration' },
      { decision: 'Mesh for all traffic vs critical paths only', reason: 'Full mesh gives universal observability and security; selective mesh reduces overhead but creates gaps in visibility and security coverage' },
    ],
    antiPatterns: [
      'Implementing retries, circuit breakers, and mTLS independently in every microservice — this is exactly what a service mesh solves; avoid duplicating infrastructure concerns in application code',
      'Adding a service mesh to a monolith — the overhead is not justified; service meshes shine in 10+ service architectures',
      'Not monitoring sidecar proxy resource usage — each sidecar consumes CPU and memory; at 100 services, the overhead is significant',
      'Skipping mTLS in internal networks — internal traffic is not inherently trusted; lateral movement attacks exploit unencrypted service-to-service communication',
    ],
  },

  'cqrs-event-sourcing': {
    components: [
      { type: 'client' },
      { type: 'server' },
      { type: 'database' },
      { type: 'queue' },
      { type: 'cache' },
      { type: 'monitoring' },
      { type: 'storage' },
    ],
    connections: [
      { from: 'client', to: 'server' },
      { from: 'server', to: 'database' },
      { from: 'server', to: 'queue' },
      { from: 'queue', to: 'server' },
      { from: 'server', to: 'cache' },
      { from: 'server', to: 'storage' },
      { from: 'server', to: 'monitoring' },
    ],
    keyInsights: [
      'CQRS separates the write model (commands that change state) from the read model (queries that return data) — each can be optimized independently with different schemas and databases',
      'Event sourcing stores state as a sequence of immutable events, not as the current snapshot — replaying all events reconstructs any historical state at any point in time',
      'The read model is a projection: it subscribes to events and builds a denormalized view optimized for specific queries — rebuilding a projection from scratch is always possible by replaying the event log',
      'Eventual consistency between write and read models: after a command is processed, there is a delay before the read model reflects the change — the UI must handle this gracefully',
    ],
    tradeoffs: [
      { decision: 'CQRS vs shared model', reason: 'CQRS enables independent scaling and optimization of reads and writes; shared model is simpler but couples read and write performance characteristics' },
      { decision: 'Event sourcing vs CRUD + audit log', reason: 'Event sourcing provides complete history and temporal queries; CRUD with audit logging is simpler but the audit log is separate from the truth and can diverge' },
      { decision: 'Synchronous vs async projection updates', reason: 'Synchronous projection updates are immediately consistent but slow writes; async is faster but introduces read model staleness' },
    ],
    antiPatterns: [
      'Applying CQRS to a simple CRUD application — the overhead of separate models is not justified when reads and writes have similar patterns',
      'Not handling eventual consistency in the UI — after a command, the read model may not have the update yet; implement optimistic UI or confirmation polling',
      'Event schemas without versioning — events are immutable; schema changes require versioned event types and upcasters for old events',
      'Storing only snapshots without the event log — loses the ability to replay events, debug historical state, and rebuild projections',
    ],
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main — upsert referenceSolution for each mission
// ─────────────────────────────────────────────────────────────────────────────

async function main() {
  console.log('🔧  Seeding reference solutions for Compare panel…\n');

  const slugs = Object.keys(REFERENCE_SOLUTIONS);
  let updated = 0;
  let skipped = 0;

  for (const slug of slugs) {
    const mission = await prisma.mission.findUnique({ where: { slug } });
    if (!mission) {
      console.log(`  ⏭  ${slug} — mission not found in DB, skipping`);
      skipped++;
      continue;
    }

    await prisma.mission.update({
      where: { slug },
      data: { referenceSolution: JSON.stringify(REFERENCE_SOLUTIONS[slug]) },
    });

    const solution = REFERENCE_SOLUTIONS[slug];
    console.log(
      `  ✅  ${slug.padEnd(38)} ${solution.components.length} components, ` +
      `${solution.connections.length} connections, ${solution.keyInsights.length} insights`,
    );
    updated++;
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔧  REFERENCE SOLUTIONS SEED COMPLETE

  Updated: ${updated} missions
  Skipped: ${skipped} missions (not found in DB — run seed.ts first)
  Total:   ${slugs.length} reference solutions defined
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
