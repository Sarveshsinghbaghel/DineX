import type { HealthSnapshot } from '@x10think/types';

import { env } from '../../../config/env';
import { healthRepository } from '../repositories/health.repository';

export class HealthService {
  getHealthSnapshot(): HealthSnapshot {
    return {
      name: env.APP_NAME,
      environment: env.NODE_ENV,
      version: env.APP_VERSION,
      timestamp: new Date().toISOString(),
      uptimeInSeconds: Math.round(process.uptime()),
      database: {
        status: healthRepository.getDatabaseStatus(),
      },
      memory: healthRepository.getMemoryUsage(),
    };
  }
}

export const healthService = new HealthService();
