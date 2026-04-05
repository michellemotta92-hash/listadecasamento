import { GuestMessage } from '@/types';
import { appConfig } from '@/lib/config';
import { demoStore } from './demo-store';
import { api } from '@/lib/api';

export async function getMessages(): Promise<GuestMessage[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getMessages();
  }
  return api.get<GuestMessage[]>('/messages');
}

export async function getApprovedMessages(): Promise<GuestMessage[]> {
  if (appConfig.isDemoMode) {
    return demoStore.getMessages().filter(m => m.is_approved);
  }
  return api.get<GuestMessage[]>('/messages?approved=true');
}

export async function addMessage(msg: { guest_name: string; message: string }): Promise<GuestMessage> {
  if (appConfig.isDemoMode) {
    return demoStore.addMessage(msg);
  }
  return api.post<GuestMessage>('/messages', msg);
}

export async function deleteMessage(id: string): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.deleteMessage(id);
    return;
  }
  await api.delete(`/messages/${id}`);
}

export async function toggleMessageApproval(id: string): Promise<void> {
  if (appConfig.isDemoMode) {
    demoStore.toggleMessageApproval(id);
    return;
  }
  await api.patch(`/messages/${id}/toggle`, {});
}
