// Vercel Serverless Function: /api/v1
// Proxies /api/v1 to the existing Express app.

import { app } from '../../discovery-service/dist/server.js';

export default function handler(req: any, res: any) {
  // Ensure Express sees the correct path
  req.url = '/api/v1';
  return app(req, res);
}
