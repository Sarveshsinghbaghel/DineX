import { Router } from 'express';

import { healthRouter } from '../features/health/routes/health.routes';
import { authRouter } from '../features/auth/routes/auth.routes';
import { rolesRouter } from '../features/roles/routes/roles.routes';
import { permissionsRouter } from '../features/permissions/routes/permissions.routes';
import { userRolesRouter } from '../features/users/routes/user-roles.routes';
import { userProfileRouter } from '../features/users/routes/user-profile.routes';
import { restaurantRouter } from '../features/restaurants/routes/restaurant.routes';
import { branchRouter } from '../features/branches/routes/branch.routes';
import { inventoryRouter } from '../features/inventory/routes/inventory.routes';
import { employeeRouter } from '../features/employees/routes/employee.routes';
import { notificationRouter } from '../features/notifications/routes/notification.routes';
import { engagementRouter } from '../features/engagement/routes/engagement.routes';
import { analyticsRouter } from '../features/analytics/routes/analytics.routes';
import { reportRouter } from '../features/reports/routes/report.routes';
import { recommendationsRouter } from '../features/recommendations/routes/recommendations.routes';
import { qrOrderingRouter } from '../features/qr-ordering/routes/qr-ordering.routes';
import { deliveryRouter } from '../features/delivery/routes/delivery.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/permissions', permissionsRouter);
apiRouter.use('/users', userProfileRouter);
apiRouter.use('/users', userRolesRouter);
apiRouter.use('/restaurants', restaurantRouter);
apiRouter.use('/branches', branchRouter);
apiRouter.use('/inventory', inventoryRouter);
apiRouter.use('/employees', employeeRouter);
apiRouter.use('/notifications', notificationRouter);
apiRouter.use('/engagement', engagementRouter);
apiRouter.use('/analytics', analyticsRouter);
apiRouter.use('/reports', reportRouter);
apiRouter.use('/recommendations', recommendationsRouter);
apiRouter.use('/qr', qrOrderingRouter);
apiRouter.use('/delivery', deliveryRouter);

