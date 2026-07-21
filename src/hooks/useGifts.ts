import { useQuery, useQueryClient } from '@tanstack/react-query';
import { GiftItem } from '@/types';
import { getGifts, getGiftById } from '@/lib/services/gifts';
import { useTenantOptional } from '@/contexts/TenantContext';

const STALE_TIME = 1000 * 60;

export function giftsQueryKey(slug: string) {
  return ['tenant', slug, 'gifts'] as const;
}

export function useGifts() {
  const tenant = useTenantOptional();
  const slug = tenant?.slug ?? '_unknown';

  const query = useQuery<GiftItem[], Error>({
    queryKey: giftsQueryKey(slug),
    queryFn: getGifts,
    staleTime: STALE_TIME,
    retry: 1,
    enabled: Boolean(tenant?.slug),
  });

  return {
    ...query,
    gifts: query.data ?? [],
    loading: query.isLoading,
    refresh: () => query.refetch(),
  };
}

export function useGift(id: string) {
  const tenant = useTenantOptional();
  const slug = tenant?.slug ?? '_unknown';

  return useQuery<GiftItem | null, Error>({
    queryKey: ['tenant', slug, 'gift', id],
    queryFn: () => getGiftById(id),
    staleTime: STALE_TIME,
    enabled: Boolean(id) && Boolean(tenant?.slug),
    retry: 1,
  });
}

export function useInvalidateGifts() {
  const queryClient = useQueryClient();
  const tenant = useTenantOptional();

  return () => {
    if (tenant?.slug) {
      queryClient.invalidateQueries({ queryKey: giftsQueryKey(tenant.slug) });
    }
  };
}
