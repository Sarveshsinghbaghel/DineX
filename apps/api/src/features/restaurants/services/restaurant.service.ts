import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { Restaurant } from '../models/restaurant.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import { upsertSetting, getEffectiveSettings } from '../../settings/services/settings.service';
import type { WeeklyBusinessHours } from '@x10think/types';
import type {
  CreateRestaurantInput,
  UpdateRestaurantInput,
  RestaurantQueryInput,
} from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

function checkTenantBoundary(actor: UserAuthContext, tenantId: string) {
  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId && actor.tenantId !== tenantId) {
    throw new AppError('Access denied: cross-tenant access prohibited.', 403, 'FORBIDDEN');
  }
}

export async function createRestaurant(input: CreateRestaurantInput, actor: UserAuthContext) {
  // Generate tenantId from restaurant creation or use actor's tenantId if available
  const initialId = new mongoose.Types.ObjectId();
  const tenantId = actor.tenantId || initialId.toString();

  const existing = await Restaurant.findOne({ legalName: input.legalName });
  if (existing) {
    throw new AppError('Restaurant with this legal name already exists.', 409, 'RESTAURANT_EXISTS');
  }

  const restaurant = await Restaurant.create({
    _id: initialId,
    tenantId,
    name: input.name,
    legalName: input.legalName,
    description: input.description,
    email: input.email,
    phone: input.phone,
    website: input.website,
    address: input.address,
    cuisineTypes: input.cuisineTypes,
    taxConfig: input.taxConfig,
    currency: input.currency,
    timezone: input.timezone,
    status: input.status,
    businessHours: input.businessHours,
    createdBy: new mongoose.Types.ObjectId(actor.userId),
  });

  await logAuditEvent({
    tenantId,
    actorId: actor.userId,
    action: 'RESTAURANT_CREATED',
    targetType: 'restaurant',
    targetId: restaurant.id,
    metadata: { name: restaurant.name, legalName: restaurant.legalName },
  });

  return restaurant;
}

export async function getRestaurantById(restaurantId: string, actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(restaurantId)) {
    throw new AppError('Invalid restaurant ID format.', 400, 'INVALID_ID');
  }
  const restaurant = await Restaurant.findById(restaurantId);
  if (!restaurant) throw new AppError('Restaurant not found.', 404, 'RESTAURANT_NOT_FOUND');

  checkTenantBoundary(actor, restaurant.tenantId);
  return restaurant;
}

export async function updateRestaurant(
  restaurantId: string,
  input: UpdateRestaurantInput,
  actor: UserAuthContext,
) {
  const restaurant = await getRestaurantById(restaurantId, actor);

  if (input.name !== undefined) restaurant.name = input.name;
  if (input.legalName !== undefined) restaurant.legalName = input.legalName;
  if (input.description !== undefined) restaurant.description = input.description;
  if (input.email !== undefined) restaurant.email = input.email;
  if (input.phone !== undefined) restaurant.phone = input.phone;
  if (input.website !== undefined) restaurant.website = input.website;
  if (input.address !== undefined) restaurant.address = input.address as any;
  if (input.cuisineTypes !== undefined) restaurant.cuisineTypes = input.cuisineTypes;
  if (input.taxConfig !== undefined) restaurant.taxConfig = input.taxConfig;
  if (input.currency !== undefined) restaurant.currency = input.currency;
  if (input.timezone !== undefined) restaurant.timezone = input.timezone;

  restaurant.updatedBy = new mongoose.Types.ObjectId(actor.userId);
  await restaurant.save();

  await logAuditEvent({
    tenantId: restaurant.tenantId,
    actorId: actor.userId,
    action: 'RESTAURANT_UPDATED',
    targetType: 'restaurant',
    targetId: restaurant.id,
    metadata: { changes: Object.keys(input) },
  });

  return restaurant;
}

export async function updateRestaurantStatus(
  restaurantId: string,
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ONBOARDING',
  reason: string | undefined,
  actor: UserAuthContext,
) {
  const restaurant = await getRestaurantById(restaurantId, actor);

  restaurant.status = status;
  if (reason) restaurant.statusReason = reason;
  restaurant.updatedBy = new mongoose.Types.ObjectId(actor.userId);
  await restaurant.save();

  await logAuditEvent({
    tenantId: restaurant.tenantId,
    actorId: actor.userId,
    action: 'RESTAURANT_STATUS_CHANGED',
    targetType: 'restaurant',
    targetId: restaurant.id,
    metadata: { newStatus: status, reason },
  });

  return restaurant;
}

export async function replaceBusinessHours(
  restaurantId: string,
  hours: WeeklyBusinessHours,
  actor: UserAuthContext,
) {
  const restaurant = await getRestaurantById(restaurantId, actor);

  restaurant.businessHours = hours;
  restaurant.updatedBy = new mongoose.Types.ObjectId(actor.userId);
  await restaurant.save();

  await logAuditEvent({
    tenantId: restaurant.tenantId,
    actorId: actor.userId,
    action: 'BUSINESS_HOURS_UPDATED',
    targetType: 'restaurant',
    targetId: restaurant.id,
  });

  return restaurant.businessHours;
}

export async function updateRestaurantSettings(
  restaurantId: string,
  settings: Record<string, unknown>,
  actor: UserAuthContext,
) {
  const restaurant = await getRestaurantById(restaurantId, actor);

  for (const [key, value] of Object.entries(settings)) {
    await upsertSetting(restaurant.tenantId, 'tenant', key, value);
  }

  await logAuditEvent({
    tenantId: restaurant.tenantId,
    actorId: actor.userId,
    action: 'RESTAURANT_SETTINGS_UPDATED',
    targetType: 'restaurant',
    targetId: restaurant.id,
    metadata: { keys: Object.keys(settings) },
  });

  return getEffectiveSettings(restaurant.tenantId);
}

export async function listRestaurants(query: RestaurantQueryInput, actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};

  const isSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');
  if (!isSuperAdmin && actor.tenantId) {
    filter.tenantId = actor.tenantId;
  }

  if (query.status) filter.status = query.status;
  if (query.search) {
    const regex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: regex }, { legalName: regex }, { email: regex }];
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [restaurants, total] = await Promise.all([
    Restaurant.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Restaurant.countDocuments(filter),
  ]);

  return {
    restaurants,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
