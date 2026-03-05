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
  available: ComponentType[];      // all blocks for this mission (core + domain + specialized)
  required: ComponentType[];       // must place before simulation
  hints: string[];                 // text hints
  missionContext?: Record<ComponentType, string>;  // per-block "why" descriptions shown in popover
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

// =============================================================================
// EXPANDED COMPONENT TYPE SYSTEM
// ~40 building blocks organized into 10 categories
// =============================================================================

// Legacy type for backward compatibility
export type LegacyComponentType =
  | 'client'
  | 'loadbalancer'
  | 'server'
  | 'database'
  | 'cache'
  | 'cdn'
  | 'queue'
  | 'storage'
  | 'monitoring'
  | 'apigateway';

// New expanded ComponentType taxonomy
export type ComponentType =
  // Core Tier - always available
  | 'web-client'
  | 'mobile-client'
  | 'dns'
  | 'load-balancer-l7'
  | 'api-gateway'
  | 'app-server'
  | 'relational-db'
  | 'logging-service'
  // Data Stores - Domain tier
  | 'document-db'
  | 'wide-column-store'
  | 'key-value-store'
  | 'graph-db'
  | 'time-series-db'
  | 'search-engine'
  | 'vector-db'
  // Caching - Domain tier
  | 'redis-cache'
  | 'cdn'
  // Messaging - Domain tier
  | 'message-queue'
  | 'event-stream'
  | 'pub-sub'
  // Storage - Domain tier
  | 'object-storage'
  | 'block-storage'
  // Compute - Domain tier
  | 'worker'
  | 'serverless-function'
  | 'scheduler'
  // Real-time - Domain tier
  | 'websocket-server'
  // Networking - Domain tier
  | 'load-balancer-l4'
  | 'reverse-proxy'
  // Security - Specialized tier
  | 'auth-service'
  | 'rate-limiter'
  // Specialized - Specialized tier (mission-specific)
  | 'ml-inference-engine'
  | 'geospatial-index'
  | 'transcoder'
  | 'notification-hub'
  | 'consensus-service'
  | 'service-mesh'
  | 'circuit-breaker'
  | 'config-service'
  | 'metrics-collector'
  | 'distributed-tracing';

// Map legacy types to new expanded types for backward compatibility
export const LEGACY_TYPE_MAP: Record<LegacyComponentType, ComponentType> = {
  'client': 'web-client',
  'loadbalancer': 'load-balancer-l7',
  'server': 'app-server',
  'database': 'relational-db',
  'cache': 'redis-cache',
  'cdn': 'cdn',
  'queue': 'message-queue',
  'storage': 'object-storage',
  'monitoring': 'logging-service',
  'apigateway': 'api-gateway',
};

// Convert legacy architecture to new format
export function migrateLegacyArchitecture(arch: Architecture): Architecture {
  return {
    components: arch.components.map(c => ({
      ...c,
      type: LEGACY_TYPE_MAP[c.type as LegacyComponentType] || c.type as ComponentType,
    })),
    connections: arch.connections,
  };
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

// =============================================================================
// COMPONENT CATEGORIES (for icon-grid palette)
// =============================================================================

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
  description: string;
}

