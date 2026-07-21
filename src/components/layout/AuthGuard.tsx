import { Outlet, Navigate, useLocation } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard() {
  const { isLoggedIn, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/app/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
