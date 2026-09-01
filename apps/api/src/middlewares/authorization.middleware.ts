import type { NextFunction, Request, Response } from 'express';
import type mongoose from 'mongoose';
import { AppError } from '../errors/AppError';
import { User } from '../features/auth/models/auth.models';
import { verifyAccessToken } from '../features/auth/services/auth.service';
import { Role } from '../features/roles/models/role.model';
import { Permission } from '../features/permissions/models/permission.model';
import { logAuditEvent } from '../features/audit-logs/services/audit-log.service';

export interface UserAuthContext {
  userId: string;
  sessionId: string;
  tenantId?: string;
  branchIds?: string[];
  roles: Array<{ _id: string; code: string; name: string; isSystem: boolean }>;
  permissions: string[];
}

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; sessionId: string };
      user?: UserAuthContext;
    }
  }
}

/**
 * Authenticates user and builds populated authorization context (roles & compiled permissions)
 */
export async function requireAuth(request: Request, _response: Response, next: NextFunction): Promise<void> {
  try {
    const header = request.get('authorization');
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('Authentication required.', 401, 'AUTH_TOKEN_INVALID');
    }
    const payload = verifyAccessToken(header.slice(7));
    const userId = payload.sub as string;
    const sessionId = payload.sid as string;

    const userDoc = await User.findById(userId).lean();
    if (!userDoc || userDoc.accountStatus === 'disabled' || userDoc.accountStatus === 'locked') {
      throw new AppError('User account is invalid or suspended.', 401, 'AUTH_ACCOUNT_SUSPENDED');
    }

    // Populate active roles and permissions
    let roleDocs: Array<any> = [];
    if (userDoc.roleIds && userDoc.roleIds.length > 0) {
      roleDocs = await Role.find({
        _id: { $in: userDoc.roleIds },
        status: 'active',
      }).lean();
    }

    const permissionIds = Array.from(
      new Set(roleDocs.flatMap((r) => r.permissionIds?.map((id: any) => id.toString()) ?? [])),
    );

    let permissionCodes: string[] = [];
    if (permissionIds.length > 0) {
      const permDocs = await Permission.find({
        _id: { $in: permissionIds },
        status: 'active',
      }).lean();
      permissionCodes = permDocs.map((p) => p.code);
    }

    const userRoles = roleDocs.map((r) => ({
      _id: r._id.toString(),
      code: r.code,
      name: r.name,
      isSystem: r.isSystem,
    }));

    request.auth = { userId, sessionId };
    request.user = {
      userId,
      sessionId,
      tenantId: userDoc.tenantId,
      branchIds: userDoc.branchIds,
      roles: userRoles,
      permissions: permissionCodes,
    };

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Enforces that user possesses at least one of the specified permissions (or system.doEverything)
 */
export function requirePermission(...requiredPermissions: string[]) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!request.user) {
        throw new AppError('Authentication required.', 401, 'AUTH_TOKEN_INVALID');
      }

      const hasAccess = hasAnyPermission(request.user, requiredPermissions);
      if (!hasAccess) {
        await logAuditEvent({
          tenantId: request.user.tenantId,
          actorId: request.user.userId,
          action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          targetType: 'permission',
          metadata: {
            requiredPermissions,
            userRoles: request.user.roles.map((r) => r.code),
            path: request.originalUrl,
            method: request.method,
          },
          ipAddress: request.ip,
          userAgent: request.get('user-agent'),
        });
        throw new AppError('Access forbidden. Required permission missing.', 403, 'FORBIDDEN');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Enforces that user possesses at least one of the specified role codes
 */
export function requireRole(...requiredRoleCodes: string[]) {
  return async (request: Request, _response: Response, next: NextFunction): Promise<void> => {
    try {
      if (!request.user) {
        throw new AppError('Authentication required.', 401, 'AUTH_TOKEN_INVALID');
      }

      const userRoleCodes = request.user.roles.map((r) => r.code);
      const isSuperAdmin = userRoleCodes.includes('super_admin');
      const hasRole = isSuperAdmin || requiredRoleCodes.some((code) => userRoleCodes.includes(code));

      if (!hasRole) {
        await logAuditEvent({
          tenantId: request.user.tenantId,
          actorId: request.user.userId,
          action: 'UNAUTHORIZED_ROLE_ACCESS_ATTEMPT',
          targetType: 'role',
          metadata: {
            requiredRoleCodes,
            userRoles: userRoleCodes,
            path: request.originalUrl,
          },
          ipAddress: request.ip,
          userAgent: request.get('user-agent'),
        });
        throw new AppError('Access forbidden. Required role missing.', 403, 'FORBIDDEN');
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Checks if user has a single permission code or system.doEverything
 */
export function hasPermission(user: UserAuthContext | undefined, permissionCode: string): boolean {
  if (!user) return false;
  if (user.permissions.includes('system.doEverything')) return true;
  return user.permissions.includes(permissionCode);
}

/**
 * Checks if user has any of the specified permission codes
 */
export function hasAnyPermission(user: UserAuthContext | undefined, permissionCodes: string[]): boolean {
  if (!user) return false;
  if (user.permissions.includes('system.doEverything')) return true;
  return permissionCodes.some((code) => user.permissions.includes(code));
}

/**
 * Checks if user has all of the specified permission codes
 */
export function hasAllPermissions(user: UserAuthContext | undefined, permissionCodes: string[]): boolean {
  if (!user) return false;
  if (user.permissions.includes('system.doEverything')) return true;
  return permissionCodes.every((code) => user.permissions.includes(code));
}

/**
 * Checks resource ownership
 */
export function isOwner(
  user: UserAuthContext | undefined,
  resourceOwnerId: string | mongoose.Types.ObjectId | undefined,
): boolean {
  if (!user || !resourceOwnerId) return false;
  return user.userId === String(resourceOwnerId);
}

/**
 * Enforces resource ownership or scope (branch/tenant)
 */
export function checkResourceOwnershipAndScope(
  user: UserAuthContext | undefined,
  resource: {
    userId?: string | mongoose.Types.ObjectId;
    branchId?: string;
    tenantId?: string;
  },
): boolean {
  if (!user) return false;

  // Super admin accesses all scope
  if (user.permissions.includes('system.doEverything')) return true;

  // If user owns the resource
  if (resource.userId && isOwner(user, resource.userId)) return true;

  // Tenant boundary check
  if (resource.tenantId && user.tenantId && resource.tenantId !== user.tenantId) return false;

  // Branch boundary check (if branch ids assigned to staff)
  if (resource.branchId && user.branchIds && user.branchIds.length > 0) {
    if (!user.branchIds.includes(resource.branchId)) return false;
  }

  return true;
}
