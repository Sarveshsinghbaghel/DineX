import { Router } from 'express';

import { healthRouter } from '../features/health/routes/health.routes';
import { authRouter } from '../features/auth/routes/auth.routes';
import { rolesRouter } from '../features/roles/routes/roles.routes';
import { permissionsRouter } from '../features/permissions/routes/permissions.routes';
import { userRolesRouter } from '../features/users/routes/user-roles.routes';

export const apiRouter = Router();

apiRouter.use('/health', healthRouter);
apiRouter.use('/auth', authRouter);
apiRouter.use('/roles', rolesRouter);
apiRouter.use('/permissions', permissionsRouter);
apiRouter.use('/users', userRolesRouter);

