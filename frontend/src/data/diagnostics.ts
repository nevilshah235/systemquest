/**
 * diagnostics.ts
 * Generates metric-specific root-cause analysis with progressive hints
 * that guide the learner toward discovering the solution themselves.
 */

import { Architecture, SimulationMetrics, MissionRequirements } from './types';

export interface FixSuggestion {
  component: string;
  icon: string;
  solution: string;  // shown only after all hints exhausted
  impact: string;
}

export interface MetricDiagnosis {
  /** One-line summary of the root cause */
  cause: string;
  /** Detailed explanation of why the metric is failing */
  detail: string;
  /** Progressive hints — vague → specific, never reveal the answer directly */
  hints: string[];
  /** Specific solutions — only revealed after the user has seen all hints */
  solutions: FixSuggestion[];
}

function hasComponent(arch: Architecture, type: string): boolean {
  return arch.components.some((c) => c.type === type);
}

// ── Latency ───────────────────────────────────────────────────────────────────

export function diagnoseLatency(
  metrics: SimulationMetrics,
  req: MissionRequirements,
  arch: Architecture
): MetricDiagnosis | null {
  if (metrics.latencyMs <= req.performance.latencyMs) return null;

  const causes: string[] = [];
  const solutions: FixSuggestion[] = [];

  if (!hasComponent(arch, 'cache')) {
    causes.push('every request hits the database directly');
    solutions.push({
      component: 'cache',
      icon: '⚡',
      solution: 'Add a Cache layer',
      impact: '−60ms latency, −40% DB load',
    });
  }
  if (!hasComponent(arch, 'cdn')) {
    causes.push('static assets are fetched from the origin server on every request');
    solutions.push({
      component: 'cdn',
      icon: '🌐',
      solution: 'Add a CDN',
      impact: '−40ms for static content',
    });
  }
  if (!hasComponent(arch, 'loadbalancer')) {
    causes.push('a single server handles all requests without load distribution');
    solutions.push({
      component: 'loadbalancer',
      icon: '⚖️',
      solution: 'Add a Load Balancer',
      impact: '−10ms avg, prevents hot-spot spikes',
    });
  }

  const causeText = causes.length
    ? causes.join(' and ')
    : 'insufficient processing capacity for the request volume';

  return {
    cause: `Latency is ${metrics.latencyMs}ms vs target ${req.performance.latencyMs}ms`,
    detail: `Response time is high because ${causeText}. Each uncached request creates a full round-trip through the server to the database, adding significant overhead.`,
    hints: [
      'Consider how repeated requests affect the database — is every user asking for the same data?',
      'What if frequently accessed data could be returned instantly without touching the database at all?',
      'Think about a dedicated layer that sits between the server and database and remembers recent results.',
    ],
    solutions,
  };
}

// ── Availability ──────────────────────────────────────────────────────────────

export function diagnoseAvailability(
  metrics: SimulationMetrics,
  req: MissionRequirements,
  arch: Architecture
): MetricDiagnosis | null {
  if (metrics.availability >= req.performance.availability) return null;

  const causes: string[] = [];
  const solutions: FixSuggestion[] = [];

  if (!hasComponent(arch, 'loadbalancer')) {
    causes.push('a single server is a single point of failure');
    solutions.push({
      component: 'loadbalancer',
      icon: '⚖️',
      solution: 'Add a Load Balancer',
      impact: '+0.5% availability, eliminates SPOF',
    });
  }
  if (!hasComponent(arch, 'monitoring')) {
    causes.push('there is no visibility into when failures occur');
    solutions.push({
      component: 'monitoring',
      icon: '📊',
      solution: 'Add Monitoring',
      impact: '+0.3% uptime via fast incident response',
    });
  }
  const serverCount = arch.components.filter((c) => c.type === 'server').length;
  if (serverCount < 2) {
    causes.push('only one application server means zero redundancy');
    solutions.push({
      component: 'server',
      icon: '🖥️',
      solution: 'Add a second App Server',
      impact: '+0.4% availability (N+1 redundancy)',
    });
  }

  return {
    cause: `Availability is ${metrics.availability}% vs required ${req.performance.availability}%`,
    detail: `The system has single points of failure because ${causes.join(' and ')}. High availability requires redundancy at every layer so the system can survive individual component failures.`,
    hints: [
      'Think about what happens to your users if the only server in your architecture crashes or restarts.',
      'What component ensures traffic keeps flowing even when one server becomes unavailable?',
      'Consider how redundancy at every layer — traffic routing, application, and observability — eliminates single points of failure.',
    ],
    solutions,
  };
}

// ── Throughput ────────────────────────────────────────────────────────────────

