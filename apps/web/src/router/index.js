import { jsx as _jsx } from 'react/jsx-runtime';
import { createBrowserRouter } from 'react-router-dom';
import { App } from '@/App';
import { DashboardOverviewPage } from '@/features/dashboard/pages/DashboardOverviewPage';
export const router = createBrowserRouter([
  {
    path: '/',
    element: _jsx(App, {}),
    children: [
      {
        index: true,
        element: _jsx(DashboardOverviewPage, {}),
      },
    ],
  },
]);
