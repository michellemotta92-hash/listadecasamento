import { createContext, useContext, useEffect, ReactNode } from 'react';
import { setApiTenantSlug } from '@/shared/api/tenant-slug';
import { SiteConfig } from '@/types';
import { TenantPublic } from '@/types/platform';

interface TenantContextValue {
  slug: string;
  id: string;
  name: string;
  config: SiteConfig;
  refetch: () => void;
}

const TenantContext = createContext<TenantContextValue | null>(null);

interface Props {
  tenant: TenantPublic;
  children: ReactNode;
}

export function TenantProvider({ tenant, children }: Props) {
  useEffect(() => {
    setApiTenantSlug(tenant.slug);
    return () => setApiTenantSlug(null);
  }, [tenant.slug]);

  const value: TenantContextValue = {
    slug: tenant.slug,
    id: tenant.id,
    name: tenant.name,
    config: tenant.config || {},
    refetch: () => {
      window.location.reload();
    },
  };

  return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
}

export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext);
  if (!ctx) {
    throw new Error('useTenant must be used within TenantProvider');
  }
  return ctx;
}

export function useTenantOptional(): TenantContextValue | null {
  return useContext(TenantContext);
}
