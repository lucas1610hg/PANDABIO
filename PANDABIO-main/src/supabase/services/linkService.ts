import { supabase, isSupabaseConfigured } from '../client';
import { BioLink } from '../../types';

/**
 * Serviço para gerenciamento de links
 */
export class LinkService {
  /**
   * Obtém todos os links do usuário atual
   */
  static async getLinks(): Promise<BioLink[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('links')
        .select('*')
        .eq('profile_id', user.id)
        .order('link_order', { ascending: true });

      if (error) throw error;
      if (!data) return [];

      return data.map(link => ({
        id: link.id,
        title: link.title,
        url: link.url,
        clicks: link.clicks,
        leads: link.leads,
        active: link.active,
        icon: link.icon,
        type: link.type,
      }));
    } catch (error) {
      console.error('Error fetching links:', error);
      return [];
    }
  }

  /**
   * Cria um novo link
   */
  static async createLink(link: Omit<BioLink, 'id'>): Promise<BioLink | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // Obter o maior link_order atual
      const { data: existingLinks } = await supabase
        .from('links')
        .select('link_order')
        .eq('profile_id', user.id)
        .order('link_order', { ascending: false })
        .limit(1);

      const nextOrder = existingLinks && existingLinks.length > 0 ? existingLinks[0].link_order + 1 : 0;

      const { data, error } = await supabase
        .from('links')
        .insert({
          profile_id: user.id,
          title: link.title,
          url: link.url,
          clicks: link.clicks,
          leads: link.leads,
          active: link.active,
          icon: link.icon,
          type: link.type,
          link_order: nextOrder,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        title: data.title,
        url: data.url,
        clicks: data.clicks,
        leads: data.leads,
        active: data.active,
        icon: data.icon,
        type: data.type,
      };
    } catch (error) {
      console.error('Error creating link:', error);
      return null;
    }
  }

  /**
   * Atualiza um link existente
   */
  static async updateLink(id: string, updates: Partial<BioLink>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('links')
        .update({
          title: updates.title,
          url: updates.url,
          active: updates.active,
          icon: updates.icon,
          type: updates.type,
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error updating link:', error);
      return false;
    }
  }

  /**
   * Alterna o status ativo de um link
   */
  static async toggleLink(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      // Tenta RPC atômica primeiro (se a migration T4 foi aplicada no banco)
      try {
        const { data, error: rpcError } = await supabase.rpc('toggle_link_status', { link_id: id });
        if (!rpcError) return Boolean(data);
      } catch {
        // Fallthrough: RPC não existe, segue read-then-write manual
      }

      // Fallback: lê o estado atual e INVERTE (nunca hardcode true)
      const { data: current, error: readErr } = await supabase
        .from('links')
        .select('active')
        .eq('id', id)
        .single();

      if (readErr) throw readErr;
      if (!current) return false;

      const { error } = await supabase
        .from('links')
        .update({
          active: !current.active,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error toggling link:', error);
      return false;
    }
  }

  /**
   * Reordena links
   */
  static async reorderLinks(linkIds: string[]): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const updates = linkIds.map((id, index) => ({
        id,
        link_order: index,
      }));

      const { error } = await supabase
        .from('links')
        .upsert(updates);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error reordering links:', error);
      return false;
    }
  }

  /**
   * Deleta um link
   */
  static async deleteLink(id: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { error } = await supabase
        .from('links')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting link:', error);
      return false;
    }
  }

  /**
   * Registra um clique em um link
   */
  static async registerClick(linkId: string): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      // Incrementar contador de cliques
      const { error: clickError } = await supabase.rpc('increment_link_clicks', {
        link_id: linkId,
      });

      if (clickError) {
        // Fallback se a função não existir - buscar valor atual e incrementar
        const { data: currentLink } = await supabase
          .from('links')
          .select('clicks')
          .eq('id', linkId)
          .single();
        
        if (currentLink) {
          const { error } = await supabase
            .from('links')
            .update({ clicks: (currentLink.clicks || 0) + 1 })
            .eq('id', linkId);
          if (error) throw error;
        }
      }

      // Registrar evento de analytics
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('analytics').insert({
          profile_id: user.id,
          link_id: linkId,
          event_type: 'click',
          device_type: this.getDeviceType(),
        });
      }

      return true;
    } catch (error) {
      console.error('Error registering click:', error);
      return false;
    }
  }

  private static getDeviceType(): 'mobile' | 'desktop' | 'tablet' {
    const userAgent = navigator.userAgent;
    if (/tablet|ipad|playbook|silk/i.test(userAgent)) return 'tablet';
    if (/mobile|android|iphone|ipod/i.test(userAgent)) return 'mobile';
    return 'desktop';
  }
}