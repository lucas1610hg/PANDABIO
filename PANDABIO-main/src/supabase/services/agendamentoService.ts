// =============================================================
// PANDABIO — MÓDULO AGENDAMENTOS: SUPABASE SERVICE
// Versão: 1.0
// Integração com o banco de dados via RPC functions
// =============================================================

import { supabase, isSupabaseConfigured } from '../client';
import { ProfileService } from './profileService';
import {
  BookingWorkspace,
  BookingSettings,
  BookingService,
  BookingProfessional,
  BookingProfessionalService,
  BookingAvailability,
  BookingBlockedSlot,
  BookingClient,
  BookingAppointment,
  BookingFilters,
  BookingStats,
  CreateBookingData,
  CreateServiceData,
  CreateProfessionalData,
  CreateClientData,
  TimeSlot,
  PublicBookingAvailability,
} from '../../types_agendamentos';

const workspaceCache = new Map<string, BookingWorkspace[]>();
const workspaceRequests = new Map<string, Promise<BookingWorkspace[]>>();
const catalogCacheTtl = 30_000;
const settingsCache = new Map<string, { data: BookingSettings | null; expiresAt: number }>();
const settingsRequests = new Map<string, Promise<BookingSettings | null>>();
const servicesCache = new Map<string, { data: BookingService[]; expiresAt: number }>();
const servicesRequests = new Map<string, Promise<BookingService[]>>();
const professionalsCache = new Map<string, { data: BookingProfessional[]; expiresAt: number }>();
const professionalsRequests = new Map<string, Promise<BookingProfessional[]>>();
const statsCache = new Map<string, { data: BookingStats; expiresAt: number }>();
const statsRequests = new Map<string, Promise<BookingStats>>();
const publicAvailabilityCache = new Map<
  string,
  { data: PublicBookingAvailability[]; expiresAt: number }
>();
const publicAvailabilityRequests = new Map<string, Promise<PublicBookingAvailability[]>>();

function clearBookingCatalogCache(): void {
  settingsCache.clear();
  servicesCache.clear();
  professionalsCache.clear();
  publicAvailabilityCache.clear();
}

function clearBookingStatsCache(): void {
  statsCache.clear();
}

function getBookingErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;

  if (typeof error === 'object' && error !== null) {
    const supabaseError = error as {
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      code?: unknown;
    };
    const parts = [supabaseError.message, supabaseError.details, supabaseError.hint]
      .filter((part): part is string => typeof part === 'string' && part.trim().length > 0)
      .map((part) => part.trim());

    if (typeof supabaseError.code === 'string' && supabaseError.code.trim()) {
      parts.push(`código ${supabaseError.code.trim()}`);
    }

    if (parts.length > 0) return parts.join(' — ');
  }

  return 'Erro desconhecido ao criar reserva';
}

