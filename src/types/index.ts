export type RoomType = 'sala' | 'cozinha' | 'banheiro' | 'lavanderia' | 'quarto' | 'outro';
export type GiftStatus = 'disponivel' | 'reservado' | 'comprado';
export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada' | 'expirada';

export interface Tenant {
  id: string;
  name: string;
  event_date: string | null;
  theme_config: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface GiftItem {
  id: string;
  tenant_id: string;
  name: string;
  description: string | null;
  price: number;
  room: RoomType;
  color: string | null;
  store_name: string | null;
  store_link: string | null;
  status: GiftStatus;
  image_url: string | null;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export type PublicPage = 'presentes' | 'recados' | 'confirmar';

export interface PageTexts {
  home_subtitle?: string;
  home_description?: string;
  home_gifts_card?: string;
  gifts_subtitle?: string;
  gifts_title?: string;
  gifts_description?: string;
  messages_subtitle?: string;
  messages_title?: string;
  messages_description?: string;
  rsvp_subtitle?: string;
  rsvp_title?: string;
  rsvp_description?: string;
}

export interface SiteConfig {
  hero_image_url?: string;
  logo_url?: string;
  couple_name?: string;
  event_date?: string;
  event_time?: string;
  event_location?: string;
  hidden_pages?: PublicPage[];
  page_texts?: PageTexts;
  theme?: string;
}

export interface GuestMessage {
  id: string;
  tenant_id: string;
  guest_name: string;
  message: string;
  is_approved: boolean;
  created_at: string;
}

export interface RSVPEntry {
  id: string;
  tenant_id: string;
  guest_name: string;
  guest_email: string;
  guests_count: number;
  dietary_restrictions: string | null;
  message: string | null;
  status: 'confirmado' | 'recusado';
  created_at: string;
}

export interface GiftReservation {
  id: string;
  gift_item_id: string;
  tenant_id: string;
  guest_name: string | null;
  guest_email: string | null;
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
}
