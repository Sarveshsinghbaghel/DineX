export interface DashboardModule {
  title: string;
  summary: string;
  status: 'Ready' | 'Planned';
  metricLabel: string;
  metricValue: string;
}

export interface DashboardFilters {
  search: string;
}
