import type { NextFunction, Request, Response } from 'express';
import { getHeader, verifyIntentCastSignature } from '../utils/auth.js';

const MUTATION_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

// Simple in-memory nonce tracking (best-effort). In production, use a durable store (Redis/DB) + TTL.
const usedNonces = new Set<string>();

function getRequestPath(req: Request): string {
  // Use originalUrl so the signature covers mounted router prefixes.
  // Strip querystring to avoid clients needing to sign volatile params ordering.
  return (req.originalUrl || req.url || req.path).split('?')[0] || '/';
}

export function walletAuthForMutations(req: Request, res: Response, next: NextFunction) {
  const method = req.method.toUpperCase();
  if (!MUTATION_METHODS.has(method)) return next();

  const walletAddress = getHeader(req.headers['x-wallet-address']);
  const signature = getHeader(req.headers['x-signature']);
  const nonce = getHeader(req.headers['x-nonce']);

  if (!walletAddress || !signature || !nonce) {
    res.status(401).json({
      error: 'Missing auth headers',
      requiredHeaders: ['x-wallet-address', 'x-signature', 'x-nonce'],
      messageFormat: 'IntentCast:{nonce}:{method}:{path}',
      exampleToSign: `IntentCast:123:${method}:${getRequestPath(req)}`,
    });
    return;
  }

  const key = `${walletAddress.toLowerCase()}:${nonce}`;
  if (usedNonces.has(key)) {
    res.status(401).json({
      error: 'Nonce already used',
      hint: 'Generate a fresh nonce for every mutation request',
    });
    return;
  }

  const path = getRequestPath(req);
  const result = verifyIntentCastSignature({ walletAddress, signature, nonce, method, path });

  if (!result.ok) {
    res.status(401).json({
      error: 'Invalid signature',
      details: result.error,
      messageFormat: 'IntentCast:{nonce}:{method}:{path}',
      messageToSign: result.message,
    });
    return;
  }

  usedNonces.add(key);
  // Attach recovered address for downstream use (optional)
  (req as any).auth = {
    walletAddress: result.recoveredAddress,
    nonce,
    signature,
    message: result.message,
  };

  next();
}
