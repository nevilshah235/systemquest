import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { authRouter } from './routes/auth';
import { missionRouter } from './routes/missions';
import { simulationRouter } from './routes/simulation';
import { progressRouter } from './routes/progress';
import { chatRouter } from './routes/chat';
import { rubricRouter } from './routes/rubric';
import { conceptsRouter } from './routes/concepts';
import { lldRouter } from './routes/lld';
import { comparisonRouter } from './routes/comparison';
import { interviewRouter } from './routes/interview';
import { logger } from './services/logger';

dotenv.config();

const app = express();
const PORT = parseInt(process.env.PORT || '4000', 10);

app.use(helmet());
app.use(compression());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*', credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: (msg) => logger.info(msg.trim()) } }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'systemquest-api' });
});

app.use('/api/auth', authRouter);
app.use('/api/missions', missionRouter);
app.use('/api/simulation', simulationRouter);
app.use('/api/progress', progressRouter);
app.use('/api/chat', chatRouter);
app.use('/api/rubric', rubricRouter);
app.use('/api/concepts', conceptsRouter);
app.use('/api/lld', lldRouter);
app.use('/api/comparison', comparisonRouter);
app.use('/api/interview', interviewRouter);

app.use((_req, res) => { res.status(404).json({ error: 'Route not found' }); });
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 SystemQuest API running on port ${PORT}`);
});

export default app;
