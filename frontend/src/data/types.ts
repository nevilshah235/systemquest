// Shared TypeScript types across the frontend

export interface User {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  skillLevel: string;
  derivedSkillLevel?: string;
}

export interface Mission {
  id: string;
  slug: string;
  title: string;
  difficulty: number;
  estimatedTime: string;
  xpReward: number;
  order: number;
  description: string;
  scenario: string;
  objectives: string[];
  requirements: MissionRequirements;
  components: MissionComponents;
  feedbackData: FeedbackData;
  learningPath: string;
  skillLevel: string;
  isLocked?: boolean;
  lockReason?: string | null;
  userProgress?: UserMissionProgress;
  savedArchitecture?: Architecture | null;
  referenceSolution?: Architecture | null;
}

export interface MissionRequirements {
  traffic: { concurrent: number; daily: number };
  performance: { latencyMs: number; availability: number };
  budget: number;
  growth: string;
  required: ComponentType[];
  bonus: BonusComponent[];
}

export interface BonusComponent {
  component: ComponentType;
  xp: number;
  label: string;
}

export interface MissionComponents {
  available: ComponentType[];
  required: ComponentType[];
  hints: string[];
  /** Per-block "why" descriptions shown in palette popover for mission-specific blocks */
  missionContext?: Partial<Record<ComponentType, string>>;
}

export interface FeedbackData {
  learned: string[];
  nextMission: string | null;
  nextPreview: string;
}

export interface UserMissionProgress {
  completed: boolean;
  bestScore: number | null;
  xpEarned: number | null;
  attempts: number;
}

// ── Building Block Taxonomy ───────────────────────────────────────────────────
// Core: always available. Domain: mission-relevant. Specialized: mission-specific.

export type ComponentType =
  // Core tier
  | 'web-client'
  | 'mobile-client'
  | 'dns'
  | 'load-balancer-l7'
  | 'api-gateway'
  | 'app-server'
  | 'relational-db'
  | 'logging-service'
  // Domain tier — Data
  | 'document-db'
  | 'wide-column-store'
  | 'key-value-store'
  | 'graph-db'
  | 'time-series-db'
  | 'search-engine'
  | 'vector-db'
  // Domain tier — Caching, Messaging, Storage, Compute, Real-time, Networking
  | 'redis-cache'
  | 'cdn'
  | 'message-queue'
  | 'event-stream'
  | 'pub-sub'
  | 'object-storage'
  | 'block-storage'
  | 'worker'
  | 'serverless-function'
  | 'scheduler'
  | 'websocket-server'
  | 'load-balancer-l4'
  | 'reverse-proxy'
  // Specialized tier
  | 'ml-inference-engine'
  | 'geospatial-index'
  | 'transcoder'
  | 'rate-limiter'
  | 'auth-service'
  | 'notification-hub'
  | 'consensus-service'
  | 'service-mesh'
  | 'circuit-breaker'
  | 'config-service'
  | 'metrics-collector'
  | 'distributed-tracing'
  // Legacy aliases (deprecated, for backward compat with solutions data)
  | 'client'
  | 'loadbalancer'
  | 'server'
  | 'database'
  | 'cache'
  | 'queue'
  | 'storage'
  | 'monitoring'
  | 'apigateway';

/** Maps legacy component types to new types for backward compatibility when loading saved architectures */
export const LEGACY_TYPE_MAP: Record<string, ComponentType> = {
  client: 'web-client',
  loadbalancer: 'load-balancer-l7',
  server: 'app-server',
  database: 'relational-db',
  cache: 'redis-cache',
  queue: 'message-queue',
  storage: 'object-storage',
  monitoring: 'logging-service',
  apigateway: 'api-gateway',
  cdn: 'cdn',
};

export function migrateComponentType(type: string): ComponentType {
  return (LEGACY_TYPE_MAP[type] as ComponentType) ?? (type as ComponentType);
}

/** Safe lookup for meta; resolves legacy types automatically */
export function getComponentMeta(type: string): (typeof COMPONENT_META)[ComponentType] {
  const resolved = migrateComponentType(type);
  return COMPONENT_META[resolved];
}

/** Safe lookup for cost; resolves legacy types automatically */
export function getComponentCost(type: string): number {
  const resolved = migrateComponentType(type);
  return COMPONENT_COSTS[resolved] ?? 0;
}

