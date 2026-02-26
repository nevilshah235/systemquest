/**
 * solutions.ts
 * Optimal "reference" architectures for each mission used by SolutionViewer.
 * Components are pre-positioned for a clean canvas layout.
 */

import { Architecture, COMPONENT_META, ComponentType } from './types';

export interface MissionSolution {
  architecture: Architecture;
  /** Ordered steps explaining how to build this architecture */
  steps: string[];
  /** One-paragraph explanation of why this design works */
  explanation: string;
}

export const MISSION_SOLUTIONS: Record<string, MissionSolution> = {

  // ── Mission 1: MVP Launch ──────────────────────────────────────────────────
  // Target: 1,000 users · 200ms · 99% uptime · $500 budget
  // Cost: $0+20+50+50+40+15+30+10 = $215 ✓
  'mvp-launch': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',           x: 560, y: 40  },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 160 },
        { id: 'sol-server1',    type: 'server',        x: 160, y: 300 },
        { id: 'sol-server2',    type: 'server',        x: 440, y: 300 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 640, y: 300 },
        { id: 'sol-cache',      type: 'cache',         x: 300, y: 420 },
        { id: 'sol-db',         type: 'database',      x: 300, y: 540 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-lb'      },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc5',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc6',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc7',  from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc8',  from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc9',  from: 'sol-monitoring', to: 'sol-server2' },
      ],
    },
    steps: [
      'Place Client → Load Balancer → 2 App Servers (handles 1k users, eliminates SPOF)',
      'Connect both servers to Cache, then Cache → Database (Server → Cache → DB path)',
      'Add CDN off the Client for static asset delivery',
      'Add Monitoring to push availability to 99%',
    ],
    explanation:
      'Two App Servers behind a Load Balancer handle 1,000 concurrent users and remove the single point of failure. A Cache between the servers and the Database cuts latency to sub-200ms. CDN offloads static assets, and Monitoring provides the observability needed for 99% uptime.',
  },

  // ── Mission 2: Scaling Up ──────────────────────────────────────────────────
  // Target: 10,000 users · 150ms · 99.9% uptime · $2,000 budget
  // Cost: $0+20+150+40+15+30+25+35+10 = $325 ✓
  'scaling-up': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 40  },
        { id: 'sol-cdn',        type: 'cdn',           x: 580, y: 40  },
        { id: 'sol-apigw',      type: 'apigateway',   x: 300, y: 150 },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 270 },
        { id: 'sol-server1',    type: 'server',        x: 80,  y: 400 },
        { id: 'sol-server2',    type: 'server',        x: 300, y: 400 },
        { id: 'sol-server3',    type: 'server',        x: 520, y: 400 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 700, y: 400 },
        { id: 'sol-cache',      type: 'cache',         x: 190, y: 530 },
        { id: 'sol-queue',      type: 'queue',         x: 420, y: 530 },
        { id: 'sol-db',         type: 'database',      x: 190, y: 650 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache'   },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache'   },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-cache',   to: 'sol-db'      },
        { id: 'sc11', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc12', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'Add API Gateway to manage and throttle 10k incoming requests',
      'Scale to 3 App Servers behind the Load Balancer for throughput',
      'Connect 2 servers to Cache → DB; 3rd server feeds the Queue for async tasks',
      'Add CDN + Monitoring for 99.9% availability',
    ],
    explanation:
      'Scaling to 10k users requires three App Servers behind a Load Balancer plus an API Gateway for traffic management. A Cache slashes DB round-trips to hit 150ms latency. A Queue decouples heavy background tasks. CDN and Monitoring together push availability to 99.9%.',
  },

  // ── Mission 3: Global Expansion ───────────────────────────────────────────
  // Target: 100,000 users · 100ms · 99.99% uptime · $10,000 budget
  // Cost: $0+20+150+40+30+30+25+35+20+10 = $360 ✓
  'global-expansion': {
    architecture: {
      components: [
        { id: 'sol-client',     type: 'client',       x: 300, y: 30  },
        { id: 'sol-cdn',        type: 'cdn',           x: 580, y: 30  },
        { id: 'sol-apigw',      type: 'apigateway',   x: 300, y: 140 },
        { id: 'sol-lb',         type: 'loadbalancer',  x: 300, y: 260 },
        { id: 'sol-server1',    type: 'server',        x: 80,  y: 390 },
        { id: 'sol-server2',    type: 'server',        x: 300, y: 390 },
        { id: 'sol-server3',    type: 'server',        x: 520, y: 390 },
        { id: 'sol-monitoring', type: 'monitoring',    x: 700, y: 390 },
        { id: 'sol-cache1',     type: 'cache',         x: 80,  y: 520 },
        { id: 'sol-cache2',     type: 'cache',         x: 300, y: 520 },
        { id: 'sol-queue',      type: 'queue',         x: 520, y: 520 },
        { id: 'sol-db',         type: 'database',      x: 190, y: 640 },
        { id: 'sol-storage',    type: 'storage',       x: 420, y: 640 },
      ],
      connections: [
        { id: 'sc1',  from: 'sol-client',  to: 'sol-cdn'     },
        { id: 'sc2',  from: 'sol-client',  to: 'sol-apigw'   },
        { id: 'sc3',  from: 'sol-apigw',   to: 'sol-lb'      },
        { id: 'sc4',  from: 'sol-lb',      to: 'sol-server1' },
        { id: 'sc5',  from: 'sol-lb',      to: 'sol-server2' },
        { id: 'sc6',  from: 'sol-lb',      to: 'sol-server3' },
        { id: 'sc7',  from: 'sol-server1', to: 'sol-cache1'  },
        { id: 'sc8',  from: 'sol-server2', to: 'sol-cache2'  },
        { id: 'sc9',  from: 'sol-server3', to: 'sol-queue'   },
        { id: 'sc10', from: 'sol-cache1',  to: 'sol-db'      },
        { id: 'sc11', from: 'sol-cache2',  to: 'sol-db'      },
        { id: 'sc12', from: 'sol-queue',   to: 'sol-storage' },
        { id: 'sc13', from: 'sol-monitoring', to: 'sol-server1' },
        { id: 'sc14', from: 'sol-monitoring', to: 'sol-server2' },
        { id: 'sc15', from: 'sol-monitoring', to: 'sol-server3' },
      ],
    },
    steps: [
      'CDN + API Gateway handle global routing and edge delivery',
      'Load Balancer + 3 App Servers cover 100k concurrent users',
      'Two Cache layers (one per server group) keep latency under 100ms globally',
      'Queue feeds into Storage for distributed async file processing',
      'Monitoring across all servers achieves 99.99% uptime',
    ],
    explanation:
      'Global scale demands CDN for edge delivery, API Gateway for geo-routing, 3 App Servers behind a Load Balancer for throughput, two Cache layers for sub-100ms latency everywhere, a Queue + Storage tier for async media workloads, and full Monitoring for five-nines availability.',
  },
};

