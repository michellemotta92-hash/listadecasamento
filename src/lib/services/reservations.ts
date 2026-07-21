import { GiftReservation } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api, ApiError } from '@/lib/api';

export interface CreateReservationInput {
  giftId: string;
  guestName: string;
  guestEmail?: string;
}

export async function createReservation(
  input: CreateReservationInput
): Promise<{ reservation?: GiftReservation; conflict?: boolean; error?: string }> {
  if (appConfig.isDemoMode) {
    const reservation = await demoStore.createReservation(input.giftId, input.guestName, input.guestEmail);
    return { reservation: reservation ?? undefined };
  }
  try {
    const reservation = await api.post<GiftReservation>('/reservations', {
      gift_id: input.giftId,
      guest_name: input.guestName,
      guest_email: input.guestEmail || null,
    });
    return { reservation };
  } catch (err) {
    if (err instanceof ApiError && err.status === 409) {
      return { conflict: true, error: 'Este presente já foi reservado por outra pessoa.' };
    }
    if (err instanceof ApiError && err.status === 400) {
      return { error: err.message };
    }
    return { error: 'Erro ao conectar. Tente novamente.' };
  }
}

export async function confirmReservation(
  reservationId: string,
  token: string,
  demoGiftId?: string
): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.confirmReservation(demoGiftId || reservationId);
    return;
  }
  await api.post(`/reservations/${reservationId}/confirm`, { token });
}

export async function getReservations(): Promise<GiftReservation[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getReservations();
  }
  return api.get<GiftReservation[]>('/reservations');
}
