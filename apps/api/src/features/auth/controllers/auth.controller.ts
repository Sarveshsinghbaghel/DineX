import type { Request, Response } from 'express';
import { AppError } from '../../../errors/AppError';
import { sendSuccessResponse } from '../../../shared/utils/api-response';
import {
  clearRefreshCookie,
  changePassword,
  currentUser,
  login,
  logout,
  logoutRefreshToken,
  refresh,
  register,
  requestPasswordReset,
  resendVerification,
  resetPassword,
  setRefreshCookie,
  verifyEmail,
} from '../services/auth.service';

function cookieValue(request: Request) {
  return request
    .get('cookie')
    ?.split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith('x10think_refresh='))
    ?.split('=')
    .slice(1)
    .join('=');
}
function body(request: Request) {
  return request.body as Record<string, string | undefined>;
}

export const authController = {
  async register(request: Request, response: Response) {
    const user = await register(
      body(request) as { name: string; email: string; phone?: string; password: string },
    );
    return sendSuccessResponse(response, {
      statusCode: 201,
      message: 'Registration completed. Verify your email to continue.',
      data: { user },
    });
  },
  async login(request: Request, response: Response) {
    const result = await login(body(request) as { email: string; password: string }, request);
    setRefreshCookie(response, result.refreshToken);
    return sendSuccessResponse(response, {
      message: 'Login successful.',
      data: { user: result.user, accessToken: result.accessToken },
    });
  },
  async refresh(request: Request, response: Response) {
    const raw = cookieValue(request);
    if (!raw) throw new AppError('Refresh token required.', 401, 'AUTH_TOKEN_INVALID');
    const result = await refresh(raw);
    setRefreshCookie(response, result.refreshToken);
    return sendSuccessResponse(response, {
      message: 'Session refreshed.',
      data: { user: result.user, accessToken: result.accessToken },
    });
  },
  async logout(request: Request, response: Response) {
    if (request.auth) await logout(request.auth.sessionId);
    else {
      const raw = cookieValue(request);
      if (raw) await logoutRefreshToken(raw);
    }
    clearRefreshCookie(response);
    return sendSuccessResponse(response, { message: 'Logout successful.', data: null });
  },
  async me(request: Request, response: Response) {
    return sendSuccessResponse(response, {
      message: 'Current user loaded.',
      data: { user: await currentUser(request.auth!.userId) },
    });
  },
  async verifyEmail(request: Request, response: Response) {
    await verifyEmail(body(request).token as string);
    return sendSuccessResponse(response, { message: 'Email verified.', data: null });
  },
  async resendVerification(request: Request, response: Response) {
    await resendVerification(body(request).email as string);
    return sendSuccessResponse(response, {
      message: 'If the account exists, a verification email will be sent.',
      data: null,
    });
  },
  async forgotPassword(request: Request, response: Response) {
    await requestPasswordReset(body(request).email as string);
    return sendSuccessResponse(response, {
      message: 'If the account exists, a password reset email will be sent.',
      data: null,
    });
  },
  async resetPassword(request: Request, response: Response) {
    await resetPassword(body(request).token as string, body(request).password as string);
    return sendSuccessResponse(response, { message: 'Password reset successful.', data: null });
  },
  async changePassword(request: Request, response: Response) {
    await changePassword(
      request.auth!.userId,
      body(request).currentPassword as string,
      body(request).password as string,
      request.auth!.sessionId,
    );
    clearRefreshCookie(response);
    return sendSuccessResponse(response, {
      message: 'Password changed. Please sign in again.',
      data: null,
    });
  },
};
