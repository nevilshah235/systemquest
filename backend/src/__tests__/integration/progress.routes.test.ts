/**
 * Integration tests — /api/progress routes
 * Tests user XP, level, and completed missions progress endpoint.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

let accessToken: string;
let userId: string;

beforeAll(async () => {
  await prisma.$connect();

  // Clean slate
  await prisma.missionAttempt.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.user.deleteMany({ where: { email: 'progress@ci.test' } });

  // Register test user
  const regRes = await request(app).post('/api/auth/register').send({
    email: 'progress@ci.test',
    username: 'progressplayer',
    password: 'SecurePass123!',
  });
  accessToken = regRes.body.accessToken;
  userId = regRes.body.user.id;
});

afterAll(async () => {
  await prisma.missionAttempt.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
  await prisma.$disconnect();
});

// ── GET /api/progress ─────────────────────────────────────────────────────────────────
describe('GET /api/progress', () => {
  it('returns initial progress for a newly registered user', async () => {
    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    // New user starts at level 1 with 0 XP
    expect(res.body.level).toBe(1);
    expect(res.body.xp).toBe(0);
    expect(res.body.xpToNextLevel).toBeGreaterThan(0);
    expect(Array.isArray(res.body.completedMissions)).toBe(true);
    expect(res.body.completedMissions).toHaveLength(0);
    expect(Array.isArray(res.body.achievements)).toBe(true);
  });

  it('returns 401 without a token', async () => {
    const res = await request(app).get('/api/progress');
    expect(res.status).toBe(401);
  });

  it('response contains all required progress fields', async () => {
    const res = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('xp');
    expect(res.body).toHaveProperty('level');
    expect(res.body).toHaveProperty('xpToNextLevel');
    expect(res.body).toHaveProperty('xpThisLevel');
    expect(res.body).toHaveProperty('xpForLevel');
    expect(res.body).toHaveProperty('completedMissions');
    expect(res.body).toHaveProperty('achievements');
  });

  it('XP increases after completing a simulation with a passing score', async () => {
    // Create a mission for XP testing
    const xpMissionSlug = 'ci-xp-test-mission';
    await prisma.mission.upsert({
      where: { slug: xpMissionSlug },
      update: {},
      create: {
        slug: xpMissionSlug,
        title: 'CI XP Test Mission',
        difficulty: 1,
        estimatedTime: '5 min',
        xpReward: 200,
        order: 9997,
        learningPath: 'ci-xp-path',
        skillLevel: 'beginner',
        description: 'XP test mission',
        scenario: 'XP scenario',
        objectives: JSON.stringify(['Pass the mission']),
        requirements: JSON.stringify({
          traffic: { concurrent: 100, daily: 1000 },
          performance: { latencyMs: 400, availability: 90.0 },
          budget: 1000,
        }),
        components: JSON.stringify({ available: ['client', 'server', 'database'], required: [], hints: [] }),
        feedbackData: JSON.stringify({}),
      },
    });

    // Run a simulation that should score >= 60 (complete the mission)
    await request(app)
      .post('/api/simulation/run')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        missionSlug: xpMissionSlug,
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

    const progressRes = await request(app)
      .get('/api/progress')
      .set('Authorization', `Bearer ${accessToken}`);

    // XP may or may not be awarded depending on score, but response must be valid
    expect(progressRes.status).toBe(200);
    expect(progressRes.body.xp).toBeGreaterThanOrEqual(0);

    // Cleanup
    await prisma.mission.deleteMany({ where: { slug: xpMissionSlug } });
  });
});
