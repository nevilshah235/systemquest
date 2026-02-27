import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

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
 * Fields returned on every auth response.
 * skillLevel is required so the dashboard adaptive logic works on first render.
 */
function serializeUser(user: {
  id: string;
  email: string;
  username: string;
  xp: number;
  level: number;
  skillLevel: string;
}) {
  return {
    id: user.id,
    email: user.email,
    username: user.username,
    xp: user.xp,
    level: user.level,
    skillLevel: user.skillLevel,
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

    const tokens = generateTokens(user.id);
    return { user: serializeUser(user), ...tokens };
  },

  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({ where: { email: input.email } });
    if (!user) throw new Error('Invalid email or password');

    const valid = await bcrypt.compare(input.password, user.passwordHash);
    if (!valid) throw new Error('Invalid email or password');

    const tokens = generateTokens(user.id);
    return { user: serializeUser(user), ...tokens };
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
    return user;
  },
};
