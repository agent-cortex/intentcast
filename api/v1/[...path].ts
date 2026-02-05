// Vercel Serverless Function: /api/v1/*
// Proxies all /api/v1/<anything> routes to the existing Express app.

import { app } from '../../discovery-service/dist/server.js';

export default async function handler(req: any, res: any) {
  try {
    // req.url will be like /api/v1/xyz in Vercel functions; Express app expects the same.
    // Leave as-is.
    return app(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || String(e), stack: e?.stack }));
  }
}
