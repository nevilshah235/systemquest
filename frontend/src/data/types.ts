// Shared TypeScript types across the frontend

export interface User {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
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
  userProgress?: UserMissionProgress;
  savedArchitecture?: Architecture | null;
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

// Component display metadata
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
