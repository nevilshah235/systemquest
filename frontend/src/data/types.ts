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
  missionContext?: Record<ComponentType, string>;
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

// Legacy types (for backward compatibility)
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

// New comprehensive component type system
export type ComponentType =
  // Core Tier (always available)
  | 'web-client'
  | 'mobile-client'
  | 'dns'
  | 'load-balancer-l7'
  | 'api-gateway'
  | 'app-server'
  | 'relational-db'
  | 'logging-service'
  // Domain Tier - Data Stores
  | 'document-db'
  | 'wide-column-store'
  | 'key-value-store'
  | 'graph-db'
  | 'time-series-db'
  | 'search-engine'
  | 'vector-db'
  // Domain Tier - Caching
  | 'redis-cache'
  | 'cdn'
  // Domain Tier - Messaging
  | 'message-queue'
  | 'event-stream'
  | 'pub-sub'
  // Domain Tier - Storage
  | 'object-storage'
  | 'block-storage'
  // Domain Tier - Compute
  | 'worker'
  | 'serverless-function'
  | 'scheduler'
  // Domain Tier - Real-time
  | 'websocket-server'
  // Domain Tier - Networking
  | 'load-balancer-l4'
  | 'reverse-proxy'
  // Specialized Tier
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
  | 'distributed-tracing';

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

/** Component tier classification */
export type ComponentTier = 'core' | 'domain' | 'specialized';

/** Component category for palette organization */
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

/** Monthly cost in USD per component instance */
export const COMPONENT_COSTS: Record<ComponentType, number> = {
  // Core Tier
  'web-client': 0,
  'mobile-client': 0,
  'dns': 20,
  'load-balancer-l7': 100,
  'api-gateway': 120,
  'app-server': 200,
  'relational-db': 300,
  'logging-service': 80,
  // Data Stores
  'document-db': 280,
  'wide-column-store': 350,
  'key-value-store': 150,
  'graph-db': 320,
  'time-series-db': 250,
  'search-engine': 400,
  'vector-db': 450,
  // Caching
  'redis-cache': 150,
  'cdn': 100,
  // Messaging
  'message-queue': 80,
  'event-stream': 200,
  'pub-sub': 100,
  // Storage
  'object-storage': 50,
  'block-storage': 120,
  // Compute
  'worker': 180,
  'serverless-function': 0,
  'scheduler': 40,
  // Real-time
  'websocket-server': 150,
  // Networking
  'load-balancer-l4': 90,
  'reverse-proxy': 80,
  // Specialized
  'ml-inference-engine': 800,
  'geospatial-index': 300,
  'transcoder': 500,
  'rate-limiter': 60,
  'auth-service': 100,
  'notification-hub': 150,
  'consensus-service': 200,
  'service-mesh': 180,
  'circuit-breaker': 50,
  'config-service': 80,
  'metrics-collector': 120,
  'distributed-tracing': 150,
};

