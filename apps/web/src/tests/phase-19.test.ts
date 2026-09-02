import {
  recommendationQuerySchema,
  cartRecommendationSchema,
  recommendationEventSchema,
} from '@x10think/validation';

export function runFrontendPhase19Tests() {
  // 1. Recommendation Query schema validation
  const validRecQuery = recommendationQuerySchema.safeParse({
    context: 'personalized',
    limit: 5,
  });
  if (!validRecQuery.success) {
    throw new Error('Expected validRecQuery.success to be true');
  }

  // 2. Cart Recommendation schema validation
  const validCartRec = cartRecommendationSchema.safeParse({
    cartItemIds: ['ITEM-101'],
    limit: 3,
  });
  if (!validCartRec.success) {
    throw new Error('Expected validCartRec.success to be true');
  }

  // 3. Recommendation Event schema validation
  const validEvent = recommendationEventSchema.safeParse({
    context: 'cart_addons',
    menuItemId: 'ITEM-105',
    eventType: 'add_to_cart',
  });
  if (!validEvent.success) {
    throw new Error('Expected validEvent.success to be true');
  }

  return true;
}

runFrontendPhase19Tests();