// ============================================
// WORKSPACE SERVICE
// ============================================
export class WorkspaceService {
  static async getWorkspaces(): Promise<BookingWorkspace[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return [];

      const cachedWorkspaces = workspaceCache.get(profileId);
      if (cachedWorkspaces) return cachedWorkspaces;

      const pendingRequest = workspaceRequests.get(profileId);
      if (pendingRequest) return pendingRequest;

      const request = this.loadWorkspaces(profileId);
      workspaceRequests.set(profileId, request);

      try {
        const workspaces = await request;
        workspaceCache.set(profileId, workspaces);
        return workspaces;
      } finally {
        workspaceRequests.delete(profileId);
      }
    } catch (error) {
      console.error('Error fetching workspaces:', error);
      return [];
    }
  }

  private static async loadWorkspaces(profileId: string): Promise<BookingWorkspace[]> {
    if (!supabase) return [];

    const { data, error } = await supabase
      .from('booking_workspaces')
      .select('*')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (data && data.length > 0) return data;

    const workspace = await this.getOrCreateWorkspace();
    return workspace ? [workspace] : [];
  }

  static async createWorkspace(
    workspace: Omit<BookingWorkspace, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BookingWorkspace | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('booking_workspaces')
        .insert(workspace)
        .select()
        .single();

      if (error) throw error;
      workspaceCache.delete(workspace.profile_id);
      return data;
    } catch (error) {
      console.error('Error creating workspace:', error);
      return null;
    }
  }

  static async getOrCreateWorkspace(): Promise<BookingWorkspace | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase.rpc('create_booking_workspace', {
        p_name: null,
        p_slug: null,
        p_description: null,
        p_timezone: 'America/Sao_Paulo',
        p_currency: 'BRL',
        p_language: 'pt-BR',
      });

      const workspaceFromRpc = Array.isArray(data) ? data[0] : data;
      if (!error && workspaceFromRpc) return workspaceFromRpc;

      if (error) {
        console.warn('Workspace onboarding RPC unavailable; using direct fallback:', error.message);
      }

      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data: existingWorkspaces, error: existingError } = await supabase
        .from('booking_workspaces')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: true })
        .limit(1);

      if (existingError) throw existingError;
      if (existingWorkspaces?.[0]) {
        await this.ensureSettings(existingWorkspaces[0]);
        return existingWorkspaces[0];
      }

      const workspace = await this.createWorkspace({
        profile_id: profileId,
        name: 'Meu negocio',
        slug: `agenda-${profileId.replace(/-/g, '').slice(0, 12)}`,
        description: undefined,
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        language: 'pt-BR',
        active: true,
        settings: {},
      });

      if (!workspace) return null;

      try {
        await this.ensureSettings(workspace);
        return workspace;
      } catch (settingsError) {
        await supabase.from('booking_workspaces').delete().eq('id', workspace.id);
        throw settingsError;
      }
    } catch (error) {
      console.error('Error ensuring booking workspace:', error);
      return null;
    }
  }

  private static async ensureSettings(workspace: BookingWorkspace): Promise<void> {
    if (!supabase) throw new Error('Supabase not configured');

    const { data, error } = await supabase
      .from('booking_settings')
      .select('id')
      .eq('workspace_id', workspace.id)
      .maybeSingle();

    if (error) throw error;
    if (data) return;

    const { error: insertError } = await supabase.from('booking_settings').insert({
      workspace_id: workspace.id,
      profile_id: workspace.profile_id,
    });

    if (insertError) throw insertError;
  }
}

// ============================================
// SETTINGS SERVICE
// ============================================
export class SettingsService {
  static async getSettings(workspaceId: string): Promise<BookingSettings | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    const cached = settingsCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pendingRequest = settingsRequests.get(workspaceId);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
      try {
        const { data, error } = await supabase
          .from('booking_settings')
          .select('*')
          .eq('workspace_id', workspaceId)
          .single();

        if (error) throw error;
        settingsCache.set(workspaceId, { data, expiresAt: Date.now() + catalogCacheTtl });
        return data;
      } catch (error) {
        console.error('Error fetching settings:', error);
        return null;
      }
    })();

    settingsRequests.set(workspaceId, request);

    try {
      return await request;
    } finally {
      settingsRequests.delete(workspaceId);
    }
  }

  static async updateSettings(
    workspaceId: string,
    updates: Partial<BookingSettings>,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_settings')
        .update(updates)
        .eq('workspace_id', workspaceId);

      if (error) throw error;
      settingsCache.delete(workspaceId);
      return true;
    } catch (error) {
      console.error('Error updating settings:', error);
      return false;
    }
  }
}

