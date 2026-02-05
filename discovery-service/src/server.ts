/**
 * Express Server Setup — Intent Discovery Service
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { getStoreStats } from './store/memory.js';
import { intentsRouter } from './routes/intents.js';
import { providersRouter } from './routes/providers.js';
import { offersRouter } from './routes/offers.js';
import { paymentsRouter } from './routes/payments.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req: Request, _res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// Root endpoint - API info
app.get('/', (_req: Request, res: Response) => {
  const stats = getStoreStats();
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
      github: 'https://github.com/BrainDeadWorkers/intent-discovery',
      basescan: 'https://sepolia.basescan.org',
    },
  });
});

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  const stats = getStoreStats();
  res.json({
    status: 'ok',
    service: 'intent-discovery',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    stats,
  });
});

// API version prefix
app.get('/api/v1', (_req: Request, res: Response) => {
  res.json({
    version: 'v1',
    endpoints: [
      'GET /api/v1/intents',
      'POST /api/v1/intents',
      'GET /api/v1/intents/:id',
      'DELETE /api/v1/intents/:id',
      'GET /api/v1/providers',
      'POST /api/v1/providers',
      'GET /api/v1/providers/match/:providerId',
      'POST /api/v1/intents/:id/offers',
      'GET /api/v1/intents/:id/offers',
      'POST /api/v1/intents/:id/accept',
      'POST /api/v1/payments/release',
      'GET /api/v1/payments/balance',
    ],
  });
});

// Mount API routes
app.use('/api/v1/intents', intentsRouter);
app.use('/api/v1/providers', providersRouter);
app.use('/api/v1', offersRouter);  // offers are nested under intents
app.use('/api/v1/payments', paymentsRouter);

// Error handling middleware
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Error:', err.message);
  res.status(500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// 404 handler
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not Found' });
});

export { app };
