import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Role } from '../models/role.model';
import { Permission } from '../../permissions/models/permission.model';
import { User } from '../../auth/models/auth.models';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { CreateRoleInput, UpdateRoleInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

export async function listRoles(tenantId?: string) {
  const filter: Record<string, unknown> = {};
  if (tenantId) filter.tenantId = tenantId;
  const roles = await Role.find(filter).populate('permissionIds').sort({ createdAt: -1 });
  return roles;
}

export async function getRoleById(roleId: string) {
  if (!mongoose.Types.ObjectId.isValid(roleId)) {
    throw new AppError('Invalid role ID format.', 400, 'INVALID_ID');
  }
  const role = await Role.findById(roleId).populate('permissionIds');
  if (!role) {
    throw new AppError('Role not found.', 404, 'ROLE_NOT_FOUND');
  }
  return role;
}

export async function createRole(input: CreateRoleInput, actor: UserAuthContext) {
  const code = input.code.toLowerCase().trim();
  const existingCode = await Role.findOne({ code, tenantId: actor.tenantId });
  if (existingCode) {
    throw new AppError(`Role code '${code}' already exists.`, 409, 'ROLE_CODE_EXISTS');
  }

  const existingName = await Role.findOne({ name: input.name.trim(), tenantId: actor.tenantId });
  if (existingName) {
    throw new AppError(`Role with name '${input.name}' already exists.`, 409, 'ROLE_NAME_EXISTS');
  }

  // Validate permission IDs
  if (input.permissionIds && input.permissionIds.length > 0) {
    const validCount = await Permission.countDocuments({ _id: { $in: input.permissionIds } });
    if (validCount !== input.permissionIds.length) {
      throw new AppError('One or more permission IDs are invalid.', 400, 'INVALID_PERMISSIONS');
    }
  }

  const role = await Role.create({
    tenantId: actor.tenantId,
    name: input.name.trim(),
    code,
    description: input.description,
    permissionIds: input.permissionIds,
    status: 'active',
    isSystem: false,
  });

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ROLE_CREATED',
    targetType: 'role',
    targetId: role.id,
    metadata: { name: role.name, code: role.code },
  });

  return role.populate('permissionIds');
}

export async function updateRole(roleId: string, input: UpdateRoleInput, actor: UserAuthContext) {
  const role = await getRoleById(roleId);

  if (role.isSystem && input.name && input.name !== role.name) {
    throw new AppError('System roles cannot be renamed.', 403, 'SYSTEM_ROLE_PROTECTED');
  }

  if (input.name) {
    const duplicate = await Role.findOne({
      _id: { $ne: role._id },
      name: input.name.trim(),
      tenantId: actor.tenantId,
    });
    if (duplicate) {
      throw new AppError(`Role name '${input.name}' is already in use.`, 409, 'ROLE_NAME_EXISTS');
    }
    role.name = input.name.trim();
  }

  if (input.description !== undefined) role.description = input.description;
  if (input.status !== undefined) {
    if (role.isSystem && input.status === 'inactive') {
      throw new AppError('System roles cannot be deactivated.', 403, 'SYSTEM_ROLE_PROTECTED');
    }
    role.status = input.status;
  }

  if (input.permissionIds !== undefined) {
    const validCount = await Permission.countDocuments({ _id: { $in: input.permissionIds } });
    if (validCount !== input.permissionIds.length) {
      throw new AppError('One or more permission IDs are invalid.', 400, 'INVALID_PERMISSIONS');
    }
    role.permissionIds = input.permissionIds.map((id) => new mongoose.Types.ObjectId(id));
  }

  await role.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ROLE_UPDATED',
    targetType: 'role',
    targetId: role.id,
    metadata: { changes: input },
  });

  return role.populate('permissionIds');
}

export async function deleteRole(roleId: string, actor: UserAuthContext) {
  const role = await getRoleById(roleId);

  if (role.isSystem) {
    throw new AppError('System roles cannot be deleted.', 403, 'SYSTEM_ROLE_PROTECTED');
  }

  const assignedUsersCount = await User.countDocuments({ roleIds: role._id });
  if (assignedUsersCount > 0) {
    throw new AppError('Cannot delete role that is assigned to active users.', 409, 'ROLE_ASSIGNED');
  }

  await Role.deleteOne({ _id: role._id });

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ROLE_DELETED',
    targetType: 'role',
    targetId: roleId,
    metadata: { code: role.code, name: role.name },
  });
}

export async function assignPermissionsToRole(roleId: string, permissionIds: string[], actor: UserAuthContext) {
  const role = await getRoleById(roleId);

  const validCount = await Permission.countDocuments({ _id: { $in: permissionIds } });
  if (validCount !== permissionIds.length) {
    throw new AppError('One or more permission IDs are invalid.', 400, 'INVALID_PERMISSIONS');
  }

  const currentIds = role.permissionIds.map((id) => id.toString());
  const combined = Array.from(new Set([...currentIds, ...permissionIds])).map(
    (id) => new mongoose.Types.ObjectId(id),
  );

  role.permissionIds = combined;
  await role.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ROLE_PERMISSIONS_ASSIGNED',
    targetType: 'role',
    targetId: role.id,
    metadata: { addedPermissionIds: permissionIds },
  });

  return role.populate('permissionIds');
}

export async function removePermissionFromRole(roleId: string, permissionId: string, actor: UserAuthContext) {
  const role = await getRoleById(roleId);

  role.permissionIds = role.permissionIds.filter((id) => id.toString() !== permissionId);
  await role.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ROLE_PERMISSION_REMOVED',
    targetType: 'role',
    targetId: role.id,
    metadata: { removedPermissionId: permissionId },
  });

  return role.populate('permissionIds');
}