export function diagnoseThroughput(
  metrics: SimulationMetrics,
  req: MissionRequirements,
  arch: Architecture
): MetricDiagnosis | null {
  if (metrics.throughput >= req.traffic.concurrent) return null;

  const gap = req.traffic.concurrent - metrics.throughput;
  const causes: string[] = [];
  const solutions: FixSuggestion[] = [];
  const hasLB = hasComponent(arch, 'loadbalancer');
  const serverCount = arch.components.filter((c) => c.type === 'server').length;

  if (!hasLB) {
    causes.push('traffic cannot be distributed across multiple servers');
    solutions.push({
      component: 'loadbalancer',
      icon: '⚖️',
      solution: 'Add a Load Balancer',
      impact: `+${Math.round(metrics.throughput * 1.5).toLocaleString()} users (2.5× capacity)`,
    });
  }
  if (!hasComponent(arch, 'cache')) {
    causes.push('the database becomes the bottleneck under repeated identical queries');
    solutions.push({
      component: 'cache',
      icon: '⚡',
      solution: 'Add a Cache layer',
      impact: `+${Math.round(metrics.throughput * 0.8).toLocaleString()} users (1.8× capacity)`,
    });
  }
  // When LB is present but only one server, horizontal scaling is the key missing step
  if (hasLB && serverCount < 2) {
    causes.push('the load balancer has only one server to route to — horizontal scaling requires multiple servers');
    solutions.push({
      component: 'server',
      icon: '🖥️',
      solution: 'Add a 2nd (and 3rd) App Server — each adds 500 concurrent users',
      impact: `+${500 * Math.ceil(gap / 500)} users (${Math.ceil(gap / 500)} extra server${Math.ceil(gap / 500) > 1 ? 's' : ''})`,
    });
  } else if (!hasLB && serverCount < 2) {
    solutions.push({
      component: 'server',
      icon: '🖥️',
      solution: 'Add more App Servers (needs Load Balancer too)',
      impact: '+500 users per additional server',
    });
  }

  // Hints adapt based on whether LB is already in place
  const hints = hasLB
    ? [
        'You have a Load Balancer — great start. But a load balancer can only distribute work if there\'s more than one server to send it to.',
        'Think of a load balancer as a traffic director: it\'s useless without multiple lanes. How many App Servers are in your architecture right now?',
        'To handle more concurrent users, you need to add more App Server blocks to the canvas — each one adds ~500 users of capacity.',
      ]
    : [
        'Think about what limits how many users your system can serve at once — is one component becoming a bottleneck?',
        'What if the system could spread user requests across multiple processing units simultaneously?',
        'Consider components that both distribute incoming traffic and reduce unnecessary repeat work on the database.',
      ];

  return {
    cause: `Throughput is ${metrics.throughput.toLocaleString()} users vs target ${req.traffic.concurrent.toLocaleString()}`,
    detail: `The architecture handles ${metrics.throughput.toLocaleString()} concurrent users but needs ${req.traffic.concurrent.toLocaleString()} — a gap of ${gap.toLocaleString()}. ${
      hasLB && serverCount < 2
        ? 'You have a Load Balancer but only one App Server. A load balancer scales throughput by routing across multiple servers — add more servers to unlock its full benefit.'
        : causes.length
        ? `This is because ${causes.join(' and ')}.`
        : 'The current setup lacks horizontal scaling capacity.'
    }`,
    hints,
    solutions,
  };
}

// ── Cost ──────────────────────────────────────────────────────────────────────

export function diagnoseCost(
  metrics: SimulationMetrics,
  req: MissionRequirements,
  arch: Architecture
): MetricDiagnosis | null {
  if (metrics.monthlyCost <= req.budget) return null;

  const over = metrics.monthlyCost - req.budget;
  const expensive = arch.components
    .filter((c) => ['server', 'database', 'loadbalancer', 'apigateway'].includes(c.type))
    .map((c) => c.type);

  const solutions: FixSuggestion[] = [];

  const serverCount = arch.components.filter((c) => c.type === 'server').length;
  if (serverCount > 1) {
    solutions.push({
      component: 'server',
      icon: '🖥️',
      solution: 'Remove redundant App Servers',
      impact: `−$${(serverCount - 1) * 50}/month`,
    });
  }
  if (hasComponent(arch, 'cdn') && hasComponent(arch, 'cache')) {
    solutions.push({
      component: 'cdn',
      icon: '🌐',
      solution: 'Cache can replace CDN at lower scale',
      impact: '−$30/month',
    });
  }
  solutions.push({
    component: 'storage',
    icon: '💾',
    solution: 'Use object storage for files instead of extra servers',
    impact: '−$30/month vs extra server',
  });

  return {
    cause: `Monthly cost is $${metrics.monthlyCost} vs budget $${req.budget} (+$${over} over)`,
    detail: `Your architecture costs $${over} more than the budget. The most expensive components are ${expensive.length ? expensive.join(', ') : 'the current stack'}. Some components may be over-provisioned or duplicating each other's responsibilities.`,
    hints: [
      'Review your architecture and ask: is every component earning its cost, or is something running that isn\'t needed at this scale?',
      'Could any two components be serving the same purpose — meaning you might be paying twice for one job?',
      'Think about cheaper, purpose-built alternatives for tasks like file storage — not everything needs a full server.',
    ],
    solutions,
  };
}

// ── Master export ─────────────────────────────────────────────────────────────

export interface FullDiagnosis {
  latency:      MetricDiagnosis | null;
  availability: MetricDiagnosis | null;
  throughput:   MetricDiagnosis | null;
  cost:         MetricDiagnosis | null;
}

export function diagnoseAll(
  metrics: SimulationMetrics,
  req: MissionRequirements,
  arch: Architecture
): FullDiagnosis {
  return {
    latency:      diagnoseLatency(metrics, req, arch),
    availability: diagnoseAvailability(metrics, req, arch),
    throughput:   diagnoseThroughput(metrics, req, arch),
    cost:         diagnoseCost(metrics, req, arch),
  };
}
