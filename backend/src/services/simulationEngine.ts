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

  // ── Topology helpers ─────────────────────────────────────────────────────────────
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
   * Cache topology: Server → Cache (→ DB optional but sensible).
   * Returns false when a Cache block has no server feeding into it.
   */
  const cacheComponents = architecture.components.filter((c) => c.type === 'cache');
  const cacheCorrectlyPlaced = cacheComponents.every((cache) => {
    const incoming = incomingTypes(cache.id);
    return incoming.some((t) => ['server', 'loadbalancer', 'apigateway'].includes(t));
  });
  const cacheDirectToDb = cacheComponents.some((cache) => {
    const outgoing = outgoingTypes(cache.id);
    const incoming = incomingTypes(cache.id);
    return (
      outgoing.includes('database') &&
      !incoming.some((t) => ['server', 'loadbalancer', 'apigateway'].includes(t))
    );
  });

  // ── Load Balancer topology: is LB actually connected to servers? ─────────────────
  const lbComponents = architecture.components.filter((c) => c.type === 'loadbalancer');
  const serversConnectedToLb = lbComponents.reduce((count, lb) => {
    return count + outgoingTypes(lb.id).filter((t) => t === 'server').length;
  }, 0);
  const lbEffective   = lbComponents.length > 0 && serversConnectedToLb >= 2;
  const lbPartial     = lbComponents.length > 0 && serversConnectedToLb === 1;
  const lbDisconnected = lbComponents.length > 0 && serversConnectedToLb === 0;

  // ── CDN topology: connected (any wire) vs floating (zero connections) ──────────
  // CDN as a side-path (client→cdn only, no downstream) is VALID for static-asset
  // delivery and earns full benefits. Only a completely unwired CDN provides no value.
  const cdnComponents = architecture.components.filter((c) => c.type === 'cdn');
  const cdnFloating = cdnComponents.length > 0 && cdnComponents.every((cdn) =>
    incomingTypes(cdn.id).length === 0 && outgoingTypes(cdn.id).length === 0,
  );

  // ── API Gateway topology: must have ≥1 incoming AND ≥1 outgoing ──────────────
  const apiGwComponents = architecture.components.filter((c) => c.type === 'apigateway');
  const apiGwEffective = apiGwComponents.some((gw) => {
    return incomingTypes(gw.id).length > 0 && outgoingTypes(gw.id).length > 0;
  });
  const apiGwFloating = apiGwComponents.length > 0 && !apiGwEffective;

  // Base metrics
  let latency = 320;
  let availability = 95.0;
  let throughput = 200;
  let monthlyCost = 0;

  // Apply each component's effect
  for (const type of types) {
    const spec = COMPONENT_SPECS[type];
    if (!spec) continue;
    latency -= spec.latencyReduction;
    availability += spec.availabilityBoost;
    monthlyCost += spec.cost;
  }

  // Synergy bonuses
  if (hasComponent('cache') && hasComponent('cdn')) latency -= 25;
  if (hasComponent('loadbalancer') && hasComponent('cache')) latency -= 10;

  // Throughput: topology-gated multipliers
  for (const type of new Set(types)) {
    const spec = COMPONENT_SPECS[type];
    if (!spec) continue;
    if (type === 'loadbalancer') {
      // Full 2.5× only when LB routes to ≥2 servers; 1.2× with 1 server; 1.0× if floating
      const lbMult = lbEffective ? 2.5 : lbPartial ? 1.2 : 1.0;
      throughput = Math.round(throughput * lbMult);
      // Availability: LB only improves uptime when it provides real redundancy
      if (!lbEffective) {
        availability -= COMPONENT_SPECS['loadbalancer'].availabilityBoost;
        if (lbPartial) availability += 0.5;
      }
    } else if (type === 'cdn') {
      // Floating CDN = no benefit; connected CDN (incl. side-path) = full benefit
      if (cdnFloating) {
        throughput = Math.round(throughput * 1.0);
        latency   += COMPONENT_SPECS['cdn'].latencyReduction;
      } else {
        throughput = Math.round(throughput * spec.throughputMultiplier);
      }
    } else if (type === 'apigateway') {
      // Floating apigateway: no benefit at all
      if (apiGwFloating) {
        throughput = Math.round(throughput * 1.0);
        latency   += COMPONENT_SPECS['apigateway'].latencyReduction;
        availability -= COMPONENT_SPECS['apigateway'].availabilityBoost;
      } else {
        throughput = Math.round(throughput * spec.throughputMultiplier);
      }
    } else {
      throughput = Math.round(throughput * spec.throughputMultiplier);
    }
  }

  // Extra servers: only count servers reachable from LB when LB is present
  const totalServers = countComponent('server');
  const effectiveExtraServers = hasComponent('loadbalancer')
    ? Math.max(0, serversConnectedToLb - 1)
    : Math.max(0, totalServers - 1);
  if (effectiveExtraServers > 0) {
    throughput = Math.round(throughput * Math.pow(6, effectiveExtraServers));
  }

  // Extra caches: each additional cache layer adds 15% throughput boost
  const extraCaches = Math.max(0, countComponent('cache') - 1);
  if (extraCaches > 0) {
    throughput = Math.round(throughput * (1 + extraCaches * 0.15));
  }

  // ── Topology penalty: cache mis-wired directly to DB ────────────────────────
  if (hasComponent('cache') && !cacheCorrectlyPlaced) {
    latency      += COMPONENT_SPECS['cache'].latencyReduction;
    throughput    = Math.round(throughput / COMPONENT_SPECS['cache'].throughputMultiplier);
    availability -= COMPONENT_SPECS['cache'].availabilityBoost;
    if (hasComponent('cdn')) latency += 25;
    if (hasComponent('loadbalancer')) latency += 10;
  }

  // ── CDN floating synergy cancellation ─────────────────────────────────────
  if (cdnFloating && hasComponent('cache')) latency += 25;

  // ── Connection validation feedback ───────────────────────────────────────────
  const feedback: FeedbackItem[] = [];

  if (!hasComponent('client'))   feedback.push({ type: 'warning', message: 'No client component — users cannot access the system.' });
  if (!hasComponent('server'))   feedback.push({ type: 'warning', message: 'No server component — no business logic layer.' });
  if (!hasComponent('database')) feedback.push({ type: 'warning', message: 'No database — data cannot be persisted.' });

  if (hasComponent('loadbalancer')) {
    if (lbEffective) {
      feedback.push({ type: 'success', message: `Load balancer distributes traffic across ${serversConnectedToLb} servers ✓` });
    } else if (lbPartial) {
      feedback.push({ type: 'warning', message: '⚠ Load balancer has only 1 server — connect a 2nd App Server to unlock full horizontal scaling.' });
    } else {
      feedback.push({ type: 'warning', message: '⚠ Load balancer is not connected to any servers — wire it to App Servers or its throughput benefit is lost.' });
    }
  }

  if (hasComponent('cache')) {
    if (cacheDirectToDb) {
      feedback.push({ type: 'warning', message: '⚠ Cache is wired directly to the Database — it has no effect here. Connect your Server → Cache → Database instead.' });
    } else if (!cacheCorrectlyPlaced) {
      feedback.push({ type: 'warning', message: '⚠ Cache is not connected to an App Server — reconnect it so requests flow Server → Cache → Database.' });
    } else {
      feedback.push({ type: 'success', message: 'Cache layer sits correctly between Server and Database ✓' });
    }
  }

  if (hasComponent('cdn')) {
    if (cdnFloating) {
      feedback.push({ type: 'warning', message: '⚠ CDN has no connections — wire it from the Client to activate edge delivery.' });
    } else {
      feedback.push({ type: 'success', message: 'CDN delivers static assets globally ✓' });
    }
  }

  if (hasComponent('apigateway')) {
    if (apiGwEffective) {
      feedback.push({ type: 'success', message: 'API Gateway routes and protects all inbound traffic ✓' });
    } else {
      feedback.push({ type: 'warning', message: '⚠ API Gateway has no connections — wire it between CDN/Client and the Load Balancer to activate its benefits.' });
    }
  }

  if (!hasComponent('cache'))      feedback.push({ type: 'info', message: 'Consider adding a cache layer for better performance.' });
  if (!hasComponent('monitoring')) feedback.push({ type: 'info', message: 'Monitoring helps detect issues in production.' });

  // Cap values
  latency      = Math.max(50, latency);
  availability = Math.min(99.99, availability);

  // Scoring (0-100)
  const latencyScore      = latency      <= missionRequirements.latencyMs   ? 25 : Math.max(0, 25 - (latency - missionRequirements.latencyMs) / 10);
  const availabilityScore = availability >= missionRequirements.availability ? 25 : Math.max(0, 25 - (missionRequirements.availability - availability) * 5);
  const throughputScore   = throughput   >= missionRequirements.throughput   ? 25 : Math.max(0, 25 * (throughput / missionRequirements.throughput));
  const budgetScore       = monthlyCost  <= missionRequirements.budget       ? 25 : Math.max(0, 25 - ((monthlyCost - missionRequirements.budget) / missionRequirements.budget) * 25);

  // Anti-pattern topology penalty: -5 per mis-wired effective component (max -15)
  let topologyPenalty = 0;
  if (lbDisconnected)  topologyPenalty += 5;
  if (lbPartial)       topologyPenalty += 2;
  if (cdnFloating)     topologyPenalty += 5;
  if (apiGwFloating)   topologyPenalty += 5;
  topologyPenalty = Math.min(topologyPenalty, 15);

  const score = Math.max(0, Math.round(latencyScore + availabilityScore + throughputScore + budgetScore - topologyPenalty));

  // XP calculation
  const xpEarned = Math.round((score / 100) * missionRequirements.baseXp);

  // Bonus XP from optional components
  let bonusXp = 0;
  const achievements: string[] = [];
  if (missionRequirements.bonusComponents) {
    for (const bonus of missionRequirements.bonusComponents) {
      if (hasComponent(bonus.component)) bonusXp += bonus.xp;
    }
  }

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
