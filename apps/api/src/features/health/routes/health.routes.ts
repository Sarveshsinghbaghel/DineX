import { Router } from 'express';

import { healthController } from '../controllers/health.controller';
import { validateHealthRequest } from '../middlewares/health.middleware';

export const healthRouter = Router();

healthRouter.get('/', validateHealthRequest, (request, response) =>
  healthController.getHealth(request, response),
);
