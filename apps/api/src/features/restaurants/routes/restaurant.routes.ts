import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/restaurant.controller';

export const restaurantRouter = Router();

restaurantRouter.use(requireAuth);

restaurantRouter.get('/', requirePermission('restaurants.view'), controller.listRestaurants);
restaurantRouter.post('/', requirePermission('restaurants.manage'), controller.createRestaurant);

restaurantRouter.get(
  '/:restaurantId',
  requirePermission('restaurants.view'),
  controller.getRestaurant,
);
restaurantRouter.patch(
  '/:restaurantId',
  requirePermission('restaurants.manage'),
  controller.updateRestaurant,
);
restaurantRouter.patch(
  '/:restaurantId/status',
  requirePermission('restaurants.manage'),
  controller.updateRestaurantStatus,
);

restaurantRouter.get(
  '/:restaurantId/business-hours',
  requirePermission('restaurants.view'),
  controller.getBusinessHours,
);
restaurantRouter.put(
  '/:restaurantId/business-hours',
  requirePermission('restaurants.manage'),
  controller.replaceBusinessHours,
);

restaurantRouter.get(
  '/:restaurantId/settings',
  requirePermission('settings.manage'),
  controller.getRestaurantSettings,
);
restaurantRouter.patch(
  '/:restaurantId/settings',
  requirePermission('settings.manage'),
  controller.updateRestaurantSettings,
);
