import { createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import { httpClient } from '@/api/http-client';

export interface UserRoleSummary {
  _id: string;
  code: string;
  name: string;
  isSystem: boolean;
}

export interface AuthUser {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  emailVerified: boolean;
  accountStatus: string;
  roles?: UserRoleSummary[];
  permissions?: string[];
}

export interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (roleCode: string) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  hasAnyPermission: (permissionCodes: string[]) => boolean;
  hasAllPermissions: (permissionCodes: string[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    httpClient
      .post<{ data: { user: AuthUser; accessToken: string } }>('/auth/refresh')
      .then(({ data }) => {
        setUser(data.data.user);
        setAccessToken(data.data.accessToken);
      })
      .catch(() => {
        setUser(null);
        setAccessToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  async function login(email: string, password: string) {
    const { data } = await httpClient.post<{ data: { user: AuthUser; accessToken: string } }>(
      '/auth/login',
      { email, password },
    );
    setUser(data.data.user);
    setAccessToken(data.data.accessToken);
  }

  async function register(name: string, email: string, password: string) {
    await httpClient.post('/auth/register', { name, email, password });
  }

  async function logout() {
    await httpClient.post('/auth/logout', undefined, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
    });
    setUser(null);
    setAccessToken(null);
  }

  function hasRole(roleCode: string): boolean {
    if (!user || !user.roles) return false;
    if (user.roles.some((r) => r.code === 'super_admin')) return true;
    return user.roles.some((r) => r.code === roleCode);
  }

  function hasPermission(permissionCode: string): boolean {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('system.doEverything')) return true;
    return user.permissions.includes(permissionCode);
  }

  function hasAnyPermission(permissionCodes: string[]): boolean {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('system.doEverything')) return true;
    return permissionCodes.some((code) => user.permissions?.includes(code));
  }

  function hasAllPermissions(permissionCodes: string[]): boolean {
    if (!user || !user.permissions) return false;
    if (user.permissions.includes('system.doEverything')) return true;
    return permissionCodes.every((code) => user.permissions?.includes(code));
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        loading,
        login,
        register,
        logout,
        hasRole,
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
