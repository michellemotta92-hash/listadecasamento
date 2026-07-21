import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SiteConfig } from '@/types';
import { getSiteConfig, updateSiteConfig } from '@/lib/services/site-config';
import { useTenantOptional } from '@/contexts/TenantContext';

export function siteConfigQueryKey(slug: string) {
  return ['tenant', slug, 'site-config'] as const;
}

export function useSiteConfig() {
  const tenant = useTenantOptional();
  const slug = tenant?.slug ?? '_unknown';

  return useQuery({
    queryKey: siteConfigQueryKey(slug),
    queryFn: getSiteConfig,
    initialData: tenant?.config,
    staleTime: 1000 * 60,
    enabled: Boolean(tenant?.slug),
  });
}

export function useUpdateSiteConfig() {
  const queryClient = useQueryClient();
  const tenant = useTenantOptional();
  const slug = tenant?.slug ?? '_unknown';

  return useMutation({
    mutationFn: (patch: Partial<SiteConfig>) => updateSiteConfig(patch),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: siteConfigQueryKey(slug) });
      queryClient.invalidateQueries({ queryKey: ['tenant', slug, 'public'] });
    },
  });
}
