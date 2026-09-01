import type { NextFunction, Request, Response } from 'express';
import type { z } from 'zod';
import { AppError } from '../../../errors/AppError';

export function validateAuth(schema: z.ZodType) {
  return (request: Request, _response: Response, next: NextFunction) => {
    const result = schema.safeParse(request.body);
    if (!result.success) {
      next(
        new AppError('Request validation failed.', 400, 'VALIDATION_ERROR', {
          issues: result.error.issues,
        }),
      );
      return;
    }
    request.body = result.data;
    next();
  };
}
