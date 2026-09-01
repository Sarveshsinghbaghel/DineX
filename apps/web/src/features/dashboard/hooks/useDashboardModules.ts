import { useQuery } from '@tanstack/react-query';

import { dashboardQueryKeys } from '@/features/dashboard/constants/dashboard.constants';
import { dashboardService } from '@/features/dashboard/services/dashboard.service';

export function useDashboardModules(search: string) {
  return useQuery({
    queryKey: [...dashboardQueryKeys.modules, search],
    queryFn: () => dashboardService.listModules(search),
  });
}
