import { useState, useEffect, useCallback } from 'react';
import { GiftItem } from '@/types';
import { getGifts, getGiftById } from '@/lib/services/gifts';

export function useGifts() {
  const [gifts, setGifts] = useState<GiftItem[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGifts();
      setGifts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gifts, loading, refresh };
}

export function useGift(id: string) {
  const [gift, setGift] = useState<GiftItem | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getGiftById(id);
      setGift(data);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { gift, loading, refresh };
}
