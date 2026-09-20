import { supabase, isSupabaseConfigured } from '../client';
import { LeadItem } from '../../types';

/**
 * Serviço para gerenciamento de leads
 */
export class LeadService {
  /**
   * Obtém todos os leads do usuário atual
   */
  static async getLeads(): Promise<LeadItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        channel: lead.channel,
        createdAt: lead.created_at,
      }));
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('leads')
        .insert({
          profile_id: user.id,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          channel: lead.channel,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || '',
        channel: data.channel,
        createdAt: data.created_at,
      };
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
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('profile_id', user.id)
        .eq('link_id', linkId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data) return [];

      return data.map((lead) => ({
        id: lead.id,
        name: lead.name,
        email: lead.email,
        phone: lead.phone || '',
        channel: lead.channel,
        createdAt: lead.created_at,
      }));
    } catch (error) {
      console.error('Error fetching leads by link:', error);
      return [];
    }
  }

  /**
   * Exporta leads para CSV
   */
  static async exportLeadsToCSV(): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const leads = await this.getLeads();

      const headers = ['Nome', 'Email', 'Telefone', 'Canal', 'Data'];
      const rows = leads.map((lead) => [
        lead.name,
        lead.email,
        lead.phone,
        lead.channel,
        new Date(lead.createdAt).toLocaleDateString('pt-BR'),
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.join(','))].join('\n');

      return csvContent;
    } catch (error) {
      console.error('Error exporting leads:', error);
      return null;
    }
  }
}
