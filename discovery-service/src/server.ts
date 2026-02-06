/**
 * Express Server Setup — Intent Discovery Service
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import crypto from 'crypto';
import { getStoreStats, providerStore } from './store/index.js';
import { readRateLimit, writeRateLimit } from './middleware/rateLimit.js';
import { intentsRouter } from './routes/intents.js';
import { providersRouter } from './routes/providers.js';
import { offersRouter } from './routes/offers.js';
import { paymentsRouter } from './routes/payments.js';
import { categoriesRouter } from './routes/categories.js';
import { findMatchingIntents } from './services/matching.js';
import { CATEGORIES } from './models/categories.js';
import { asyncHandler } from './utils/asyncHandler.js';
import { Errors, AppError } from './utils/errors.js';
import { errorHandler } from './middleware/errorHandler.js';
import { walletAuthForMutations } from './middleware/auth.js';

const app = express();

// If running behind a reverse proxy (Vercel, Nginx, etc.), this makes req.ip reliable.
app.set('trust proxy', 1);

// Middleware
app.use(cors());
app.use(express.json());

// Request IDs (propagate x-request-id if present, otherwise generate)
app.use((req: Request, res: Response, next: NextFunction) => {
  const incoming = req.header('x-request-id');
  const requestId = incoming || crypto.randomUUID();
  (req as any).id = requestId;
  res.setHeader('x-request-id', requestId);
  next();
});

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Wallet-based auth for mutations (POST/PUT/PATCH/DELETE). GET remains public.
app.use(walletAuthForMutations);

// Rate limiting (per wallet header or IP fallback)
// Read limit is applied globally to GET/HEAD/OPTIONS.
app.use(readRateLimit);

// Root endpoint - API info
app.get(
  '/',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await getStoreStats();
    res.json({
      name: 'Intent Discovery Service',
      description: 'Agent Service Discovery via Intent Broadcasting + USDC',
      version: '0.1.0',
      chain: 'Base Sepolia',
      endpoints: {
        health: '/health',
        api: '/api/v1',
        docs: '/api/v1',
      },
      stats,
      links: {
        github: 'https://github.com/agent-cortex/intentcast',
        basescan: 'https://sepolia.basescan.org',
      },
    });
  })
);

// Health check endpoint
app.get(
  '/health',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = await getStoreStats();
    res.json({
      status: 'ok',
      service: 'intent-discovery',
      version: '0.2.0',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      stats: {
        ...stats,
        categories: CATEGORIES.length,
      },
      endpoints: {
        api: '/api/v1',
        docs: 'https://intentcast.agentcortex.space/docs/api',
        directory: 'https://intentcast.agentcortex.space/directory',
      },
    });
  })
);

// API version prefix
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    version: 'v1',
    description: 'IntentCast API — Agent Service Discovery + USDC Escrow',
    docs: 'https://intentcast.agentcortex.space/docs/api',
    auth: {
      note: 'Wallet signature required for mutations (POST/PUT/PATCH/DELETE). GET is public.',
      headers: ['x-wallet-address', 'x-signature', 'x-nonce'],
      messageFormat: 'IntentCast:{nonce}:{method}:{path}',
      example: 'IntentCast:123:POST:/api/v1/providers',
    },
    endpoints: {
      categories: ['GET /api/v1/categories', 'GET /api/v1/categories/:id'],
      intents: ['GET /api/v1/intents', 'POST /api/v1/intents', 'GET /api/v1/intents/:id', 'DELETE /api/v1/intents/:id'],
      providers: ['GET /api/v1/providers', 'POST /api/v1/providers', 'GET /api/v1/match/:providerId'],
      offers: ['POST /api/v1/intents/:id/offers', 'GET /api/v1/intents/:id/offers', 'POST /api/v1/intents/:id/accept'],
      payments: ['POST /api/v1/payments/release', 'GET /api/v1/payments/balance'],
    },
  });
});

// Match endpoint (canonical): GET /api/v1/match/:providerId
// Kept for backwards compatibility with docs/skills.
app.get(
  '/api/v1/match/:providerId',
  asyncHandler(async (req: Request, res: Response) => {
    const { providerId } = req.params;

    const provider = await providerStore.get(providerId);
    if (!provider) {
      throw new AppError({
        code: 'NOT_FOUND',
        statusCode: 404,
        message: 'Provider not found',
      });
    }

    const matches = await findMatchingIntents(providerId);

    res.json({
      providerId,
      capabilities: provider.capabilities,
      matchCount: matches.length,
      matches,
    });
  })
);

// Mount API routes
app.use('/api/v1/categories', categoriesRouter);

// Stricter write limits for mutation routes (POST/PUT/PATCH/DELETE).
app.use('/api/v1/intents', writeRateLimit, intentsRouter);
app.use('/api/v1/providers', writeRateLimit, providersRouter);
app.use('/api/v1', writeRateLimit, offersRouter); // offers are nested under intents
app.use('/api/v1/payments', writeRateLimit, paymentsRouter);

// 404 handler (consistent error shape)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: 'Not Found',
      details: { path: req.path },
      requestId: (req as any).id,
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

export { app };
