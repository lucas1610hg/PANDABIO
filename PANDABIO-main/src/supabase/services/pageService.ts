import { supabase, isSupabaseConfigured } from '../client';
import { PageData, UserProfile } from '../../types';

export class PageService {
  /**
   * Salvar dados da página do usuário
   */
  static async savePageData(userId: string, pageData: PageData): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!userId || userId === 'undefined') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    try {
      // Persistir as colunas do perfil (evita dados duplicados entre perfil e page_data JSONB)
      const profile = pageData.profile;
      const profileUpdates: Record<string, unknown> = {
        page_data: pageData,
        updated_at: new Date().toISOString(),
      };
      if (profile && typeof profile === 'object') {
        if (profile.name) profileUpdates.name = profile.name;
        if (profile.username) profileUpdates.username = profile.username;
        if (profile.avatarUrl) profileUpdates.avatar_url = profile.avatarUrl;
        if (profile.coverUrl !== undefined) profileUpdates.cover_url = profile.coverUrl || null;
        if (profile.bioDescription !== undefined) profileUpdates.bio_description = profile.bioDescription;
        if (profile.category !== undefined) profileUpdates.category = profile.category || null;
        if (profile.location !== undefined) profileUpdates.location = profile.location || null;
        if (profile.customLink !== undefined) profileUpdates.custom_link = profile.customLink || null;
        if (profile.pageTitle) profileUpdates.page_title = profile.pageTitle;
        // Mantém o bio_url consistente com o username atual quando usa o formato
        // default (pandabio.com/<slug>); bioUrls personalizados são preservados.
        if (profile.username) {
          const storedBio = profile.bioUrl || '';
          if (storedBio.startsWith('pandabio.com/')) {
            profileUpdates.bio_url = `pandabio.com/${profile.username}`;
          } else if (storedBio) {
            profileUpdates.bio_url = storedBio;
          }
        }
      }

      const { error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId); // Mudado de user_id para id (profile_id)

      if (updateError) {
        console.error('Supabase error saving page data:', updateError);
        throw updateError;
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving page data:', error);
      return { success: false, error: error.message || 'Erro ao salvar página' };
    }
  }

  /**
   * Carregar dados da página do usuário
   */
  static async loadPageData(userId: string): Promise<{ success: boolean; pageData?: PageData; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!userId || userId === 'undefined') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('page_data')
        .eq('id', userId) // Mudado de user_id para id (profile_id)
        .single();

      if (error) {
        console.error('Supabase error loading page data:', error);
        throw error;
      }

      if (!data || !data.page_data) {
        // Retornar dados padrão se não existirem
        const defaultPageData: PageData = {
          profile: {} as UserProfile,
          blocks: [],
          theme: {
            theme: 'light',
            backgroundColor: '#ffffff',
            backgroundType: 'color',
            buttonStyle: 'rounded',
            fontFamily: 'Inter',
            animationsEnabled: true,
          },
          published: false,
          lastUpdated: new Date().toISOString(),
        };
        return { success: true, pageData: defaultPageData };
      }

      return { success: true, pageData: data.page_data };
    } catch (error) {
      console.error('Error loading page data:', error);
      return { success: false, error: error.message || 'Erro ao carregar página' };
    }
  }

  /**
   * Publicar página
   */
  static async publishPage(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!userId || userId === 'undefined') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ published: true, updated_at: new Date().toISOString() })
        .eq('id', userId); // Mudado de user_id para id (profile_id)

      if (error) {
        console.error('Supabase error publishing page:', error);
        throw error;
      }

      return { success: true };
    } catch (error) {
      console.error('Error publishing page:', error);
      return { success: false, error: error.message || 'Erro ao publicar página' };
    }
  }

  /**
   * Despublicar página
   */
  static async unpublishPage(userId: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!userId || userId === 'undefined') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ published: false, updated_at: new Date().toISOString() })
        .eq('id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      console.error('Error unpublishing page:', error);
      return { success: false, error: error.message || 'Erro ao despublicar página' };
    }
  }
}