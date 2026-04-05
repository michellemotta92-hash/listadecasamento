import { GiftItem, GiftStatus } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api } from '@/lib/api';

export async function getGifts(): Promise<GiftItem[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getGifts();
  }
  return api.get<GiftItem[]>('/gifts');
}

export async function getGiftById(id: string): Promise<GiftItem | null> {
  if (appConfig.isDemoMode) {
    return demoStore.getGiftById(id) || null;
  }
  try {
    return await api.get<GiftItem>(`/gifts/${id}`);
  } catch {
    return null;
  }
}

export async function updateGiftStatus(id: string, status: GiftStatus): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.updateGift(id, { status });
    return;
  }
  await api.patch(`/gifts/${id}`, { status });
}

export async function updateGift(id: string, updates: Partial<GiftItem>): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.updateGift(id, updates);
    return;
  }
  await api.patch(`/gifts/${id}`, updates);
}

export async function addGift(gift: Omit<GiftItem, 'id' | 'created_at' | 'updated_at'>): Promise<GiftItem> {
  if (appConfig.isDemoMode) {
    return demoStore.addGift(gift);
  }
  return api.post<GiftItem>('/gifts', gift);
}

export async function deleteGift(id: string): Promise<void> {
  if (appConfig.isDemoMode) return;
  await api.delete(`/gifts/${id}`);
}

export async function reorderGifts(orderedIds: string[]): Promise<void> {
  if (appConfig.isDemoMode) return;
  await api.post('/gifts/reorder', { orderedIds });
}
