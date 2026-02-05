// Vercel Serverless Function: /health (via rewrite to /api/health)

import { app } from '../discovery-service/dist/server.js';

export default function handler(req: any, res: any) {
  // Our Express app defines GET /health at the root.
  // When called via rewrite (/health -> /api/health), Vercel passes url as /api/health.
  // Force the url to match the Express route.
  req.url = '/health';
  return app(req, res);
}
