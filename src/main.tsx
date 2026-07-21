import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router';
import { AuthProvider } from '@/contexts/AuthContext';
import { PlatformAuthProvider } from '@/contexts/PlatformAuthContext';
import { ToastProvider } from '@/contexts/ToastContext';
import { ReactQueryProvider } from '@/lib/ReactQueryProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import { router } from './router';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <ReactQueryProvider>
        <ToastProvider>
          <PlatformAuthProvider>
            <AuthProvider>
              <Suspense fallback={<div className="min-h-screen bg-slate-950" />}>
                <RouterProvider router={router} />
              </Suspense>
            </AuthProvider>
          </PlatformAuthProvider>
        </ToastProvider>
      </ReactQueryProvider>
    </ErrorBoundary>
  </StrictMode>
);