// ============================================
// SERVICE SERVICE
// ============================================
export class ServiceService {
  static async getServices(workspaceId: string): Promise<BookingService[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const cached = servicesCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pendingRequest = servicesRequests.get(workspaceId);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
      try {
        const { data, error } = await supabase
          .from('booking_services')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('sort_order', { ascending: true });

        if (error) throw error;
        const services = Array.isArray(data) ? (data as BookingService[]) : [];
        servicesCache.set(workspaceId, { data: services, expiresAt: Date.now() + catalogCacheTtl });
        return services;
      } catch (error) {
        console.error('Error fetching services:', error);
        return [];
      }
    })();

    servicesRequests.set(workspaceId, request);
    try {
      return await request;
    } finally {
      servicesRequests.delete(workspaceId);
    }
  }

  static async createService(
    workspaceId: string,
    service: CreateServiceData,
  ): Promise<BookingService | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('booking_services')
        .insert({
          workspace_id: workspaceId,
          profile_id: profileId,
          ...service,
        })
        .select()
        .single();

      if (error) throw error;
      clearBookingCatalogCache();
      return data;
    } catch (error) {
      console.error('Error creating service:', error);
      return null;
    }
  }

  static async updateService(
    serviceId: string,
    updates: Partial<BookingService>,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('booking_services').update(updates).eq('id', serviceId);

      if (error) throw error;
      clearBookingCatalogCache();
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      return false;
    }
  }

  static async deleteService(serviceId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('booking_services').delete().eq('id', serviceId);

      if (error) throw error;
      clearBookingCatalogCache();
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      return false;
    }
  }
}

// ============================================
// PROFESSIONAL SERVICE
// ============================================
export class ProfessionalService {
  static async getProfessionals(workspaceId: string): Promise<BookingProfessional[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const cached = professionalsCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pendingRequest = professionalsRequests.get(workspaceId);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
      try {
        const { data, error } = await supabase
          .from('booking_professionals')
          .select('*')
          .eq('workspace_id', workspaceId)
          .order('created_at', { ascending: false });

        if (error) throw error;
        const professionals = data || [];
        professionalsCache.set(workspaceId, {
          data: professionals,
          expiresAt: Date.now() + catalogCacheTtl,
        });
        return professionals;
      } catch (error) {
        console.error('Error fetching professionals:', error);
        return [];
      }
    })();

    professionalsRequests.set(workspaceId, request);
    try {
      return await request;
    } finally {
      professionalsRequests.delete(workspaceId);
    }
  }

  static async createProfessional(
    workspaceId: string,
    professional: CreateProfessionalData,
  ): Promise<BookingProfessional | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('booking_professionals')
        .insert({
          workspace_id: workspaceId,
          profile_id: profileId,
          ...professional,
        })
        .select()
        .single();

      if (error) throw error;
      clearBookingCatalogCache();
      return data;
    } catch (error) {
      console.error('Error creating professional:', error);
      return null;
    }
  }

  static async updateProfessional(
    professionalId: string,
    updates: Partial<BookingProfessional>,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_professionals')
        .update(updates)
        .eq('id', professionalId);

      if (error) throw error;
      clearBookingCatalogCache();
      return true;
    } catch (error) {
      console.error('Error updating professional:', error);
      return false;
    }
  }

  static async deleteProfessional(professionalId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_professionals')
        .delete()
        .eq('id', professionalId);

      if (error) throw error;
      clearBookingCatalogCache();
      return true;
    } catch (error) {
      console.error('Error deleting professional:', error);
      return false;
    }
  }

  static async getProfessionalServices(
    professionalId: string,
  ): Promise<BookingProfessionalService[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('booking_professional_services')
        .select('*')
        .eq('professional_id', professionalId)
        .eq('active', true);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching professional services:', error);
      return [];
    }
  }

  static async syncProfessionalServices(
    professionalId: string,
    workspaceId: string,
    profileId: string,
    serviceIds: string[],
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { data: currentServices, error: currentError } = await supabase
        .from('booking_professional_services')
        .select('service_id')
        .eq('professional_id', professionalId);

      if (currentError) throw currentError;

      const selectedIds = [...new Set(serviceIds)];
      const currentIds = (currentServices || []).map((item) => item.service_id as string);
      const removedIds = currentIds.filter((serviceId) => !selectedIds.includes(serviceId));

      if (removedIds.length > 0) {
        const { error: deleteError } = await supabase
          .from('booking_professional_services')
          .delete()
          .eq('professional_id', professionalId)
          .in('service_id', removedIds);

        if (deleteError) throw deleteError;
      }

      if (selectedIds.length > 0) {
        const { error: upsertError } = await supabase.from('booking_professional_services').upsert(
          selectedIds.map((serviceId) => ({
            professional_id: professionalId,
            service_id: serviceId,
            workspace_id: workspaceId,
            profile_id: profileId,
            active: true,
          })),
          { onConflict: 'professional_id,service_id' },
        );

        if (upsertError) throw upsertError;
      }

      return true;
    } catch (error) {
      console.error('Error syncing professional services:', error);
      return false;
    }
  }
}

