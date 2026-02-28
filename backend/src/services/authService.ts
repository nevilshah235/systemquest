import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { computeDerivedSkillLevel, effectiveSkillLevel } from './skillService';

const prisma = new PrismaClient();

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Canonical shape returned on every auth response.
 *
 * - skillLevel: the stored / self-declared level (what the DB holds)
 * - derivedSkillLevel: computed from performance history (what performance says)
 *
 * The UI should use derivedSkillLevel (or the higher of the two) for badges
 * and path recommendations, while skillLevel acts as a floor/override.
 */
function serializeUser(
  user: {
    id: string;
    email: string;
    username: string;
    xp: number;
    level: number;
    skillLevel: string;
  },
  derivedSkillLevel: string,
) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    xp: user.xp,
    level: user.level,
    skillLevel: user.skillLevel,       // stored / self-declared floor
    derivedSkillLevel,                  // performance-derived (always ≥ skillLevel after promotion)
  };
}

function generateTokens(userId: string) {
  const accessToken = jwt.sign(
    { userId },
    process.env.JWT_SECRET!,
    { expiresIn: process.env.JWT_EXPIRES_IN || '15m' } as jwt.SignOptions
  );
  const refreshToken = jwt.sign(
    { userId },
    process.env.JWT_REFRESH_SECRET!,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
  return { accessToken, refreshToken };
}

export const authService = {
  async register(input: RegisterInput) {
    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: input.email }, { username: input.username }] },
    });
    if (existing) {
      throw new Error(existing.email === input.email ? 'Email already in use' : 'Username already taken');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await prisma.user.create({
      data: { email: input.email, username: input.username, passwordHash },
    });

    // New users have no attempts so derived is always 'beginner' here,
    // but we keep the call consistent so the shape is guaranteed correct.
    const derived = await computeDerivedSkillLevel(user.id);
    const tokens = generateTokens(user.id);
    return { user: serializeUser(user, derived), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    // Re-derive on every login so returning users always get an up-to-date level.
    const derived = await computeDerivedSkillLevel(user.id);
    const tokens = generateTokens(user.id);
    return { user: serializeUser(user, derived), ...tokens };
  },

  async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { userId: string };
      const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
      if (!user) throw new Error('User not found');
      const tokens = generateTokens(user.id);
      return tokens;
    } catch {
      throw new Error('Invalid refresh token');
    }
  },

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        achievements: { include: { achievement: true } },
        missionAttempts: { where: { completed: true }, include: { mission: true } },
      },
    });
    if (!user) throw new Error('User not found');

    const derived = await computeDerivedSkillLevel(userId);
    const effective = effectiveSkillLevel(derived, user.skillLevel);

    return {
      ...user,
      derivedSkillLevel: derived,
      // Effective level is the single value the UI should trust for gating
      effectiveSkillLevel: effective,
    };
  },
};
