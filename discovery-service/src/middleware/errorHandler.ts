import type { NextFunction, Request, Response } from 'express';
import { AppError, type ErrorResponse } from '../utils/errors.js';

function getRequestId(req: Request, res: Response): string | undefined {
  return (
    (res.locals?.requestId as string | undefined) ||
    (req.headers['x-request-id'] as string | undefined) ||
    undefined
  );
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  const requestId = getRequestId(req, res);

  if (err instanceof AppError) {
    const payload: ErrorResponse = {
      error: {
        code: err.code,
        message: err.message,
        details: err.details,
        requestId,
      },
    };

    res.status(err.statusCode).json(payload);
    return;
  }

  // Fallback: unknown error
  const message = err instanceof Error ? err.message : 'Unknown error';

  const payload: ErrorResponse = {
    error: {
      code: 'INTERNAL',
      message: 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? { message } : undefined,
      requestId,
    },
  };

  // eslint-disable-next-line no-console
  console.error('Unhandled error:', err);

  res.status(500).json(payload);
}
