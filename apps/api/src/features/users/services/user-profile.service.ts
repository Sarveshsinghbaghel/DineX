import mongoose from 'mongoose';
import { AppError } from '../../../errors/AppError';
import { User, type UserDocument } from '../../auth/models/auth.models';
import { Role } from '../../roles/models/role.model';
import { logAuditEvent } from '../../audit-logs/services/audit-log.service';
import {
  uploadAvatarToCloudinary,
  deleteAvatarFromCloudinary,
} from '../../../lib/cloudinary.service';
import type {
  UpdateProfileInput,
  AddressInput,
  UpdateAddressInput,
  PreferencesInput,
  AdminUpdateUserInput,
  UserQueryInput,
} from '@x10think/validation';
import type { UserAuthContext } from '../../../middlewares/authorization.middleware';

function sanitizeUserObject(userDoc: UserDocument) {
  const obj = userDoc.toObject({ versionKey: false }) as unknown as Record<string, unknown>;
  delete obj.passwordHash;
  delete obj.failedLoginAttempts;
  delete obj.lockUntil;
  return obj;
}

export async function getOwnProfile(userId: string) {
  const user = await User.findById(userId).populate('roleIds');
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  return sanitizeUserObject(user);
}

export async function updateOwnProfile(
  userId: string,
  input: UpdateProfileInput,
  actor: UserAuthContext,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  // Explicit field whitelisting
  if (input.firstName !== undefined || input.lastName !== undefined) {
    user.profile = {
      firstName: input.firstName ?? user.profile?.firstName ?? '',
      lastName: input.lastName ?? user.profile?.lastName ?? '',
      displayName:
        `${input.firstName ?? user.profile?.firstName ?? ''} ${input.lastName ?? user.profile?.lastName ?? ''}`.trim(),
    };
    user.name = user.profile.displayName || user.name;
  }

  if (input.phone !== undefined) {
    user.phone = input.phone;
  }
  if (input.locale !== undefined) {
    user.locale = input.locale;
  }
  if (input.timezone !== undefined) {
    user.timezone = input.timezone;
  }

  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'PROFILE_UPDATED',
    targetType: 'user',
    targetId: userId,
    metadata: { fields: Object.keys(input) },
  });

  return sanitizeUserObject(user);
}

export async function uploadAvatar(
  userId: string,
  buffer: Buffer,
  mimeType: string,
  actor: UserAuthContext,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  // Upload new avatar to Cloudinary
  const asset = await uploadAvatarToCloudinary(userId, buffer, mimeType);

  // If user previously had an avatar, delete old one from Cloudinary
  if (user.avatar?.publicId) {
    await deleteAvatarFromCloudinary(user.avatar.publicId);
  }

  user.avatar = asset;
  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'AVATAR_UPLOADED',
    targetType: 'user',
    targetId: userId,
    metadata: { publicId: asset.publicId, url: asset.url },
  });

  return asset;
}

export async function deleteAvatar(userId: string, actor: UserAuthContext) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  if (!user.avatar?.publicId) {
    throw new AppError('User does not have an avatar to delete.', 404, 'AVATAR_NOT_FOUND');
  }

  await deleteAvatarFromCloudinary(user.avatar.publicId);

  const oldPublicId = user.avatar.publicId;
  user.avatar = undefined;
  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'AVATAR_DELETED',
    targetType: 'user',
    targetId: userId,
    metadata: { publicId: oldPublicId },
  });
}

export async function getAddresses(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  return user.addresses ?? [];
}

export async function addAddress(userId: string, input: AddressInput, actor: UserAuthContext) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const addresses = user.addresses ?? [];
  if (addresses.length >= 10) {
    throw new AppError('Maximum limit of 10 addresses reached.', 422, 'ADDRESS_LIMIT_EXCEEDED');
  }

  const isFirstAddress = addresses.length === 0;
  const isDefault = input.isDefault || isFirstAddress;

  if (isDefault) {
    addresses.forEach((addr) => {
      addr.isDefault = false;
    });
  }

  const newAddress = {
    _id: new mongoose.Types.ObjectId(),
    label: input.label,
    recipientName: input.recipientName,
    phone: input.phone,
    addressLine1: input.addressLine1,
    addressLine2: input.addressLine2,
    landmark: input.landmark,
    city: input.city,
    state: input.state,
    postalCode: input.postalCode,
    country: input.country,
    latitude: input.latitude,
    longitude: input.longitude,
    isDefault,
  };

  addresses.push(newAddress as any);
  user.addresses = addresses;
  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ADDRESS_ADDED',
    targetType: 'address',
    targetId: newAddress._id.toString(),
    metadata: { label: input.label, isDefault },
  });

  return newAddress;
}