export interface ArchitectureComponent {
  id: string;
  type: ComponentType;
  x: number;
  y: number;
  label?: string;
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  label?: string;
}

export interface Architecture {
  components: ArchitectureComponent[];
  connections: Connection[];
}

export interface SimulationMetrics {
  latencyMs: number;
  availability: number;
  throughput: number;
  monthlyCost: number;
  score: number;
  xpEarned: number;
  bonusXp: number;
  feedback: FeedbackItem[];
  achievements: string[];
  allMetricsMet?: boolean;
}

export interface SimulationResult {
  metrics: SimulationMetrics;
  missionTitle: string;
  skillPromotion: {
    promoted: boolean;
    newLevel: string;
    derivedSkillLevel: string;
  } | null;
}

export interface FeedbackItem {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export interface Progress {
  xp: number;
  level: number;
  xpToNextLevel: number;
  xpThisLevel: number;
  xpForLevel: number;
  completedMissions: CompletedMission[];
  achievements: UserAchievement[];
}

export interface CompletedMission {
  missionSlug: string;
  missionTitle: string;
  score: number;
  xpEarned: number;
  completedAt: string;
}

export interface UserAchievement {
  slug: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
}

// ── Sprint 2: Spaced Repetition (F-005) ──────────────────────────────────────────

export interface ReviewQueueItem {
  id: string;
  missionSlug: string;
  missionTitle: string;
  missionPath: string;
  lastScore: number;
  interval: number;
  dueAt: string;
  snoozeCount: number;
  isDue?: boolean;
}

// ── Sprint 2: Mistake Patterns (F-003) ────────────────────────────────────────

export type PatternDimension =
  | 'scalability'
  | 'consistency'
  | 'reliability'
  | 'api-design'
  | 'data-modelling';

export interface MistakePattern {
  id: string;
  dimension: PatternDimension;
  patternSlug: string;
  patternName: string;
  frequency: number;
  /** Mission slugs where this pattern was detected */
  affectedMissions: string[];
  conceptSlug: string | null;
  isResolved: boolean;
  lastSeenAt: string;
  createdAt: string;
}

// ── Learning Path metadata ────────────────────────────────────────────────────────

export interface LearningPathMeta {
  slug: string;
  title: string;
  icon: string;
  description: string;
  colorClass: string;
  order: number;
  skillLabel: string;
}

export const LEARNING_PATHS: Record<string, LearningPathMeta> = {
  'foundations': {
    slug: 'foundations',
    title: 'Foundations',
    icon: '🏗️',
    description: 'Core concepts every system designer must master',
    colorClass: 'border-blue-500/40 bg-blue-500/5',
    order: 0,
    skillLabel: 'Beginner',
  },
  'async-queues': {
    slug: 'async-queues',
    title: 'Async & Queues',
    icon: '⚡',
    description: 'Decouple processing with message queues and workers',
    colorClass: 'border-orange-500/40 bg-orange-500/5',
    order: 1,
    skillLabel: 'Intermediate',
  },
  'high-read': {
    slug: 'high-read',
    title: 'High-Read Systems',
    icon: '🚀',
    description: 'Caching, CDN, and read-path optimisation at scale',
    colorClass: 'border-green-500/40 bg-green-500/5',
    order: 2,
    skillLabel: 'Intermediate → Advanced',
  },
  'real-time': {
    slug: 'real-time',
    title: 'Real-Time Systems',
    icon: '📡',
    description: 'Live data, pub/sub, and event streaming architectures',
    colorClass: 'border-purple-500/40 bg-purple-500/5',
    order: 3,
    skillLabel: 'Intermediate → Advanced',
  },
  'consistency': {
    slug: 'consistency',
    title: 'Consistency & Transactions',
    icon: '🔒',
    description: 'Distributed locks, ACID guarantees, and correctness',
    colorClass: 'border-red-500/40 bg-red-500/5',
    order: 4,
    skillLabel: 'Advanced',
  },
  'scale-streaming': {
    slug: 'scale-streaming',
    title: 'Scale & Streaming',
    icon: '🌍',
    description: 'Fan-out patterns, CDN-first delivery, and massive scale',
    colorClass: 'border-cyan-500/40 bg-cyan-500/5',
    order: 5,
    skillLabel: 'Advanced',
  },
};

/** Monthly cost in USD per component instance */
export const COMPONENT_COSTS: Record<ComponentType, number> = {
  'web-client': 0,
  'mobile-client': 0,
  dns: 30,
  'load-balancer-l7': 100,
  'api-gateway': 120,
  'app-server': 200,
  'relational-db': 300,
  'logging-service': 80,
  'document-db': 280,
  'wide-column-store': 350,
  'key-value-store': 120,
  'graph-db': 400,
  'time-series-db': 250,
  'search-engine': 320,
  'vector-db': 380,
  'redis-cache': 150,
  cdn: 100,
  'message-queue': 80,
  'event-stream': 200,
  'pub-sub': 90,
  'object-storage': 50,
  'block-storage': 70,
  worker: 180,
  'serverless-function': 60,
  scheduler: 40,
  'websocket-server': 140,
  'load-balancer-l4': 90,
  'reverse-proxy': 80,
  'ml-inference-engine': 500,
  'geospatial-index': 220,
  transcoder: 300,
  'rate-limiter': 50,
  'auth-service': 100,
  'notification-hub': 120,
  'consensus-service': 150,
  'service-mesh': 180,
  'circuit-breaker': 40,
  'config-service': 60,
  'metrics-collector': 100,
  'distributed-tracing': 120,
  // Legacy aliases
  client: 0,
  loadbalancer: 100,
  server: 200,
  database: 300,
  cache: 150,
  queue: 80,
  storage: 50,
  monitoring: 80,
  apigateway: 120,
};

export type ComponentTier = 'core' | 'domain' | 'specialized';

export const COMPONENT_META: Record<ComponentType, { label: string; icon: string; color: string; description: string; tier: ComponentTier }> = {
  'web-client': { label: 'Web Client', icon: '🌐', color: 'bg-blue-500', description: 'User-facing web app', tier: 'core' },
  'mobile-client': { label: 'Mobile Client', icon: '📱', color: 'bg-blue-500', description: 'User-facing mobile app', tier: 'core' },
  dns: { label: 'DNS', icon: '🔗', color: 'bg-slate-500', description: 'Domain name resolution and routing', tier: 'core' },
  'load-balancer-l7': { label: 'Load Balancer (L7)', icon: '⚖️', color: 'bg-purple-500', description: 'HTTP-aware traffic distribution', tier: 'core' },
  'api-gateway': { label: 'API Gateway', icon: '🔀', color: 'bg-rose-500', description: 'Routes and manages API traffic', tier: 'core' },
  'app-server': { label: 'App Server', icon: '🖥️', color: 'bg-indigo-500', description: 'Business logic and API requests', tier: 'core' },
  'relational-db': { label: 'PostgreSQL', icon: '🗄️', color: 'bg-green-500', description: 'ACID relational database', tier: 'core' },
  'logging-service': { label: 'Logging', icon: '📋', color: 'bg-gray-500', description: 'Centralized logs and health', tier: 'core' },
  'document-db': { label: 'MongoDB', icon: '📄', color: 'bg-green-600', description: 'Document store for flexible schema', tier: 'domain' },
  'wide-column-store': { label: 'Cassandra', icon: '📊', color: 'bg-green-700', description: 'Wide-column store for high write throughput', tier: 'domain' },
  'key-value-store': { label: 'Redis KV', icon: '🔑', color: 'bg-red-600', description: 'Key-value store for fast lookups', tier: 'domain' },
  'graph-db': { label: 'Neo4j', icon: '🕸️', color: 'bg-purple-600', description: 'Graph database for relationships', tier: 'domain' },
  'time-series-db': { label: 'InfluxDB', icon: '📈', color: 'bg-cyan-600', description: 'Time-series data and metrics', tier: 'domain' },
  'search-engine': { label: 'Elasticsearch', icon: '🔍', color: 'bg-blue-600', description: 'Full-text search and indexing', tier: 'domain' },
  'vector-db': { label: 'Vector DB', icon: '🧮', color: 'bg-violet-600', description: 'Vector embeddings for similarity search', tier: 'domain' },
  'redis-cache': { label: 'Redis Cache', icon: '⚡', color: 'bg-yellow-500', description: 'In-memory cache for reads', tier: 'domain' },
  cdn: { label: 'CDN', icon: '🌍', color: 'bg-cyan-500', description: 'Delivers static content globally', tier: 'domain' },
  'message-queue': { label: 'RabbitMQ/SQS', icon: '📬', color: 'bg-orange-500', description: 'Task queue for async processing', tier: 'domain' },
  'event-stream': { label: 'Kafka', icon: '📡', color: 'bg-orange-600', description: 'Event stream for fan-out and replay', tier: 'domain' },
  'pub-sub': { label: 'Pub/Sub', icon: '📢', color: 'bg-orange-500', description: 'Publish-subscribe for real-time', tier: 'domain' },
  'object-storage': { label: 'S3', icon: '💾', color: 'bg-teal-500', description: 'Object storage for files and media', tier: 'domain' },
  'block-storage': { label: 'Block Storage', icon: '📦', color: 'bg-teal-600', description: 'Block storage for volumes', tier: 'domain' },
  worker: { label: 'Worker', icon: '⚙️', color: 'bg-indigo-600', description: 'Background job processor', tier: 'domain' },
  'serverless-function': { label: 'Lambda', icon: 'λ', color: 'bg-amber-500', description: 'Event-triggered compute', tier: 'domain' },
  scheduler: { label: 'Scheduler', icon: '⏰', color: 'bg-amber-600', description: 'Cron and periodic jobs', tier: 'domain' },
  'websocket-server': { label: 'WebSocket', icon: '🔌', color: 'bg-purple-500', description: 'Real-time bidirectional connection', tier: 'domain' },
  'load-balancer-l4': { label: 'Load Balancer (L4)', icon: '⚖️', color: 'bg-purple-600', description: 'TCP-level load balancing', tier: 'domain' },
  'reverse-proxy': { label: 'Reverse Proxy', icon: '🔄', color: 'bg-slate-600', description: 'SSL termination and routing', tier: 'domain' },
  'ml-inference-engine': { label: 'ML Inference', icon: '🤖', color: 'bg-blue-700', description: 'Model inference for predictions', tier: 'specialized' },
  'geospatial-index': { label: 'Geospatial Index', icon: '📍', color: 'bg-emerald-600', description: 'Location-based queries (H3, Quadtree)', tier: 'specialized' },
  transcoder: { label: 'Transcoder', icon: '🎬', color: 'bg-pink-600', description: 'Media transcoding pipeline', tier: 'specialized' },
  'rate-limiter': { label: 'Rate Limiter', icon: '🚦', color: 'bg-red-500', description: 'Throttle requests per user/IP', tier: 'specialized' },
  'auth-service': { label: 'Auth Service', icon: '🔐', color: 'bg-amber-700', description: 'Authentication and authorization', tier: 'specialized' },
  'notification-hub': { label: 'Notification Hub', icon: '🔔', color: 'bg-yellow-600', description: 'Push, email, SMS delivery', tier: 'specialized' },
  'consensus-service': { label: 'ZooKeeper/etcd', icon: '🔄', color: 'bg-slate-700', description: 'Distributed consensus and locks', tier: 'specialized' },
  'service-mesh': { label: 'Service Mesh', icon: '🕸️', color: 'bg-indigo-700', description: 'mTLS, retries, circuit breaking', tier: 'specialized' },
  'circuit-breaker': { label: 'Circuit Breaker', icon: '🔌', color: 'bg-red-600', description: 'Fail fast on downstream errors', tier: 'specialized' },
  'config-service': { label: 'Config Service', icon: '⚙️', color: 'bg-gray-600', description: 'Dynamic configuration', tier: 'specialized' },
  'metrics-collector': { label: 'Prometheus', icon: '📊', color: 'bg-orange-700', description: 'Metrics collection and scraping', tier: 'specialized' },
  'distributed-tracing': { label: 'Jaeger', icon: '🔭', color: 'bg-purple-700', description: 'Distributed request tracing', tier: 'specialized' },
  // Legacy aliases
  client: { label: 'Client', icon: '👤', color: 'bg-blue-500', description: 'User-facing app', tier: 'core' },
  loadbalancer: { label: 'Load Balancer', icon: '⚖️', color: 'bg-purple-500', description: 'Distributes traffic', tier: 'core' },
  server: { label: 'App Server', icon: '🖥️', color: 'bg-indigo-500', description: 'Business logic', tier: 'core' },
  database: { label: 'Database', icon: '🗄️', color: 'bg-green-500', description: 'Persists data', tier: 'core' },
  cache: { label: 'Cache', icon: '⚡', color: 'bg-yellow-500', description: 'In-memory cache', tier: 'domain' },
  queue: { label: 'Queue', icon: '📋', color: 'bg-orange-500', description: 'Async tasks', tier: 'domain' },
  storage: { label: 'Storage', icon: '💾', color: 'bg-teal-500', description: 'Files and media', tier: 'domain' },
  monitoring: { label: 'Monitoring', icon: '📊', color: 'bg-pink-500', description: 'Health and alerts', tier: 'core' },
  apigateway: { label: 'API Gateway', icon: '🔀', color: 'bg-rose-500', description: 'API traffic', tier: 'core' },
};

/** Per-block "why you'd use this" description for palette popover */
export const COMPONENT_CONTEXT: Partial<Record<ComponentType, string>> = {
  'search-engine': 'Full-text search across billions of indexed pages',
  worker: 'Background process to fetch, transform, or process data',
  'geospatial-index': 'Efficiently query nearby drivers within a radius',
  'websocket-server': 'Push real-time updates between client and server',
  transcoder: 'Convert video/audio to multiple formats and bitrates',
  'event-stream': 'Fan-out events to many consumers with replay',
  'wide-column-store': 'High-write timeline and feed storage',
  'key-value-store': 'Fast lookups for URLs, sessions, counters',
  'pub-sub': 'Fan out real-time updates to many subscribers',
  'notification-hub': 'Deliver push, email, SMS to users',
  'rate-limiter': 'Prevent abuse and ensure fair usage',
  'auth-service': 'Verify identity and manage access tokens',
  'ml-inference-engine': 'Run inference for recommendations, embeddings',
};

export type ComponentCategory =
  | 'clients'
  | 'networking'
  | 'compute'
  | 'data-stores'
  | 'caching'
  | 'messaging'
  | 'storage'
  | 'real-time'
  | 'security'
  | 'specialized';

export interface CategoryMeta {
  label: string;
  icon: string;
  types: ComponentType[];
}

export const COMPONENT_CATEGORIES: Record<ComponentCategory, CategoryMeta> = {
  clients: { label: 'Clients', icon: '👤', types: ['web-client', 'mobile-client'] },
  networking: {
    label: 'Networking',
    icon: '🌐',
    types: ['dns', 'load-balancer-l7', 'load-balancer-l4', 'api-gateway', 'reverse-proxy'],
  },
  compute: {
    label: 'Compute',
    icon: '⚙️',
    types: ['app-server', 'worker', 'serverless-function', 'scheduler'],
  },
  'data-stores': {
    label: 'Data Stores',
    icon: '🗄️',
    types: ['relational-db', 'document-db', 'wide-column-store', 'key-value-store', 'graph-db', 'time-series-db', 'search-engine', 'vector-db'],
  },
  caching: { label: 'Caching', icon: '⚡', types: ['redis-cache', 'cdn'] },
  messaging: { label: 'Messaging', icon: '📨', types: ['message-queue', 'event-stream', 'pub-sub'] },
  storage: { label: 'Storage', icon: '💾', types: ['object-storage', 'block-storage'] },
  'real-time': { label: 'Real-time', icon: '📡', types: ['websocket-server'] },
  security: { label: 'Security', icon: '🔐', types: ['auth-service', 'rate-limiter'] },
  specialized: {
    label: 'Specialized',
    icon: '🔧',
    types: ['ml-inference-engine', 'geospatial-index', 'transcoder', 'notification-hub', 'consensus-service', 'service-mesh', 'circuit-breaker', 'config-service', 'metrics-collector', 'distributed-tracing', 'logging-service'],
  },
};

// ── Compare Panel (reference solution diff) ───────────────────────────────────

export interface ComparisonResult {
  attemptScore: number;
  components: {
    matched: string[];
    missing: string[];
    extra: string[];
  };
  keyInsights: string[];
  tradeoffs: { decision: string; reason: string }[];
  antiPatterns: string[];
}
