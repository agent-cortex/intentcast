import type { NextFunction, Request, Response } from 'express';
import type { ZodTypeAny } from 'zod';

function formatZodError(error: any) {
  const issues = error?.issues ?? [];
  return {
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: issues.map((i: any) => ({
        path: i.path,
        message: i.message,
      })),
    },
  };
}

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json(formatZodError(result.error));
      return;
    }

    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      res.status(400).json(formatZodError(result.error));
      return;
    }

    // Express types req.query as ParsedQs; safe to overwrite for our usage.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as any).query = result.data;
    next();
  };
}
