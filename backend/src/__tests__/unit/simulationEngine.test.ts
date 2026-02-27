/**
 * Unit tests for runSimulation() — architecture metric calculations.
 * No database or network required.
 */
import { describe, it, expect } from 'vitest';
import { runSimulation, Architecture } from '../../services/simulationEngine';

// ── Shared mission requirements fixture ─────────────────────────────────────────
const MVP_REQUIREMENTS = {
  latencyMs: 200,
  availability: 99.0,
  throughput: 1000,
  budget: 500,
  baseXp: 150,
};

// ── Helpers ─────────────────────────────────────────────────────────────────────────
function makeArch(
  types: string[],
  connections: Array<{ from: string; to: string }> = [],
): Architecture {
  return {
    components: types.map((type, i) => ({ id: `${type}-${i}`, type, x: i * 100, y: 0 })),
    connections,
  };
}

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — return shape', () => {
  it('returns all required metric fields', () => {
    const arch = makeArch(['client', 'server', 'database']);
    const metrics = runSimulation(arch, MVP_REQUIREMENTS);

    expect(metrics).toHaveProperty('latencyMs');
    expect(metrics).toHaveProperty('availability');
    expect(metrics).toHaveProperty('throughput');
    expect(metrics).toHaveProperty('monthlyCost');
    expect(metrics).toHaveProperty('score');
    expect(metrics).toHaveProperty('allMetricsMet');
    expect(metrics).toHaveProperty('xpEarned');
    expect(metrics).toHaveProperty('bonusXp');
    expect(metrics).toHaveProperty('feedback');
    expect(metrics).toHaveProperty('achievements');
  });

  it('score is between 0 and 100', () => {
    const arch = makeArch(['client', 'server', 'database']);
    const { score } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it('feedback is an array', () => {
    const arch = makeArch(['client', 'server', 'database']);
    const { feedback } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(Array.isArray(feedback)).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — latency', () => {
  it('base latency starts at 320ms with no latency-reducing components', () => {
    // client, server, database each have 0 latencyReduction
    const arch = makeArch(['client', 'server', 'database']);
    const { latencyMs } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(latencyMs).toBe(320);
  });

  it('cache reduces latency by 60ms', () => {
    // Correctly wired: server-0 -> cache-2 -> database-1
    const arch: Architecture = {
      components: [
        { id: 'client-0', type: 'client', x: 0, y: 0 },
        { id: 'server-1', type: 'server', x: 100, y: 0 },
        { id: 'cache-2', type: 'cache', x: 200, y: 0 },
        { id: 'database-3', type: 'database', x: 300, y: 0 },
      ],
      connections: [
        { from: 'client-0', to: 'server-1' },
        { from: 'server-1', to: 'cache-2' },
        { from: 'cache-2', to: 'database-3' },
      ],
    };
    const { latencyMs } = runSimulation(arch, MVP_REQUIREMENTS);
    // 320 - 60 (cache) = 260
    expect(latencyMs).toBe(260);
  });

  it('cache + CDN with synergy reduces latency by 60 + 40 + 25 = 125ms', () => {
    const arch: Architecture = {
      components: [
        { id: 'client-0', type: 'client', x: 0, y: 0 },
        { id: 'cdn-1', type: 'cdn', x: 50, y: 0 },
        { id: 'server-2', type: 'server', x: 100, y: 0 },
        { id: 'cache-3', type: 'cache', x: 200, y: 0 },
        { id: 'database-4', type: 'database', x: 300, y: 0 },
      ],
      connections: [
        { from: 'client-0', to: 'cdn-1' },
        { from: 'cdn-1', to: 'server-2' },
        { from: 'server-2', to: 'cache-3' },
        { from: 'cache-3', to: 'database-4' },
      ],
    };
    const { latencyMs } = runSimulation(arch, MVP_REQUIREMENTS);
    // 320 - 60 (cache) - 40 (cdn) - 25 (synergy cache+cdn) = 195
    expect(latencyMs).toBe(195);
  });

  it('latency floor is capped at 50ms', () => {
    // Max latency reduction: cache(60) + cdn(40) + lb(10) + apigateway(15) + synergies
    const arch = makeArch(['client', 'server', 'database', 'cache', 'cdn', 'loadbalancer', 'apigateway', 'queue', 'storage', 'monitoring']);
    const { latencyMs } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(latencyMs).toBeGreaterThanOrEqual(50);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — availability', () => {
  it('base availability starts at 95%', () => {
    const arch = makeArch(['client']);
    const { availability } = runSimulation(arch, MVP_REQUIREMENTS);
    // client adds 0, base is 95
    expect(availability).toBe(95);
  });

  it('adding server and database increases availability', () => {
    const arch = makeArch(['client', 'server', 'database']);
    const { availability } = runSimulation(arch, MVP_REQUIREMENTS);
    // base 95 + server(0.5) + database(0) = 95.5
    expect(availability).toBeCloseTo(95.5, 1);
  });

  it('availability is capped at 99.99%', () => {
    const arch = makeArch(['client', 'server', 'database', 'cache', 'cdn', 'queue', 'storage', 'monitoring', 'monitoring', 'monitoring']);
    const { availability } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(availability).toBeLessThanOrEqual(99.99);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — throughput', () => {
  it('base throughput is 200 with a single server', () => {
    const arch = makeArch(['client', 'server']);
    const { throughput } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(throughput).toBe(200);
  });

  it('effective load balancer (connected to 2 servers) applies 2.5x multiplier', () => {
    const arch: Architecture = {
      components: [
        { id: 'lb-0', type: 'loadbalancer', x: 0, y: 0 },
        { id: 'srv-1', type: 'server', x: 100, y: 0 },
        { id: 'srv-2', type: 'server', x: 100, y: 100 },
      ],
      connections: [
        { from: 'lb-0', to: 'srv-1' },
        { from: 'lb-0', to: 'srv-2' },
      ],
    };
    const { throughput } = runSimulation(arch, MVP_REQUIREMENTS);
    // base 200 * 2.5 (lb) * 6^1 (1 extra server) = 200 * 2.5 * 6 = 3000
    expect(throughput).toBe(3000);
  });

  it('floating load balancer (no server connections) gives no multiplier benefit', () => {
    const archWithLB = makeArch(['loadbalancer', 'server']);
    const archWithoutLB = makeArch(['server']);
    const withLB = runSimulation(archWithLB, MVP_REQUIREMENTS);
    const withoutLB = runSimulation(archWithoutLB, MVP_REQUIREMENTS);
    // A disconnected LB contributes no throughput improvement
    expect(withLB.throughput).toBeLessThanOrEqual(withoutLB.throughput * 1.1);
  });

  it('scale-master achievement unlocked when throughput >= 10,000', () => {
    // LB + 3 servers + cache = 200 * 2.5 (lb) * 6^2 (2 extra servers) * 1.8 (cache) = 81,000
    const arch: Architecture = {
      components: [
        { id: 'lb-0', type: 'loadbalancer', x: 0, y: 0 },
        { id: 'srv-1', type: 'server', x: 100, y: 0 },
        { id: 'srv-2', type: 'server', x: 100, y: 100 },
        { id: 'srv-3', type: 'server', x: 100, y: 200 },
        { id: 'cache-4', type: 'cache', x: 200, y: 0 },
      ],
      connections: [
        { from: 'lb-0', to: 'srv-1' },
        { from: 'lb-0', to: 'srv-2' },
        { from: 'lb-0', to: 'srv-3' },
        { from: 'srv-1', to: 'cache-4' },
      ],
    };
    const { throughput, achievements } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(throughput).toBeGreaterThanOrEqual(10000);
    expect(achievements).toContain('scale-master');
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — cost', () => {
  it('monthlyCost sums component costs correctly', () => {
    // server=$50, database=$40, cache=$15 -> $105
    const arch = makeArch(['server', 'database', 'cache']);
    const { monthlyCost } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(monthlyCost).toBe(105);
  });

  it('budget-master achievement awarded when cost is <= 95% of budget', () => {
    // Just client: cost = 0, budget = 500 -> qualifies
    const arch = makeArch(['client', 'server', 'database']);
    const { achievements } = runSimulation(arch, { ...MVP_REQUIREMENTS, budget: 1000 });
    expect(achievements).toContain('budget-master');
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — topology penalties & feedback', () => {
  it('warns when no client component is present', () => {
    const arch = makeArch(['server', 'database']);
    const { feedback } = runSimulation(arch, MVP_REQUIREMENTS);
    const warnings = feedback.filter((f) => f.type === 'warning').map((f) => f.message);
    expect(warnings.some((m) => m.includes('client'))).toBe(true);
  });

  it('warns when load balancer has only 1 server connection', () => {
    const arch: Architecture = {
      components: [
        { id: 'lb-0', type: 'loadbalancer', x: 0, y: 0 },
        { id: 'srv-1', type: 'server', x: 100, y: 0 },
      ],
      connections: [{ from: 'lb-0', to: 'srv-1' }],
    };
    const { feedback } = runSimulation(arch, MVP_REQUIREMENTS);
    const warnings = feedback.filter((f) => f.type === 'warning').map((f) => f.message);
    expect(warnings.some((m) => m.includes('Load balancer has only 1 server'))).toBe(true);
  });

  it('warns when CDN is floating (no connections)', () => {
    const arch = makeArch(['client', 'server', 'database', 'cdn']);
    const { feedback } = runSimulation(arch, MVP_REQUIREMENTS);
    const warnings = feedback.filter((f) => f.type === 'warning').map((f) => f.message);
    expect(warnings.some((m) => m.includes('CDN has no connections'))).toBe(true);
  });

  it('allMetricsMet is false when requirements are not satisfied', () => {
    // A single server with no cache will not meet all metrics for a high-demand mission
    const arch = makeArch(['client', 'server']);
    const strictReqs = { latencyMs: 50, availability: 99.99, throughput: 50000, budget: 50, baseXp: 100 };
    const { allMetricsMet } = runSimulation(arch, strictReqs);
    expect(allMetricsMet).toBe(false);
  });

  it('allMetricsMet is true when all requirements are satisfied', () => {
    // Generous requirements matched by simple architecture
    const arch = makeArch(['client', 'server', 'database']);
    const easyReqs = { latencyMs: 400, availability: 90, throughput: 100, budget: 1000, baseXp: 100 };
    const { allMetricsMet } = runSimulation(arch, easyReqs);
    expect(allMetricsMet).toBe(true);
  });
});

// ────────────────────────────────────────────────────────────────────────────────
describe('runSimulation — XP', () => {
  it('xpEarned is 0 when score is 0', () => {
    // Empty architecture will have a score of 0 (no components = no points)
    const arch: Architecture = { components: [], connections: [] };
    const { xpEarned } = runSimulation(arch, MVP_REQUIREMENTS);
    expect(xpEarned).toBe(0);
  });

  it('xpEarned scales with score', () => {
    const goodArch = makeArch(['client', 'server', 'database', 'cache']);
    const poorArch = makeArch(['client']);
    const goodMetrics = runSimulation(goodArch, { ...MVP_REQUIREMENTS, throughput: 100, budget: 1000 });
    const poorMetrics = runSimulation(poorArch, MVP_REQUIREMENTS);
    expect(goodMetrics.xpEarned).toBeGreaterThan(poorMetrics.xpEarned);
  });

  it('bonusXp is awarded for optional bonus components', () => {
    const arch = makeArch(['client', 'server', 'database', 'monitoring']);
    const { bonusXp } = runSimulation(arch, {
      ...MVP_REQUIREMENTS,
      bonusComponents: [{ component: 'monitoring', xp: 50, label: 'Monitoring bonus' }],
    });
    expect(bonusXp).toBe(50);
  });
});
