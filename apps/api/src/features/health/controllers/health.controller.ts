import type { Request, Response } from 'express';

import { healthService } from '../services/health.service';
import { sendSuccessResponse } from '../../../utils/api-response';

export class HealthController {
  getHealth(_request: Request, response: Response) {
    const snapshot = healthService.getHealthSnapshot();

    return sendSuccessResponse(response, {
      message: 'Service health snapshot retrieved successfully.',
      data: snapshot,
    });
  }
}

export const healthController = new HealthController();