export const COMPONENT_CATEGORIES: Record<ComponentCategory, CategoryMeta> = {
  'clients': {
    label: 'Clients',
    icon: '👤',
    types: ['web-client', 'mobile-client'],
    description: 'User-facing applications',
  },
  'networking': {
    label: 'Networking',
    icon: '🌐',
    types: ['dns', 'load-balancer-l7', 'load-balancer-l4', 'api-gateway', 'reverse-proxy'],
    description: 'Traffic routing and management',
  },
  'compute': {
    label: 'Compute',
    icon: '⚙️',
    types: ['app-server', 'worker', 'serverless-function', 'scheduler'],
    description: 'Processing and execution',
  },
  'data-stores': {
    label: 'Data Stores',
    icon: '🗄️',
    types: ['relational-db', 'document-db', 'wide-column-store', 'key-value-store', 'graph-db', 'time-series-db', 'search-engine', 'vector-db'],
    description: 'Persistence and retrieval',
  },
  'caching': {
    label: 'Caching',
    icon: '⚡',
    types: ['redis-cache', 'cdn'],
    description: 'Speed up reads and delivery',
  },
  'messaging': {
    label: 'Messaging',
    icon: '📨',
    types: ['message-queue', 'event-stream', 'pub-sub'],
    description: 'Async communication patterns',
  },
  'storage': {
    label: 'Storage',
    icon: '💾',
    types: ['object-storage', 'block-storage'],
    description: 'Files and media storage',
  },
  'real-time': {
    label: 'Real-Time',
    icon: '📡',
    types: ['websocket-server'],
    description: 'Live data and streaming',
  },
  'security': {
    label: 'Security',
    icon: '🔒',
    types: ['auth-service', 'rate-limiter'],
    description: 'Auth, access control, and limits',
  },
  'specialized': {
    label: 'Specialized',
    icon: '🔧',
    types: ['ml-inference-engine', 'geospatial-index', 'transcoder', 'notification-hub', 'consensus-service', 'service-mesh', 'circuit-breaker', 'config-service', 'metrics-collector', 'distributed-tracing', 'logging-service'],
    description: 'Domain-specific services',
  },
};

// =============================================================================
// COMPONENT METADATA
// =============================================================================

export type ComponentTier = 'core' | 'domain' | 'specialized';

export interface ComponentMeta {
  label: string;
  icon: string;
  color: string;
  description: string;
  tier: ComponentTier;
  category: ComponentCategory;
}

