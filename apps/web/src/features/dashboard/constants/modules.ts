import type { DashboardModule } from '@/features/dashboard/types/dashboard.types';

export const restaurantModules: DashboardModule[] = [
  {
    title: 'Dining Room Operations',
    summary: 'Track table occupancy, waitlist movement, and live service bottlenecks.',
    status: 'Ready',
    metricLabel: 'Focus',
    metricValue: 'Floor flow',
  },
  {
    title: 'Kitchen Command',
    summary: 'Coordinate ticket visibility, station workload, and order pacing.',
    status: 'Ready',
    metricLabel: 'Focus',
    metricValue: 'Ticket speed',
  },
  {
    title: 'Billing and Checkout',
    summary: 'Support cashier workflows, settlement tracking, and receipt generation.',
    status: 'Planned',
    metricLabel: 'Focus',
    metricValue: 'Payment controls',
  },
  {
    title: 'Inventory Intelligence',
    summary: 'Monitor stock movement, low inventory alerts, and supplier readiness.',
    status: 'Planned',
    metricLabel: 'Focus',
    metricValue: 'Stock visibility',
  },
];