export const COMPONENT_META: Record<ComponentType, {
  label: string;
  icon: string;
  color: string;
  description: string;
  tier: ComponentTier;
  category: ComponentCategory;
}> = {
  // Core Tier
  'web-client': {
    label: 'Web Client',
    icon: '🌐',
    color: 'bg-blue-500',
    description: 'Browser-based web application',
    tier: 'core',
    category: 'clients',
  },
  'mobile-client': {
    label: 'Mobile Client',
    icon: '📱',
    color: 'bg-blue-600',
    description: 'iOS/Android native or hybrid app',
    tier: 'core',
    category: 'clients',
  },
  'dns': {
    label: 'DNS',
    icon: '🔍',
    color: 'bg-slate-500',
    description: 'Domain name resolution and routing',
    tier: 'core',
    category: 'networking',
  },
  'load-balancer-l7': {
    label: 'Load Balancer (L7)',
    icon: '⚖️',
    color: 'bg-purple-500',
    description: 'HTTP-aware traffic distribution',
    tier: 'core',
    category: 'networking',
  },
  'api-gateway': {
    label: 'API Gateway',
    icon: '🔀',
    color: 'bg-rose-500',
    description: 'Routes and manages API traffic',
    tier: 'core',
    category: 'networking',
  },
  'app-server': {
    label: 'App Server',
    icon: '🖥️',
    color: 'bg-indigo-500',
    description: 'Handles business logic and API requests',
    tier: 'core',
    category: 'compute',
  },
  'relational-db': {
    label: 'PostgreSQL',
    icon: '🐘',
    color: 'bg-green-600',
    description: 'ACID-compliant relational database',
    tier: 'core',
    category: 'data-stores',
  },
  'logging-service': {
    label: 'Logging',
    icon: '📊',
    color: 'bg-pink-500',
    description: 'Centralized log aggregation',
    tier: 'core',
    category: 'specialized',
  },
  // Data Stores
  'document-db': {
    label: 'MongoDB',
    icon: '🍃',
    color: 'bg-green-500',
    description: 'Flexible schema document store',
    tier: 'domain',
    category: 'data-stores',
  },
  'wide-column-store': {
    label: 'Cassandra',
    icon: '📊',
    color: 'bg-emerald-600',
    description: 'High-write distributed wide-column store',
    tier: 'domain',
    category: 'data-stores',
  },
  'key-value-store': {
    label: 'Redis',
    icon: '🔴',
    color: 'bg-red-500',
    description: 'In-memory key-value data structure store',
    tier: 'domain',
    category: 'data-stores',
  },
  'graph-db': {
    label: 'Neo4j',
    icon: '🕸️',
    color: 'bg-blue-700',
    description: 'Graph database for connected data',
    tier: 'domain',
    category: 'data-stores',
  },
  'time-series-db': {
    label: 'InfluxDB',
    icon: '📈',
    color: 'bg-violet-500',
    description: 'Optimized for time-series data',
    tier: 'domain',
    category: 'data-stores',
  },
  'search-engine': {
    label: 'Elasticsearch',
    icon: '🔎',
    color: 'bg-yellow-600',
    description: 'Full-text search and analytics',
    tier: 'domain',
    category: 'data-stores',
  },
  'vector-db': {
    label: 'Pinecone',
    icon: '🧠',
    color: 'bg-purple-600',
    description: 'Vector embeddings for ML/AI',
    tier: 'domain',
    category: 'data-stores',
  },
  // Caching
  'redis-cache': {
    label: 'Redis Cache',
    icon: '⚡',
    color: 'bg-yellow-500',
    description: 'In-memory cache for fast reads',
    tier: 'domain',
    category: 'caching',
  },
  'cdn': {
    label: 'CDN',
    icon: '🌍',
    color: 'bg-cyan-500',
    description: 'Edge caching and static content delivery',
    tier: 'domain',
    category: 'caching',
  },
  // Messaging
  'message-queue': {
    label: 'RabbitMQ',
    icon: '📬',
    color: 'bg-orange-500',
    description: 'Message queue for async tasks',
    tier: 'domain',
    category: 'messaging',
  },
  'event-stream': {
    label: 'Kafka',
    icon: '🌊',
    color: 'bg-gray-700',
    description: 'Distributed event streaming platform',
    tier: 'domain',
    category: 'messaging',
  },
  'pub-sub': {
    label: 'Pub/Sub',
    icon: '📡',
    color: 'bg-sky-500',
    description: 'Publish-subscribe messaging pattern',
    tier: 'domain',
    category: 'messaging',
  },
  // Storage
  'object-storage': {
    label: 'S3',
    icon: '💾',
    color: 'bg-teal-500',
    description: 'Object storage for files and media',
    tier: 'domain',
    category: 'storage',
  },
  'block-storage': {
    label: 'Block Storage',
    icon: '💿',
    color: 'bg-teal-600',
    description: 'Low-level block storage volumes',
    tier: 'domain',
    category: 'storage',
  },
  // Compute
  'worker': {
    label: 'Worker',
    icon: '⚙️',
    color: 'bg-indigo-600',
    description: 'Background job processor',
    tier: 'domain',
    category: 'compute',
  },
  'serverless-function': {
    label: 'Lambda',
    icon: '⚡',
    color: 'bg-amber-500',
    description: 'Event-driven serverless compute',
    tier: 'domain',
    category: 'compute',
  },
  'scheduler': {
    label: 'Scheduler',
    icon: '⏰',
    color: 'bg-blue-400',
    description: 'Cron-like job scheduling',
    tier: 'domain',
    category: 'compute',
  },
  // Real-time
  'websocket-server': {
    label: 'WebSocket',
    icon: '🔌',
    color: 'bg-fuchsia-500',
    description: 'Bidirectional real-time communication',
    tier: 'domain',
    category: 'real-time',
  },
  // Networking
  'load-balancer-l4': {
    label: 'Load Balancer (L4)',
    icon: '⚖️',
    color: 'bg-purple-600',
    description: 'TCP/UDP-level traffic distribution',
    tier: 'domain',
    category: 'networking',
  },
  'reverse-proxy': {
    label: 'Reverse Proxy',
    icon: '🔄',
    color: 'bg-slate-600',
    description: 'SSL termination and request routing',
    tier: 'domain',
    category: 'networking',
  },
  // Specialized
  'ml-inference-engine': {
    label: 'ML Inference',
    icon: '🤖',
    color: 'bg-violet-600',
    description: 'Machine learning model serving',
    tier: 'specialized',
    category: 'specialized',
  },
  'geospatial-index': {
    label: 'Geospatial Index',
    icon: '🗺️',
    color: 'bg-lime-600',
    description: 'Location-based spatial queries',
    tier: 'specialized',
    category: 'specialized',
  },
  'transcoder': {
    label: 'Transcoder',
    icon: '🎬',
    color: 'bg-red-600',
    description: 'Media format conversion pipeline',
    tier: 'specialized',
    category: 'specialized',
  },
  'rate-limiter': {
    label: 'Rate Limiter',
    icon: '🚦',
    color: 'bg-orange-600',
    description: 'Request throttling and quota enforcement',
    tier: 'specialized',
    category: 'security',
  },
  'auth-service': {
    label: 'Auth Service',
    icon: '🔐',
    color: 'bg-red-700',
    description: 'Authentication and authorization',
    tier: 'specialized',
    category: 'security',
  },
  'notification-hub': {
    label: 'Notification Hub',
    icon: '🔔',
    color: 'bg-yellow-700',
    description: 'Multi-channel notification delivery',
    tier: 'specialized',
    category: 'specialized',
  },
  'consensus-service': {
    label: 'ZooKeeper',
    icon: '🤝',
    color: 'bg-green-700',
    description: 'Distributed coordination and consensus',
    tier: 'specialized',
    category: 'specialized',
  },
  'service-mesh': {
    label: 'Istio',
    icon: '🕸️',
    color: 'bg-blue-800',
    description: 'Service-to-service communication layer',
    tier: 'specialized',
    category: 'specialized',
  },
  'circuit-breaker': {
    label: 'Circuit Breaker',
    icon: '🔌',
    color: 'bg-orange-700',
    description: 'Fault tolerance and resilience pattern',
    tier: 'specialized',
    category: 'specialized',
  },
  'config-service': {
    label: 'Config Service',
    icon: '⚙️',
    color: 'bg-gray-600',
    description: 'Centralized configuration management',
    tier: 'specialized',
    category: 'specialized',
  },
  'metrics-collector': {
    label: 'Prometheus',
    icon: '📊',
    color: 'bg-orange-800',
    description: 'Metrics collection and alerting',
    tier: 'specialized',
    category: 'specialized',
  },
  'distributed-tracing': {
    label: 'Jaeger',
    icon: '🔍',
    color: 'bg-cyan-700',
    description: 'Distributed request tracing',
    tier: 'specialized',
    category: 'specialized',
  },
};

