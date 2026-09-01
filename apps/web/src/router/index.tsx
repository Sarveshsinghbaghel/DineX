import { createBrowserRouter } from 'react-router-dom';

import { App } from '@/App';
import { DashboardOverviewPage } from '@/features/dashboard/pages/DashboardOverviewPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    children: [
      {
        index: true,
        element: <DashboardOverviewPage />,
      },
    ],
  },
]);
