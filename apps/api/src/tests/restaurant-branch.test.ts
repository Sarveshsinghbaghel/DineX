import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';
import { Restaurant } from '../features/restaurants/models/restaurant.model';
import { Branch } from '../features/branches/models/branch.model';
import { Setting } from '../features/settings/models/setting.model';
import * as restaurantService from '../features/restaurants/services/restaurant.service';
import * as branchService from '../features/branches/services/branch.service';
import { getEffectiveSettings } from '../features/settings/services/settings.service';
import { createBranchSchema } from '@x10think/validation';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('Restaurant & Branch Management (DineX Prompt 11)', () => {
  let restaurantId: string;
  let branchId: string;
  let tenantId: string;

  const mockAdminActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'session_admin_1',
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: [
      'restaurants.manage',
      'restaurants.view',
      'branches.manage',
      'branches.view',
      'settings.manage',
    ],
  };

  const mockManagerActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'session_mgr_1',
    tenantId: '',
    branchIds: [],
    roles: [{ _id: 'r2', name: 'Manager', code: 'manager', isSystem: true }],
    permissions: ['branches.view'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }

    await Restaurant.deleteMany({ legalName: 'DineX Enterprise Ltd' });
    await Branch.deleteMany({ code: 'CP-01' });
    await Setting.deleteMany({});
  });

  after(async () => {
    await Restaurant.deleteMany({ legalName: 'DineX Enterprise Ltd' });
    await Branch.deleteMany({ code: 'CP-01' });
    await Setting.deleteMany({});
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Create and retrieve Restaurant profile', async () => {
    const restaurant = await restaurantService.createRestaurant(
      {
        name: 'DineX Flagship',
        legalName: 'DineX Enterprise Ltd',
        description: 'Premium dining experience',
        email: 'contact@dinex.local',
        phone: '+919876543210',
        website: 'https://dinex.local',
        address: {
          label: 'HQ',
          recipientName: 'DineX Admin',
          phone: '+919876543210',
          addressLine1: '100 Tech Tower',
          city: 'New Delhi',
          state: 'Delhi',
          postalCode: '110001',
          country: 'India',
          isDefault: true,
        },
        cuisineTypes: ['North Indian', 'Continental'],
        taxConfig: { gstNumber: '07AAAAA0000A1Z5', taxRate: 5 },
        currency: 'INR',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE',
      },
      mockAdminActor,
    );

    assert.ok(restaurant.id);
    restaurantId = restaurant.id;
    tenantId = restaurant.tenantId;
    mockAdminActor.tenantId = tenantId;
    mockManagerActor.tenantId = tenantId;

    const fetched = await restaurantService.getRestaurantById(restaurantId, mockAdminActor);
    assert.equal(fetched.name, 'DineX Flagship');
    assert.equal(fetched.legalName, 'DineX Enterprise Ltd');
  });

  test('2. Business hours replacement with overnight interval support', async () => {
    const weeklyHours = [
      {
        day: 'friday' as const,
        isClosed: false,
        intervals: [{ open: '18:00', close: '02:00' }], // Overnight hours
      },
    ];

    const updatedHours = await restaurantService.replaceBusinessHours(
      restaurantId,
      weeklyHours,
      mockAdminActor,
    );

    assert.equal(updatedHours?.[0].day, 'friday');
    assert.equal(updatedHours?.[0].intervals[0].open, '18:00');
    assert.equal(updatedHours?.[0].intervals[0].close, '02:00');
  });

  test('3. Create Branch with unique branch code and parent check', async () => {
    const branchInput = createBranchSchema.parse({
      restaurantId,
      name: 'Connaught Place Branch',
      code: 'CP-01',
      phone: '+911123456789',
      address: {
        label: 'Branch',
        recipientName: 'CP Branch',
        phone: '+911123456789',
        addressLine1: 'Block A, Inner Circle',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
        isDefault: true,
      },
      capacity: 120,
      serviceModes: ['dine_in', 'takeaway', 'delivery'],
    });

    const branch = await branchService.createBranch(branchInput, mockAdminActor);

    assert.ok(branch.id);
    branchId = branch.id;
    assert.equal(branch.code, 'CP-01');

    // Duplicate branch code rejection test
    const dupInput = createBranchSchema.parse({
      restaurantId,
      name: 'Duplicate Branch',
      code: 'CP-01',
      phone: '+919999999999',
      address: {
        label: 'Branch',
        recipientName: 'Dup',
        phone: '+919999999999',
        addressLine1: 'Block B',
        city: 'New Delhi',
        state: 'Delhi',
        postalCode: '110001',
        country: 'India',
        isDefault: false,
      },
    });

    await assert.rejects(async () => branchService.createBranch(dupInput, mockAdminActor), {
      name: 'AppError',
      message: "Branch code 'CP-01' already exists for this restaurant.",
    });
  });

  test('4. Branch operational status transitions', async () => {
    const updated = await branchService.updateBranchStatus(
      branchId,
      'TEMPORARILY_CLOSED',
      'Renovation work',
      mockAdminActor,
    );

    assert.equal(updated.status, 'TEMPORARILY_CLOSED');
    assert.equal(updated.statusReason, 'Renovation work');

    const restored = await branchService.updateBranchStatus(
      branchId,
      'ACTIVE',
      undefined,
      mockAdminActor,
    );
    assert.equal(restored.status, 'ACTIVE');
  });

  test('5. Settings precedence resolution (Branch -> Restaurant -> System Default)', async () => {
    // Initial resolution -> System Default tax.default_rate is 5
    const initial = await getEffectiveSettings(tenantId, branchId);
    assert.equal(initial['tax.default_rate'], 5);

    // Update restaurant tenant setting to 8
    await restaurantService.updateRestaurantSettings(
      restaurantId,
      { 'tax.default_rate': 8 },
      mockAdminActor,
    );

    const afterTenant = await getEffectiveSettings(tenantId, branchId);
    assert.equal(afterTenant['tax.default_rate'], 8);

    // Override branch setting to 12
    await branchService.updateBranchSettings(branchId, { 'tax.default_rate': 12 }, mockAdminActor);

    const afterBranchOverride = await getEffectiveSettings(tenantId, branchId);
    assert.equal(afterBranchOverride['tax.default_rate'], 12);
  });

  test('6. Security: Manager branch boundary enforcement', async () => {
    // Assign manager to a different branch ID
    mockManagerActor.branchIds = [new mongoose.Types.ObjectId().toString()];

    // Manager attempting to get branchId should be rejected (403 Forbidden)
    await assert.rejects(async () => branchService.getBranchById(branchId, mockManagerActor), {
      name: 'AppError',
      message: 'Access denied: user is not assigned to this branch.',
    });
  });
});
