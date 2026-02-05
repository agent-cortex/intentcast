// Vercel Serverless Function: /api/v1/*
// Proxies all /api/v1/<anything> routes to the existing Express app.

import { app } from '../../discovery-service/dist/server.js';

export default function handler(req: any, res: any) {
  // req.url will be like /api/v1/xyz in Vercel functions; Express app expects the same.
  // Leave as-is.
  return app(req, res);
}