// ============================================
// AVAILABILITY SERVICE
// ============================================
export class AvailabilityService {
  static async getAvailability(professionalId: string): Promise<BookingAvailability[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('booking_availability')
        .select('*')
        .eq('professional_id', professionalId)
        .order('day_of_week', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching availability:', error);
      return [];
    }
  }

  static async createAvailability(
    availability: Omit<BookingAvailability, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BookingAvailability | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('booking_availability')
        .insert(availability)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating availability:', error);
      return null;
    }
  }

  static async updateAvailability(
    availabilityId: string,
    updates: Partial<BookingAvailability>,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_availability')
        .update(updates)
        .eq('id', availabilityId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating availability:', error);
      return false;
    }
  }

  static async deleteAvailability(availabilityId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_availability')
        .delete()
        .eq('id', availabilityId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting availability:', error);
      return false;
    }
  }

  static async getBlockedSlots(professionalId?: string): Promise<BookingBlockedSlot[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      let query = supabase
        .from('booking_blocked_slots')
        .select('*')
        .order('start_date', { ascending: true });

      if (professionalId) {
        query = query.eq('professional_id', professionalId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching blocked slots:', error);
      return [];
    }
  }

  static async createBlockedSlot(
    blockedSlot: Omit<BookingBlockedSlot, 'id' | 'created_at' | 'updated_at'>,
  ): Promise<BookingBlockedSlot | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase
        .from('booking_blocked_slots')
        .insert(blockedSlot)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating blocked slot:', error);
      return null;
    }
  }

  static async deleteBlockedSlot(blockedSlotId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('booking_blocked_slots')
        .delete()
        .eq('id', blockedSlotId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting blocked slot:', error);
      return false;
    }
  }
}

// ============================================
// CLIENT SERVICE
// ============================================
export class ClientService {
  static async getClients(workspaceId: string): Promise<BookingClient[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data, error } = await supabase
        .from('booking_clients')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching clients:', error);
      return [];
    }
  }

  static async createClient(
    workspaceId: string,
    client: CreateClientData,
  ): Promise<BookingClient | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('booking_clients')
        .insert({
          workspace_id: workspaceId,
          profile_id: profileId,
          ...client,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating client:', error);
      return null;
    }
  }

  static async updateClient(clientId: string, updates: Partial<BookingClient>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('booking_clients').update(updates).eq('id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating client:', error);
      return false;
    }
  }

  static async deleteClient(clientId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('booking_clients').delete().eq('id', clientId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting client:', error);
      return false;
    }
  }
}

// ============================================
// APPOINTMENT SERVICE
// ============================================
export class AppointmentService {
  static async getAppointments(
    workspaceId: string,
    filters?: BookingFilters,
  ): Promise<BookingAppointment[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      let query = supabase
        .from('booking_appointments')
        .select(
          `
          *,
          client:booking_clients(*),
          professional:booking_professionals(*),
          service:booking_services(*)
        `,
        )
        .eq('workspace_id', workspaceId)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (filters?.status && filters.status.length > 0) {
        query = query.in('status', filters.status);
      }
      if (filters?.professional_id) {
        query = query.eq('professional_id', filters.professional_id);
      }
      if (filters?.service_id) {
        query = query.eq('service_id', filters.service_id);
      }
      if (filters?.client_id) {
        query = query.eq('client_id', filters.client_id);
      }
      if (filters?.start_date) {
        query = query.gte('date', filters.start_date);
      }
      if (filters?.end_date) {
        query = query.lte('date', filters.end_date);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching appointments:', error);
      return [];
    }
  }

