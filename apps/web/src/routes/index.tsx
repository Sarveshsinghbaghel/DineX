import { createBrowserRouter } from 'react-router-dom';

import { App } from '@/App';
import { DashboardOverviewPage } from '@/features/dashboard/pages/DashboardOverviewPage';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { AuthPage } from '@/features/auth/pages/AuthPage';
import { ProtectedRoute } from '@/routes/ProtectedRoute';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <AuthPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/register',
    element: <AuthPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <ProtectedRoute />,
        children: [
          {
            index: true,
            element: <DashboardOverviewPage />,
          },
        ],
      },
    ],
  },
]);
