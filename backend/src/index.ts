import 'express-async-errors';
import path from 'path';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import { rateLimit } from 'express-rate-limit';

import webhookRoutes from './api/webhook';
import chatRoutes from './api/chat';
import weatherRoutes from './api/weather';
import marketRoutes, { startMarketRefreshJob } from './api/market';
import uploadRoutes from './api/upload';
import contactRoutes from './api/contact';
import { errorHandler } from './middleware/errorHandler';
import { logger } from './lib/logger';
import { httpRequestsTotal, requestLatencyMs, renderMetrics } from './lib/metrics';
import { prisma } from './lib/prismaClient';

dotenv.config();

// Re-exported for backward compatibility with any code importing
// `{ prisma }` from `../index` — but prefer importing directly from
// `./lib/prismaClient` in new code (see that file for why).
export { prisma };

// ---------------------------------------------------------------------------
// Startup validation — fail loudly and immediately on misconfiguration
// instead of discovering it later when a farmer's request silently fails.
// ---------------------------------------------------------------------------
function validateEnv(): void {
  const isProd = process.env.NODE_ENV === 'production';
  const problems: string[] = [];

  if (!process.env.DATABASE_URL) {
    problems.push('DATABASE_URL is not set.');
  }

  if (isProd) {
    if (!process.env.CORS_ORIGIN || process.env.CORS_ORIGIN === '*') {
      problems.push('CORS_ORIGIN must be set to your real frontend domain(s) in production (not unset/wildcard).');
    }
    if (!process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY === 'demo') {
      logger.warn('ANTHROPIC_API_KEY is not set (or is the placeholder "demo") in production. The AI service will run in degraded rule-based fallback mode for every request.');
    }
    if (!process.env.API_KEY) {
      logger.warn('API_KEY is not set — the /api/chat endpoint will accept requests from anyone with no key check.');
    }
    if (process.env.TWILIO_AUTH_TOKEN && !process.env.PUBLIC_BASE_URL) {
      problems.push('PUBLIC_BASE_URL must be set when TWILIO_AUTH_TOKEN is configured, or webhook signature validation cannot run and will fail closed.');
    }
  }

  if (problems.length > 0) {
    logger.error('Startup validation failed', { problems });
    if (isProd) {
      // eslint-disable-next-line no-console
      console.error('\nFATAL: refusing to start with invalid production configuration:\n' + problems.map((p) => ` - ${p}`).join('\n') + '\n');
      process.exit(1);
    }
  }
}

validateEnv();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
  contentSecurityPolicy: false,
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173', 'http://localhost:3000'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key'],
  credentials: true,
}));

// ---------------------------------------------------------------------------
// Rate limiting — keyed by identity (API key, or phone number for
// webhooks) rather than raw IP. Many farmers share carrier-grade NAT in
// rural India, so an IP-keyed limiter punishes everyone behind the same
// IP for one heavy user. A general per-IP limiter is kept as an outer
// backstop against pure volumetric abuse.
// ---------------------------------------------------------------------------
const ipLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api/', ipLimiter);

const identityLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) =>
    (req.headers['x-api-key'] as string) ||
    req.body?.From ||
    req.body?.phoneNumber ||
    req.ip ||
    'unknown',
  message: { error: 'Too many requests from this account, please slow down.', code: 'RATE_LIMIT_EXCEEDED' },
});
app.use('/api/chat', identityLimiter);
app.use('/api/webhook', identityLimiter);
app.use('/api/upload', identityLimiter);

// Twilio sends application/x-www-form-urlencoded; the signature validator
// needs the exact raw parsed body, so urlencoded parsing must happen
// before any route handler touches req.body. JSON parsing is for the
// frontend-facing JSON APIs.
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Lightweight request metrics (see lib/metrics.ts) — no external
// dependency, exposed below at GET /metrics in Prometheus text format.
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const route = req.route?.path ? `${req.baseUrl}${req.route.path}` : req.path;
    httpRequestsTotal.inc({ route, method: req.method, status: String(res.statusCode) });
    requestLatencyMs.observe(Date.now() - start, { route });
  });
  next();
});

// Serve uploaded farmer photos (used by the chat photo-diagnosis feature).
// In production, point this at real object storage (S3/R2) instead of
// local disk — local disk doesn't survive container restarts/redeploys.
app.use('/uploads', express.static(path.join(process.cwd(), process.env.UPLOAD_DIR || 'uploads')));

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.1.0',
    name: 'Krishak Mitra API',
  });
});

app.get('/metrics', (_req, res) => {
  res.set('Content-Type', 'text/plain; version=0.0.4');
  res.send(renderMetrics());
});

app.use('/api/webhook', webhookRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/market', marketRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/contact', contactRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found', code: 'NOT_FOUND' });
});

app.use(errorHandler);

const server = app.listen(PORT, () => {
  logger.info('Krishak Mitra API started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  });
});

// Builds real 7-day price history so the market trend calculation
// (api/market.ts -> calculateTrend) has something to compare against.
startMarketRefreshJob();

async function gracefulShutdown(signal: string) {
  logger.info(`${signal} received, shutting down gracefully`);
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await prisma.$disconnect();
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason });
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error });
  process.exit(1);
});

export default app;
