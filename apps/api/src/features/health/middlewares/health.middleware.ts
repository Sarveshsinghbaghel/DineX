import type { NextFunction, Request, Response } from 'express';

import { healthQuerySchema } from '../validators/health.validator';

export function validateHealthRequest(request: Request, _response: Response, next: NextFunction) {
  healthQuerySchema.parse(request.query);
  next();
}
