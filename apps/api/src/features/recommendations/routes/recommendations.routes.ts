import { Router } from 'express';
import {
  requireAuth,
  requirePermission,
  optionalAuth,
} from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/recommendations.controller';

export const recommendationsRouter = Router();

// Customer endpoints (Optional auth or customer session)
recommendationsRouter.get('/', optionalAuth, controller.getRecommendations);
recommendationsRouter.get('/popular', optionalAuth, controller.getRecommendations);
recommendationsRouter.get('/similar', optionalAuth, controller.getRecommendations);
recommendationsRouter.post('/cart', optionalAuth, controller.getCartRecommendations);
recommendationsRouter.post('/events', optionalAuth, controller.trackRecommendationEvent);

// Staff Insights endpoint (Requires Auth & permission 'recommendations.read' or 'analytics.read')
recommendationsRouter.get(
  '/insights',
  requireAuth,
  requirePermission('recommendations.read'),
  controller.getStaffInsights,
);
