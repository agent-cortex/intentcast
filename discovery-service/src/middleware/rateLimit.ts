/**
 * Rate limiting middleware
 *
 * Goal: per-wallet (or IP fallback) rate limiting to prevent abuse.
 */

import rateLimit, {
  ipKeyGenerator,
  type RateLimitExceededEventHandler,
  type RateLimitRequestHandler,
} from 'express-rate-limit';
import type { Request } from 'express';

function getRateLimitKey(req: Request): string {
  const wallet = req.header('x-wallet-address')?.trim();
  if (wallet) return wallet.toLowerCase();

  // Prefer the library helper to properly normalize IPv6 addresses.
  if (req.ip) return ipKeyGenerator(req.ip);

  // Extremely rare fallback (e.g., misconfigured Express).
  return 'unknown';
}

const rateLimitExceededHandler: RateLimitExceededEventHandler = (_req, res, _next, optionsUsed) => {
  const retryAfterSeconds = Math.ceil(optionsUsed.windowMs / 1000);

  // Retry-After is a standard header for 429 responses.
  res.setHeader('Retry-After', String(retryAfterSeconds));

  res.status(429).json({
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests',
      retryAfter: retryAfterSeconds,
    },
  });
};

export const readRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 100,
  keyGenerator: getRateLimitKey,
  skip: (req) => {
    // Only apply the read limiter to safe/idempotent requests.
    return !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  },
  standardHeaders: true,
  legacyHeaders: true, // ensures X-RateLimit-* headers are present
  handler: rateLimitExceededHandler,
});

export const writeRateLimit: RateLimitRequestHandler = rateLimit({
  windowMs: 60_000,
  limit: 20,
  keyGenerator: getRateLimitKey,
  skip: (req) => {
    // Only apply to mutation requests.
    return !['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);
  },
  standardHeaders: true,
  legacyHeaders: true,
  handler: rateLimitExceededHandler,
});
