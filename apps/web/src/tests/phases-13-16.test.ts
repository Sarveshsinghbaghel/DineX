import {
  createIngredientSchema,
  createEmployeeSchema,
  broadcastNotificationSchema,
  createCouponSchema,
  createReviewSchema,
} from '@x10think/validation';

export function runFrontendPhases13To16Tests() {
  // 1. Inventory schema validation
  const validIngredient = createIngredientSchema.safeParse({
    name: 'Basmati Rice',
    sku: 'ing-rice-01',
    baseUnit: 'kg',
  });
  if (!validIngredient.success) {
    throw new Error('Expected validIngredient.success to be true');
  }

  // 2. Employee schema validation
  const validEmployee = createEmployeeSchema.safeParse({
    userId: '6a9668c4b2e062da23aec3f5',
    employeeNumber: 'emp-101',
    primaryBranchId: '6a9668c4b2e062da23aec3f5',
    branchIds: ['6a9668c4b2e062da23aec3f5'],
  });
  if (!validEmployee.success) {
    throw new Error('Expected validEmployee.success to be true');
  }

  // 3. Notification broadcast schema validation
  const validBroadcast = broadcastNotificationSchema.safeParse({
    title: 'Emergency Maintenance Alert',
    type: 'SYSTEM',
    priority: 'critical',
  });
  if (!validBroadcast.success) {
    throw new Error('Expected validBroadcast.success to be true');
  }

  // 4. Coupon schema validation
  const validCoupon = createCouponSchema.safeParse({
    code: 'festive20',
    discountType: 'percentage',
    value: 20,
    startsAt: new Date().toISOString(),
    endsAt: new Date(Date.now() + 86400000).toISOString(),
  });
  if (!validCoupon.success) {
    throw new Error('Expected validCoupon.success to be true');
  }

  // 5. Review schema validation
  const validReview = createReviewSchema.safeParse({
    branchId: '6a9668c4b2e062da23aec3f5',
    orderId: '6a9668c4b2e062da23aec3f5',
    content: 'Great food, fast service, awesome atmosphere!',
    rating: 5,
  });
  if (!validReview.success) {
    throw new Error('Expected validReview.success to be true');
  }

  return true;
}

runFrontendPhases13To16Tests();
