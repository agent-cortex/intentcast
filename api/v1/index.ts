// Vercel Serverless Function: /api/v1
// Proxies /api/v1 to the existing Express app.

import { app } from '../../discovery-service/dist/server.js';

export default async function handler(req: any, res: any) {
  try {
    // Ensure Express sees the correct path
    req.url = '/api/v1';
    return app(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(JSON.stringify({ error: e?.message || String(e), stack: e?.stack }));
  }
}
