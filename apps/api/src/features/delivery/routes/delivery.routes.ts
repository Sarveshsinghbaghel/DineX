import { Router } from 'express';
import {
  requireAuth,
  requirePermission,
  optionalAuth,
} from '../../../middlewares/authorization.middleware';
import { checkoutLimiter } from '../../../middlewares/rate-limiters.middleware';
import * as controller from '../controllers/delivery.controller';

export const deliveryRouter = Router();

// Public / Customer Endpoints
deliveryRouter.post('/serviceability', controller.checkServiceability);
deliveryRouter.post('/checkout', checkoutLimiter, optionalAuth, controller.checkoutDeliveryOrder);
deliveryRouter.get('/orders/track/:orderId', optionalAuth, controller.getDeliveryOrderStatus);

// Authenticated Customer Address Management Endpoints
deliveryRouter.post('/addresses', requireAuth, controller.addAddress);
deliveryRouter.get('/addresses', requireAuth, controller.listAddresses);
deliveryRouter.delete('/addresses/:addressId', requireAuth, controller.deleteAddress);

// Delivery Driver / Staff Fulfillment Endpoints
deliveryRouter.get('/driver/deliveries', requireAuth, controller.listDriverAssignedDeliveries);
deliveryRouter.patch('/orders/:orderId/status', requireAuth, controller.updateDeliveryStatus);

// Manager / Admin Delivery Management Endpoints
deliveryRouter.get(
  '/orders/staff/branch/:branchId',
  requireAuth,
  requirePermission('delivery.view'),
  controller.listStaffDeliveryOrders,
);
deliveryRouter.get(
  '/drivers/branch/:branchId',
  requireAuth,
  requirePermission('delivery.view'),
  controller.listAvailableDrivers,
);
deliveryRouter.patch(
  '/orders/:orderId/assign',
  requireAuth,
  requirePermission('delivery.manage'),
  controller.assignDeliveryDriver,
);
