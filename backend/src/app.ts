/**
 * app.ts — Express application factory (no server.listen)
 * Imported by index.ts (production) and test files (testing).
 */
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { authRouter } from './routes/auth';
import { missionRouter } from './routes/missions';
import { simulationRouter } from './routes/simulation';
import { progressRouter } from './routes/progress';
import { chatRouter } from './routes/chat';
import { rubricRouter } from './routes/rubric';
import { interviewRouter } from './routes/interview';
import { logger } from './services/logger';

export const app = express();

// ── Security & parsing middleware ──────────────────────────────────────────────
app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

// Skip HTTP access logging during tests to keep output clean
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined', { stream: { write: (msg: string) => logger.info(msg.trim()) } }));
}

// ── Health check ───────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'systemquest-api' });
});

// ── API routes ──────────────────────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/missions', missionRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/progress', progressRouter);
app.use('/api/chat', chatRouter);
app.use('/api/rubric', rubricRouter);
app.use('/api/interview', interviewRouter);

// ── 404 & global error handlers ────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});