export const COMPONENT_META: Record<ComponentType, ComponentMeta> = {
  // Core Tier
  'web-client': { label: 'Web Client', icon: '🌐', color: 'bg-blue-500', description: 'Browser-based user interface', tier: 'core', category: 'clients' },
  'mobile-client': { label: 'Mobile Client', icon: '📱', color: 'bg-blue-600', description: 'iOS/Android native app', tier: 'core', category: 'clients' },
  'dns': { label: 'DNS', icon: '📍', color: 'bg-purple-500', description: 'Domain name resolution and routing', tier: 'core', category: 'networking' },
  'load-balancer-l7': { label: 'L7 Load Balancer', icon: '⚖️', color: 'bg-purple-600', description: 'HTTP-aware traffic distribution', tier: 'core', category: 'networking' },
  'api-gateway': { label: 'API Gateway', icon: '🔀', color: 'bg-purple-700', description: 'API routing, auth, and rate limiting', tier: 'core', category: 'networking' },
  'app-server': { label: 'App Server', icon: '🖥️', color: 'bg-indigo-500', description: 'Business logic and API handling', tier: 'core', category: 'compute' },
  'relational-db': { label: 'PostgreSQL', icon: '🐘', color: 'bg-green-500', description: 'ACID-compliant relational database', tier: 'core', category: 'data-stores' },
  'logging-service': { label: 'Logging', icon: '📝', color: 'bg-gray-500', description: 'Centralized log collection and storage', tier: 'core', category: 'specialized' },

  // Domain Tier - Data Stores
  'document-db': { label: 'MongoDB', icon: '📄', color: 'bg-green-600', description: 'Schema-flexible document store', tier: 'domain', category: 'data-stores' },
  'wide-column-store': { label: 'Cassandra', icon: '📊', color: 'bg-green-700', description: 'High-write distributed wide-column store', tier: 'domain', category: 'data-stores' },
  'key-value-store': { label: 'Redis KV', icon: '🔑', color: 'bg-red-500', description: 'Fast key-value lookups and counters', tier: 'domain', category: 'data-stores' },
  'graph-db': { label: 'Neo4j', icon: '🕸️', color: 'bg-green-800', description: 'Graph relationship queries and traversals', tier: 'domain', category: 'data-stores' },
  'time-series-db': { label: 'InfluxDB', icon: '📈', color: 'bg-pink-500', description: 'Time-series metrics and events storage', tier: 'domain', category: 'data-stores' },
  'search-engine': { label: 'Elasticsearch', icon: '🔍', color: 'bg-yellow-600', description: 'Full-text search and indexing', tier: 'domain', category: 'data-stores' },
  'vector-db': { label: 'Vector DB', icon: '🧮', color: 'bg-violet-500', description: 'Similarity search for embeddings', tier: 'domain', category: 'data-stores' },

  // Domain Tier - Caching
  'redis-cache': { label: 'Redis Cache', icon: '⚡', color: 'bg-red-400', description: 'In-memory read caching layer', tier: 'domain', category: 'caching' },
  'cdn': { label: 'CDN', icon: '🌍', color: 'bg-cyan-500', description: 'Edge content delivery network', tier: 'domain', category: 'caching' },

  // Domain Tier - Messaging
  'message-queue': { label: 'RabbitMQ', icon: '📬', color: 'bg-orange-500', description: 'Reliable message queue for tasks', tier: 'domain', category: 'messaging' },
  'event-stream': { label: 'Kafka', icon: '🌊', color: 'bg-orange-600', description: 'High-throughput event streaming', tier: 'domain', category: 'messaging' },
  'pub-sub': { label: 'Pub/Sub', icon: '📢', color: 'bg-orange-700', description: 'Publish-subscribe fan-out pattern', tier: 'domain', category: 'messaging' },

  // Domain Tier - Storage
  'object-storage': { label: 'S3', icon: '🪣', color: 'bg-teal-500', description: 'Scalable object/blob storage', tier: 'domain', category: 'storage' },
  'block-storage': { label: 'EBS', icon: '💿', color: 'bg-teal-600', description: 'Block-level disk storage', tier: 'domain', category: 'storage' },

  // Domain Tier - Compute
  'worker': { label: 'Worker', icon: '👷', color: 'bg-indigo-600', description: 'Background job processor', tier: 'domain', category: 'compute' },
  'serverless-function': { label: 'Lambda', icon: 'λ', color: 'bg-indigo-700', description: 'Event-triggered serverless compute', tier: 'domain', category: 'compute' },
  'scheduler': { label: 'Scheduler', icon: '⏰', color: 'bg-indigo-800', description: 'Cron and scheduled job runner', tier: 'domain', category: 'compute' },

  // Domain Tier - Real-time
  'websocket-server': { label: 'WebSocket', icon: '🔌', color: 'bg-fuchsia-500', description: 'Bidirectional real-time communication', tier: 'domain', category: 'real-time' },

  // Domain Tier - Networking
  'load-balancer-l4': { label: 'L4 LB', icon: '⚖️', color: 'bg-purple-400', description: 'TCP/UDP-level traffic distribution', tier: 'domain', category: 'networking' },
  'reverse-proxy': { label: 'Reverse Proxy', icon: '🔙', color: 'bg-purple-800', description: 'SSL termination and request routing', tier: 'domain', category: 'networking' },

  // Specialized Tier - Security
  'auth-service': { label: 'Auth Service', icon: '🔐', color: 'bg-red-600', description: 'JWT/OAuth authentication and sessions', tier: 'specialized', category: 'security' },
  'rate-limiter': { label: 'Rate Limiter', icon: '🚦', color: 'bg-red-700', description: 'Token bucket rate limiting', tier: 'specialized', category: 'security' },

  // Specialized Tier - Domain Specific
  'ml-inference-engine': { label: 'ML Inference', icon: '🤖', color: 'bg-violet-600', description: 'Model serving and inference', tier: 'specialized', category: 'specialized' },
  'geospatial-index': { label: 'Geo Index', icon: '🗺️', color: 'bg-emerald-500', description: 'H3/Quadtree location queries', tier: 'specialized', category: 'specialized' },
  'transcoder': { label: 'Transcoder', icon: '🎬', color: 'bg-rose-500', description: 'Video/audio format conversion', tier: 'specialized', category: 'specialized' },
  'notification-hub': { label: 'Notifications', icon: '🔔', color: 'bg-amber-500', description: 'Push notification delivery', tier: 'specialized', category: 'specialized' },
  'consensus-service': { label: 'Consensus', icon: '🤝', color: 'bg-lime-500', description: 'ZooKeeper/etcd distributed coordination', tier: 'specialized', category: 'specialized' },
  'service-mesh': { label: 'Service Mesh', icon: '🕸️', color: 'bg-sky-500', description: 'Istio/Linkerd microservice mesh', tier: 'specialized', category: 'specialized' },
  'circuit-breaker': { label: 'Circuit Breaker', icon: '🔌', color: 'bg-rose-600', description: 'Fault tolerance and resilience', tier: 'specialized', category: 'specialized' },
  'config-service': { label: 'Config Service', icon: '⚙️', color: 'bg-slate-500', description: 'Dynamic configuration management', tier: 'specialized', category: 'specialized' },
  'metrics-collector': { label: 'Metrics', icon: '📊', color: 'bg-pink-600', description: 'Prometheus-style metrics collection', tier: 'specialized', category: 'specialized' },
  'distributed-tracing': { label: 'Tracing', icon: '🔎', color: 'bg-pink-700', description: 'Jaeger/Zipkin request tracing', tier: 'specialized', category: 'specialized' },
};

