import type { NextFunction, Request, Response } from 'express';

import { AppError } from './AppError';

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  const normalizedError = error instanceof AppError ? error : new AppError('Internal server error');

  return response.status(normalizedError.statusCode).json({
    success: false,
    message: normalizedError.message,
    errorCode: normalizedError.code,
    errors: normalizedError.details ? [normalizedError.details] : [],
    timestamp: new Date().toISOString(),
    requestId: response.locals.requestId as string,
  });
}