/** Contextual "why use this" descriptions for mission-specific palette */
export const COMPONENT_CONTEXT: Record<ComponentType, string> = {
  // Core
  'web-client': 'Browser-based user interface',
  'mobile-client': 'Native mobile app experience',
  'dns': 'Route users to nearest datacenter',
  'load-balancer-l7': 'Distribute HTTP traffic across servers',
  'api-gateway': 'Centralize API routing and auth',
  'app-server': 'Execute business logic',
  'relational-db': 'Store structured data with ACID guarantees',
  'logging-service': 'Aggregate logs for debugging',
  // Data Stores
  'document-db': 'Flexible schema for evolving data models',
  'wide-column-store': 'Handle massive write throughput at scale',
  'key-value-store': 'Ultra-fast in-memory lookups',
  'graph-db': 'Model and query connected relationships',
  'time-series-db': 'Efficiently store metrics and events over time',
  'search-engine': 'Full-text search across billions of documents',
  'vector-db': 'Semantic search and ML embeddings',
  // Caching
  'redis-cache': 'Speed up read-heavy workloads',
  'cdn': 'Deliver static assets from edge locations',
  // Messaging
  'message-queue': 'Decouple async background processing',
  'event-stream': 'Fan-out events to multiple consumers',
  'pub-sub': 'Real-time message broadcasting',
  // Storage
  'object-storage': 'Store files, images, and videos',
  'block-storage': 'Persistent volumes for databases',
  // Compute
  'worker': 'Process background jobs asynchronously',
  'serverless-function': 'Event-triggered compute without servers',
  'scheduler': 'Run periodic tasks and cron jobs',
  // Real-time
  'websocket-server': 'Push live updates to clients',
  // Networking
  'load-balancer-l4': 'TCP-level load balancing for gaming/streaming',
  'reverse-proxy': 'SSL termination and request forwarding',
  // Specialized
  'ml-inference-engine': 'Serve ML model predictions at scale',
  'geospatial-index': 'Query nearby locations efficiently',
  'transcoder': 'Convert media to multiple formats',
  'rate-limiter': 'Prevent abuse and enforce quotas',
  'auth-service': 'Centralize authentication logic',
  'notification-hub': 'Send push, email, SMS notifications',
  'consensus-service': 'Coordinate distributed systems',
  'service-mesh': 'Manage microservice communication',
  'circuit-breaker': 'Fail fast and prevent cascading failures',
  'config-service': 'Dynamic configuration without redeployment',
  'metrics-collector': 'Monitor system health and performance',
  'distributed-tracing': 'Debug requests across services',
};

