import { supabase, isSupabaseConfigured } from '../client';
import { LeadItem, LeadStatus } from '../../types';
import { ProfileService } from './profileService';

/**
 * Serviço para gerenciamento de leads
 */
export class LeadService {
  private static mapLead(lead: Record<string, unknown>): LeadItem {
    return {
      id: String(lead.id || ''),
      name: String(lead.name || ''),
      email: String(lead.email || ''),
      phone: String(lead.phone || ''),
      channel: String(lead.channel || lead.source || 'Outros'),
      createdAt: String(lead.created_at || new Date().toISOString()),
      status: (lead.status as LeadStatus | undefined) || 'new',
      source: typeof lead.source === 'string' ? lead.source : undefined,
      medium: typeof lead.medium === 'string' ? lead.medium : undefined,
      campaign: typeof lead.campaign === 'string' ? lead.campaign : undefined,
      referrer: typeof lead.referrer === 'string' ? lead.referrer : undefined,
      landingPage: typeof lead.landing_page === 'string' ? lead.landing_page : undefined,
      device:
        lead.device === 'mobile' || lead.device === 'tablet' || lead.device === 'desktop'
          ? lead.device
          : undefined,
      country: typeof lead.country === 'string' ? lead.country : undefined,
      city: typeof lead.city === 'string' ? lead.city : undefined,
      score: typeof lead.score === 'number' ? lead.score : undefined,
      interest:
        lead.interest === 'low' || lead.interest === 'medium' || lead.interest === 'high'
          ? lead.interest
          : undefined,
      firstAccessAt: typeof lead.first_access_at === 'string' ? lead.first_access_at : undefined,
      lastAccessAt: typeof lead.last_access_at === 'string' ? lead.last_access_at : undefined,
      relatedType:
        lead.related_type === 'product' ||
        lead.related_type === 'service' ||
        lead.related_type === 'link'
          ? lead.related_type
          : undefined,
      relatedName: typeof lead.related_name === 'string' ? lead.related_name : undefined,
      linkId: typeof lead.link_id === 'string' ? lead.link_id : undefined,
      consentAt: typeof lead.consent_at === 'string' ? lead.consent_at : undefined,
      visitorId: typeof lead.visitor_id === 'string' ? lead.visitor_id : undefined,
      metadata:
        lead.metadata && typeof lead.metadata === 'object'
          ? Object.fromEntries(
              Object.entries(lead.metadata as Record<string, unknown>).filter(
                ([, value]) => typeof value === 'string',
              ) as [string, string][],
            )
          : undefined,
    };
  }

  /**
   * Obtém todos os leads do usuário atual
   */
  static async getLeads(): Promise<LeadItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('profile_id', profileId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((lead) => this.mapLead(lead as Record<string, unknown>));
    } catch (error) {
      console.error('Error fetching leads:', error);
      return [];
    }
  }

  /**
   * Cria um novo lead
   */
  static async createLead(lead: Omit<LeadItem, 'id' | 'createdAt'>): Promise<LeadItem | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return null;

      const { data, error } = await supabase
        .from('leads')
        .insert({
          profile_id: profileId,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          channel: lead.channel,
          status: lead.status || 'new',
          source: lead.source || lead.channel,
          medium: lead.medium,
          campaign: lead.campaign,
          referrer: lead.referrer,
          landing_page: lead.landingPage,
          device: lead.device,
          country: lead.country,
          city: lead.city,
          score: lead.score ?? 70,
          interest: lead.interest || 'low',
          first_access_at: lead.firstAccessAt,
          last_access_at: lead.lastAccessAt,
          related_type: lead.relatedType,
          related_name: lead.relatedName,
          consent_at: lead.consentAt,
          visitor_id: lead.visitorId,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return this.mapLead(data as Record<string, unknown>);
    } catch (error) {
      console.error('Error creating lead:', error);
      return null;
    }
  }

  /**
   * Obtém leads por link específico
   */
  static async getLeadsByLink(linkId: string): Promise<LeadItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const profileId = await ProfileService.getCurrentProfileId();
      if (!profileId) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('profile_id', profileId)
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((lead) => this.mapLead(lead as Record<string, unknown>));
    } catch (error) {
      console.error('Error fetching leads by link:', error);
      return [];
    }
  }

  static async updateLead(id: string, updates: Partial<LeadItem>): Promise<LeadItem | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const payload = {
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        channel: updates.channel,
        status: updates.status,
        source: updates.source,
        medium: updates.medium,
        campaign: updates.campaign,
        referrer: updates.referrer,
        landing_page: updates.landingPage,
        device: updates.device,
        country: updates.country,
        city: updates.city,
        score: updates.score,
        interest: updates.interest,
        first_access_at: updates.firstAccessAt,
        last_access_at: updates.lastAccessAt,
        related_type: updates.relatedType,
        related_name: updates.relatedName,
        consent_at: updates.consentAt,
      };
      const cleanPayload = Object.fromEntries(
        Object.entries(payload).filter(([, value]) => value !== undefined),
      );
      const { data, error } = await supabase
        .from('leads')
        .update(cleanPayload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data ? this.mapLead(data as Record<string, unknown>) : null;
    } catch (error) {
      console.error('Error updating lead:', error);
      return null;
    }
  }

  static async deleteLead(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase.from('leads').delete().eq('id', id);
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting lead:', error);
      return false;
    }
  }

  /**
   * Exporta leads para CSV
   */
  static async exportLeadsToCSV(): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const leads = await this.getLeads();

      const rows = leads.map((lead) => [
        lead.name,
        lead.email,
        lead.phone,
        lead.source || lead.channel,
        lead.relatedName || '',
        lead.status || 'new',
        lead.score ?? '',
        new Date(lead.createdAt).toLocaleDateString('pt-BR'),
      ]);

      const csvContent = [
        ['Nome', 'Email', 'Telefone', 'Origem', 'Interesse', 'Status', 'Score', 'Data'].join(';'),
        ...rows.map((row) =>
          row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(';'),
        ),
      ].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting leads:', error);
      return null;
    }
  }
}
