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

export type ComponentType =
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
  client:       0,
  loadbalancer: 100,
  server:       200,
  database:     300,
  cache:        150,
  cdn:          100,
  queue:        80,
  storage:      50,
  monitoring:   80,
  apigateway:   120,
};

export const COMPONENT_META: Record<ComponentType, { label: string; icon: string; color: string; description: string }> = {
  client:       { label: 'Client',        icon: '👤', color: 'bg-blue-500',    description: 'User-facing web or mobile app' },
  loadbalancer: { label: 'Load Balancer', icon: '⚖️',  color: 'bg-purple-500',  description: 'Distributes incoming traffic evenly' },
  server:       { label: 'App Server',    icon: '🖥️',  color: 'bg-indigo-500',  description: 'Handles business logic and API requests' },
  database:     { label: 'Database',      icon: '🗄️',  color: 'bg-green-500',   description: 'Persists application data' },
  cache:        { label: 'Cache',         icon: '⚡',  color: 'bg-yellow-500',  description: 'Speeds up reads via in-memory storage' },
  cdn:          { label: 'CDN',           icon: '🌐',  color: 'bg-cyan-500',    description: 'Delivers static content globally' },
  queue:        { label: 'Queue',         icon: '📋',  color: 'bg-orange-500',  description: 'Decouples async background tasks' },
  storage:      { label: 'Storage',       icon: '💾',  color: 'bg-teal-500',    description: 'Stores files and media' },
  monitoring:   { label: 'Monitoring',    icon: '📊',  color: 'bg-pink-500',    description: 'Tracks system health and alerts' },
  apigateway:   { label: 'API Gateway',   icon: '🔀',  color: 'bg-rose-500',    description: 'Routes and manages API traffic' },
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
