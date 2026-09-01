import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { User } from '../../auth/models/auth.models';
import { Role } from '../../roles/models/role.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import type { AssignUserRolesInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

export async function assignRolesToUser(
  targetUserId: string,
  input: AssignUserRolesInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid target user ID.', 400, 'INVALID_ID');
  }

  // Self-role modification check
  if (actor.userId === targetUserId) {
    await logAuditEvent({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'PRIVILEGE_ESCALATION_ATTEMPT',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { reason: 'User attempted to assign roles to self' },
    });
    throw new AppError('Users cannot modify their own roles.', 403, 'SELF_ROLE_MODIFICATION_FORBIDDEN');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');
  }

  // Validate roles existence and active status
  const rolesToAssign = await Role.find({
    _id: { $in: input.roleIds },
    status: 'active',
  });

  if (rolesToAssign.length !== input.roleIds.length) {
    throw new AppError('One or more specified role IDs do not exist or are inactive.', 400, 'INVALID_ROLES');
  }

  // Check for privilege escalation: non-super_admin assigning super_admin role
  const isAssigningSuperAdmin = rolesToAssign.some((r) => r.code === 'super_admin');
  const actorIsSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');

  if (isAssigningSuperAdmin && !actorIsSuperAdmin) {
    await logAuditEvent({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'PRIVILEGE_ESCALATION_ATTEMPT',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { reason: 'Attempted to assign super_admin role without super_admin privileges' },
    });
    throw new AppError('Only Super Admin can assign the Super Admin role.', 403, 'PRIVILEGE_ESCALATION_FORBIDDEN');
  }

  const newRoleObjectIds = input.roleIds.map((id) => new mongoose.Types.ObjectId(id));
  targetUser.roleIds = newRoleObjectIds;
  if (input.branchIds) {
    targetUser.branchIds = input.branchIds;
  }
  await targetUser.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'USER_ROLES_ASSIGNED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { assignedRoleIds: input.roleIds, roleCodes: rolesToAssign.map((r) => r.code) },
  });

  const updated = await User.findById(targetUserId).populate('roleIds');
  return updated;
}

export async function removeRoleFromUser(
  targetUserId: string,
  roleId: string,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId) || !mongoose.Types.ObjectId.isValid(roleId)) {
    throw new AppError('Invalid user or role ID format.', 400, 'INVALID_ID');
  }

  if (actor.userId === targetUserId) {
    await logAuditEvent({
      tenantId: actor.tenantId,
      actorId: actor.userId,
      action: 'PRIVILEGE_ESCALATION_ATTEMPT',
      targetType: 'user',
      targetId: targetUserId,
      metadata: { reason: 'User attempted to remove role from self' },
    });
    throw new AppError('Users cannot modify their own roles.', 403, 'SELF_ROLE_MODIFICATION_FORBIDDEN');
  }

  const targetUser = await User.findById(targetUserId);
  if (!targetUser) {
    throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');
  }

  targetUser.roleIds = targetUser.roleIds.filter((id) => id.toString() !== roleId);
  await targetUser.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'USER_ROLE_REMOVED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { removedRoleId: roleId },
  });

  const updated = await User.findById(targetUserId).populate('roleIds');
  return updated;
}
