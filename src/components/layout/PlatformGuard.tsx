import { Navigate, Outlet, useLocation } from 'react-router';
import { usePlatformAuth } from '@/contexts/PlatformAuthContext';
import { Skeleton } from '@/shared/ui/Skeleton';

export default function PlatformGuard() {
  const { isLoggedIn, loading } = usePlatformAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center gap-3">
        <Skeleton className="h-8 w-32 bg-slate-800" />
      </div>
    );
  }

  if (!isLoggedIn) {
    return <Navigate to="/app/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