export async function updateAddress(
  userId: string,
  addressId: string,
  input: UpdateAddressInput,
  actor: UserAuthContext,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const addresses = user.addresses ?? [];
  const targetAddress = addresses.find((addr) => addr._id.toString() === addressId);

  if (!targetAddress) {
    throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  if (input.isDefault === true) {
    addresses.forEach((addr) => {
      addr.isDefault = false;
    });
    targetAddress.isDefault = true;
  }

  if (input.label !== undefined) targetAddress.label = input.label;
  if (input.recipientName !== undefined) targetAddress.recipientName = input.recipientName;
  if (input.phone !== undefined) targetAddress.phone = input.phone;
  if (input.addressLine1 !== undefined) targetAddress.addressLine1 = input.addressLine1;
  if (input.addressLine2 !== undefined) targetAddress.addressLine2 = input.addressLine2;
  if (input.landmark !== undefined) targetAddress.landmark = input.landmark;
  if (input.city !== undefined) targetAddress.city = input.city;
  if (input.state !== undefined) targetAddress.state = input.state;
  if (input.postalCode !== undefined) targetAddress.postalCode = input.postalCode;
  if (input.country !== undefined) targetAddress.country = input.country;
  if (input.latitude !== undefined) targetAddress.latitude = input.latitude;
  if (input.longitude !== undefined) targetAddress.longitude = input.longitude;

  user.addresses = addresses;
  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ADDRESS_UPDATED',
    targetType: 'address',
    targetId: addressId,
    metadata: { changes: input },
  });

  return targetAddress;
}

export async function deleteAddress(userId: string, addressId: string, actor: UserAuthContext) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const addresses = user.addresses ?? [];
  const targetIndex = addresses.findIndex((addr) => addr._id.toString() === addressId);

  if (targetIndex === -1) {
    throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');
  }

  const isDeletingDefault = addresses[targetIndex].isDefault;
  addresses.splice(targetIndex, 1);

  // If deleted address was default and remaining addresses exist, set first remaining as default
  if (isDeletingDefault && addresses.length > 0) {
    addresses[0].isDefault = true;
  }

  user.addresses = addresses;
  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ADDRESS_DELETED',
    targetType: 'address',
    targetId: addressId,
  });
}

export async function getPreferences(userId: string) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  return (
    user.preferences ?? {
      theme: 'system',
      language: 'en',
      marketingPreferences: { email: true, sms: false, push: true },
      orderNotifications: { email: true, sms: true, push: true },
      reservationNotifications: { email: true, sms: true, push: true },
      dietaryPreferences: [],
    }
  );
}

export async function updatePreferences(
  userId: string,
  input: PreferencesInput,
  actor: UserAuthContext,
) {
  const user = await User.findById(userId);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  user.preferences = {
    theme: input.theme ?? user.preferences?.theme ?? 'system',
    language: input.language ?? user.preferences?.language ?? 'en',
    marketingPreferences: {
      email:
        input.marketingPreferences?.email ?? user.preferences?.marketingPreferences?.email ?? true,
      sms: input.marketingPreferences?.sms ?? user.preferences?.marketingPreferences?.sms ?? false,
      push:
        input.marketingPreferences?.push ?? user.preferences?.marketingPreferences?.push ?? true,
    },
    orderNotifications: {
      email: input.orderNotifications?.email ?? user.preferences?.orderNotifications?.email ?? true,
      sms: input.orderNotifications?.sms ?? user.preferences?.orderNotifications?.sms ?? true,
      push: input.orderNotifications?.push ?? user.preferences?.orderNotifications?.push ?? true,
    },
    reservationNotifications: {
      email:
        input.reservationNotifications?.email ??
        user.preferences?.reservationNotifications?.email ??
        true,
      sms:
        input.reservationNotifications?.sms ??
        user.preferences?.reservationNotifications?.sms ??
        true,
      push:
        input.reservationNotifications?.push ??
        user.preferences?.reservationNotifications?.push ??
        true,
    },
    dietaryPreferences: input.dietaryPreferences ?? user.preferences?.dietaryPreferences ?? [],
  };

  await user.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'PREFERENCES_UPDATED',
    targetType: 'user',
    targetId: userId,
  });

  return user.preferences;
}

