import { RSVPEntry } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api } from '@/lib/api';

export async function getRSVPs(): Promise<RSVPEntry[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getRSVPs();
  }
  return api.get<RSVPEntry[]>('/rsvp');
}

export async function addRSVP(entry: {
  guest_name: string;
  guest_email: string;
  guests_count: number;
  dietary_restrictions: string | null;
  message: string | null;
  status: 'confirmado' | 'recusado';
}): Promise<RSVPEntry> {
  if (appConfig.isDemoMode) {
    return demoStore.addRSVP(entry);
  }
  return api.post<RSVPEntry>('/rsvp', entry);
}

export async function deleteRSVP(id: string): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.deleteRSVP(id);
    return;
  }
  await api.delete(`/rsvp/${id}`);
}
