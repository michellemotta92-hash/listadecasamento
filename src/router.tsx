import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { appConfig } from '@/lib/config';

import TenantShell from '@/components/layout/TenantShell';
import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/layout/AuthGuard';
import PlatformLayout from '@/components/layout/PlatformLayout';
import PlatformGuard from '@/components/layout/PlatformGuard';
import { Skeleton } from '@/shared/ui/Skeleton';

const HomePage = lazy(() => import('@/pages/public/HomePage'));
const GiftsPage = lazy(() => import('@/pages/public/GiftsPage'));
const GiftDetailPage = lazy(() => import('@/pages/public/GiftDetailPage'));
const MessagesPage = lazy(() => import('@/pages/public/MessagesPage'));
const RSVPPage = lazy(() => import('@/pages/public/RSVPPage'));
const PixPage = lazy(() => import('@/pages/public/PixPage'));
const DashboardPage = lazy(() => import('@/pages/admin/DashboardPage'));
const AdminGiftsPage = lazy(() => import('@/pages/admin/AdminGiftsPage'));
const AdminReservationsPage = lazy(() => import('@/pages/admin/AdminReservationsPage'));
const AdminConfigPage = lazy(() => import('@/pages/admin/AdminConfigPage'));
const AdminMessagesPage = lazy(() => import('@/pages/admin/AdminMessagesPage'));
const AdminRSVPPage = lazy(() => import('@/pages/admin/AdminRSVPPage'));
const AdminTasksPage = lazy(() => import('@/pages/admin/AdminTasksPage'));
const LandingPage = lazy(() => import('@/pages/marketing/LandingPage'));
const PlatformLoginPage = lazy(() => import('@/pages/platform/PlatformLoginPage'));
const PlatformSignupPage = lazy(() => import('@/pages/platform/PlatformSignupPage'));
const SitesListPage = lazy(() => import('@/pages/platform/SitesListPage'));
const CreateSiteWizard = lazy(() => import('@/pages/platform/CreateSiteWizard'));
const PlansPage = lazy(() => import('@/pages/platform/PlansPage'));
const LazyNotFound = lazy(() => import('@/pages/NotFoundPage'));

function PageFallback() {
  return (
    <div className="min-h-[40vh] flex items-center justify-center">
      <Skeleton className="h-8 w-40 rounded-full" />
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <LandingPage />,
  },
  {
    path: '/app',
    element: <PlatformLayout />,
    children: [
      { index: true, element: <Navigate to="/app/sites" replace /> },
      { path: 'login', element: <PlatformLoginPage /> },
      { path: 'signup', element: <PlatformSignupPage /> },
      {
        element: <PlatformGuard />,
        children: [
          { path: 'sites', element: <SitesListPage /> },
          { path: 'sites/new', element: <CreateSiteWizard /> },
          { path: 'plans', element: <PlansPage /> },
        ],
      },
    ],
  },
  {
    path: '/:domain',
    element: <TenantShell />,
    children: [
      {
        element: <PublicLayout />,
        children: [
          { index: true, element: <HomePage /> },
          { path: 'presentes', element: <GiftsPage /> },
          { path: 'presentes/:id', element: <GiftDetailPage /> },
          { path: 'recados', element: <MessagesPage /> },
          { path: 'confirmar', element: <RSVPPage /> },
          { path: 'pix', element: <PixPage /> },
        ],
      },
    ],
  },
  {
    path: '/:domain/admin/login',
    element: <Navigate to="/app/login" replace />,
  },
  {
    path: '/:domain/admin',
    element: <TenantShell />,
    children: [
      {
        element: <AuthGuard />,
        children: [
          {
            element: <AdminLayout />,
            children: [
              { index: true, element: <DashboardPage /> },
              { path: 'planejamento', element: <AdminTasksPage /> },
              { path: 'presentes', element: <AdminGiftsPage /> },
              { path: 'reservas', element: <AdminReservationsPage /> },
              { path: 'recados', element: <AdminMessagesPage /> },
              { path: 'confirmacoes', element: <AdminRSVPPage /> },
              { path: 'config', element: <AdminConfigPage /> },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: (
      <Suspense fallback={<PageFallback />}>
        <LazyNotFound />
      </Suspense>
    ),
  },
]);

/** Legacy redirect for bookmarks */
export const legacyTenantRedirect = appConfig.defaultTenant;
