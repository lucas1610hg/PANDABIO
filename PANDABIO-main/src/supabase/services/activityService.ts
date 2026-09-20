import { supabase, isSupabaseConfigured } from '../client';
import { ActivityItem } from '../../types';

/**
 * Serviço para gerenciamento de atividades
 */
export class ActivityService {
  /**
   * Obtém todas as atividades do usuário atual
   */
  static async getActivities(limit: number = 20): Promise<ActivityItem[]> {
    if (!isSupabaseConfigured() || !supabase) return [];

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('activities')
        .select('*')
        .eq('profile_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      if (!data) return [];

      return data.map(activity => ({
        id: activity.id,
        title: activity.title,
        subtitle: activity.subtitle,
        timeAgo: activity.time_ago,
        type: activity.type,
        timestamp: activity.timestamp,
      }));
    } catch (error) {
      console.error('Error fetching activities:', error);
      return [];
    }
  }

  /**
   * Cria uma nova atividade
   */
  static async createActivity(activity: Omit<ActivityItem, 'id'>): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('activities')
        .insert({
          profile_id: user.id,
          title: activity.title,
          subtitle: activity.subtitle,
          time_ago: activity.timeAgo,
          type: activity.type,
          timestamp: activity.timestamp,
        });

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error creating activity:', error);
      return false;
    }
  }

  /**
   * Cria atividade de novo link
   */
  static async logNewLink(linkTitle: string): Promise<boolean> {
    return this.createActivity({
      title: `Novo link adicionado: ${linkTitle}`,
      subtitle: 'Publicado na bio',
      timeAgo: 'agora',
      type: 'clicks',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cria atividade de novo produto
   */
  static async logNewProduct(productName: string, price: number): Promise<boolean> {
    return this.createActivity({
      title: `Novo produto criado: ${productName}`,
      subtitle: `R$ ${price.toFixed(2)}`,
      timeAgo: 'agora',
      type: 'order',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Cria atividade de novo lead
   */
  static async logNewLead(leadName: string): Promise<boolean> {
    return this.createActivity({
      title: `Novo lead capturado: ${leadName}`,
      subtitle: 'Contato recebido',
      timeAgo: 'agora',
      type: 'lead',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Limpa atividades antigas (manutenção)
   */
  static async cleanupOldActivities(daysToKeep: number = 30): Promise<boolean> {
    if (!isSupabaseConfigured() || !supabase) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const { error } = await supabase
        .from('activities')
        .delete()
        .eq('profile_id', user.id)
        .lt('created_at', cutoffDate.toISOString());

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error cleaning up activities:', error);
      return false;
    }
  }
}