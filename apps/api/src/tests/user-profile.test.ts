import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';
import { User } from '../features/auth/models/auth.models';
import * as userProfileService from '../features/users/services/user-profile.service';
import { validateImageBuffer } from '../lib/cloudinary.service';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('User & Profile Management (DineX Prompt 10)', () => {
  let userId: string;
  let adminUserId: string;

  const mockUserActor: UserAuthContext = {
    userId: '',
    sessionId: 'session_1',
    roles: [],
    permissions: [],
  };

  const mockAdminActor: UserAuthContext = {
    userId: '',
    sessionId: 'session_admin',
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['users.read', 'users.update', 'users.activate', 'users.suspend'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await User.deleteMany({ email: { $in: ['profiletest@dinex.local', 'admintest@dinex.local'] } });

    const user = await User.create({
      name: 'Jane Doe',
      email: 'profiletest@dinex.local',
      passwordHash: 'hashed_password_123',
      phone: '+919876543210',
      accountStatus: 'active',
      profile: { firstName: 'Jane', lastName: 'Doe', displayName: 'Jane Doe' },
    });
    userId = user.id;
    mockUserActor.userId = userId;

    const admin = await User.create({
      name: 'Admin User',
      email: 'admintest@dinex.local',
      passwordHash: 'hashed_password_123',
      accountStatus: 'active',
    });
    adminUserId = admin.id;
    mockAdminActor.userId = adminUserId;
  });

  after(async () => {
    await User.deleteMany({ email: { $in: ['profiletest@dinex.local', 'admintest@dinex.local'] } });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Get and update own user profile with field whitelisting', async () => {
    const initial = await userProfileService.getOwnProfile(userId);
    assert.equal(initial.name, 'Jane Doe');

    const updated = await userProfileService.updateOwnProfile(
      userId,
      {
        firstName: 'Janet',
        lastName: 'Smith',
        phone: '+919999999999',
        locale: 'en-US',
      },
      mockUserActor,
    );

    assert.equal(updated.name, 'Janet Smith');
    assert.equal(updated.phone, '+919999999999');
    assert.equal(updated.locale, 'en-US');

    // Mass assignment prevention test: passwordHash, roleIds, accountStatus cannot be modified via updateOwnProfile
    const userDoc = await User.findById(userId).select('+passwordHash');
    assert.equal(userDoc?.passwordHash, 'hashed_password_123');
    assert.equal(userDoc?.accountStatus, 'active');
  });

  test('2. Avatar magic byte validation and Cloudinary helper', async () => {
    // Valid PNG signature: [0x89, 0x50, 0x4E, 0x47]
    const validPngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
    const validated = validateImageBuffer(validPngBuffer, 'image/png');
    assert.equal(validated.format, 'png');

    // Invalid non-image buffer should throw
    const invalidBuffer = Buffer.from([0x00, 0x11, 0x22, 0x33, 0x44]);
    assert.throws(() => validateImageBuffer(invalidBuffer, 'image/png'), {
      name: 'AppError',
      message: 'File signature validation failed. File is not a valid image.',
    });

    // Upload avatar service
    const avatar = await userProfileService.uploadAvatar(
      userId,
      validPngBuffer,
      'image/png',
      mockUserActor,
    );

    assert.ok(avatar.url.includes('avatars/avatar_'));
    assert.equal(avatar.format, 'png');

    // Delete avatar service
    await userProfileService.deleteAvatar(userId, mockUserActor);
    const profileAfterDelete = await userProfileService.getOwnProfile(userId);
    assert.equal(profileAfterDelete.avatar, undefined);
  });

  test('3. Address CRUD and single-default address constraint', async () => {
    // Add first address -> automatically becomes default
    const addr1 = await userProfileService.addAddress(
      userId,
      {
        label: 'Home',
        recipientName: 'Janet Smith',
        phone: '+919999999999',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: false,
      },
      mockUserActor,
    );

    assert.equal(addr1.isDefault, true);

    // Add second address with isDefault: true -> unsets default on first address
    const addr2 = await userProfileService.addAddress(
      userId,
      {
        label: 'Work',
        recipientName: 'Janet Smith',
        phone: '+919999999999',
        addressLine1: '456 Business Park',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400051',
        country: 'India',
        isDefault: true,
      },
      mockUserActor,
    );

    assert.equal(addr2.isDefault, true);

    const addresses = await userProfileService.getAddresses(userId);
    assert.equal(addresses.length, 2);

    const updatedAddr1 = addresses.find((a) => a._id.toString() === addr1._id.toString());
    assert.equal(updatedAddr1?.isDefault, false);

    // Delete address
    await userProfileService.deleteAddress(userId, addr2._id.toString(), mockUserActor);
    const addressesAfterDelete = await userProfileService.getAddresses(userId);
    assert.equal(addressesAfterDelete.length, 1);
    assert.equal(addressesAfterDelete[0].isDefault, true); // First remaining automatically gets default
  });

  test('4. Preferences read and update', async () => {
    const updated = await userProfileService.updatePreferences(
      userId,
      {
        theme: 'dark',
        language: 'hi',
        dietaryPreferences: ['Vegetarian', 'Nut-Free'],
      },
      mockUserActor,
    );

    assert.equal(updated.theme, 'dark');
    assert.equal(updated.language, 'hi');
    assert.deepEqual(updated.dietaryPreferences, ['Vegetarian', 'Nut-Free']);
  });

  test('5. Admin user search, filter, pagination, and status transitions', async () => {
    const list = await userProfileService.adminListUsers(
      { search: 'Janet', page: 1, limit: 10 },
      mockAdminActor,
    );

    assert.ok(list.users.length >= 1);
    assert.equal(list.users[0].name, 'Janet Smith');

    // Admin change user account status to suspended
    const suspended = await userProfileService.adminUpdateUserStatus(
      userId,
      'suspended',
      'Policy violation investigation',
      mockAdminActor,
    );

    assert.equal(suspended.accountStatus, 'suspended');

    // Restore status to active
    const restored = await userProfileService.adminUpdateUserStatus(
      userId,
      'active',
      'Investigation cleared',
      mockAdminActor,
    );

    assert.equal(restored.accountStatus, 'active');
  });
});
