import assert from 'node:assert/strict';
import { test, describe, before, after } from 'node:test';
import mongoose from 'mongoose';

import { RecommendationEvent } from '../features/recommendations/models/recommendation-event.model';
import * as recommendationsService from '../features/recommendations/services/recommendations.service';
import {
  recommendationQuerySchema,
  cartRecommendationSchema,
  recommendationEventSchema,
} from '@x10think/validation';
import type { UserAuthContext } from '../middlewares/authorization.middleware';

describe('DineX Phase 19: AI-Powered Recommendations Test Suite', () => {
  const tenantId = 'tenant_test_rec_19';
  const branchId = new mongoose.Types.ObjectId().toString();
  const customerId = new mongoose.Types.ObjectId().toString();

  const mockAdminActor: UserAuthContext = {
    userId: new mongoose.Types.ObjectId().toString(),
    sessionId: 'sess_admin_rec',
    tenantId,
    roles: [{ _id: 'r1', name: 'Admin', code: 'admin', isSystem: true }],
    permissions: ['recommendations.read', 'analytics.read'],
  };

  const mockCustomerActor: UserAuthContext = {
    userId: customerId,
    sessionId: 'sess_cust_rec',
    tenantId,
    roles: [{ _id: 'r2', name: 'Customer', code: 'customer', isSystem: false }],
    permissions: ['orders.create'],
  };

  before(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/dinex-test');
    }
    await RecommendationEvent.deleteMany({ tenantId });
  });

  after(async () => {
    await RecommendationEvent.deleteMany({ tenantId });
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });

  test('1. Personalized scoring & ranking for authenticated customer', async () => {
    const query = recommendationQuerySchema.parse({ context: 'personalized', branchId, limit: 4 });
    const recs = await recommendationsService.getRecommendations(query, mockCustomerActor);

    assert.ok(recs.length > 0);
    assert.ok(recs.length <= 4);
    assert.ok(recs[0].normalizedScore >= recs[recs.length - 1].normalizedScore);
    assert.equal(recs[0].isAvailable, true);
  });

  test('2. Cold-start graceful degradation for guest user with no history', async () => {
    const query = recommendationQuerySchema.parse({ context: 'personalized', limit: 4 });
    // Calling without customer actor (guest)
    const recs = await recommendationsService.getRecommendations(query);

    assert.ok(recs.length > 0);
    assert.equal(recs[0].explanationSignal, 'Popular at this branch');
  });

  test('3. Cart add-ons recommendation excluding items already in cart', async () => {
    const cartItemIds = ['ITEM-101', 'ITEM-103']; // Butter Chicken & Garlic Naan in cart
    const input = cartRecommendationSchema.parse({ cartItemIds, limit: 3 });

    const addOns = await recommendationsService.getCartRecommendations(input, mockCustomerActor);

    assert.ok(addOns.length > 0);
    // Verify none of the recommended add-ons are in the current cart
    addOns.forEach((item) => {
      assert.equal(cartItemIds.includes(item.menuItemId), false);
    });
  });

  test('4. Staff insights separation of facts vs AI interpretation', async () => {
    const insights = await recommendationsService.getStaffInsights(mockAdminActor, branchId);

    assert.ok(insights.length > 0);
    insights.forEach((insight) => {
      assert.ok(insight.factualSummary.startsWith('Calculated Fact:'));
      assert.ok(insight.aiInterpretation.startsWith('AI Recommendation:'));
      assert.ok(insight.confidenceScore > 0 && insight.confidenceScore <= 1.0);
    });
  });

  test('5. Recommendation event tracking (impression, click, add_to_cart)', async () => {
    const input = recommendationEventSchema.parse({
      context: 'cart_addons',
      menuItemId: 'ITEM-105',
      eventType: 'add_to_cart',
      branchId,
    });

    const event = await recommendationsService.trackRecommendationEvent(input, mockCustomerActor);

    assert.ok(event);
    assert.equal(event.menuItemId, 'ITEM-105');
    assert.equal(event.eventType, 'add_to_cart');

    const persisted = await RecommendationEvent.findOne({ tenantId, menuItemId: 'ITEM-105' });
    assert.ok(persisted);
  });
});
