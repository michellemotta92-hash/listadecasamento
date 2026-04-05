import { Outlet, Navigate, useParams } from 'react-router';
import { useAuth } from '@/contexts/AuthContext';

export default function AuthGuard() {
  const { isLoggedIn, loading } = useAuth();
  const { domain } = useParams();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-8 h-8 border-2 border-primary-300 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to={`/${domain}/admin/login`} replace />;
  }

  return <Outlet />;
}
