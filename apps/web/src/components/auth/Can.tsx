import type { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface CanProps {
  do: string | string[];
  mode?: 'any' | 'all';
  children: ReactNode;
  fallback?: ReactNode;
}

export function Can({ do: action, mode = 'any', children, fallback = null }: CanProps) {
  const { hasAnyPermission, hasAllPermissions } = useAuth();
  const actions = Array.isArray(action) ? action : [action];

  const allowed = mode === 'all' ? hasAllPermissions(actions) : hasAnyPermission(actions);

  if (!allowed) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
