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
];
