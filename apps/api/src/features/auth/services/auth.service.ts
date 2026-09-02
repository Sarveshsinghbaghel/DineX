import bcrypt from 'bcryptjs';
import { type Request } from 'express';
import jwt, { type JwtPayload } from 'jsonwebtoken';
import { env } from '../../../config/env';
import { logger } from '../../../config/logger';
import { AppError } from '../../../errors/AppError';
import { sendAuthEmail } from './email.service';
import {
  OneTimeToken,
  Session,
  User,
  createOpaqueToken,
  hashOpaqueToken,
  type UserDocument,
} from '../models/auth.models';

const ACCESS_TOKEN = 'access';
const REFRESH_TOKEN = 'refresh';
const lockThreshold = 5;
const lockMinutes = 15;

import { Role } from '../../roles/models/role.model';
import { Permission } from '../../permissions/models/permission.model';

export type SafeUser = Pick<
  UserDocument,
  | '_id'
  | 'name'
  | 'email'
  | 'phone'
  | 'emailVerified'
  | 'accountStatus'
  | 'lastLoginAt'
  | 'createdAt'
  | 'updatedAt'
> & {
  roles: Array<{ _id: string; code: string; name: string; isSystem: boolean }>;
  permissions: string[];
};

export async function buildSafeUserWithRoles(user: UserDocument): Promise<SafeUser> {
  const result = user.toObject({ versionKey: false }) as unknown as Record<string, unknown>;
  delete result.passwordHash;

  let roles: Array<{ _id: string; code: string; name: string; isSystem: boolean }> = [];
  let permissions: string[] = [];

  if (user.roleIds && user.roleIds.length > 0) {
    const roleDocs = await Role.find({ _id: { $in: user.roleIds }, status: 'active' }).lean();
    roles = roleDocs.map((r) => ({
      _id: r._id.toString(),
      code: r.code,
      name: r.name,
      isSystem: r.isSystem,
    }));

    const permIds = Array.from(
      new Set(roleDocs.flatMap((r) => r.permissionIds?.map((id: any) => id.toString()) ?? [])),
    );
    if (permIds.length > 0) {
      const permDocs = await Permission.find({ _id: { $in: permIds }, status: 'active' }).lean();
      permissions = permDocs.map((p) => p.code);
    }
  }

  return {
    ...result,
    roles,
    permissions,
  } as SafeUser;
}

function safeUser(user: UserDocument): SafeUser {
  const result = user.toObject({ versionKey: false }) as unknown as Record<string, unknown>;
  delete result.passwordHash;
  return {
    ...result,
    roles: [],
    permissions: [],
  } as unknown as SafeUser;
}

function tokenPayload(userId: string, sessionId: string, type: string) {
  return { sub: userId, sid: sessionId, type, jti: createOpaqueToken().token };
}

function issueAccessToken(user: UserDocument, sessionId: string) {
  return jwt.sign(tokenPayload(user.id, sessionId, ACCESS_TOKEN), env.JWT_ACCESS_SECRET, {
    expiresIn: env.ACCESS_TOKEN_TTL as jwt.SignOptions['expiresIn'],
  });
}

function issueRefreshToken(user: UserDocument, sessionId: string) {
  return jwt.sign(tokenPayload(user.id, sessionId, REFRESH_TOKEN), env.JWT_REFRESH_SECRET, {
    expiresIn: `${env.REFRESH_TOKEN_TTL_DAYS}d` as jwt.SignOptions['expiresIn'],
  });
}

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000);
}

export function setRefreshCookie(response: import('express').Response, token: string) {
  response.cookie('dinex_refresh', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
    path: '/api/v1/auth',
  });
}

export function clearRefreshCookie(response: import('express').Response) {
  response.clearCookie('dinex_refresh', {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/api/v1/auth',
  });
}

