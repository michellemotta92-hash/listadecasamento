import { createBrowserRouter, Navigate } from 'react-router';
import { appConfig } from '@/lib/config';

import PublicLayout from '@/components/layout/PublicLayout';
import AdminLayout from '@/components/layout/AdminLayout';
import AuthGuard from '@/components/layout/AuthGuard';

import HomePage from '@/pages/public/HomePage';
import GiftsPage from '@/pages/public/GiftsPage';
import GiftDetailPage from '@/pages/public/GiftDetailPage';
import MessagesPage from '@/pages/public/MessagesPage';
import RSVPPage from '@/pages/public/RSVPPage';

import LoginPage from '@/pages/admin/LoginPage';
import DashboardPage from '@/pages/admin/DashboardPage';
import AdminGiftsPage from '@/pages/admin/AdminGiftsPage';
import AdminReservationsPage from '@/pages/admin/AdminReservationsPage';
import AdminConfigPage from '@/pages/admin/AdminConfigPage';
import AdminMessagesPage from '@/pages/admin/AdminMessagesPage';
import AdminRSVPPage from '@/pages/admin/AdminRSVPPage';

import NotFoundPage from '@/pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Navigate to={`/${appConfig.defaultTenant}`} replace />,
  },
  {
    path: '/:domain',
    element: <PublicLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'presentes', element: <GiftsPage /> },
      { path: 'presentes/:id', element: <GiftDetailPage /> },
      { path: 'recados', element: <MessagesPage /> },
      { path: 'confirmar', element: <RSVPPage /> },
    ],
  },
  {
    path: '/:domain/admin/login',
    element: <LoginPage />,
  },
  {
    path: '/:domain/admin',
    element: <AuthGuard />,
    children: [
      {
        element: <AdminLayout />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'presentes', element: <AdminGiftsPage /> },
          { path: 'reservas', element: <AdminReservationsPage /> },
          { path: 'recados', element: <AdminMessagesPage /> },
          { path: 'confirmacoes', element: <AdminRSVPPage /> },
          { path: 'config', element: <AdminConfigPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);
