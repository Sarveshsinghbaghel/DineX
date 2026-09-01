import type { NextFunction, Request, Response } from 'express';

import { logger } from '../config/logger';

export function requestLoggerMiddleware(request: Request, response: Response, next: NextFunction) {
  const startedAt = Date.now();

  response.on('finish', () => {
    logger.info('HTTP request completed', {
      requestId: response.locals.requestId as string,
      method: request.method,
      path: request.originalUrl,
      statusCode: response.statusCode,
      durationMs: Date.now() - startedAt,
    });
  });

  next();
}
