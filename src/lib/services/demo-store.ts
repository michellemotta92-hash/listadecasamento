import { GiftItem, GiftReservation, GuestMessage, RSVPEntry, SiteConfig } from '@/types';
import { realGifts } from '../real-data';

class DemoStore {
  gifts: GiftItem[] = [...realGifts];
  reservations: GiftReservation[] = [];
  messages: GuestMessage[] = [
    {
      id: 'msg-1',
      tenant_id: 'tenant-1',
      guest_name: 'Ana Paula',
      message: 'Que Deus abençoe essa união! Muitas felicidades ao casal mais lindo! 💕',
      is_approved: true,
      created_at: '2026-03-20T14:30:00.000Z',
    },
    {
      id: 'msg-2',
      tenant_id: 'tenant-1',
      guest_name: 'Carlos e Fernanda',
      message: 'Estamos muito felizes por vocês! Será o casamento mais bonito do ano!',
      is_approved: true,
      created_at: '2026-03-22T10:15:00.000Z',
    },
    {
      id: 'msg-3',
      tenant_id: 'tenant-1',
      guest_name: 'Vovó Maria',
      message: 'Meus netos queridos, que essa nova jornada seja repleta de amor e saúde. Amo vocês!',
      is_approved: true,
      created_at: '2026-03-25T08:00:00.000Z',
    },
  ];
  rsvps: RSVPEntry[] = [];
  siteConfig: SiteConfig = {};

  // Gifts
  getGifts() {
    return this.gifts;
  }

  getGiftById(id: string) {
    return this.gifts.find(g => g.id === id);
  }

  updateGift(id: string, updates: Partial<GiftItem>) {
    this.gifts = this.gifts.map(g =>
      g.id === id ? { ...g, ...updates, updated_at: new Date().toISOString() } : g
    );
  }

  addGift(gift: Omit<GiftItem, 'id' | 'created_at' | 'updated_at'>) {
    const newGift: GiftItem = {
      ...gift,
      id: Math.random().toString(36).substring(7),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.gifts.push(newGift);
    return newGift;
  }

  // Reservations
  createReservation(giftId: string) {
    const gift = this.getGiftById(giftId);
    if (!gift || gift.status !== 'disponivel') return null;

    this.updateGift(giftId, { status: 'reservado' });

    const reservation: GiftReservation = {
      id: Math.random().toString(36).substring(7),
      gift_item_id: giftId,
      tenant_id: gift.tenant_id,
      guest_name: 'Convidado Demo',
      guest_email: 'demo@example.com',
      status: 'pendente',
      expires_at: new Date(Date.now() + 20 * 60000).toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.reservations.push(reservation);
    return reservation;
  }

  confirmReservation(giftId: string) {
    this.updateGift(giftId, { status: 'comprado' });
    const res = this.reservations.find(r => r.gift_item_id === giftId && r.status === 'pendente');
    if (res) {
      res.status = 'confirmada';
      res.updated_at = new Date().toISOString();
    }
  }

  getReservations() {
    return this.reservations;
  }

  // Messages
  getMessages() {
    return [...this.messages].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  addMessage(msg: { guest_name: string; message: string }) {
    const newMsg: GuestMessage = {
      id: Math.random().toString(36).substring(7),
      tenant_id: 'tenant-1',
      guest_name: msg.guest_name,
      message: msg.message,
      is_approved: true,
      created_at: new Date().toISOString(),
    };
    this.messages.push(newMsg);
    return newMsg;
  }

  deleteMessage(id: string) {
    this.messages = this.messages.filter(m => m.id !== id);
  }

  toggleMessageApproval(id: string) {
    this.messages = this.messages.map(m =>
      m.id === id ? { ...m, is_approved: !m.is_approved } : m
    );
  }

  // RSVP
  getRSVPs() {
    return [...this.rsvps].sort((a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  addRSVP(entry: Omit<RSVPEntry, 'id' | 'tenant_id' | 'created_at'>) {
    const newEntry: RSVPEntry = {
      ...entry,
      id: Math.random().toString(36).substring(7),
      tenant_id: 'tenant-1',
      created_at: new Date().toISOString(),
    };
    this.rsvps.push(newEntry);
    return newEntry;
  }

  deleteRSVP(id: string) {
    this.rsvps = this.rsvps.filter(r => r.id !== id);
  }

  // Site Config
  getSiteConfig() {
    return { ...this.siteConfig };
  }

  updateSiteConfig(config: Partial<SiteConfig>) {
    this.siteConfig = { ...this.siteConfig, ...config };
  }
}

// Module-level singleton for SPA
export const demoStore = new DemoStore();
