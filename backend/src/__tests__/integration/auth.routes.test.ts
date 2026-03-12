/**
 * Integration tests — /api/auth routes
 * Tests run against a real SQLite test database.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import { app } from '../../app';
import { prisma } from '../../lib/prisma';

beforeAll(async () => {
  await prisma.$connect();
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(async () => {
  // Clean up test users before every test for isolation
  await prisma.missionAttempt.deleteMany();
  await prisma.userAchievement.deleteMany();
  await prisma.interviewSession.deleteMany();
  await prisma.user.deleteMany();
});

// ── POST /api/auth/register ──────────────────────────────────────────────────────
describe('POST /api/auth/register', () => {
  it('creates a new user and returns 201 with tokens', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'register@ci.test',
      username: 'ciregister',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(201);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('register@ci.test');
    expect(res.body.user.username).toBe('ciregister');
    expect(res.body.user).not.toHaveProperty('passwordHash');
  });

  it('returns 400 when email is already registered', async () => {
    const payload = { email: 'dup@ci.test', username: 'dupuser1', password: 'SecurePass123!' };
    await request(app).post('/api/auth/register').send(payload);

    // Second registration with same email (different username)
    const res = await request(app)
      .post('/api/auth/register')
      .send({ ...payload, username: 'dupuser2' });

    expect(res.status).toBe(400);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 400 when username is already taken', async () => {
    await request(app).post('/api/auth/register').send({
      email: 'first@ci.test',
      username: 'sameusername',
      password: 'SecurePass123!',
    });

    const res = await request(app).post('/api/auth/register').send({
      email: 'second@ci.test',
      username: 'sameusername',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid email format', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'not-an-email',
      username: 'validuser',
      password: 'SecurePass123!',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when username is shorter than 3 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'short@ci.test',
      username: 'ab',
      password: 'SecurePass123!',
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'weakpass@ci.test',
      username: 'weakuser',
      password: 'short',
    });
    expect(res.status).toBe(400);
  });
});

// ── POST /api/auth/login ────────────────────────────────────────────────────────
describe('POST /api/auth/login', () => {
  beforeEach(async () => {
    await request(app).post('/api/auth/register').send({
      email: 'login@ci.test',
      username: 'loginuser',
      password: 'SecurePass123!',
    });
  });

  it('returns 200 with accessToken and refreshToken on valid credentials', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@ci.test',
      password: 'SecurePass123!',
    });

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('accessToken');
    expect(res.body).toHaveProperty('refreshToken');
    expect(res.body.user.email).toBe('login@ci.test');
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'login@ci.test',
      password: 'WrongPassword999!',
    });
    expect(res.status).toBe(401);
    expect(res.body).toHaveProperty('error');
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app).post('/api/auth/login').send({
      email: 'ghost@ci.test',
      password: 'SecurePass123!',
    });
    expect(res.status).toBe(401);
  });
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────────ndescribe('GET /api/auth/me', () => {
  let accessToken: string;

  beforeEach(async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: 'me@ci.test',
      username: 'meuser',
      password: 'SecurePass123!',
    });
    accessToken = res.body.accessToken;
  });

  it('returns user profile for authenticated request', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.email).toBe('me@ci.test');
  });

  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});

// ── GET /health ──────────────────────────────────────────────────────────────────────ndescribe('GET /health', () => {
  it('returns 200 with ok status', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.service).toBe('systemquest-api');
  });
});
