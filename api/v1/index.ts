// Vercel Serverless Function: /api/v1/*
// Handles all API v1 routes by proxying to the Express app.

import { app } from '../../discovery-service/dist/server.js';

export default async function handler(req: any, res: any) {
  try {
    // req.url already contains the full path (e.g., /api/v1/payments/balance)
    // Just pass it through to Express
    return app(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || String(e) }));
  }
}
