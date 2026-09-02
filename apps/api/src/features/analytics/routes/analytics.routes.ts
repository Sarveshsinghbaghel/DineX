import { Router } from 'express';
import { requireAuth, requirePermission } from '../../../middlewares/authorization.middleware';
import * as controller from '../controllers/analytics.controller';

export const analyticsRouter = Router();

analyticsRouter.use(requireAuth, requirePermission('analytics.read'));

analyticsRouter.get('/dashboard', controller.getDashboardSummary);
analyticsRouter.get('/kpis', controller.getDashboardSummary);
analyticsRouter.get('/revenue', controller.getRevenueAnalytics);
analyticsRouter.get('/orders', controller.getOrderAnalytics);
analyticsRouter.get('/menu', controller.getMenuAnalytics);
analyticsRouter.get('/customers', controller.getCustomerAnalytics);
analyticsRouter.get('/reservations', controller.getReservationAnalytics);
analyticsRouter.get('/inventory', controller.getInventoryAnalytics);
analyticsRouter.get('/employees', controller.getEmployeeAnalytics);
analyticsRouter.get('/payments', controller.getPaymentAnalytics);
analyticsRouter.get('/branches', controller.getBranchComparison);
