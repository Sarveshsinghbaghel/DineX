import { restaurantModules } from '@/features/dashboard/constants/modules';
import type { DashboardModule } from '@/features/dashboard/types/dashboard.types';

export class DashboardService {
  async listModules(search: string): Promise<DashboardModule[]> {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) {
      return restaurantModules;
    }

    return restaurantModules.filter((moduleItem) => {
      const haystack =
        `${moduleItem.title} ${moduleItem.summary} ${moduleItem.metricValue}`.toLowerCase();
      return haystack.includes(normalizedSearch);
    });
  }
}

export const dashboardService = new DashboardService();
