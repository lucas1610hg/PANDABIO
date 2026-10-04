/**
 * Contratos do módulo de agendamentos.
 * Os nomes seguem o formato snake_case retornado pelo Supabase e suas RPCs.
 */

export type AgendamentoSection =
  | 'visao-geral'
  | 'agenda'
  | 'servicos'
  | 'profissionais'
  | 'disponibilidade'
  | 'clientes'
  | 'reservas'
  | 'configuracoes';

export type CalendarView = 'day' | 'week' | 'month';

export interface BookingWorkspace {
  id: string;
  profile_id: string;
  name: string;
  slug: string;
  description?: string;
  timezone: string;
  currency: string;
  language: string;
  active: boolean;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BookingSettings {
  id: string;
  workspace_id: string;
  profile_id: string;
  default_slot_duration: number;
  min_advance_booking: number;
  max_advance_booking: number;
  allow_cancellations: boolean;
  cancellation_hours: number;
  cancellation_policy?: string;
  require_deposit: boolean;
  deposit_percentage: number;
  deposit_fixed_amount?: number;
  payment_methods: string[];
  enable_reminders: boolean;
  reminder_hours: number[];
  reminder_template?: string;
  enable_auto_confirm: boolean;
  require_phone: boolean;
  require_email: boolean;
  buffer_time: number;
  max_daily_bookings?: number;
  max_weekly_bookings?: number;
  no_show_limit: number;
  created_at: string;
  updated_at: string;
}

export interface BookingService {
  id: string;
  workspace_id: string;
  profile_id: string;
  name: string;
  description?: string;
  category?: string;
  color: string;
  duration: number;
  price: number;
  price_display_type: 'fixed' | 'variable' | 'consultation';
  active: boolean;
  requires_deposit: boolean;
  deposit_amount?: number;
  advance_booking_days: number;
  cancellation_hours: number;
  metadata: Record<string, unknown>;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface BookingProfessional {
  id: string;
  workspace_id: string;
  profile_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  specializations: string[];
  active: boolean;
  color: string;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface BookingProfessionalService {
  id: string;
  professional_id: string;
  service_id: string;
  workspace_id: string;
  profile_id: string;
  active: boolean;
  custom_price?: number;
  custom_duration?: number;
  created_at: string;
  updated_at: string;
}

export interface BookingAvailability {
  id: string;
  professional_id: string;
  workspace_id: string;
  profile_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string | null;
  break_end_time?: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface BookingBlockedSlot {
  id: string;
  professional_id?: string;
  workspace_id: string;
  profile_id: string;
  start_date: string;
  end_date: string;
  reason?: string;
  blocked_type: 'vacation' | 'holiday' | 'maintenance' | 'custom';
  created_at: string;
  updated_at: string;
}

export interface BookingClient {
  id: string;
  workspace_id: string;
  profile_id: string;
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
  total_bookings: number;
  total_spent: number;
  last_booking_date?: string;
  no_show_count: number;
  consent_marketing: boolean;
  consent_data_processing: boolean;
  created_at: string;
  updated_at: string;
}

export type BookingStatus =
  'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'no_show' | 'expired';

export type PaymentStatus = 'pending' | 'paid' | 'refunded' | 'partial' | 'cancelled';

export interface BookingAppointment {
  id: string;
  workspace_id: string;
  profile_id: string;
  client_id: string | null;
  professional_id: string;
  service_id: string;
  date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  service_name: string;
  service_duration: number;
  service_price: number;
  professional_name: string;
  status: BookingStatus;
  payment_status: PaymentStatus;
  payment_amount?: number;
  deposit_paid: boolean;
  deposit_amount?: number;
  notes?: string;
  client_notes?: string;
  internal_notes?: string;
  metadata: Record<string, unknown>;
  confirmation_code: string;
  reminder_sent: boolean;
  reminder_count: number;
  created_at: string;
  updated_at: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
  client?: BookingClient;
  professional?: BookingProfessional;
  service?: BookingService;
}

export interface BookingAuditLog {
  id: string;
  workspace_id: string;
  profile_id: string;
  entity_type: 'appointment' | 'client' | 'professional' | 'service' | 'settings';
  entity_id: string;
  action: 'created' | 'updated' | 'deleted' | 'status_changed' | 'cancelled' | 'confirmed';
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  changed_by?: string;
  change_reason?: string;
  ip_address?: string;
  created_at: string;
}

export type NotificationType =
  'reminder' | 'confirmation' | 'cancellation' | 'reschedule' | 'no_show' | 'review';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'cancelled';

export interface BookingNotification {
  id: string;
  workspace_id: string;
  profile_id: string;
  appointment_id?: string;
  client_id?: string;
  professional_id?: string;
  type: NotificationType;
  status: NotificationStatus;
  channels: { email: boolean; sms: boolean; whatsapp: boolean };
  subject?: string;
  content?: string;
  template_id?: string;
  scheduled_for?: string;
  sent_at?: string;
  error_message?: string;
  retry_count: number;
  created_at: string;
  updated_at: string;
}

export interface BookingFilters {
  status?: BookingStatus[];
  professional_id?: string;
  service_id?: string;
  client_id?: string;
  start_date?: string;
  end_date?: string;
}

export interface BookingStats {
  total_appointments: number;
  pending_appointments: number;
  confirmed_appointments: number;
  completed_appointments: number;
  cancelled_appointments: number;
  no_show_appointments: number;
  in_progress_appointments: number;
  expired_appointments: number;
  total_clients: number;
  total_revenue: number;
  active_services: number;
  active_professionals: number;
  occupancy_rate: number;
  cancellation_rate: number;
  no_show_rate: number;
}

export interface CreateBookingData {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  service_id: string;
  professional_id: string;
  date: string;
  start_time: string;
  notes?: string;
}

export interface UpdateBookingData {
  status?: BookingStatus;
  payment_status?: PaymentStatus;
  date?: string;
  start_time?: string;
  notes?: string;
  professional_id?: string;
  service_id?: string;
}

export interface CreateServiceData {
  name: string;
  description?: string;
  category?: string;
  color: string;
  duration: number;
  price: number;
  price_display_type?: 'fixed' | 'variable' | 'consultation';
  requires_deposit?: boolean;
  deposit_amount?: number;
  advance_booking_days?: number;
  cancellation_hours?: number;
}

export interface CreateProfessionalData {
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  specializations: string[];
  color?: string;
}

export interface CreateClientData {
  name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  notes?: string;
  consent_marketing?: boolean;
  consent_data_processing?: boolean;
}

export interface TimeSlot {
  date: string;
  start_time: string;
  end_time: string;
  available: boolean;
  professional_id?: string;
  service_id?: string;
}

export interface PublicBookingAvailability {
  id: string;
  workspace_slug: string;
  professional_id: string;
  professional_name: string;
  professional_avatar?: string;
  service_id: string;
  service_name: string;
  service_description?: string;
  service_duration: number;
  service_price: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  break_start_time?: string;
  break_end_time?: string;
}
