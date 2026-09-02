import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/engagement.controller';

export const engagementRouter = Router();

// Reviews & Ratings
engagementRouter.get('/reviews', controller.listReviews);
engagementRouter.post('/reviews', requireAuth, controller.createReview);
engagementRouter.patch(
  '/reviews/:reviewId/moderate',
  requireAuth,
  requirePermission('reviews.moderate'),
  controller.moderateReview,
);

engagementRouter.get('/ratings/summary', controller.getRatingSummary);
engagementRouter.post('/ratings', requireAuth, controller.submitRating);

// Coupons
engagementRouter.get('/coupons', requireAuth, controller.listCoupons);
engagementRouter.post(
  '/coupons',
  requireAuth,
  requirePermission('coupons.manage'),
  controller.createCoupon,
);
engagementRouter.post('/coupons/validate', requireAuth, controller.validateCoupon);

// Loyalty
engagementRouter.get('/loyalty', requireAuth, controller.getLoyaltyBalance);

// Favorites
engagementRouter.get('/favorites', requireAuth, controller.listFavorites);
engagementRouter.post('/favorites', requireAuth, controller.addFavorite);
engagementRouter.delete('/favorites/:menuItemId', requireAuth, controller.removeFavorite);
