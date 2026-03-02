import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticate, AuthRequest } from '../middleware/auth';
import { pickFollowupQuestion, FOLLOWUP_QUESTIONS } from '../data/followupQuestions';
import { SPRINT3_FOLLOWUP_QUESTIONS } from '../data/followupQuestions-sprint3';
import { scoreInterviewSession } from '../services/interviewScorer';
import { Architecture } from '../services/simulationEngine';

// Merge Sprint 3 follow-up questions into the main bank at startup
Object.assign(FOLLOWUP_QUESTIONS, SPRINT3_FOLLOWUP_QUESTIONS);

export const interviewRouter = Router();
const prisma = new PrismaClient();

// ── POST /api/interview/start ────────────────────────────────────────────────────
interviewRouter.post('/start', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { missionSlug, durationMinutes = 45 } = req.body as {
    missionSlug: string; durationMinutes?: number;
  };
  try {
    const mission = await prisma.mission.findUnique({ where: { slug: missionSlug } });
    if (!mission) { res.status(404).json({ error: 'Mission not found' }); return; }

    // Abandon any existing active session for this mission
    await prisma.interviewSession.updateMany({
      where: { userId: req.userId!, missionId: mission.id, status: 'active' },
      data: { status: 'abandoned' },
    });

    const session = await prisma.interviewSession.create({
      data: {
        userId: req.userId!,
        missionId: mission.id,
        durationMinutes,
        status: 'active',
      },
    });

    res.json({
      sessionId: session.id,
      missionSlug,
      missionTitle: mission.title,
      durationMinutes,
      startedAt: session.startedAt,
      followupScheduledAt: Math.floor(durationMinutes * 60 * 0.5), // inject at 50% elapsed
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to start interview session' });
  }
});

// ── GET /api/interview/:id ──────────────────────────────────────────────────────────
interviewRouter.get('/:id', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: { mission: { select: { slug: true, title: true, requirements: true } } },
    });
    if (!session || session.userId !== req.userId!) {
      res.status(404).json({ error: 'Session not found' }); return;
    }
    res.json({
      ...session,
      followupLog: JSON.parse(session.followupLog),
      rubricScores: JSON.parse(session.rubricScores),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// ── POST /api/interview/:id/followup ──────────────────────────────────────────────────
// Injected by the client at 50% elapsed time — returns the follow-up question.
interviewRouter.post('/:id/followup', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: { mission: { select: { slug: true } } },
    });
    if (!session || session.userId !== req.userId! || session.status !== 'active') {
      res.status(404).json({ error: 'Active session not found' }); return;
    }
    const question = pickFollowupQuestion(session.mission.slug);
    if (!question) {
      res.json({ question: null });
      return;
    }
    // Record in log
    const log = JSON.parse(session.followupLog) as Array<{
      questionId: string; askedAt: string; userAnswer: string;
    }>;
    log.push({ questionId: question.id, askedAt: new Date().toISOString(), userAnswer: '' });
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { followupLog: JSON.stringify(log) },
    });
    res.json({ question });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get follow-up question' });
  }
});

// ── POST /api/interview/:id/answer ─────────────────────────────────────────────────────
// Records user's answer to the injected follow-up question.
interviewRouter.post('/:id/answer', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { questionId, answer } = req.body as { questionId: string; answer: string };
  try {
    const session = await prisma.interviewSession.findUnique({ where: { id: req.params.id } });
    if (!session || session.userId !== req.userId! || session.status !== 'active') {
      res.status(404).json({ error: 'Active session not found' }); return;
    }
    const log = JSON.parse(session.followupLog) as Array<{
      questionId: string; askedAt: string; userAnswer: string;
    }>;
    const entry = log.find((e) => e.questionId === questionId);
    if (entry) entry.userAnswer = answer;
    await prisma.interviewSession.update({
      where: { id: session.id },
      data: { followupLog: JSON.stringify(log) },
    });
    res.json({ saved: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to record answer' });
  }
});

// ── POST /api/interview/:id/submit ─────────────────────────────────────────────────────
interviewRouter.post('/:id/submit', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  const { architecture, elapsedSeconds } = req.body as {
    architecture: Architecture; elapsedSeconds: number;
  };
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: { mission: { select: { requirements: true, slug: true, xpReward: true } } },
    });
    if (!session || session.userId !== req.userId! || session.status !== 'active') {
      res.status(404).json({ error: 'Active session not found' }); return;
    }

    const requirements = JSON.parse(session.mission.requirements);
    const requiredComponents: string[] = requirements.required ?? [];

    const scoreResult = scoreInterviewSession(
      architecture,
      session.mission.slug,
      session.durationMinutes,
      elapsedSeconds,
      requiredComponents,
    );

    await prisma.interviewSession.update({
      where: { id: session.id },
      data: {
        status: 'completed',
        submittedAt: new Date(),
        finalArchitecture: JSON.stringify(architecture),
        rubricScores: JSON.stringify(scoreResult.rubricScores),
        totalScore: scoreResult.totalScore,
        xpEarned: scoreResult.xpEarned,
      },
    });

    // Award XP
    await prisma.user.update({
      where: { id: req.userId! },
      data: { xp: { increment: scoreResult.xpEarned } },
    });

    res.json({
      totalScore: scoreResult.totalScore,
      grade: scoreResult.grade,
      rubricScores: scoreResult.rubricScores,
      feedback: scoreResult.feedback,
      xpEarned: scoreResult.xpEarned,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit interview' });
  }
});

// ── GET /api/interview/:id/result ─────────────────────────────────────────────────────
interviewRouter.get('/:id/result', authenticate, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const session = await prisma.interviewSession.findUnique({
      where: { id: req.params.id },
      include: { mission: { select: { title: true, slug: true } } },
    });
    if (!session || session.userId !== req.userId! || session.status !== 'completed') {
      res.status(404).json({ error: 'Completed session not found' }); return;
    }
    res.json({
      sessionId: session.id,
      missionTitle: session.mission.title,
      totalScore: session.totalScore,
      rubricScores: JSON.parse(session.rubricScores),
      followupLog: JSON.parse(session.followupLog),
      xpEarned: session.xpEarned,
      startedAt: session.startedAt,
      submittedAt: session.submittedAt,
      durationMinutes: session.durationMinutes,
    });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});
