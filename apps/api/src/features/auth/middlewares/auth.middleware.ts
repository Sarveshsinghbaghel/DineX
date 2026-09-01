import type { NextFunction, Request, Response } from 'express';
import { AppError } from '../../../errors/AppError';
import { currentUser, verifyAccessToken } from '../services/auth.service';

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string };
    }
  }
}

export async function requireAuth(request: Request, _response: Response, next: NextFunction) {
  try {
    const header = request.get('authorization');
    if (!header?.startsWith('Bearer '))
      throw new AppError('Authentication required.', 401, 'AUTH_TOKEN_INVALID');
    const payload = verifyAccessToken(header.slice(7));
    await currentUser(payload.sub as string);
    request.auth = { userId: payload.sub as string, sessionId: payload.sid as string };
    next();
  } catch (error) {
    next(error);
  }
}
