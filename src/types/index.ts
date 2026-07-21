export type RoomType = 'sala' | 'cozinha' | 'banheiro' | 'lavanderia' | 'quarto' | 'outro';
export type GiftStatus = 'disponivel' | 'reservado' | 'comprado';
export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada' | 'expirada';
export type TaskStatus = 'todo' | 'in_progress' | 'blocked' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface EventTask {
  id: string;
  organization_id: string;
  tenant_id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  visibility: 'internal' | 'client';
  assigned_to_user_id: string | null;
  completed_at: string | null;
  version: number;
  created_at: string;
  updated_at: string;
}

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
  sort_order?: number;
  created_at: string;
  updated_at: string;
}

export type PixKeyType = 'cpf' | 'email' | 'phone' | 'random';

export interface PixConfig {
  enabled: boolean;
  title?: string;
  description?: string;
  key_type: PixKeyType;
  key: string;
  beneficiary_name?: string;
  qr_image_url?: string;
}

export type PublicPage = 'presentes' | 'recados' | 'confirmar' | 'pix';

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
  pix?: PixConfig;
  meta_description?: string;
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
  gift_name?: string | null;
  guest_name: string | null;
  guest_email: string | null;
  status: ReservationStatus;
  expires_at: string;
  created_at: string;
  updated_at: string;
  /** Returned only once, when a public reservation is created. */
  confirmation_token?: string;
}
