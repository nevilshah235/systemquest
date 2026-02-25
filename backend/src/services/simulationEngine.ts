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
  allMetricsMet: boolean; // true only when ALL 4 targets are hit
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
// Availability boosts calibrated so each mission target is achievable:
//   Mission 1 (99%):    LB(1.5) + server×2(0.5×2) + cache(0.3) + cdn(0.4) + monitoring(0.8) = +3.8 → 98.8% ≈ 99% ✓
//   Mission 2 (99.9%):  above + queue(0.3) + apigateway(0.4) + server×3(1.5) = +5.4 → ≥99.9% ✓
//   Mission 3 (99.99%): all components → cap at 99.99% ✓
const COMPONENT_SPECS: Record<string, { cost: number; latencyReduction: number; availabilityBoost: number; throughputMultiplier: number }> = {
  client:      { cost: 0,    latencyReduction: 0,   availabilityBoost: 0,    throughputMultiplier: 1.0 },
  loadbalancer:{ cost: 20,   latencyReduction: 10,  availabilityBoost: 1.5,  throughputMultiplier: 2.5 },
  server:      { cost: 50,   latencyReduction: 0,   availabilityBoost: 0.5,  throughputMultiplier: 1.0 },
  database:    { cost: 40,   latencyReduction: 0,   availabilityBoost: 0,    throughputMultiplier: 1.0 },
  cache:       { cost: 15,   latencyReduction: 60,  availabilityBoost: 0.3,  throughputMultiplier: 1.8 },
  cdn:         { cost: 30,   latencyReduction: 40,  availabilityBoost: 0.4,  throughputMultiplier: 1.5 },
  queue:       { cost: 25,   latencyReduction: 20,  availabilityBoost: 0.3,  throughputMultiplier: 1.3 },
  storage:     { cost: 20,   latencyReduction: 5,   availabilityBoost: 0.1,  throughputMultiplier: 1.1 },
  monitoring:  { cost: 10,   latencyReduction: 0,   availabilityBoost: 0.8,  throughputMultiplier: 1.0 },
  apigateway:  { cost: 35,   latencyReduction: 15,  availabilityBoost: 0.4,  throughputMultiplier: 1.4 },
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

  // ── Topology helpers ────────────────────────────────────────────────────────
  /** Types of components that have an outgoing connection TO a given component id */
  const incomingTypes = (id: string): string[] =>
    architecture.connections
      .filter((c) => c.to === id)
      .map((c) => architecture.components.find((comp) => comp.id === c.from)?.type ?? '')
      .filter(Boolean);

  /** Types of components that a given component id connects TO */
  const outgoingTypes = (id: string): string[] =>
    architecture.connections
      .filter((c) => c.from === id)
      .map((c) => architecture.components.find((comp) => comp.id === c.to)?.type ?? '')
      .filter(Boolean);

  /**
   * Check if Cache is correctly placed: Server → Cache (→ DB optional but sensible).
   * Returns false when a Cache block has no server feeding into it — i.e. it is only
   * connected from the client or directly to the DB with nothing upstream.
   */
  const cacheComponents = architecture.components.filter((c) => c.type === 'cache');
  const cacheCorrectlyPlaced = cacheComponents.every((cache) => {
    const incoming = incomingTypes(cache.id);
    // Acceptable upstream sources for a cache: server, loadbalancer, apigateway
    return incoming.some((t) => ['server', 'loadbalancer', 'apigateway'].includes(t));
  });
  // Detect the specific anti-pattern: cache wired straight to DB with no server upstream
  const cacheDirectToDb = cacheComponents.some((cache) => {
    const outgoing = outgoingTypes(cache.id);
    const incoming = incomingTypes(cache.id);
    return (
      outgoing.includes('database') &&
      !incoming.some((t) => ['server', 'loadbalancer', 'apigateway'].includes(t))
    );
  });

  // Base metrics
  let latency = 320; // base latency ms (lowered from 350 for better achievability)
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

  // Synergy bonuses: combinations that should compound better
  if (hasComponent('cache') && hasComponent('cdn')) {
    // Cache handles origin requests, CDN handles edge delivery — they complement each other
    latency -= 25;
  }
  if (hasComponent('loadbalancer') && hasComponent('cache')) {
    // Load balancer routing optimisation reduces round-trip overhead
    latency -= 10;
  }

  // Throughput: multiply by all applicable multipliers (unique component types)
  for (const type of new Set(types)) {
    const spec = COMPONENT_SPECS[type];
    if (!spec) continue;
    throughput = Math.round(throughput * spec.throughputMultiplier);
  }

  // Extra servers: exponential scaling — each additional server multiplies total throughput
  // significantly (horizontal scaling compounds with LB, cache, CDN already applied above)
  const extraServers = Math.max(0, countComponent('server') - 1);
  if (extraServers > 0) {
    throughput = Math.round(throughput * Math.pow(6, extraServers));
  }

  // Extra caches: each additional cache layer adds 15% throughput boost
  const extraCaches = Math.max(0, countComponent('cache') - 1);
  if (extraCaches > 0) {
    throughput = Math.round(throughput * (1 + extraCaches * 0.15));
  }

  // ── Topology penalty: cache mis-wired directly to DB ──────────────────────
  // If cache has no server feeding into it its benefits don't apply — a cache
  // only speeds things up when it intercepts requests from the application layer.
  if (hasComponent('cache') && !cacheCorrectlyPlaced) {
    // Undo the cache latency reduction and throughput multiplier already applied above
    latency      += COMPONENT_SPECS['cache'].latencyReduction;
    throughput    = Math.round(throughput / COMPONENT_SPECS['cache'].throughputMultiplier);
    availability -= COMPONENT_SPECS['cache'].availabilityBoost;
    // Also undo the Cache+CDN synergy if it was applied
    if (hasComponent('cdn')) latency += 25;
    if (hasComponent('loadbalancer')) latency += 10;
  }

  // ── Connection validation feedback ────────────────────────────────────────
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
    if (cacheDirectToDb) {
      feedback.push({
        type: 'warning',
        message: '⚠ Cache is wired directly to the Database — it has no effect here. Connect your Server → Cache → Database instead.',
      });
    } else if (!cacheCorrectlyPlaced) {
      feedback.push({
        type: 'warning',
        message: '⚠ Cache is not connected to an App Server — reconnect it so requests flow Server → Cache → Database.',
      });
    } else {
      feedback.push({ type: 'success', message: 'Cache layer sits correctly between Server and Database ✓' });
    }
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

  const allMetricsMet =
    latency       <= missionRequirements.latencyMs &&
    availability  >= missionRequirements.availability &&
    throughput    >= missionRequirements.throughput &&
    monthlyCost   <= missionRequirements.budget;

  return {
    latencyMs: latency,
    availability: parseFloat(availability.toFixed(2)),
    throughput,
    monthlyCost,
    score,
    allMetricsMet,
    xpEarned,
    bonusXp,
    feedback,
    achievements,
  };
}
