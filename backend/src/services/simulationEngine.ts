// Simulation Engine — calculates architecture performance metrics and scores

export interface ArchitectureComponent {
  id: string;
  type: string; // 'client' | 'loadbalancer' | 'server' | 'database' | 'cache' | 'cdn' | 'queue' | 'storage' | 'monitoring' | 'apigateway'
  x: number;
  y: number;
}

export interface Connection {
  from: string;
  to: string;
}

export interface Architecture {
  components: ArchitectureComponent[];
  connections: Connection[];
}

export interface SimulationMetrics {
  latencyMs: number;
  availability: number;   // percentage 0-100
  throughput: number;     // concurrent users supported
  monthlyCost: number;    // USD
  score: number;          // 0-100
  xpEarned: number;
  bonusXp: number;
  feedback: FeedbackItem[];
  achievements: string[];
}

interface FeedbackItem {
  type: 'success' | 'warning' | 'info';
  message: string;
}

// Component cost per month (USD) and performance characteristics
const COMPONENT_SPECS: Record<string, { cost: number; latencyReduction: number; availabilityBoost: number; throughputMultiplier: number }> = {
  client:      { cost: 0,    latencyReduction: 0,   availabilityBoost: 0,    throughputMultiplier: 1.0 },
  loadbalancer:{ cost: 20,   latencyReduction: 10,  availabilityBoost: 0.5,  throughputMultiplier: 2.5 },
  server:      { cost: 50,   latencyReduction: 0,   availabilityBoost: 0,    throughputMultiplier: 1.0 },
  database:    { cost: 40,   latencyReduction: 0,   availabilityBoost: 0,    throughputMultiplier: 1.0 },
  cache:       { cost: 15,   latencyReduction: 60,  availabilityBoost: 0.1,  throughputMultiplier: 1.8 },
  cdn:         { cost: 30,   latencyReduction: 40,  availabilityBoost: 0.2,  throughputMultiplier: 1.5 },
  queue:       { cost: 25,   latencyReduction: 20,  availabilityBoost: 0.2,  throughputMultiplier: 1.3 },
  storage:     { cost: 20,   latencyReduction: 5,   availabilityBoost: 0.1,  throughputMultiplier: 1.1 },
  monitoring:  { cost: 10,   latencyReduction: 0,   availabilityBoost: 0.3,  throughputMultiplier: 1.0 },
  apigateway:  { cost: 35,   latencyReduction: 15,  availabilityBoost: 0.2,  throughputMultiplier: 1.4 },
};

export function runSimulation(
  architecture: Architecture,
  missionRequirements: {
    latencyMs: number;
    availability: number;
    throughput: number;
    budget: number;
    baseXp: number;
    bonusComponents?: Array<{ component: string; xp: number; label: string }>;
  }
): SimulationMetrics {
  const types = architecture.components.map((c) => c.type);
  const hasComponent = (type: string) => types.includes(type);
  const countComponent = (type: string) => types.filter((t) => t === type).length;

  // Base metrics
  let latency = 350; // base latency ms
  let availability = 95.0;
  let throughput = 200; // base concurrent users
  let monthlyCost = 0;

  // Apply each component's effect
  for (const type of types) {
    const spec = COMPONENT_SPECS[type];
    if (!spec) continue;
    latency -= spec.latencyReduction;
    availability += spec.availabilityBoost;
    monthlyCost += spec.cost;
  }

  // Throughput: multiply by all applicable multipliers
  for (const type of new Set(types)) {
    const spec = COMPONENT_SPECS[type];
    if (!spec) continue;
    throughput = Math.round(throughput * spec.throughputMultiplier);
  }

  // Extra servers multiply throughput linearly
  const extraServers = Math.max(0, countComponent('server') - 1);
  throughput += extraServers * 500;

  // Connection validation: check logical connections
  const feedback: FeedbackItem[] = [];

  if (!hasComponent('client')) {
    feedback.push({ type: 'warning', message: 'No client component — users cannot access the system.' });
  }
  if (!hasComponent('server')) {
    feedback.push({ type: 'warning', message: 'No server component — no business logic layer.' });
  }
  if (!hasComponent('database')) {
    feedback.push({ type: 'warning', message: 'No database — data cannot be persisted.' });
  }
  if (hasComponent('loadbalancer')) {
    feedback.push({ type: 'success', message: 'Load balancer distributes traffic evenly ✓' });
  }
  if (hasComponent('cache')) {
    feedback.push({ type: 'success', message: 'Cache layer reduces database load ✓' });
  }
  if (hasComponent('cdn')) {
    feedback.push({ type: 'success', message: 'CDN delivers static assets globally ✓' });
  }
  if (!hasComponent('cache')) {
    feedback.push({ type: 'info', message: 'Consider adding a cache layer for better performance.' });
  }
  if (!hasComponent('monitoring')) {
    feedback.push({ type: 'info', message: 'Monitoring helps detect issues in production.' });
  }

  // Cap values
  latency = Math.max(50, latency);
  availability = Math.min(99.99, availability);

  // Scoring (0-100)
  let score = 0;
  const latencyScore = latency <= missionRequirements.latencyMs ? 25 : Math.max(0, 25 - (latency - missionRequirements.latencyMs) / 10);
  const availabilityScore = availability >= missionRequirements.availability ? 25 : Math.max(0, 25 - (missionRequirements.availability - availability) * 5);
  const throughputScore = throughput >= missionRequirements.throughput ? 25 : Math.max(0, 25 * (throughput / missionRequirements.throughput));
  const budgetScore = monthlyCost <= missionRequirements.budget ? 25 : Math.max(0, 25 - ((monthlyCost - missionRequirements.budget) / missionRequirements.budget) * 25);
  score = Math.round(latencyScore + availabilityScore + throughputScore + budgetScore);

  // XP calculation
  const xpEarned = Math.round((score / 100) * missionRequirements.baseXp);

  // Bonus XP from optional components
  let bonusXp = 0;
  const achievements: string[] = [];
  if (missionRequirements.bonusComponents) {
    for (const bonus of missionRequirements.bonusComponents) {
      if (hasComponent(bonus.component)) {
        bonusXp += bonus.xp;
      }
    }
  }

  // Achievement checks
  if (score >= 80) achievements.push('first-architecture');
  if (monthlyCost <= missionRequirements.budget * 0.95) achievements.push('budget-master');
  if (latency < 170) achievements.push('speed-demon');
  if (throughput >= 10000) achievements.push('scale-master');

  return {
    latencyMs: latency,
    availability: parseFloat(availability.toFixed(2)),
    throughput,
    monthlyCost,
    score,
    xpEarned,
    bonusXp,
    feedback,
    achievements,
  };
}
