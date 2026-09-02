import { lazy } from 'react';
import { createBrowserRouter } from 'react-router-dom';

import { App } from '@/App';
import { RouteErrorPage } from '@/pages/RouteErrorPage';
import { AuthPage } from '@/features/auth/pages/AuthPage';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Lazy-loaded page components for route-level code splitting & bundle optimization
const DashboardOverviewPage = lazy(() =>
  import('@/features/dashboard/pages/DashboardOverviewPage').then((m) => ({
    default: m.DashboardOverviewPage,
  })),
);
const UserProfilePage = lazy(() =>
  import('@/features/users/pages/UserProfilePage').then((m) => ({ default: m.UserProfilePage })),
);
const AdminUserManagementPage = lazy(() =>
  import('@/features/users/pages/AdminUserManagementPage').then((m) => ({
    default: m.AdminUserManagementPage,
  })),
);
const RestaurantOverviewPage = lazy(() =>
  import('@/features/restaurants/pages/RestaurantOverviewPage').then((m) => ({
    default: m.RestaurantOverviewPage,
  })),
);
const RestaurantSettingsPage = lazy(() =>
  import('@/features/restaurants/pages/RestaurantSettingsPage').then((m) => ({
    default: m.RestaurantSettingsPage,
  })),
);
const BranchManagementPage = lazy(() =>
  import('@/features/branches/pages/BranchManagementPage').then((m) => ({
    default: m.BranchManagementPage,
  })),
);
const BranchDetailsPage = lazy(() =>
  import('@/features/branches/pages/BranchDetailsPage').then((m) => ({
    default: m.BranchDetailsPage,
  })),
);
const InventoryDashboardPage = lazy(() =>
  import('@/features/inventory/pages/InventoryDashboardPage').then((m) => ({
    default: m.InventoryDashboardPage,
  })),
);
const EmployeeManagementPage = lazy(() =>
  import('@/features/employees/pages/EmployeeManagementPage').then((m) => ({
    default: m.EmployeeManagementPage,
  })),
);
const NotificationCenterPage = lazy(() =>
  import('@/features/notifications/pages/NotificationCenterPage').then((m) => ({
    default: m.NotificationCenterPage,
  })),
);
const CustomerEngagementPage = lazy(() =>
  import('@/features/engagement/pages/CustomerEngagementPage').then((m) => ({
    default: m.CustomerEngagementPage,
  })),
);
const AnalyticsDashboardPage = lazy(() =>
  import('@/features/analytics/pages/AnalyticsDashboardPage').then((m) => ({
    default: m.AnalyticsDashboardPage,
  })),
);
const ReportsDashboardPage = lazy(() =>
  import('@/features/reports/pages/ReportsDashboardPage').then((m) => ({
    default: m.ReportsDashboardPage,
  })),
);
const StaffRecommendationInsightsPage = lazy(() =>
  import('@/features/recommendations/pages/StaffRecommendationInsightsPage').then((m) => ({
    default: m.StaffRecommendationInsightsPage,
  })),
);
const PublicQRMenuPage = lazy(() =>
  import('@/features/qr-ordering/pages/PublicQRMenuPage').then((m) => ({
    default: m.PublicQRMenuPage,
  })),
);
const TableQRManagementPage = lazy(() =>
  import('@/features/qr-ordering/pages/TableQRManagementPage').then((m) => ({
    default: m.TableQRManagementPage,
  })),
);
const DeliveryCheckoutPage = lazy(() =>
  import('@/features/delivery/pages/DeliveryCheckoutPage').then((m) => ({
    default: m.DeliveryCheckoutPage,
  })),
);
const DeliveryTrackingPage = lazy(() =>
  import('@/features/delivery/pages/DeliveryTrackingPage').then((m) => ({
    default: m.DeliveryTrackingPage,
  })),
);
const DeliveryManagementPage = lazy(() =>
  import('@/features/delivery/pages/DeliveryManagementPage').then((m) => ({
    default: m.DeliveryManagementPage,
  })),
);
const DeliveryDriverPage = lazy(() =>
  import('@/features/delivery/pages/DeliveryDriverPage').then((m) => ({
    default: m.DeliveryDriverPage,
  })),
);

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
    path: '/qr/:token',
    element: <PublicQRMenuPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/delivery/checkout',
    element: <DeliveryCheckoutPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/delivery/track/:orderId',
    element: <DeliveryTrackingPage />,
    errorElement: <RouteErrorPage />,
  },
  {
    path: '/',
    element: <App />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: (
          <ProtectedRoute>
            <DashboardOverviewPage />
          </ProtectedRoute>
        ),
        index: true,
      },
      {
        path: 'restaurant',
        element: (
          <ProtectedRoute permissions={['restaurants.view']}>
            <RestaurantOverviewPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'restaurant/settings',
        element: (
          <ProtectedRoute permissions={['settings.manage']}>
            <RestaurantSettingsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches',
        element: (
          <ProtectedRoute permissions={['branches.view']}>
            <BranchManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches/:branchId',
        element: (
          <ProtectedRoute permissions={['branches.view']}>
            <BranchDetailsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'inventory',
        element: (
          <ProtectedRoute permissions={['inventory.view']}>
            <InventoryDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'employees',
        element: (
          <ProtectedRoute permissions={['employees.view']}>
            <EmployeeManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'notifications',
        element: (
          <ProtectedRoute>
            <NotificationCenterPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'engagement',
        element: (
          <ProtectedRoute>
            <CustomerEngagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'analytics',
        element: (
          <ProtectedRoute permissions={['analytics.read']}>
            <AnalyticsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'reports',
        element: (
          <ProtectedRoute permissions={['reports.read']}>
            <ReportsDashboardPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'recommendations/insights',
        element: (
          <ProtectedRoute permissions={['recommendations.read', 'analytics.read']}>
            <StaffRecommendationInsightsPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/qr-tables',
        element: (
          <ProtectedRoute permissions={['tables.read', 'tables.manage']}>
            <TableQRManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'branches/:branchId/qr',
        element: (
          <ProtectedRoute permissions={['tables.read', 'tables.manage']}>
            <TableQRManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/delivery',
        element: (
          <ProtectedRoute permissions={['delivery.view', 'delivery.manage']}>
            <DeliveryManagementPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'driver/deliveries',
        element: (
          <ProtectedRoute>
            <DeliveryDriverPage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'profile',
        element: (
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        ),
      },
      {
        path: 'admin/users',
        element: (
          <ProtectedRoute permissions={['users.read']}>
            <AdminUserManagementPage />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
