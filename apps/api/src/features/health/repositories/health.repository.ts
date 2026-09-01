import { getDatabaseStatus } from '../../../config/database';

export class HealthRepository {
  getDatabaseStatus() {
    return getDatabaseStatus();
  }

  getMemoryUsage() {
    const memoryUsage = process.memoryUsage();

    return {
      rssInBytes: memoryUsage.rss,
      heapTotalInBytes: memoryUsage.heapTotal,
      heapUsedInBytes: memoryUsage.heapUsed,
    };
  }
}

export const healthRepository = new HealthRepository();
