/**
 * diagnostics.ts
 * Generates metric-specific root-cause analysis and before/after
 * improvement projections based on the placed architecture.
 */

import { Architecture, SimulationMetrics, MissionRequirements } from './types';

export interface MetricDiagnosis {
  /** One-line summary of the root cause */
  cause: string;
  /** Detailed explanation */
  detail: string;
  /** Specific components that would help, with projected impact */
  fixes: FixSuggestion[];
}

export interface FixSuggestion {
  component: string;
  icon: string;
  label: string;
  impact: string; // e.g. "−60ms latency"
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
  if (metrics.latencyMs <= req.performance.latencyMs) return null; // passing — no need

  const causes: string[] = [];
  const fixes: FixSuggestion[] = [];

  if (!hasComponent(arch, 'cache')) {
    causes.push('every request hits the database directly');
    fixes.push({
      component: 'cache',
      icon: '⚡',
      label: 'Add Cache layer',
      impact: '−60ms latency, −40% database load',
    });
  }
  if (!hasComponent(arch, 'cdn')) {
    causes.push('static assets are served from the origin server');
    fixes.push({
      component: 'cdn',
      icon: '🌐',
      label: 'Add CDN',
      impact: '−40ms for static content',
    });
  }
  if (!hasComponent(arch, 'loadbalancer')) {
    causes.push('a single server handles all requests without load distribution');
    fixes.push({
      component: 'loadbalancer',
      icon: '⚖️',
      label: 'Add Load Balancer',
      impact: '−10ms avg, prevents hot-spot spikes',
    });
  }

  const causeText = causes.length
    ? causes.join(' and ')
    : 'insufficient processing capacity for the request volume';

  return {
    cause: `Latency is ${metrics.latencyMs}ms vs target ${req.performance.latencyMs}ms`,
    detail: `Response time is high because ${causeText}. Each uncached request creates a full round-trip through the server to the database, adding significant overhead.`,
    fixes,
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
  const fixes: FixSuggestion[] = [];

  if (!hasComponent(arch, 'loadbalancer')) {
    causes.push('a single server is a single point of failure — any restart or crash takes the system offline');
    fixes.push({
      component: 'loadbalancer',
      icon: '⚖️',
      label: 'Add Load Balancer',
      impact: '+0.5% availability, eliminates SPOF',
    });
  }
  if (!hasComponent(arch, 'monitoring')) {
    causes.push('there is no monitoring to detect and alert on failures in real time');
    fixes.push({
      component: 'monitoring',
      icon: '📊',
      label: 'Add Monitoring',
      impact: '+0.3% effective uptime via fast incident response',
    });
  }
  const serverCount = arch.components.filter((c) => c.type === 'server').length;
  if (serverCount < 2) {
    causes.push('only one application server means zero redundancy');
    fixes.push({
      component: 'server',
      icon: '🖥️',
      label: 'Add a second App Server',
      impact: '+0.4% availability, N+1 redundancy',
    });
  }

  return {
    cause: `Availability is ${metrics.availability}% vs required ${req.performance.availability}%`,
    detail: `The system has single points of failure because ${causes.join(' and ')}. High availability requires redundancy at every layer.`,
    fixes,
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
  const fixes: FixSuggestion[] = [];

  if (!hasComponent(arch, 'loadbalancer')) {
    causes.push('traffic cannot be distributed across multiple servers');
    fixes.push({
      component: 'loadbalancer',
      icon: '⚖️',
      label: 'Add Load Balancer',
      impact: `+${Math.round(metrics.throughput * 1.5).toLocaleString()} users (2.5× multiplier)`,
    });
  }
  if (!hasComponent(arch, 'cache')) {
    causes.push('the database is the bottleneck under repeated identical queries');
    fixes.push({
      component: 'cache',
      icon: '⚡',
      label: 'Add Cache',
      impact: `+${Math.round(metrics.throughput * 0.8).toLocaleString()} users (1.8× multiplier)`,
    });
  }
  const serverCount = arch.components.filter((c) => c.type === 'server').length;
  if (serverCount < 2) {
    fixes.push({
      component: 'server',
      icon: '🖥️',
      label: 'Add more App Servers',
      impact: '+500 users per additional server',
    });
  }

  return {
    cause: `Throughput is ${metrics.throughput.toLocaleString()} users vs target ${req.traffic.concurrent.toLocaleString()}`,
    detail: `The architecture handles ${metrics.throughput.toLocaleString()} concurrent users but needs ${req.traffic.concurrent.toLocaleString()} — a gap of ${gap.toLocaleString()}. This is because ${causes.length ? causes.join(' and ') : 'the current setup lacks horizontal scaling capacity'}.`,
    fixes,
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

  const fixes: FixSuggestion[] = [];

  const serverCount = arch.components.filter((c) => c.type === 'server').length;
  if (serverCount > 1) {
    fixes.push({
      component: 'server',
      icon: '🖥️',
      label: 'Remove redundant App Servers',
      impact: `−$${(serverCount - 1) * 50}/month`,
    });
  }
  if (hasComponent(arch, 'cdn') && hasComponent(arch, 'cache')) {
    fixes.push({
      component: 'cdn',
      icon: '🌐',
      label: 'Cache can replace CDN at lower scale',
      impact: '−$30/month',
    });
  }
  fixes.push({
    component: 'storage',
    icon: '💾',
    label: 'Use object storage instead of extra servers for files',
    impact: '−$30/month vs extra server',
  });

  return {
    cause: `Monthly cost is $${metrics.monthlyCost} vs budget $${req.budget} (+$${over} over)`,
    detail: `Your architecture costs $${over} more than the budget. The most expensive components are ${expensive.length ? expensive.join(', ') : 'the current stack'}. Removing or replacing components with cheaper alternatives can bring costs within budget.`,
    fixes,
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