// =============================================================================
// COMPONENT COSTS (monthly USD per instance)
// =============================================================================

export const COMPONENT_COSTS: Record<ComponentType, number> = {
  // Core Tier
  'web-client': 0,
  'mobile-client': 0,
  'dns': 10,
  'load-balancer-l7': 100,
  'api-gateway': 120,
  'app-server': 200,
  'relational-db': 300,
  'logging-service': 80,

  // Domain Tier - Data Stores
  'document-db': 280,
  'wide-column-store': 350,
  'key-value-store': 180,
  'graph-db': 320,
  'time-series-db': 250,
  'search-engine': 400,
  'vector-db': 380,

  // Domain Tier - Caching
  'redis-cache': 150,
  'cdn': 100,

  // Domain Tier - Messaging
  'message-queue': 80,
  'event-stream': 250,
  'pub-sub': 120,

  // Domain Tier - Storage
  'object-storage': 50,
  'block-storage': 100,

  // Domain Tier - Compute
  'worker': 150,
  'serverless-function': 60,
  'scheduler': 40,

  // Domain Tier - Real-time
  'websocket-server': 180,

  // Domain Tier - Networking
  'load-balancer-l4': 80,
  'reverse-proxy': 90,

  // Specialized Tier - Security
  'auth-service': 150,
  'rate-limiter': 100,

  // Specialized Tier - Domain Specific
  'ml-inference-engine': 500,
  'geospatial-index': 280,
  'transcoder': 350,
  'notification-hub': 200,
  'consensus-service': 220,
  'service-mesh': 300,
  'circuit-breaker': 80,
  'config-service': 100,
  'metrics-collector': 180,
  'distributed-tracing': 160,
};

// =============================================================================
// COMPONENT CONTEXT - "Why you'd use this" descriptions for popover
// =============================================================================

