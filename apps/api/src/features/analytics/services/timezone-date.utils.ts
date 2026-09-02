import type { AnalyticsTimePeriod } from '@x10think/types';

export interface DateRange {
  startDate: Date;
  endDate: Date;
  label: string;
}

export function resolveDateRange(
  period: AnalyticsTimePeriod,
  _timezone: string,
  customStart?: string,
  customEnd?: string,
): DateRange {
  const now = new Date();

  let startDate = new Date();
  let endDate = new Date();
  let label: string = period;

  switch (period) {
    case 'today':
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      label = 'Today';
      break;

    case 'yesterday':
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate.setDate(now.getDate() - 1);
      endDate.setHours(23, 59, 59, 999);
      label = 'Yesterday';
      break;

    case 'last_7_days':
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      label = 'Last 7 Days';
      break;

    case 'last_30_days':
    default:
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      label = 'Last 30 Days';
      break;

    case 'this_month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      label = 'This Month';
      break;

    case 'previous_month':
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'Previous Month';
      break;

    case 'this_year':
      startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      label = 'This Year';
      break;

    case 'custom':
      if (customStart) startDate = new Date(customStart);
      if (customEnd) endDate = new Date(customEnd);
      label = 'Custom Range';
      break;
  }

  return { startDate, endDate, label };
}

export function getPreviousPeriodRange(current: DateRange): DateRange {
  const diffMs = current.endDate.getTime() - current.startDate.getTime();
  const prevEnd = new Date(current.startDate.getTime() - 1);
  const prevStart = new Date(prevEnd.getTime() - diffMs);

  return {
    startDate: prevStart,
    endDate: prevEnd,
    label: `Prior to ${current.label}`,
  };
}

export function calculatePercentageChange(current: number, previous: number): number {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10;
}