  static async createBooking(
    workspaceSlug: string,
    booking: CreateBookingData,
  ): Promise<BookingAppointment | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data, error } = await supabase.rpc('create_booking', {
        p_workspace_slug: workspaceSlug,
        p_client_name: booking.client_name,
        p_client_email: booking.client_email || null,
        p_client_phone: booking.client_phone || null,
        p_service_id: booking.service_id,
        p_professional_id: booking.professional_id,
        p_date: booking.date,
        p_start_time: booking.start_time,
        p_notes: booking.notes || null,
      });

      if (error) throw error;

      if (!data?.success) {
        throw new Error(data?.error || 'A reserva foi recusada pelo Supabase');
      }

      if (!data.appointment_id) {
        throw new Error('Supabase criou resposta sem ID da reserva');
      }

      const createdAppointment: BookingAppointment = {
        id: data.appointment_id,
        workspace_id: '',
        profile_id: '',
        client_id: null,
        professional_id: booking.professional_id,
        service_id: booking.service_id,
        date: booking.date,
        start_time: booking.start_time,
        end_time: data.end_time,
        timezone: 'America/Sao_Paulo',
        service_name: '',
        service_duration: data.duration,
        service_price: data.price,
        professional_name: '',
        status: 'pending',
        payment_status: 'pending',
        deposit_paid: false,
        metadata: {},
        confirmation_code: data.confirmation_code,
        reminder_sent: false,
        reminder_count: 0,
        notes: booking.notes,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Buscar o agendamento criado
      const { data: appointment, error: appointmentError } = await supabase
        .from('booking_appointments')
        .select(
          '*, client:booking_clients(*), professional:booking_professionals(*), service:booking_services(*)',
        )
        .eq('id', data.appointment_id)
        .single();

      if (appointmentError || !appointment) {
        clearBookingStatsCache();
        return createdAppointment;
      }

      clearBookingStatsCache();
      return appointment;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw new Error(getBookingErrorMessage(error));
    }
  }

  static async confirmBooking(appointmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.rpc('confirm_booking', {
        p_appointment_id: appointmentId,
      });

      if (error) throw error;
      clearBookingStatsCache();
      return true;
    } catch (error) {
      console.error('Error confirming booking:', error);
      return false;
    }
  }

  static async cancelBooking(appointmentId: string, reason?: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.rpc('cancel_booking', {
        p_appointment_id: appointmentId,
        p_reason: reason,
      });

      if (error) throw error;
      clearBookingStatsCache();
      return true;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      return false;
    }
  }

  static async rescheduleBooking(
    appointmentId: string,
    newDate: string,
    newStartTime: string,
  ): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { data, error } = await supabase.rpc('reschedule_booking', {
        p_appointment_id: appointmentId,
        p_new_date: newDate,
        p_new_start_time: newStartTime,
      });

      if (error) throw error;
      if (data.success) clearBookingStatsCache();
      return data.success;
    } catch (error) {
      console.error('Error rescheduling booking:', error);
      return false;
    }
  }

  static async getAvailableSlots(
    workspaceSlug: string,
    serviceId: string,
    professionalId: string,
    startDate: string,
    endDate: string,
  ): Promise<TimeSlot[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data, error } = await supabase.rpc('get_available_slots', {
        p_workspace_slug: workspaceSlug,
        p_service_id: serviceId,
        p_professional_id: professionalId,
        p_start_date: startDate,
        p_end_date: endDate,
      });

      if (error) throw error;
      return Array.isArray(data) ? (data as TimeSlot[]) : [];
    } catch (error) {
      console.error('Error fetching available slots:', error);
      return [];
    }
  }

  static async markNoShow(appointmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.rpc('mark_no_show', {
        p_appointment_id: appointmentId,
      });

      if (error) throw error;
      clearBookingStatsCache();
      return true;
    } catch (error) {
      console.error('Error marking no-show:', error);
      return false;
    }
  }

  static async completeBooking(appointmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.rpc('complete_booking', {
        p_appointment_id: appointmentId,
      });

      if (error) throw error;
      clearBookingStatsCache();
      return true;
    } catch (error) {
      console.error('Error completing booking:', error);
      return false;
    }
  }

  static async startBooking(appointmentId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.rpc('start_booking', {
        p_appointment_id: appointmentId,
      });

      if (error) throw error;
      clearBookingStatsCache();
      return true;
    } catch (error) {
      console.error('Error starting booking:', error);
      return false;
    }
  }
}