export const COMPONENT_CONTEXT: Record<ComponentType, string> = {
  // Core Tier
  'web-client': 'Browser-based user interface for your application',
  'mobile-client': 'Native iOS or Android mobile application',
  'dns': 'Route traffic to the closest datacenter',
  'load-balancer-l7': 'Distribute HTTP requests across app servers',
  'api-gateway': 'Central entry point for all API traffic',
  'app-server': 'Handle business logic and API requests',
  'relational-db': 'ACID transactions and complex relationships',
  'logging-service': 'Collect and analyze system logs',

  // Domain Tier - Data Stores
  'document-db': 'Flexible schema for unstructured or evolving data',
  'wide-column-store': 'Massive write throughput for time-series data',
  'key-value-store': 'Sub-millisecond lookups and counters',
  'graph-db': 'Complex relationship queries and traversals',
  'time-series-db': 'Efficient storage of metrics and events over time',
  'search-engine': 'Full-text search across billions of documents',
  'vector-db': 'Similarity search for embeddings and AI features',

  // Domain Tier - Caching
  'redis-cache': 'Speed up reads with in-memory caching',
  'cdn': 'Deliver static content from edge locations',

  // Domain Tier - Messaging
  'message-queue': 'Reliable async task processing',
  'event-stream': 'High-throughput event log for pub/sub patterns',
  'pub-sub': 'Fan-out messages to multiple consumers',

  // Domain Tier - Storage
  'object-storage': 'Store files, images, and media at scale',
  'block-storage': 'Mountable disk for databases and stateful apps',

  // Domain Tier - Compute
  'worker': 'Background job processing and async tasks',
  'serverless-function': 'Event-triggered compute without servers',
  'scheduler': 'Run periodic jobs and cron tasks',

  // Domain Tier - Real-time
  'websocket-server': 'Push live updates without polling',

  // Domain Tier - Networking
  'load-balancer-l4': 'TCP-level distribution for gaming or streaming',
  'reverse-proxy': 'SSL termination and request routing',

  // Specialized Tier - Security
  'auth-service': 'JWT/OAuth authentication and session management',
  'rate-limiter': 'Prevent abuse with token bucket limiting',

  // Specialized Tier - Domain Specific
  'ml-inference-engine': 'Serve ML models for recommendations or chat',
  'geospatial-index': 'Query nearby locations efficiently (H3/Quadtree)',
  'transcoder': 'Convert video/audio formats for streaming',
  'notification-hub': 'Push notifications to mobile devices',
  'consensus-service': 'Distributed locks and leader election',
  'service-mesh': 'Observability and traffic control between services',
  'circuit-breaker': 'Prevent cascade failures in microservices',
  'config-service': 'Dynamic configuration without restarts',
  'metrics-collector': 'Collect and query system metrics',
  'distributed-tracing': 'Trace requests across service boundaries',
};

// Helper to check if a component is available in a mission
export function isComponentAvailable(type: ComponentType, availableTypes: ComponentType[]): boolean {
  return availableTypes.includes(type);
}

// Helper to check if a component is core tier
export function isCoreComponent(type: ComponentType): boolean {
  return COMPONENT_META[type].tier === 'core';
}

// Helper to get components by category
export function getComponentsByCategory(category: ComponentCategory): ComponentType[] {
  return COMPONENT_CATEGORIES[category].types;
}

// Helper to get mission-specific components (non-core that are available)
export function getMissionSpecificComponents(availableTypes: ComponentType[]): ComponentType[] {
  return availableTypes.filter(type => !isCoreComponent(type));
}

// =============================================================================
// LEGACY EXPORTS (for backward compatibility until migration is complete)
// =============================================================================

// Temporary mapping for old code that references the old 10 types
export const LEGACY_COMPONENT_COSTS: Record<LegacyComponentType, number> = {
  'client': 0,
  'loadbalancer': 100,
  'server': 200,
  'database': 300,
  'cache': 150,
  'cdn': 100,
  'queue': 80,
  'storage': 50,
  'monitoring': 80,
  'apigateway': 120,
};

export const LEGACY_COMPONENT_META: Record<LegacyComponentType, { label: string; icon: string; color: string; description: string }> = {
  'client': { label: 'Client', icon: '👤', color: 'bg-blue-500', description: 'User-facing web or mobile app' },
  'loadbalancer': { label: 'Load Balancer', icon: '⚖️', color: 'bg-purple-500', description: 'Distributes incoming traffic evenly' },
  'server': { label: 'App Server', icon: '🖥️', color: 'bg-indigo-500', description: 'Handles business logic and API requests' },
  'database': { label: 'Database', icon: '🗄️', color: 'bg-green-500', description: 'Persists application data' },
  'cache': { label: 'Cache', icon: '⚡', color: 'bg-yellow-500', description: 'Speeds up reads via in-memory storage' },
  'cdn': { label: 'CDN', icon: '🌐', color: 'bg-cyan-500', description: 'Delivers static content globally' },
  'queue': { label: 'Queue', icon: '📋', color: 'bg-orange-500', description: 'Decouples async background tasks' },
  'storage': { label: 'Storage', icon: '💾', color: 'bg-teal-500', description: 'Stores files and media' },
  'monitoring': { label: 'Monitoring', icon: '📊', color: 'bg-pink-500', description: 'Tracks system health and alerts' },
  'apigateway': { label: 'API Gateway', icon: '🔀', color: 'bg-rose-500', description: 'Routes and manages API traffic' },
};

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
