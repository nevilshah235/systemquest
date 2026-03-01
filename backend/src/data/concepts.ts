// Concept taxonomy for the On-Demand Concept Advisor (F-001) and Mistake Patterns (F-003)
// Each concept is tagged with the missions where it appears and the skill level.

export interface Concept {
  slug: string;
  title: string;
  summary: string;
  deepDive: string;
  emoji: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Mission slugs where this concept is tested */
  relatedMissions: string[];
  /** Learning path slugs this concept belongs to */
  relatedPaths: string[];
  resourceUrl?: string;
}

export const CONCEPTS: Concept[] = [
  // ── Beginner ──────────────────────────────────────────────────────────────────────
  {
    slug: 'client-server-model',
    title: 'Client-Server Model',
    summary: 'The fundamental pattern where clients request resources and servers respond.',
    deepDive: 'Every web application is built on the client-server model. The client (browser/mobile app) sends HTTP requests; the server processes them and returns responses. Understanding this is the foundation of all system design.',
    emoji: '🖥️',
    difficulty: 'beginner',
    relatedMissions: ['mvp-launch', 'scaling-up'],
    relatedPaths: ['foundations'],
  },
  {
    slug: 'load-balancing',
    title: 'Load Balancing',
    summary: 'Distributing incoming traffic across multiple servers to prevent overload.',
    deepDive: 'A load balancer sits in front of your server pool and distributes requests using algorithms like round-robin, least-connections, or IP-hash. It eliminates single points of failure and allows horizontal scaling. Layer 4 (TCP) vs Layer 7 (HTTP) load balancers serve different use cases.',
    emoji: '⚖️',
    difficulty: 'beginner',
    relatedMissions: ['mvp-launch', 'scaling-up', 'global-expansion'],
    relatedPaths: ['foundations'],
  },
  {
    slug: 'database-fundamentals',
    title: 'Database Fundamentals',
    summary: 'SQL vs NoSQL, ACID transactions, and when to use each type.',
    deepDive: 'Relational databases (PostgreSQL, MySQL) give you ACID guarantees and rich query capabilities. NoSQL databases (MongoDB, DynamoDB) trade some consistency for higher write throughput and horizontal scalability. Choosing the right database is one of the most impactful system design decisions.',
    emoji: '🗄️',
    difficulty: 'beginner',
    relatedMissions: ['mvp-launch', 'scaling-up', 'booking-system'],
    relatedPaths: ['foundations', 'consistency'],
  },
  {
    slug: 'caching-strategies',
    title: 'Caching Strategies',
    summary: 'Cache-aside, write-through, write-behind patterns and TTL management.',
    deepDive: 'Cache-aside (lazy loading): application checks cache first, on miss reads DB and populates cache. Write-through: writes go to both cache and DB synchronously. Write-behind (write-back): writes go to cache first, DB is updated asynchronously. Each trade-off between consistency, complexity, and performance.',
    emoji: '⚡',
    difficulty: 'beginner',
    relatedMissions: ['scaling-up', 'url-shortener', 'social-feed'],
    relatedPaths: ['foundations', 'high-read'],
  },
  {
    slug: 'cdn-basics',
    title: 'Content Delivery Networks',
    summary: 'Serving static assets from edge nodes close to users globally.',
    deepDive: 'A CDN caches your static assets (JS, CSS, images, video) at edge nodes around the world. Requests are routed to the nearest PoP (Point of Presence), dramatically reducing latency. CDN also absorbs traffic spikes and protects origin servers from direct load.',
    emoji: '🌐',
    difficulty: 'beginner',
    relatedMissions: ['global-expansion', 'video-streaming', 'social-feed'],
    relatedPaths: ['foundations', 'scale-streaming'],
  },
  // ── Sprint 2 Beginner ──────────────────────────────────────────────────────────────
  {
    slug: 'stateful-vs-stateless',
    title: 'Stateful vs Stateless Services',
    summary: 'How session state placement determines scalability and deployment flexibility.',
    deepDive: 'Stateless services hold no per-request memory between calls — all state is externalised to a database or cache. Any server can handle any request, making horizontal scaling trivial. Stateful services (e.g., WebSocket servers, game servers) maintain per-client state in memory — load balancers must use sticky sessions or consistent hashing. Best practice: make services stateless wherever possible; externalise session state to Redis with TTL so any server can serve returning users.',
    emoji: '🔄',
    difficulty: 'beginner',
    relatedMissions: ['secure-the-gates', 'mvp-launch'],
    relatedPaths: ['foundations'],
  },
  {
    slug: 'spof-availability',
    title: 'Single Point of Failure (SPOF) & High Availability',
    summary: 'Eliminating single points of failure through redundancy, load balancing, and failover.',
    deepDive: 'A SPOF is any component whose failure causes the entire system to go down. Common SPOFs: single app server, single database, single load balancer, single AZ deployment. Elimination strategies: load balancer in front of server pools, database primary-replica with automatic failover, multi-AZ deployments, global traffic managers. Availability SLAs: 99.9% = 8.7h downtime/year, 99.99% = 52 min/year, 99.999% = 5 min/year.',
    emoji: '🛡️',
    difficulty: 'beginner',
    relatedMissions: ['mvp-launch', 'scaling-up', 'secure-the-gates'],
    relatedPaths: ['foundations'],
  },
  // ── Intermediate ──────────────────────────────────────────────────────────────────
  {
    slug: 'message-queues',
    title: 'Message Queues & Pub/Sub',
    summary: 'Decoupling services with async messaging for resilient, scalable pipelines.',
    deepDive: 'Message queues (RabbitMQ, SQS) decouple producers from consumers. The producer sends a message and continues — the consumer processes it asynchronously. Pub/Sub (Kafka, SNS) extends this to fan-out: one message delivered to many consumers. Critical for async processing, event-driven architectures, and peak load absorption.',
    emoji: '📋',
    difficulty: 'intermediate',
    relatedMissions: ['file-converter', 'code-judge', 'live-scoreboard', 'how-reddit-works'],
    relatedPaths: ['async-queues', 'real-time'],
  },
  {
    slug: 'cap-theorem',
    title: 'CAP Theorem',
    summary: 'Consistency, Availability, Partition Tolerance — you can only pick two.',
    deepDive: 'In a distributed system that can experience network partitions, you must choose between Consistency (every read returns the latest write) and Availability (every request gets a response). CP systems (HBase, ZooKeeper) prioritize consistency. AP systems (Cassandra, DynamoDB) prioritize availability. Understanding this guides database and replication decisions.',
    emoji: '🔺',
    difficulty: 'intermediate',
    relatedMissions: ['booking-system', 'payment-processing', 'search-engine', 'db-replication-deep-dive'],
    relatedPaths: ['consistency', 'high-read'],
  },
  {
    slug: 'database-sharding',
    title: 'Database Sharding',
    summary: 'Horizontally partitioning data across multiple database nodes.',
    deepDive: 'Sharding splits your data across multiple database instances. Horizontal sharding by user_id, geographic region, or hash key lets you scale writes and storage beyond a single node. Key challenges: cross-shard queries, rebalancing when adding shards, and hotspot keys that land on a single shard.',
    emoji: '🔀',
    difficulty: 'intermediate',
    relatedMissions: ['social-feed', 'url-shortener', 'search-engine', 'how-reddit-works'],
    relatedPaths: ['high-read', 'scale-streaming'],
  },
  {
    slug: 'api-gateway-pattern',
    title: 'API Gateway Pattern',
    summary: 'Centralizing auth, rate limiting, routing, and protocol translation.',
    deepDive: 'An API Gateway is the single entry point for all client requests. It handles cross-cutting concerns: authentication, rate limiting, request routing, protocol translation (REST→gRPC), SSL termination, and response caching. Examples: AWS API Gateway, Kong, NGINX. Eliminates the need to implement these in every microservice.',
    emoji: '🔀',
    difficulty: 'intermediate',
    relatedMissions: ['file-converter', 'ride-hailing', 'booking-system', 'secure-the-gates'],
    relatedPaths: ['foundations', 'real-time'],
  },
  {
    slug: 'read-replicas',
    title: 'Read Replicas & CQRS',
    summary: 'Scaling read throughput by separating read and write paths.',
    deepDive: 'Read replicas are copies of your primary database that can serve read queries. This scales read throughput linearly. CQRS (Command Query Responsibility Segregation) formalizes this: write commands go to the primary, read queries go to optimized read models. Eventual consistency between primary and replicas is the key trade-off.',
    emoji: '📖',
    difficulty: 'intermediate',
    relatedMissions: ['scaling-up', 'url-shortener', 'social-feed', 'db-replication-deep-dive'],
    relatedPaths: ['foundations', 'high-read'],
  },
  {
    slug: 'websockets-sse',
    title: 'WebSockets & Server-Sent Events',
    summary: 'Real-time bidirectional and server-push communication protocols.',
    deepDive: 'HTTP is request-response. WebSockets provide a persistent bidirectional channel — server can push data without client polling. SSE (Server-Sent Events) is unidirectional server-push over HTTP. WebSockets are ideal for chat and live collaboration; SSE is simpler for dashboards and live feeds.',
    emoji: '📡',
    difficulty: 'intermediate',
    relatedMissions: ['live-scoreboard', 'ride-hailing'],
    relatedPaths: ['real-time'],
  },
  {
    slug: 'consistent-hashing',
    title: 'Consistent Hashing',
    summary: 'Distributing data across nodes while minimising redistribution on scale events.',
    deepDive: 'Consistent hashing maps both data keys and servers onto a circular hash ring. When a server is added/removed, only keys on the adjacent arc are remapped — not the entire dataset. This minimises cache invalidation and data movement during cluster rescaling. Used by Redis Cluster, Cassandra, and DynamoDB.',
    emoji: '🔄',
    difficulty: 'intermediate',
    relatedMissions: ['url-shortener', 'social-feed', 'how-amazon-s3-works'],
    relatedPaths: ['high-read', 'scale-streaming'],
  },
  {
    slug: 'rate-limiting',
    title: 'Rate Limiting Algorithms',
    summary: 'Token bucket, sliding window, and leaky bucket algorithms for traffic control.',
    deepDive: 'Token bucket: replenishes at a fixed rate, allows bursts up to bucket capacity. Sliding window counter: tracks requests in a rolling time window, smooth limiting. Leaky bucket: output is constant regardless of input rate, absorbs bursts. Fixed window: simple but allows 2x the rate at window boundaries. Distributed rate limiters use Redis atomic operations.',
    emoji: '🚦',
    difficulty: 'intermediate',
    relatedMissions: ['url-shortener', 'booking-system', 'secure-the-gates'],
    relatedPaths: ['high-read', 'consistency'],
  },
  {
    slug: 'object-storage',
    title: 'Object Storage & Blob Design',
    summary: 'S3-compatible storage for large binary files at petabyte scale.',
    deepDive: 'Object storage (S3, GCS, Azure Blob) stores arbitrary-size files as immutable objects with metadata. Unlike block storage, objects have globally unique keys (bucket/key). Designed for high durability (11 9s), not low latency. Lifecycle policies move cold data to cheaper tiers. Pre-signed URLs allow secure direct uploads/downloads without proxying through your server.',
    emoji: '💾',
    difficulty: 'intermediate',
    relatedMissions: ['file-converter', 'video-streaming', 'social-feed', 'how-amazon-s3-works'],
    relatedPaths: ['async-queues', 'scale-streaming'],
  },
  {
    slug: 'monitoring-observability',
    title: 'Monitoring & Observability',
    summary: 'Metrics, logs, and traces — the three pillars of production visibility.',
    deepDive: 'Metrics (Prometheus, CloudWatch): numeric measurements over time — latency, error rate, throughput. Logs (ELK, CloudWatch Logs): timestamped event records with context. Traces (Jaeger, X-Ray): follow a request across multiple services. Alerting fires when metrics breach SLO thresholds. SLI/SLO/SLA: define what you measure, what you promise, and what consequences exist.',
    emoji: '📊',
    difficulty: 'beginner',
    relatedMissions: ['scaling-up', 'payment-processing', 'ride-hailing'],
    relatedPaths: ['foundations'],
  },
  // ── Sprint 2 Intermediate ───────────────────────────────────────────────────────────
  {
    slug: 'bloom-filters',
    title: 'Bloom Filters',
    summary: 'Space-efficient probabilistic data structure for membership testing with zero false negatives.',
    deepDive: 'A Bloom filter answers "is X in the set?" with zero false negatives but a tunable false positive rate. It uses k hash functions and a bit array. Adding an element sets k bits; checking tests those k bits. Memory-efficient: a 10M-element filter with 1% false positive rate needs only ~12 MB. Used in: Google Chrome (malicious URL checking), Cassandra (SSTable membership), database query optimisation, and spam detection to avoid DB lookups for known-bad inputs.',
    emoji: '🌸',
    difficulty: 'intermediate',
    relatedMissions: ['bloom-filter-guardian'],
    relatedPaths: ['high-read'],
  },
  {
    slug: 'cqrs-pattern',
    title: 'CQRS (Command Query Responsibility Segregation)',
    summary: 'Separating write models (commands) and read models (queries) for independent scaling.',
    deepDive: 'CQRS splits an application into two paths. Commands (writes) go to the write model — normalised, consistent, ACID. Queries (reads) go to a separate read model — denormalised, optimised for query patterns, eventually consistent. Read models are updated asynchronously via events. This allows independent scaling (reads are usually 10x writes), different storage technologies, and optimised projections per use case.',
    emoji: '⚡',
    difficulty: 'intermediate',
    relatedMissions: ['cqrs-event-sourcing', 'db-replication-deep-dive'],
    relatedPaths: ['consistency', 'scale-streaming'],
  },
  {
    slug: 'webhooks',
    title: 'Webhooks & Reliable Event Delivery',
    summary: 'Outbound HTTP callbacks for event-driven integrations with retry and idempotency guarantees.',
    deepDive: 'A webhook is an HTTP POST sent to a subscriber\'s endpoint when an event occurs. Unlike polling, webhooks push data immediately. Key design concerns: delivery guarantees (at-least-once via retry queue), idempotency keys (consumers must handle duplicates), exponential backoff (don\'t hammer failing subscribers), event ordering (sequence numbers), and signature verification (HMAC-SHA256 to authenticate payloads). Stripe\'s webhook infrastructure delivers billions of events daily with 3-day retry windows.',
    emoji: '🪝',
    difficulty: 'intermediate',
    relatedMissions: [],
    relatedPaths: ['async-queues'],
  },
  // ── Advanced ───────────────────────────────────────────────────────────────────
  {
    slug: 'distributed-locking',
    title: 'Distributed Locking',
    summary: 'Coordinating exclusive access to shared resources across distributed processes.',
    deepDive: 'Distributed locks prevent race conditions when multiple service instances compete for the same resource. Redis SETNX with expiry (Redlock algorithm) is common. ZooKeeper ephemeral nodes provide stronger guarantees. Key concerns: lock expiry (what if the holder crashes?), fencing tokens to prevent stale lock holders from causing damage.',
    emoji: '🔐',
    difficulty: 'advanced',
    relatedMissions: ['booking-system', 'payment-processing'],
    relatedPaths: ['consistency'],
  },
  {
    slug: 'idempotency',
    title: 'Idempotency & Exactly-Once Processing',
    summary: 'Ensuring operations produce the same result regardless of retry count.',
    deepDive: 'Idempotency keys prevent duplicate operations under retries. The client sends a unique key with each request; the server checks if it was already processed and returns the cached result. Critical for payments (no double-charges), messaging (no duplicate sends), and any operation with side effects. Idempotency keys are stored with TTL in cache or DB.',
    emoji: '🎯',
    difficulty: 'advanced',
    relatedMissions: ['payment-processing', 'the-saga-pattern'],
    relatedPaths: ['consistency'],
  },
  {
    slug: 'event-driven-architecture',
    title: 'Event-Driven Architecture',
    summary: 'Decoupling services through events for scalable, resilient systems.',
    deepDive: 'In event-driven systems, services communicate by publishing and consuming events. The event broker (Kafka, EventBridge) guarantees ordering, replay, and delivery. Event sourcing stores state as a sequence of events rather than current state. CQRS pairs naturally with event sourcing. This pattern underpins most large-scale microservice architectures.',
    emoji: '⚡',
    difficulty: 'advanced',
    relatedMissions: ['social-feed', 'ride-hailing', 'live-scoreboard', 'change-data-capture'],
    relatedPaths: ['async-queues', 'real-time', 'scale-streaming'],
  },
  {
    slug: 'fan-out-patterns',
    title: 'Fan-Out Patterns',
    summary: 'Push vs pull strategies for delivering content to large follower graphs.',
    deepDive: 'Fan-out on write: when a celebrity posts, immediately push to all follower timelines in cache. Fast reads, expensive writes. Fan-out on read: compute the timeline on-demand by merging followed users\' posts. Cheap writes, slower reads. Hybrid: fan-out on write for regular users, fan-out on read for mega-celebrities (>1M followers). Twitter uses this hybrid.',
    emoji: '📢',
    difficulty: 'advanced',
    relatedMissions: ['social-feed'],
    relatedPaths: ['scale-streaming'],
  },
  {
    slug: 'video-transcoding',
    title: 'Video Transcoding Pipelines',
    summary: 'Async multi-resolution encoding and adaptive bitrate delivery at scale.',
    deepDive: 'Raw video uploads are processed through a transcoding pipeline that produces multiple formats (HLS, DASH) and resolutions (360p→4K). Workers pull jobs from a queue, encode in parallel, and store outputs in object storage. CDN distributes the final segments. Adaptive Bitrate Streaming (ABR) lets clients switch quality based on bandwidth.',
    emoji: '🎬',
    difficulty: 'advanced',
    relatedMissions: ['video-streaming'],
    relatedPaths: ['scale-streaming', 'async-queues'],
  },
  {
    slug: 'geo-sharding',
    title: 'Geo-Spatial Indexing & Sharding',
    summary: 'Partitioning and querying data by geographic coordinates efficiently.',
    deepDive: 'Ride-hailing and maps require fast proximity queries ("find all drivers within 2km"). Geohashing divides the Earth into a grid of cells; drivers in the same cell share a geohash prefix. Cache stores live driver locations indexed by geohash. Quadtrees partition 2D space recursively for efficient range queries. Redis GEOADD/GEORADIUS implements this natively.',
    emoji: '🗺️',
    difficulty: 'advanced',
    relatedMissions: ['ride-hailing'],
    relatedPaths: ['real-time'],
  },
  {
    slug: 'two-phase-commit',
    title: 'Distributed Transactions (2PC & Saga)',
    summary: 'Coordinating atomic operations across multiple distributed services.',
    deepDive: 'Two-Phase Commit (2PC) ensures all-or-nothing writes across services via a coordinator. It blocks on failures. Saga pattern breaks a distributed transaction into local transactions with compensating rollback events. Saga is preferred in microservices for its higher availability. Critical for order systems, payment flows, and booking confirmations.',
    emoji: '🤝',
    difficulty: 'advanced',
    relatedMissions: ['payment-processing', 'booking-system', 'the-saga-pattern'],
    relatedPaths: ['consistency'],
  },
  {
    slug: 'search-indexing',
    title: 'Search & Inverted Indexes',
    summary: 'How full-text search engines index and rank documents at scale.',
    deepDive: 'An inverted index maps terms to the list of documents containing them. Building and updating this index is write-intensive; querying is fast. Relevance ranking (TF-IDF, BM25) scores documents by term frequency and inverse document frequency. Elasticsearch and Solr abstract this. Distributed search shards the index across nodes for scale.',
    emoji: '🔍',
    difficulty: 'advanced',
    relatedMissions: ['search-engine'],
    relatedPaths: ['high-read'],
  },
  {
    slug: 'microservices-patterns',
    title: 'Microservices Patterns',
    summary: 'Service mesh, circuit breaker, bulkhead — resilience patterns for distributed systems.',
    deepDive: 'Circuit breaker: stop calling a failing service and return a fallback, preventing cascading failures. Bulkhead: isolate services so one failure doesn\'t drain shared resources. Retry with exponential backoff: handle transient failures gracefully. Service mesh (Istio, Linkerd): handles retries, circuit breaking, mTLS at the infrastructure layer.',
    emoji: '🔧',
    difficulty: 'advanced',
    relatedMissions: ['global-expansion', 'payment-processing', 'service-mesh-microservices'],
    relatedPaths: ['consistency', 'scale-streaming'],
  },
  // ── Sprint 2 Advanced ──────────────────────────────────────────────────────────────
  {
    slug: 'cdc',
    title: 'Change Data Capture (CDC)',
    summary: 'Streaming database changes to downstream systems in real time via transaction log tailing.',
    deepDive: 'CDC captures every INSERT, UPDATE, and DELETE from a database\'s transaction log (binlog in MySQL, WAL in PostgreSQL) without polling. Debezium is the most popular CDC connector, streaming changes to Kafka topics. Consumers (search index, analytics, cache invalidation) react within milliseconds. Unlike polling, CDC has zero read load on the source DB and guarantees event ordering within a partition.',
    emoji: '🔄',
    difficulty: 'advanced',
    relatedMissions: ['change-data-capture', 'db-replication-deep-dive', 'cqrs-event-sourcing'],
    relatedPaths: ['consistency'],
  },
  {
    slug: 'saga-pattern',
    title: 'The Saga Pattern',
    summary: 'Coordinating multi-step distributed transactions with compensating rollback actions.',
    deepDive: 'A Saga breaks a distributed transaction into a sequence of local transactions. Each service publishes an event; the next service reacts. If any step fails, compensating transactions undo previous steps (e.g., cancel payment if inventory reservation fails). Two variants: Choreography (event-driven, no coordinator) and Orchestration (central saga orchestrator commands each step). Sagas trade atomicity for availability.',
    emoji: '📜',
    difficulty: 'advanced',
    relatedMissions: ['the-saga-pattern', 'payment-processing'],
    relatedPaths: ['consistency'],
  },
  {
    slug: 'service-mesh',
    title: 'Service Mesh',
    summary: 'Infrastructure layer handling service-to-service communication — mTLS, retries, circuit breaking.',
    deepDive: 'A service mesh (Istio, Linkerd, Consul Connect) deploys a sidecar proxy (Envoy) next to every service instance. All inter-service traffic flows through the sidecar, enabling: mutual TLS encryption, retry policies, circuit breaking, load balancing, distributed tracing, and canary traffic shifting — all without changing application code. The control plane (Istiod) distributes configuration centrally.',
    emoji: '🕸️',
    difficulty: 'advanced',
    relatedMissions: ['service-mesh-microservices'],
    relatedPaths: ['scale-streaming'],
  },
  {
    slug: 'event-sourcing',
    title: 'Event Sourcing',
    summary: 'Storing state as an immutable sequence of events rather than current state.',
    deepDive: 'Event sourcing persists every state change as an immutable event (e.g., OrderPlaced, PaymentProcessed, ItemShipped). Current state is derived by replaying the event log. Benefits: perfect audit trail, time-travel debugging, replay to rebuild projections, easy CQRS integration. Event store (EventStoreDB, Kafka) is the source of truth. Snapshots reduce replay time for long event streams. Essential for banking, healthcare, and compliance-heavy systems.',
    emoji: '📋',
    difficulty: 'advanced',
    relatedMissions: ['cqrs-event-sourcing', 'change-data-capture'],
    relatedPaths: ['consistency', 'scale-streaming'],
  },
  {
    slug: 'consensus-algorithms',
    title: 'Consensus Algorithms (Raft & Paxos)',
    summary: 'How distributed nodes agree on a single value despite network failures and message delays.',
    deepDive: 'Consensus ensures all nodes agree on a log of values even when nodes fail. Paxos is theoretically proven but hard to implement. Raft is designed for understandability: one leader per term is elected, replicates log entries to a majority quorum before committing. Used in etcd (Kubernetes), ZooKeeper, CockroachDB, and Consul. CAP theorem: consensus systems are CP — they sacrifice availability during network partitions to guarantee consistency.',
    emoji: '🗳️',
    difficulty: 'advanced',
    relatedMissions: [],
    relatedPaths: ['consistency'],
  },
];

/** Returns concepts sorted by relevance to the missions the user is struggling with */
export function rankConceptsByGap(
  weakMissionSlugs: string[],
  notAttemptedSlugs: string[],
): Concept[] {
  const score = new Map<string, number>();
  for (const concept of CONCEPTS) {
    let s = 0;
    for (const slug of weakMissionSlugs)    { if (concept.relatedMissions.includes(slug)) s += 2; }
    for (const slug of notAttemptedSlugs)   { if (concept.relatedMissions.includes(slug)) s += 1; }
    if (s > 0) score.set(concept.slug, s);
  }
  return CONCEPTS
    .filter((c) => score.has(c.slug))
    .sort((a, b) => (score.get(b.slug) ?? 0) - (score.get(a.slug) ?? 0));
}

/** Starter concepts for brand-new users with no attempt history */
export const STARTER_CONCEPTS: Concept[] = CONCEPTS.filter(
  (c) => c.difficulty === 'beginner' && c.relatedPaths.includes('foundations'),
);
