// Vercel Serverless Function: /health (via rewrite to /api/health)

import { app } from '../discovery-service/dist/server.js';

export default async function handler(req: any, res: any) {
  try {
    // Our Express app defines GET /health at the root.
    // When called via rewrite (/health -> /api/health), Vercel passes url as /api/health.
    // Force the url to match the Express route.
    req.url = '/health';
    return app(req, res);
  } catch (e: any) {
    res.statusCode = 500;
    res.setHeader('content-type', 'application/json');
    res.end(
      JSON.stringify({
        error: e?.message || String(e),
        // Include stack temporarily for debugging; remove after confirmed stable.
        stack: e?.stack,
      })
    );
  }
}
