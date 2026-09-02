import {
  createRestaurantSchema,
  createBranchSchema,
  timeStringSchema,
  restaurantStatusSchema,
} from '@x10think/validation';

export function runFrontendRestaurantBranchTests() {
  // 1. Validates timeStringSchema
  const validTime = timeStringSchema.safeParse('18:30');
  if (!validTime.success) {
    throw new Error('Expected validTime.success to be true');
  }

  const invalidTime = timeStringSchema.safeParse('25:99');
  if (invalidTime.success) {
    throw new Error('Expected invalidTime.success to be false');
  }

  // 2. Validates createRestaurantSchema
  const validRestaurant = createRestaurantSchema.safeParse({
    name: 'DineX Flagship',
    legalName: 'DineX Enterprise Ltd',
    email: 'contact@dinex.local',
    phone: '+919876543210',
    address: {
      label: 'HQ',
      recipientName: 'Admin',
      phone: '+919876543210',
      addressLine1: '100 Tech Park',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      isDefault: true,
    },
    currency: 'INR',
    timezone: 'Asia/Kolkata',
  });
  if (!validRestaurant.success) {
    throw new Error('Expected validRestaurant.success to be true');
  }

  // 3. Validates createBranchSchema
  const validBranch = createBranchSchema.safeParse({
    restaurantId: '6a9668c4b2e062da23aec3f5',
    name: 'Connaught Place Branch',
    code: 'cp-01',
    phone: '+911123456789',
    address: {
      label: 'Branch',
      recipientName: 'CP Manager',
      phone: '+911123456789',
      addressLine1: 'Block A, CP',
      city: 'Delhi',
      state: 'Delhi',
      postalCode: '110001',
      country: 'India',
      isDefault: true,
    },
    capacity: 80,
  });
  if (!validBranch.success) {
    throw new Error('Expected validBranch.success to be true');
  }

  // 4. Validates restaurantStatusSchema
  const validStatus = restaurantStatusSchema.safeParse({
    status: 'ACTIVE',
    reason: 'Verified onboarded tenant',
  });
  if (!validStatus.success) {
    throw new Error('Expected validStatus.success to be true');
  }

  return true;
}

runFrontendRestaurantBranchTests();
