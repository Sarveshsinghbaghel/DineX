import type { NextFunction, Request, Response } from 'express';

import { AppError } from './AppError';

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const normalizedError =
    error instanceof AppError
      ? error
      : new AppError(error.message || 'Internal server error');

  return response.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    error: {
      code: normalizedError.code,
      details: normalizedError.details,
    },
  });
}
