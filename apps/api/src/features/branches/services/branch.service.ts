import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Branch } from '../models/branch.model';
import { Restaurant } from '../../restaurants/models/restaurant.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import { upsertSetting, getEffectiveSettings } from '../../settings/services/settings.service';
import type { CreateBranchInput, UpdateBranchInput, BranchQueryInput } from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

function checkBranchScope(
  actor: UserAuthContext,
  branch: { tenantId: string; _id: mongoose.Types.ObjectId | string },
) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (isSuperAdmin) return;

  if (actor.tenantId && actor.tenantId !== branch.tenantId) {
    throw new AppError('Access denied: cross-tenant branch access prohibited.', 403, 'FORBIDDEN');
  }

  // Manager branch scope check if manager role
  const isManager = actor.roles.some((r) => r.code === 'manager');
  const isAdmin = actor.roles.some((r) => r.code === 'admin');

  if (isManager && !isAdmin && actor.branchIds && actor.branchIds.length > 0) {
    const branchIdStr = branch._id.toString();
    if (!actor.branchIds.includes(branchIdStr)) {
      throw new AppError('Access denied: user is not assigned to this branch.', 403, 'FORBIDDEN');
    }
  }
}

export async function createBranch(input: CreateBranchInput, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(input.restaurantId)) {
    throw new AppError('Invalid parent restaurant ID format.', 400, 'INVALID_ID');
  }

  const restaurant = await Restaurant.findById(input.restaurantId);
  if (!restaurant) {
    throw new AppError(
      'Parent restaurant not found. Orphan branches are not allowed.',
      404,
      'RESTAURANT_NOT_FOUND',
    );
  }

  // Check unique branch code in restaurant scope
  const existingCode = await Branch.findOne({
    restaurantId: restaurant._id,
    code: input.code,
  });

  if (existingCode) {
    throw new AppError(
      `Branch code '${input.code}' already exists for this restaurant.`,
      409,
      'BRANCH_CODE_EXISTS',
    );
  }

  const branch = await Branch.create({
    restaurantId: restaurant._id,
    tenantId: restaurant.tenantId,
    name: input.name,
    code: input.code,
    address: input.address,
    phone: input.phone,
    email: input.email,
    managerId: input.managerId ? new mongoose.Types.ObjectId(input.managerId) : undefined,
    businessHours: input.businessHours ?? restaurant.businessHours,
    timezone: input.timezone || restaurant.timezone,
    status: input.status,
    capacity: input.capacity,
    coordinates: input.coordinates,
    serviceModes: input.serviceModes,
    createdBy: new mongoose.Types.ObjectId(actor.userId),
  });

  await logAuditEvent({
    tenantId: restaurant.tenantId,
    actorId: actor.userId,
    action: 'BRANCH_CREATED',
    targetType: 'branch',
    targetId: branch.id,
    metadata: { name: branch.name, code: branch.code, restaurantId: restaurant.id },
  });

  return branch;
}

export async function getBranchById(branchId: string, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(branchId)) {
    throw new AppError('Invalid branch ID format.', 400, 'INVALID_ID');
  }

  const branch = await Branch.findById(branchId).populate('restaurantId');
  if (!branch) throw new AppError('Branch not found.', 404, 'BRANCH_NOT_FOUND');

  checkBranchScope(actor, branch);
  return branch;
}

export async function updateBranch(
  branchId: string,
  input: UpdateBranchInput,
  actor: UserAuthContext,
) {
  const branch = await getBranchById(branchId, actor);

  if (input.code !== undefined && input.code !== branch.code) {
    const existingCode = await Branch.findOne({
      restaurantId: branch.restaurantId,
      code: input.code,
      _id: { $ne: branch._id },
    });
    if (existingCode) {
      throw new AppError(
        `Branch code '${input.code}' already exists for this restaurant.`,
        409,
        'BRANCH_CODE_EXISTS',
      );
    }
    branch.code = input.code;
  }

  if (input.name !== undefined) branch.name = input.name;
  if (input.address !== undefined) branch.address = input.address as any;
  if (input.phone !== undefined) branch.phone = input.phone;
  if (input.email !== undefined) branch.email = input.email;
  if (input.managerId !== undefined) {
    branch.managerId = input.managerId ? new mongoose.Types.ObjectId(input.managerId) : undefined;
  }
  if (input.businessHours !== undefined) branch.businessHours = input.businessHours;
  if (input.timezone !== undefined) branch.timezone = input.timezone;
  if (input.capacity !== undefined) branch.capacity = input.capacity;
  if (input.coordinates !== undefined) branch.coordinates = input.coordinates;
  if (input.serviceModes !== undefined) branch.serviceModes = input.serviceModes;

  branch.updatedBy = new mongoose.Types.ObjectId(actor.userId);
  await branch.save();

  await logAuditEvent({
    tenantId: branch.tenantId,
    actorId: actor.userId,
    action: 'BRANCH_UPDATED',
    targetType: 'branch',
    targetId: branch.id,
    metadata: { changes: Object.keys(input) },
  });

  return branch;
}

export async function updateBranchStatus(
  branchId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TEMPORARILY_CLOSED',
  reason: string | undefined,
  actor: UserAuthContext,
) {
  const branch = await getBranchById(branchId, actor);

  branch.status = status;
  if (reason) branch.statusReason = reason;
  branch.updatedBy = new mongoose.Types.ObjectId(actor.userId);
  await branch.save();

  await logAuditEvent({
    tenantId: branch.tenantId,
    actorId: actor.userId,
    action: 'BRANCH_STATUS_CHANGED',
    targetType: 'branch',
    targetId: branch.id,
    metadata: { newStatus: status, reason },
  });

  return branch;
}

export async function updateBranchSettings(
  branchId: string,
  settings: Record<string, unknown>,
  actor: UserAuthContext,
) {
  const branch = await getBranchById(branchId, actor);

  for (const [key, value] of Object.entries(settings)) {
    await upsertSetting(branch.tenantId, 'branch', key, value, branch.id);
  }

  await logAuditEvent({
    tenantId: branch.tenantId,
    actorId: actor.userId,
    action: 'BRANCH_SETTINGS_UPDATED',
    targetType: 'branch',
    targetId: branch.id,
    metadata: { keys: Object.keys(settings) },
  });

  return getEffectiveSettings(branch.tenantId, branch.id);
}

export async function listBranches(query: BranchQueryInput, actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};

  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) {
    filter.tenantId = actor.tenantId;
  }

  // Manager scope filtering
  const isManager = actor.roles.some((r) => r.code === 'manager');
  const isAdmin = actor.roles.some((r) => r.code === 'admin');
  if (isManager && !isAdmin && actor.branchIds && actor.branchIds.length > 0) {
    filter._id = { $in: actor.branchIds.map((id) => new mongoose.Types.ObjectId(id)) };
  }

  if (query.restaurantId) {
    filter.restaurantId = new mongoose.Types.ObjectId(query.restaurantId);
  }

  if (query.status) filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: regex }, { code: regex }, { phone: regex }];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [branches, total] = await Promise.all([
    Branch.find(filter).populate('restaurantId').sort({ createdAt: -1 }).skip(skip).limit(limit),
    Branch.countDocuments(filter),
  ]);

  return {
    branches,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
