import type { NextFunction, Request, Response } from 'express';
import { logger } from '../config/logger';

import { AppError } from './AppError';

export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
) {
  if (!(error instanceof AppError)) {
    logger.error('Unhandled server error', { error: error.stack ?? error.message });
  }

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
