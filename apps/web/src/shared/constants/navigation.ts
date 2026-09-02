export interface NavigationItem {
  to: string;
  label: string;
  description: string;
}

export const navigationItems: NavigationItem[] = [
  {
    to: '/',
    label: 'Operations Overview',
    description: 'Snapshot of the business across service, kitchen, and cash desk.',
  },
  {
    to: '/restaurant',
    label: 'Restaurant Profile',
    description: 'Manage legal profile, branding, and business hours.',
  },
  {
    to: '/branches',
    label: 'Branches',
    description: 'Manage operational branch locations, codes, and status.',
  },
  {
    to: '/restaurant/settings',
    label: 'Tenant Settings',
    description: 'Tax, pricing, and workflow settings precedence.',
  },
  {
    to: '/profile',
    label: 'My Account',
    description: 'Manage personal info, avatar, addresses, and preferences.',
  },
  {
    to: '/admin/users',
    label: 'User Management',
    description: 'Admin user search, role assignment, and account status.',
  },
  {
    to: '/inventory',
    label: 'Inventory & Stock',
    description: 'Stock levels, threshold state, suppliers, and purchase orders.',
  },
  {
    to: '/employees',
    label: 'Employee Management',
    description: 'Staff directory, shifts, scheduling, and attendance.',
  },
  {
    to: '/notifications',
    label: 'Notification Center',
    description: 'Centralized alerts, Socket.IO realtime, and preferences.',
  },
  {
    to: '/engagement',
    label: 'Customer Engagement',
    description: 'Reviews, ratings, coupons, loyalty points, and favorites.',
  },
  {
    to: '/analytics',
    label: 'Business Intelligence',
    description: 'Executive KPIs, revenue breakdown, menu engineering, and BI.',
  },
  {
    to: '/reports',
    label: 'Reports & Export',
    description: 'Tax/GST compliance, sales, orders, and CSV/XLSX/PDF exports.',
  },
  {
    to: '/recommendations/insights',
    label: 'Recommendation Insights',
    description: 'AI-assisted menu engineering, cross-sell opportunities, and item pairings.',
  },
  {
    to: '/admin/qr-tables',
    label: 'Table QR Management',
    description: 'Manage tables, generate secure QR tokens, and print QR standees.',
  },
];
