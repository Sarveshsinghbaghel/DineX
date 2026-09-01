import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { AppLoadingPage } from '@/pages/AppLoadingPage';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  if (loading) return <AppLoadingPage />;
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
