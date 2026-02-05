// Vercel Serverless Function: /api/v1/*
// Proxies all /api/v1 routes to the existing Express app from discovery-service.

import { app } from '../../discovery-service/src/server';

// Express apps are (req, res) handlers, compatible with Vercel's Node runtime.
export default app;
