import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../errors/AppError';

export function notFoundMiddleware(request: Request, _response: Response, next: NextFunction) {
  next(
    new AppError(`Route not found: ${request.method} ${request.originalUrl}`, 404, 'NOT_FOUND'),
  );
}
