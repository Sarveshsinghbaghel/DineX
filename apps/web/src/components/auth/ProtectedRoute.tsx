import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { UnauthorizedPage } from '@/pages/UnauthorizedPage';
import { ForbiddenPage } from '@/pages/ForbiddenPage';

export interface ProtectedRouteProps {
  children: ReactNode;
  roles?: string[];
  permissions?: string[];
  permissionMode?: 'any' | 'all';
}

export function ProtectedRoute({
  children,
  roles,
  permissions,
  permissionMode = 'any',
}: ProtectedRouteProps) {
  const { user, loading, hasRole, hasAnyPermission, hasAllPermissions } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

  if (!user) {
    return <UnauthorizedPage />;
  }

  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some((r) => hasRole(r));
    if (!hasRequiredRole) {
      return <ForbiddenPage />;
    }
  }

  if (permissions && permissions.length > 0) {
    const hasPerms =
      permissionMode === 'all'
        ? hasAllPermissions(permissions)
        : hasAnyPermission(permissions);
    if (!hasPerms) {
      return <ForbiddenPage />;
    }
  }

  return <>{children}</>;
}
