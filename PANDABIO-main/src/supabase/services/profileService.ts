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
    if (!isSupabaseConfigured() || !supabase) return null;

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
        coverUrl: data.cover_url || undefined,
        category: data.category || undefined,
        location: data.location || undefined,
        customLink: data.custom_link || undefined,
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
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const row = {
        user_id: user.id,
        name: profile.name || '',
        username: profile.username || '',
        email: profile.email || '',
        plan: profile.plan || 'Gratuito',
        bio_url: profile.bioUrl || '',
        page_title: profile.pageTitle || '',
        bio_description: profile.bioDescription,
        avatar_url: profile.avatarUrl,
        cover_url: profile.coverUrl,
        category: profile.category || null,
        location: profile.location || null,
        custom_link: profile.customLink || null,
      };

      // Correção: `upsert` com user_id requeria uma constraint UNIQUE em user_id.
      // Sem ela, cada chamada criava um NOVO registro duplicado. Agora atualiza
      // pelo user_id e, caso o perfil ainda não exista, faz o insert.
      const { data: existing, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selectError) throw selectError;

      let data;
      if (existing?.id) {
        const { data: updated, error } = await supabase
          .from('profiles')
          .update(row)
          .eq('user_id', user.id)
          .select()
          .single();
        if (error) throw error;
        data = updated;
      } else {
        const { data: inserted, error } = await supabase
          .from('profiles')
          .insert(row)
          .select()
          .single();
        if (error) throw error;
        data = inserted;
      }

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
        coverUrl: data.cover_url || undefined,
        category: data.category || undefined,
        location: data.location || undefined,
        customLink: data.custom_link || undefined,
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
    if (!isSupabaseConfigured() || !supabase) return false;

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
    if (!isSupabaseConfigured() || !supabase) return [];

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
        coverUrl: profile.cover_url || undefined,
      }));
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
  }
}