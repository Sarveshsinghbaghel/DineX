import type { NextFunction, Request, Response } from 'express';
import { createRequestId } from '@x10think/utils';

export function requestIdMiddleware(_request: Request, response: Response, next: NextFunction) {
  const requestId = createRequestId();

  response.locals.requestId = requestId;
  response.setHeader('X-Request-Id', requestId);

  next();
}