// ============================================
// STATS SERVICE
// ============================================
export class StatsService {
  static async getWorkspaceStats(workspaceId: string): Promise<BookingStats> {
    if (!isSupabaseConfigured() || !supabase) {
      return {
        total_appointments: 0,
        pending_appointments: 0,
        confirmed_appointments: 0,
        completed_appointments: 0,
        cancelled_appointments: 0,
        no_show_appointments: 0,
        total_clients: 0,
        total_revenue: 0,
        active_services: 0,
        active_professionals: 0,
        occupancy_rate: 0,
        cancellation_rate: 0,
        no_show_rate: 0,
      };
    }

    const cached = statsCache.get(workspaceId);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pendingRequest = statsRequests.get(workspaceId);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
      try {
        const { data, error } = await supabase.rpc('get_workspace_stats', {
          p_workspace_id: workspaceId,
        });

        if (error) throw error;
        statsCache.set(workspaceId, { data, expiresAt: Date.now() + catalogCacheTtl });
        return data;
      } catch (error) {
        console.error('Error fetching workspace stats:', error);
        return {
          total_appointments: 0,
          pending_appointments: 0,
          confirmed_appointments: 0,
          completed_appointments: 0,
          cancelled_appointments: 0,
          no_show_appointments: 0,
          total_clients: 0,
          total_revenue: 0,
          active_services: 0,
          active_professionals: 0,
          occupancy_rate: 0,
          cancellation_rate: 0,
          no_show_rate: 0,
        };
      }
    })();

    statsRequests.set(workspaceId, request);

    try {
      return await request;
    } finally {
      statsRequests.delete(workspaceId);
    }
  }
}

// ============================================
// PUBLIC AVAILABILITY
// ============================================
export class PublicAvailabilityService {
  static async getPublicAvailability(workspaceSlug: string): Promise<PublicBookingAvailability[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    const cached = publicAvailabilityCache.get(workspaceSlug);
    if (cached && cached.expiresAt > Date.now()) return cached.data;

    const pendingRequest = publicAvailabilityRequests.get(workspaceSlug);
    if (pendingRequest) return pendingRequest;

    const request = (async () => {
      try {
        const { data, error } = await supabase
          .from('public_booking_availability')
          .select('*')
          .eq('workspace_slug', workspaceSlug);

        if (error) throw error;
        const availability = data || [];
        publicAvailabilityCache.set(workspaceSlug, {
          data: availability,
          expiresAt: Date.now() + catalogCacheTtl,
        });
        return availability;
      } catch (error) {
        console.error('Error fetching public availability:', error);
        return [];
      }
    })();

    publicAvailabilityRequests.set(workspaceSlug, request);

    try {
      return await request;
    } finally {
      publicAvailabilityRequests.delete(workspaceSlug);
    }
  }

  static async checkAvailability(
    workspaceSlug: string,
    serviceId: string,
    professionalId: string,
    date: string,
    startTime: string,
  ): Promise<{ available: boolean; end_time?: string; duration?: number; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { available: false, error: 'Supabase not configured' };
    }

    try {
      const { data, error } = await supabase.rpc('check_availability', {
        p_workspace_slug: workspaceSlug,
        p_service_id: serviceId,
        p_professional_id: professionalId,
        p_date: date,
        p_start_time: startTime,
      });

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error checking availability:', error);
      return { available: false, error: 'Error checking availability' };
    }
  }
}
