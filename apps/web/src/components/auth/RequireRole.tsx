import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface RequireRoleProps {
  roles: string | string[];
  children: ReactNode;
  fallback?: ReactNode;
}

export function RequireRole({ roles, children, fallback = null }: RequireRoleProps) {
  const { hasRole } = useAuth();
  const roleList = Array.isArray(roles) ? roles : [roles];
  const isAuthorized = roleList.some((r) => hasRole(r));

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
