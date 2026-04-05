import { GiftReservation } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api } from '@/lib/api';

export async function createReservation(giftId: string): Promise<GiftReservation | null> {
  if (appConfig.isDemoMode) {
    return demoStore.createReservation(giftId);
  }
  try {
    return await api.post<GiftReservation>('/reservations', { gift_id: giftId });
  } catch {
    return null;
  }
}

export async function confirmReservation(giftId: string): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.confirmReservation(giftId);
    return;
  }
  await api.post(`/reservations/${giftId}/confirm`, {});
}

export async function getReservations(): Promise<GiftReservation[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getReservations();
  }
  return api.get<GiftReservation[]>('/reservations');
}