async function createSession(user: UserDocument, request: Request) {
  const session = await Session.create({
    userId: user._id,
    refreshTokenHash: 'pending',
    expiresAt: refreshExpiry(),
    lastUsedAt: new Date(),
    ipAddress: request.ip,
    userAgent: request.get('user-agent')?.slice(0, 300),
  });
  const refreshToken = issueRefreshToken(user, session.id);
  session.refreshTokenHash = hashOpaqueToken(refreshToken);
  await session.save();
  return { session, refreshToken, accessToken: issueAccessToken(user, session.id) };
}

export async function register(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  const exists = await User.exists({ email });
  if (exists)
    throw new AppError('Unable to create account with these details.', 409, 'AUTH_ACCOUNT_EXISTS');
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);
  const user = await User.create({ ...input, email, passwordHash });
  const token = createOpaqueToken();
  await OneTimeToken.create({
    userId: user._id,
    tokenHash: token.tokenHash,
    type: 'verification',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
  await sendAuthEmail({
    to: user.email,
    subject: 'Verify your DineX email',
    token: token.token,
    kind: 'verification',
  });
  return safeUser(user);
}

export async function login(input: { email: string; password: string }, request: Request) {
  const email = input.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select('+passwordHash');
  const invalid = () => {
    logger.warn('Authentication failed', { emailDomain: email.split('@')[1] });
    throw new AppError('Invalid email or password.', 401, 'AUTH_INVALID_CREDENTIALS');
  };
  if (!user) return invalid();
  if (user.lockUntil && user.lockUntil > new Date())
    throw new AppError('Account temporarily locked. Try again later.', 423, 'AUTH_ACCOUNT_LOCKED');
  if (user.accountStatus !== 'active') return invalid();
  if (!(await bcrypt.compare(input.password, user.passwordHash))) {
    user.failedLoginAttempts += 1;
    if (user.failedLoginAttempts >= lockThreshold) {
      user.lockUntil = new Date(Date.now() + lockMinutes * 60 * 1000);
      user.accountStatus = 'locked';
      logger.warn('Account locked', { userId: user.id });
    }
    await user.save();
    return invalid();
  }
  if (!user.emailVerified)
    throw new AppError(
      'Please verify your email before signing in.',
      403,
      'AUTH_EMAIL_NOT_VERIFIED',
    );
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.accountStatus = 'active';
  user.lastLoginAt = new Date();
  await user.save();
  const auth = await createSession(user, request);
  const safeUserData = await buildSafeUserWithRoles(user);
  return { user: safeUserData, ...auth };
}

export async function refresh(rawToken: string) {
  let payload: JwtPayload;
  try {
    payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError)
      throw new AppError('Refresh token expired.', 401, 'AUTH_TOKEN_EXPIRED');
    throw new AppError('Invalid refresh token.', 401, 'AUTH_TOKEN_INVALID');
  }
  if (
    payload.type !== REFRESH_TOKEN ||
    typeof payload.sub !== 'string' ||
    typeof payload.sid !== 'string'
  )
    throw new AppError('Invalid refresh token.', 401, 'AUTH_TOKEN_INVALID');
  const session = await Session.findById(payload.sid);
  if (!session || session.revokedAt || session.expiresAt <= new Date())
    throw new AppError('Session revoked.', 401, 'AUTH_SESSION_REVOKED');
  if (session.refreshTokenHash !== hashOpaqueToken(rawToken)) {
    await Session.updateOne({ _id: session.id }, { revokedAt: new Date() });
    logger.warn('Refresh token reuse detected', { sessionId: session.id, userId: payload.sub });
    throw new AppError('Refresh token reuse detected.', 401, 'AUTH_REFRESH_REUSED');
  }
  const user = await User.findById(payload.sub).select('+passwordHash');
  if (!user || user.accountStatus !== 'active')
    throw new AppError('Invalid session.', 401, 'AUTH_SESSION_REVOKED');
  const refreshToken = issueRefreshToken(user, session.id);
  session.refreshTokenHash = hashOpaqueToken(refreshToken);
  session.lastUsedAt = new Date();
  await session.save();
  const safeUserData = await buildSafeUserWithRoles(user);
  return { user: safeUserData, accessToken: issueAccessToken(user, session.id), refreshToken };
}

