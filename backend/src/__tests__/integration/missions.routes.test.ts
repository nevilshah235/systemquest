/**
 * Integration tests — /api/missions routes
 * Creates a minimal test mission in the test DB; cleans up on completion.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

let accessToken: string;
let userId: string;
let testMissionSlug: string;

const TEST_MISSION_SLUG = 'ci-test-mission-foundations';

beforeAll(async () => {
  await prisma.$connect();

  // Clean up
  await prisma.missionAttempt.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.mission.deleteMany({ where: { slug: TEST_MISSION_SLUG } });

  // Create a test mission (first in foundations path → always unlocked)
  await prisma.mission.create({
    data: {
      slug: TEST_MISSION_SLUG,
      title: 'CI Test Mission',
      difficulty: 1,
      estimatedTime: '5 min',
      xpReward: 100,
      order: 9999,
      learningPath: 'ci-test-path', // isolated path → always unlocked at idx 0
      skillLevel: 'beginner',
      description: 'CI test mission',
      scenario: 'Test scenario for CI',
      objectives: JSON.stringify(['Deploy the app']),
      requirements: JSON.stringify({
        traffic: { concurrent: 1000, daily: 10000 },
        performance: { latencyMs: 200, availability: 99.0 },
        budget: 500,
      }),
      components: JSON.stringify({
        available: ['client', 'server', 'database'],
        required: ['client', 'server', 'database'],
        hints: [],
      }),
      feedbackData: JSON.stringify({}),
    },
  });
  testMissionSlug = TEST_MISSION_SLUG;

  // Register and login a test user
  const regRes = await request(app).post('/api/auth/register').send({
    email: 'missions@ci.test',
    username: 'missionplayer',
    password: 'SecurePass123!',
  });
  accessToken = regRes.body.accessToken;
  userId = regRes.body.user.id;
});

afterAll(async () => {
  await prisma.missionAttempt.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.mission.deleteMany({ where: { slug: TEST_MISSION_SLUG } });
  await prisma.$disconnect();
});

// ── GET /api/missions ──────────────────────────────────────────────────────────────
describe('GET /api/missions', () => {
  it('returns an array of missions for authenticated user', async () => {
    const res = await request(app)
      .get('/api/missions')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });

  it('each mission has required fields', async () => {
    const res = await request(app)
      .get('/api/missions')
      .set('Authorization', `Bearer ${accessToken}`);

    const mission = res.body.find((m: { slug: string }) => m.slug === testMissionSlug);
    expect(mission).toBeDefined();
    expect(mission).toHaveProperty('id');
    expect(mission).toHaveProperty('slug');
    expect(mission).toHaveProperty('title');
    expect(mission).toHaveProperty('difficulty');
    expect(mission).toHaveProperty('userProgress');
    expect(mission).toHaveProperty('isLocked');
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/missions');
    expect(res.status).toBe(401);
  });
});

// ── GET /api/missions/:slug ───────────────────────────────────────────────────────
describe('GET /api/missions/:slug', () => {
  it('returns mission details for a valid unlocked slug', async () => {
    const res = await request(app)
      .get(`/api/missions/${testMissionSlug}`)
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.slug).toBe(testMissionSlug);
    expect(res.body).toHaveProperty('objectives');
    expect(res.body).toHaveProperty('requirements');
    expect(res.body).toHaveProperty('components');
  });

  it('returns 404 for a non-existent slug', async () => {
    const res = await request(app)
      .get('/api/missions/does-not-exist-xyz')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(404);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get(`/api/missions/${testMissionSlug}`);
    expect(res.status).toBe(401);
  });
});

// ── POST /api/missions/:slug/save ──────────────────────────────────────────────────
describe('POST /api/missions/:slug/save', () => {
  it('saves architecture draft and returns { saved: true }', async () => {
    const arch = {
      components: [{ id: 'srv-1', type: 'server', x: 0, y: 0 }],
      connections: [],
    };
    const res = await request(app)
      .post(`/api/missions/${testMissionSlug}/save`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ architecture: arch });

    expect(res.status).toBe(200);
    expect(res.body.saved).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app)
      .post(`/api/missions/${testMissionSlug}/save`)
      .send({ architecture: {} });
    expect(res.status).toBe(401);
  });
});
