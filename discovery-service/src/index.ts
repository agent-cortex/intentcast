/**
 * Intent Discovery Service — Entry Point
 * 
 * Agent Service Discovery via Intent Broadcasting + USDC (Base Sepolia)
 * USDC Hackathon 2026
 */

import { app } from './server.js';

const PORT = process.env.PORT || 3000;

// For local development
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║          Intent Discovery Service v0.1.0                 ║
║          USDC Hackathon 2026 — Base Sepolia              ║
╠══════════════════════════════════════════════════════════╣
║  Server running on http://localhost:${PORT}                  ║
║  Health check: GET /health                               ║
║  API docs: GET /api/v1                                   ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
}

// Export for Vercel serverless
export default app;
