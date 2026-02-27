/**
 * Integration tests — /api/simulation/run route
 * Tests SimulationEngine integration with a real mission from the test DB.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

const SIM_MISSION_SLUG = 'ci-sim-mission';
let accessToken: string;
let userId: string;

beforeAll(async () => {
  await prisma.$connect();

  // Clean slate
  await prisma.missionAttempt.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.user.deleteMany({ where: { email: 'sim@ci.test' } });
  await prisma.mission.deleteMany({ where: { slug: SIM_MISSION_SLUG } });

  // Create test mission with realistic requirements
  await prisma.mission.create({
    data: {
      slug: SIM_MISSION_SLUG,
      title: 'CI Simulation Test Mission',
      difficulty: 1,
      estimatedTime: '5 min',
      xpReward: 100,
      order: 9998,
      learningPath: 'ci-sim-path',
      skillLevel: 'beginner',
      description: 'CI simulation test',
      scenario: 'CI scenario',
      objectives: JSON.stringify(['Handle 1000 users']),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000, daily: 10000 },
        performance: { latencyMs: 200, availability: 99.0 },
        budget: 500,
      }),
      components: JSON.stringify({
        available: ['client', 'server', 'database', 'cache', 'loadbalancer'],
        required: ['client', 'server', 'database'],
        hints: [],
      }),
      feedbackData: JSON.stringify({}),
    },
  });

  // Register test user
  const regRes = await request(app).post('/api/auth/register').send({
    email: 'sim@ci.test',
    username: 'simplayer',
    password: 'SecurePass123!',
  });
  accessToken = regRes.body.accessToken;
  userId = regRes.body.user.id;
});

afterAll(async () => {
  await prisma.missionAttempt.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.mission.deleteMany({ where: { slug: SIM_MISSION_SLUG } });
  await prisma.$disconnect();
});

// ── POST /api/simulation/run ───────────────────────────────────────────────────────
describe('POST /api/simulation/run', () => {
  it('returns metrics and missionTitle for a valid architecture', async () => {
    const res = await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        missionSlug: SIM_MISSION_SLUG,
        architecture: {
          components: [
            { id: 'client-1', type: 'client', x: 0, y: 0 },
            { id: 'server-1', type: 'server', x: 100, y: 0 },
            { id: 'db-1', type: 'database', x: 200, y: 0 },
          ],
          connections: [
            { from: 'client-1', to: 'server-1' },
            { from: 'server-1', to: 'db-1' },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.metrics).toHaveProperty('latencyMs');
    expect(res.body.metrics).toHaveProperty('throughput');
    expect(res.body.metrics).toHaveProperty('availability');
    expect(res.body.metrics).toHaveProperty('monthlyCost');
    expect(res.body.metrics).toHaveProperty('score');
    expect(res.body.missionTitle).toBe('CI Simulation Test Mission');
  });

  it('persists the attempt in the database', async () => {
    await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        missionSlug: SIM_MISSION_SLUG,
        architecture: {
          components: [{ id: 'srv-1', type: 'server', x: 0, y: 0 }],
          connections: [],
        },
      });

    const attempt = await prisma.missionAttempt.findFirst({ where: { userId } });
    expect(attempt).not.toBeNull();
    expect(attempt?.score).toBeGreaterThanOrEqual(0);
  });

  it('returns 400 when missionSlug is missing', async () => {
    const res = await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        architecture: { components: [], connections: [] },
      });
    expect(res.status).toBe(400);
  });

  it('returns 404 when missionSlug does not exist', async () => {
    const res = await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        missionSlug: 'non-existent-mission-xyz',
        architecture: { components: [], connections: [] },
      });
    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post('/api/simulation/run')
      .send({ missionSlug: SIM_MISSION_SLUG, architecture: {} });
    expect(res.status).toBe(401);
  });

  it('awards score >= 60 when a solid architecture passes requirements', async () => {
    const res = await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        missionSlug: SIM_MISSION_SLUG,
        architecture: {
          components: [
            { id: 'client-1', type: 'client', x: 0, y: 0 },
            { id: 'lb-1', type: 'loadbalancer', x: 50, y: 0 },
            { id: 'srv-1', type: 'server', x: 100, y: 0 },
            { id: 'srv-2', type: 'server', x: 100, y: 100 },
            { id: 'cache-1', type: 'cache', x: 150, y: 0 },
            { id: 'db-1', type: 'database', x: 200, y: 0 },
          ],
          connections: [
            { from: 'client-1', to: 'lb-1' },
            { from: 'lb-1', to: 'srv-1' },
            { from: 'lb-1', to: 'srv-2' },
            { from: 'srv-1', to: 'cache-1' },
            { from: 'cache-1', to: 'db-1' },
          ],
        },
      });

    expect(res.status).toBe(200);
    expect(res.body.metrics.score).toBeGreaterThanOrEqual(60);
  });
});