export async function logout(sessionId: string) {
  await Session.updateOne({ _id: sessionId }, { revokedAt: new Date() });
}

export async function logoutRefreshToken(rawToken: string) {
  try {
    const payload = jwt.verify(rawToken, env.JWT_REFRESH_SECRET) as JwtPayload;
    if (typeof payload.sid === 'string') await logout(payload.sid);
  } catch {
    return;
  }
}

export function verifyAccessToken(rawToken: string) {
  try {
    const payload = jwt.verify(rawToken, env.JWT_ACCESS_SECRET) as JwtPayload;
    if (
      payload.type !== ACCESS_TOKEN ||
      typeof payload.sub !== 'string' ||
      typeof payload.sid !== 'string'
    )
      throw new Error('invalid claims');
    return payload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError)
      throw new AppError('Access token expired.', 401, 'AUTH_TOKEN_EXPIRED');
    throw new AppError('Invalid access token.', 401, 'AUTH_TOKEN_INVALID');
  }
}

export async function currentUser(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 401, 'AUTH_TOKEN_INVALID');
  return buildSafeUserWithRoles(user);
}

async function issueOneTime(user: UserDocument, type: 'verification' | 'reset') {
  await OneTimeToken.deleteMany({ userId: user._id, type, usedAt: { $exists: false } });
  const token = createOpaqueToken();
  await OneTimeToken.create({
    userId: user._id,
    tokenHash: token.tokenHash,
    type,
    expiresAt: new Date(Date.now() + (type === 'reset' ? 60 : 24 * 60) * 60 * 1000),
  });
  await sendAuthEmail({
    to: user.email,
    subject: type === 'reset' ? 'Reset your DineX password' : 'Verify your DineX email',
    token: token.token,
    kind: type,
  });
}

export async function verifyEmail(rawToken: string) {
  const token = await OneTimeToken.findOne({
    tokenHash: hashOpaqueToken(rawToken),
    type: 'verification',
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!token)
    throw new AppError('Verification token is invalid or expired.', 400, 'AUTH_TOKEN_INVALID');
  await User.updateOne({ _id: token.userId }, { emailVerified: true });
  token.usedAt = new Date();
  await token.save();
}

export async function requestPasswordReset(email: string) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (user) await issueOneTime(user, 'reset');
}

export async function resendVerification(email: string) {
  const user = await User.findOne({ email: email.trim().toLowerCase() }).select('+passwordHash');
  if (user && !user.emailVerified) await issueOneTime(user, 'verification');
}

export async function resetPassword(rawToken: string, password: string) {
  const token = await OneTimeToken.findOne({
    tokenHash: hashOpaqueToken(rawToken),
    type: 'reset',
    usedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  });
  if (!token)
    throw new AppError('Reset token is invalid or expired.', 400, 'AUTH_RESET_TOKEN_INVALID');
  const user = await User.findById(token.userId).select('+passwordHash');
  if (!user) throw new AppError('Reset token is invalid.', 400, 'AUTH_RESET_TOKEN_INVALID');
  user.passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  user.accountStatus = 'active';
  await user.save();
  token.usedAt = new Date();
  await token.save();
  await Session.updateMany({ userId: user._id, revokedAt: undefined }, { revokedAt: new Date() });
}

export async function changePassword(
  userId: string,
  currentPassword: string,
  password: string,
  sessionId: string,
) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user || !(await bcrypt.compare(currentPassword, user.passwordHash)))
    throw new AppError('Current password is incorrect.', 400, 'AUTH_INVALID_CREDENTIALS');
  user.passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);
  user.passwordChangedAt = new Date();
  await user.save();
  await Session.updateMany(
    { userId: user._id, _id: { $ne: sessionId }, revokedAt: undefined },
    { revokedAt: new Date() },
  );
}

export async function createLoginSession(userId: string, request: Request) {
  const user = await User.findById(userId).select('+passwordHash');
  if (!user) throw new AppError('User not found.', 404);
  return createSession(user, request);
}
