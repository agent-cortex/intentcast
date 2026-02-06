export type ErrorResponse = {
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
};

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(options: { statusCode: number; code: string; message: string; details?: unknown }) {
    super(options.message);
    this.name = 'AppError';
    this.statusCode = options.statusCode;
    this.code = options.code;
    this.details = options.details;
  }
}

export const Errors = {
  badRequest: (message = 'Bad Request', details?: unknown) =>
    new AppError({ statusCode: 400, code: 'BAD_REQUEST', message, details }),

  notFound: (message = 'Not Found', details?: unknown) =>
    new AppError({ statusCode: 404, code: 'NOT_FOUND', message, details }),

  conflict: (message = 'Conflict', details?: unknown) =>
    new AppError({ statusCode: 409, code: 'CONFLICT', message, details }),

  unauthorized: (message = 'Unauthorized', details?: unknown) =>
    new AppError({ statusCode: 401, code: 'UNAUTHORIZED', message, details }),

  forbidden: (message = 'Forbidden', details?: unknown) =>
    new AppError({ statusCode: 403, code: 'FORBIDDEN', message, details }),

  internal: (message = 'Internal Server Error', details?: unknown) =>
    new AppError({ statusCode: 500, code: 'INTERNAL', message, details }),
};
