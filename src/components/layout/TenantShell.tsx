import { Outlet, useParams } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { Heart } from 'lucide-react';
import { TenantProvider } from '@/contexts/TenantContext';
import { api } from '@/shared/api/client';
import { appConfig } from '@/lib/config';
import { demoStore } from '@/lib/services/demo-store';
import { TenantPublic } from '@/types/platform';
import { Skeleton } from '@/shared/ui/Skeleton';

const RESERVED = new Set(['app', 'api', 'admin', 'login', 'signup', 'pricing']);

async function resolveTenant(slug: string): Promise<TenantPublic | null> {
  if (appConfig.isDemoMode) {
    const { isDemoTenantSlug } = await import('@/features/platform/demo-sites');
    if (!isDemoTenantSlug(slug)) return null;
    const config = demoStore.getSiteConfig();
    return {
      id: 'demo',
      slug,
      name: config.couple_name || 'Mi & John',
      event_date: config.event_date || null,
      config: { ...config, couple_name: config.couple_name || 'Mi & John' },
    };
  }
  try {
    return await api.get<TenantPublic>(`/tenants/${slug}/public`);
  } catch {
    return null;
  }
}

function TenantShellInner({ tenant }: { tenant: TenantPublic }) {
  return (
    <TenantProvider tenant={tenant}>
      <Outlet />
    </TenantProvider>
  );
}

export default function TenantShell() {
  const { domain } = useParams();
  const slug = domain?.toLowerCase() ?? '';

  const { data, isLoading, isError } = useQuery({
    queryKey: ['tenant-resolve', slug],
    queryFn: () => resolveTenant(slug),
    enabled: Boolean(slug) && !RESERVED.has(slug),
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  if (!slug || RESERVED.has(slug)) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex flex-col items-center justify-center gap-4 px-6">
        <Skeleton className="h-10 w-48 rounded-full" />
        <Skeleton className="h-4 w-64 rounded" />
        <Skeleton className="h-4 w-40 rounded" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-[#faf8f5] flex items-center justify-center px-6">
        <div className="text-center max-w-md space-y-4">
          <Heart className="w-10 h-10 text-primary-300 mx-auto" />
          <h1 className="font-heading text-2xl text-primary-800">Site não encontrado</h1>
          <p className="text-[#8a7e76] text-sm font-light">
            O endereço <strong className="font-medium">/{slug}</strong> não existe ou foi removido.
          </p>
          <a
            href="/"
            className="inline-block text-sm text-primary-600 hover:text-primary-700 font-medium uppercase tracking-wider"
          >
            Voltar ao ParaSempre
          </a>
        </div>
      </div>
    );
  }

  return <TenantShellInner tenant={data} />;
}
