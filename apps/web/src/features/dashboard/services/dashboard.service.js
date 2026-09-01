import { restaurantModules } from '@/features/dashboard/constants/modules';
export class DashboardService {
    async listModules(search) {
        const normalizedSearch = search.trim().toLowerCase();
        if (!normalizedSearch) {
            return restaurantModules;
        }
        return restaurantModules.filter((moduleItem) => {
            const haystack = `${moduleItem.title} ${moduleItem.summary} ${moduleItem.metricValue}`.toLowerCase();
            return haystack.includes(normalizedSearch);
        });
    }
}
export const dashboardService = new DashboardService();