export async function adminListUsers(query: UserQueryInput, actor: UserAuthContext) {
  const filter: Record<string, unknown> = {};

  if (actor.tenantId) {
    filter.tenantId = actor.tenantId;
  }

  if (query.accountStatus) {
    filter.accountStatus = query.accountStatus;
  }

  if (query.emailVerified !== undefined) {
    filter.emailVerified = query.emailVerified;
  }

  if (query.search) {
    const searchRegex = new RegExp(query.search.trim(), 'i');
    filter.$or = [{ name: searchRegex }, { email: searchRegex }, { phone: searchRegex }];
  }

  if (query.role) {
    const roleDoc = await Role.findOne({ code: query.role });
    if (roleDoc) {
      filter.roleIds = roleDoc._id;
    }
  }

  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    User.find(filter).populate('roleIds').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  return {
    users: users.map(sanitizeUserObject),
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}

export async function adminGetUserById(targetUserId: string, _actor: UserAuthContext) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid target user ID.', 400, 'INVALID_ID');
  }
  const user = await User.findById(targetUserId).populate('roleIds');
  if (!user) throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');
  return sanitizeUserObject(user);
}

export async function adminUpdateUser(
  targetUserId: string,
  input: AdminUpdateUserInput,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid target user ID.', 400, 'INVALID_ID');
  }

  const targetUser = await User.findById(targetUserId).populate('roleIds');
  if (!targetUser) throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');

  // Prevent ordinary admin from modifying Super Admin user profile
  const targetIsSuperAdmin = (targetUser.roleIds as any[]).some(
    (r: any) => r.code === 'super_admin',
  );
  const actorIsSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');

  if (targetIsSuperAdmin && !actorIsSuperAdmin) {
    throw new AppError(
      'Only Super Admin can update Super Admin accounts.',
      403,
      'SUPER_ADMIN_PROTECTED',
    );
  }

  if (input.profile) {
    targetUser.profile = {
      firstName: input.profile.firstName ?? targetUser.profile?.firstName ?? '',
      lastName: input.profile.lastName ?? targetUser.profile?.lastName ?? '',
      displayName:
        `${input.profile.firstName ?? targetUser.profile?.firstName ?? ''} ${input.profile.lastName ?? targetUser.profile?.lastName ?? ''}`.trim(),
    };
    targetUser.name = targetUser.profile.displayName || targetUser.name;
  }

  if (input.phone !== undefined) targetUser.phone = input.phone;
  if (input.locale !== undefined) targetUser.locale = input.locale;
  if (input.timezone !== undefined) targetUser.timezone = input.timezone;
  if (input.branchIds !== undefined) targetUser.branchIds = input.branchIds;

  await targetUser.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'ADMIN_USER_UPDATED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { changes: input },
  });

  return sanitizeUserObject(targetUser);
}

export async function adminUpdateUserStatus(
  targetUserId: string,
  status: 'active' | 'inactive' | 'suspended' | 'pending_verification' | 'locked',
  reason: string | undefined,
  actor: UserAuthContext,
) {
  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new AppError('Invalid target user ID.', 400, 'INVALID_ID');
  }

  const targetUser = await User.findById(targetUserId).populate('roleIds');
  if (!targetUser) throw new AppError('Target user not found.', 404, 'USER_NOT_FOUND');

  const targetIsSuperAdmin = (targetUser.roleIds as any[]).some(
    (r: any) => r.code === 'super_admin',
  );
  const actorIsSuperAdmin = actor.roles.some((r) => r.code === 'super_admin');

  if (targetIsSuperAdmin && !actorIsSuperAdmin) {
    throw new AppError(
      'Only Super Admin can change Super Admin account status.',
      403,
      'SUPER_ADMIN_PROTECTED',
    );
  }

  targetUser.accountStatus = status;
  if (reason) targetUser.statusReason = reason;
  await targetUser.save();

  await logAuditEvent({
    tenantId: actor.tenantId,
    actorId: actor.userId,
    action: 'USER_STATUS_CHANGED',
    targetType: 'user',
    targetId: targetUserId,
    metadata: { newStatus: status, reason },
  });

  return sanitizeUserObject(targetUser);
}
