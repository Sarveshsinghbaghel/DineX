import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RequirePermissionProps {
  permissions: string | string[];
  mode?: 'any' | 'all';
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequirePermission({
  permissions,
  mode = 'any',
  children,
  fallback = null,
}: RequirePermissionProps) {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  const permList = Array.isArray(permissions) ? permissions : [permissions];

  const isAuthorized = mode === 'all' ? hasAllPermissions(permList) : hasAnyPermission(permList);

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
