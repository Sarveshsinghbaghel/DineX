import { Branch } from '../../branches/models/branch.model';
import { AppError } from '../../../errors/AppError';
import type { DeliveryServiceabilityInput } from '@x10think/validation';
import type { DeliveryServiceabilityResult } from '@x10think/types';

// Default branch delivery policy rules
const DEFAULT_FLAT_DELIVERY_FEE = 50;
const DEFAULT_FREE_DELIVERY_THRESHOLD = 500;
const DEFAULT_MINIMUM_ORDER_AMOUNT = 150;
const DEFAULT_ESTIMATED_TIME_MINUTES = 35;

export async function checkDeliveryServiceability(
  input: DeliveryServiceabilityInput,
): Promise<DeliveryServiceabilityResult> {
  const branch = await Branch.findById(input.branchId);
  if (!branch || branch.status !== 'ACTIVE') {
    throw new AppError('Branch is inactive or not found.', 400, 'BRANCH_INACTIVE');
  }

  if (!branch.serviceModes?.includes('delivery')) {
    return {
      isServiceable: false,
      reason: 'Delivery service is not enabled for this branch.',
      deliveryFee: 0,
      estimatedTimeMinutes: 0,
    };
  }

  const orderAmount = input.orderAmount || 0;

  if (orderAmount > 0 && orderAmount < DEFAULT_MINIMUM_ORDER_AMOUNT) {
    return {
      isServiceable: false,
      reason: `Minimum order amount for delivery is ₹${DEFAULT_MINIMUM_ORDER_AMOUNT}.`,
      deliveryFee: DEFAULT_FLAT_DELIVERY_FEE,
      estimatedTimeMinutes: DEFAULT_ESTIMATED_TIME_MINUTES,
      minimumOrderAmount: DEFAULT_MINIMUM_ORDER_AMOUNT,
    };
  }

  const deliveryFee =
    orderAmount >= DEFAULT_FREE_DELIVERY_THRESHOLD ? 0 : DEFAULT_FLAT_DELIVERY_FEE;

  return {
    isServiceable: true,
    deliveryFee,
    estimatedTimeMinutes: DEFAULT_ESTIMATED_TIME_MINUTES,
    freeDeliveryThreshold: DEFAULT_FREE_DELIVERY_THRESHOLD,
    minimumOrderAmount: DEFAULT_MINIMUM_ORDER_AMOUNT,
  };
}