// ── Gap analysis helpers ────────────────────────────────────────────────────

export interface GapItem {
  type: string;
  needed: number;
  have: number;
  missing: number;
}

/** Compares the current canvas architecture against the optimal solution. */
export function computeGap(current: Architecture, missionSlug: string): GapItem[] {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return [];

  // Count optimal component types
  const optimalCounts: Record<string, number> = {};
  for (const c of solution.architecture.components) {
    optimalCounts[c.type] = (optimalCounts[c.type] ?? 0) + 1;
  }

  // Count current architecture component types
  const currentCounts: Record<string, number> = {};
  for (const c of current.components) {
    currentCounts[c.type] = (currentCounts[c.type] ?? 0) + 1;
  }

  return Object.entries(optimalCounts)
    .map(([type, needed]) => ({ type, needed, have: currentCounts[type] ?? 0, missing: needed - (currentCounts[type] ?? 0) }))
    .filter((g) => g.missing > 0);
}

/** Returns 0-100 optimality score based on fraction of optimal components present. */
export function computeOptimality(current: Architecture, missionSlug: string): number {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return 0;

  const total = solution.architecture.components.length;
  const gap = computeGap(current, missionSlug).reduce((sum, g) => sum + g.missing, 0);
  return Math.round(((total - gap) / total) * 100);
}

// ── Connection topology gap analysis ────────────────────────────────────────

export interface ConnectionGapItem {
  /** Source component type */
  from: string;
  /** Target component type */
  to: string;
  /** How many of this edge exist in the ideal solution */
  needed: number;
  /** How many the user currently has */
  have: number;
  /** How many are still missing */
  missing: number;
  /** Human-readable label, e.g. "Load Balancer → App Server" */
  label: string;
}

/**
 * Compares the connection topology of the current architecture against the
 * optimal solution for a mission.
 *
 * Connections are normalised by *component type* (not component ID) so that
 * the diff is meaningful regardless of how nodes are named on the canvas.
 * For example, the ideal edge `sol-lb → sol-server1` becomes `loadbalancer → server`.
 * If the ideal has two `loadbalancer → server` edges and the user only has one,
 * a gap of 1 is reported.
 */
export function computeConnectionGap(
  current: Architecture,
  missionSlug: string,
): ConnectionGapItem[] {
  const solution = MISSION_SOLUTIONS[missionSlug];
  if (!solution) return [];

  /** Resolve a component id to its type within an architecture */
  const typeOf = (arch: Architecture, id: string): string | undefined =>
    arch.components.find((c) => c.id === id)?.type;

  // ── Build canonical edge-count map for the ideal solution ──────────────
  const optimalEdges: Record<string, number> = {};
  for (const conn of solution.architecture.connections) {
    const from = typeOf(solution.architecture, conn.from);
    const to   = typeOf(solution.architecture, conn.to);
    if (!from || !to) continue;
    const key = `${from}:${to}`;
    optimalEdges[key] = (optimalEdges[key] ?? 0) + 1;
  }

  // ── Build canonical edge-count map for the user's architecture ─────────
  const currentEdges: Record<string, number> = {};
  for (const conn of current.connections) {
    const from = typeOf(current, conn.from);
    const to   = typeOf(current, conn.to);
    if (!from || !to) continue;
    const key = `${from}:${to}`;
    currentEdges[key] = (currentEdges[key] ?? 0) + 1;
  }

  // ── Diff: return edges present in ideal but missing / under-represented ─
  return Object.entries(optimalEdges)
    .map(([key, needed]) => {
      const [from, to] = key.split(':');
      const have    = currentEdges[key] ?? 0;
      const missing = Math.max(0, needed - have);
      const fromMeta = COMPONENT_META[from as ComponentType];
      const toMeta   = COMPONENT_META[to as ComponentType];
      return {
        from,
        to,
        needed,
        have,
        missing,
        label: `${fromMeta?.label ?? from} → ${toMeta?.label ?? to}`,
      };
    })
    .filter((g) => g.missing > 0);
}
