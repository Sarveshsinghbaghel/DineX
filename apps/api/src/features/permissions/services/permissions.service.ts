import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Permission } from '../models/permission.model';
import { Role } from '../../roles/models/role.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { CreatePermissionInput, UpdatePermissionInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

export async function listPermissions(filters?: { module?: string; scope?: string; status?: string }) {
  const query: Record<string, unknown> = {};
  if (filters?.module) query.module = filters.module;
  if (filters?.scope) query.scope = filters.scope;
  if (filters?.status) query.status = filters.status;
  return Permission.find(query).sort({ module: 1, action: 1 });
}

export async function getPermissionById(permissionId: string) {
  if (!mongoose.Types.ObjectId.isValid(permissionId)) {
    throw new AppError('Invalid permission ID format.', 400, 'INVALID_ID');
  }
  const permission = await Permission.findById(permissionId);
  if (!permission) {
    throw new AppError('Permission not found.', 404, 'PERMISSION_NOT_FOUND');
  }
  return permission;
}

export async function getRolePermissions(roleId: string) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new AppError('Invalid role ID format.', 400, 'INVALID_ID');
  }
  const role = await Role.findById(roleId).populate('permissionIds');
  if (!role) {
    throw new AppError('Role not found.', 404, 'ROLE_NOT_FOUND');
  }
  return role.permissionIds;
}

export async function createPermission(input: CreatePermissionInput, actor: UserAuthContext) {
  const code = input.code.toLowerCase().trim();
  const existing = await Permission.findOne({ code });
  if (existing) {
    throw new AppError(`Permission code '${code}' already exists.`, 409, 'PERMISSION_CODE_EXISTS');
  }

  const permission = await Permission.create({
    code,
    module: input.module.toLowerCase().trim(),
    action: input.action.toLowerCase().trim(),
    scope: input.scope,
    description: input.description,
    status: 'active',
    isSystem: false,
  });

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'PERMISSION_CREATED',
    targetType: 'permission',
    targetId: permission.id,
    metadata: { code: permission.code, module: permission.module },
  });

  return permission;
}

export async function updatePermission(
  permissionId: string,
  input: UpdatePermissionInput,
  actor: UserAuthContext,
) {
  const permission = await getPermissionById(permissionId);

  if (permission.isSystem && input.status === 'inactive') {
    throw new AppError('System permissions cannot be deactivated.', 403, 'SYSTEM_PERMISSION_PROTECTED');
  }

  if (input.description !== undefined) permission.description = input.description;
  if (input.status !== undefined) permission.status = input.status;
  if (input.scope !== undefined) permission.scope = input.scope;

  await permission.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'PERMISSION_UPDATED',
    targetType: 'permission',
    targetId: permission.id,
    metadata: { changes: input },
  });

  return permission;
}