/** Category metadata for palette grid */
export interface CategoryMeta {
  label: string;
  icon: string;
  types: ComponentType[];
}

export const COMPONENT_CATEGORIES: Record<ComponentCategory, CategoryMeta> = {
  'clients': {
    label: 'Clients',
    icon: '👤',
    types: ['web-client', 'mobile-client'],
  },
  'networking': {
    label: 'Network',
    icon: '🌐',
    types: ['dns', 'load-balancer-l7', 'load-balancer-l4', 'api-gateway', 'reverse-proxy'],
  },
  'compute': {
    label: 'Compute',
    icon: '⚙️',
    types: ['app-server', 'worker', 'serverless-function', 'scheduler'],
  },
  'data-stores': {
    label: 'Data',
    icon: '🗄️',
    types: [
      'relational-db',
      'document-db',
      'wide-column-store',
      'key-value-store',
      'graph-db',
      'time-series-db',
      'search-engine',
      'vector-db',
    ],
  },
  'caching': {
    label: 'Cache',
    icon: '⚡',
    types: ['redis-cache', 'cdn'],
  },
  'messaging': {
    label: 'Messaging',
    icon: '📨',
    types: ['message-queue', 'event-stream', 'pub-sub'],
  },
  'storage': {
    label: 'Storage',
    icon: '💾',
    types: ['object-storage', 'block-storage'],
  },
  'real-time': {
    label: 'Real-time',
    icon: '📡',
    types: ['websocket-server'],
  },
  'security': {
    label: 'Security',
    icon: '🔒',
    types: ['auth-service', 'rate-limiter'],
  },
  'specialized': {
    label: 'Special',
    icon: '🔧',
    types: [
      'ml-inference-engine',
      'geospatial-index',
      'transcoder',
      'notification-hub',
      'consensus-service',
      'service-mesh',
      'circuit-breaker',
      'config-service',
      'metrics-collector',
      'distributed-tracing',
      'logging-service',
    ],
  },
};

/** Legacy type mapping for backward compatibility */
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

/** Helper to migrate legacy types to new types */
export function migrateLegacyType(type: string): ComponentType {
  if (type in LEGACY_TYPE_MAP) {
    return LEGACY_TYPE_MAP[type as LegacyComponentType];
  }
  return type as ComponentType;
}

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
