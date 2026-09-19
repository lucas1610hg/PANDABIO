import { supabase, isSupabaseConfigured } from '../client';
import { UserProfile } from '../../types';

/**
 * Serviço para gerenciamento de perfis de usuário
 */
export class ProfileService {
  /**
   * Obtém o perfil do usuário atual
   */
  static async getCurrentProfile(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        name: data.name,
        username: data.username,
        email: data.email,
        plan: data.plan,
        bioUrl: data.bio_url,
        pageTitle: data.page_title,
        bioDescription: data.bio_description || '',
        avatarUrl: data.avatar_url || '',
      };
    } catch (error) {
      console.error('Error fetching profile:', error);
      return null;
    }
  }

  /**
   * Cria ou atualiza o perfil do usuário
   */
  static async upsertProfile(profile: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!isSupabaseConfigured()) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          user_id: user.id,
          name: profile.name || '',
          username: profile.username || '',
          email: profile.email || '',
          plan: profile.plan || 'Gratuito',
          bio_url: profile.bioUrl || '',
          page_title: profile.pageTitle || '',
          bio_description: profile.bioDescription,
          avatar_url: profile.avatarUrl,
        })
        .select()
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        name: data.name,
        username: data.username,
        email: data.email,
        plan: data.plan,
        bioUrl: data.bio_url,
        pageTitle: data.page_title,
        bioDescription: data.bio_description || '',
        avatarUrl: data.avatar_url || '',
      };
    } catch (error) {
      console.error('Error upserting profile:', error);
      return null;
    }
  }

  /**
   * Atualiza o plano do usuário para PRO
   */
  static async upgradeToPro(): Promise<boolean> {
    if (!isSupabaseConfigured()) return false;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'PRO' })
        .eq('user_id', user.id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error upgrading to PRO:', error);
      return false;
    }
  }

  /**
   * Obtém todos os perfis (para admins)
   */
  static async getAllProfiles(): Promise<UserProfile[]> {
    if (!isSupabaseConfigured()) return [];

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');

      if (error) throw error;
      if (!data) return [];

      return data.map(profile => ({
        name: profile.name,
        username: profile.username,
        email: profile.email,
        plan: profile.plan,
        bioUrl: profile.bio_url,
        pageTitle: profile.page_title,
        bioDescription: profile.bio_description || '',
        avatarUrl: profile.avatar_url || '',
      }));
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
  }
}