import { supabase, isSupabaseConfigured } from '../client';
import { PageData, UserProfile } from '../../types';
import { normalizeUsername } from '../../utils/username';
import { createDefaultPageData, normalizePageData } from '../../utils/pageData';

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error) return error.message || fallback;
  if (typeof error === 'object' && error !== null && 'message' in error) {
    return String(error.message) || fallback;
  }
  return String(error || fallback);
};

export class PageService {
  /**
   * Salvar dados da página do usuário
   */
  static async savePageData(
    userId: string,
    pageData: PageData,
  ): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    if (!userId || userId === 'undefined') {
      return { success: false, error: 'ID de usuário inválido' };
    }

    try {
      // Persistir as colunas do perfil (evita dados duplicados entre perfil e page_data JSONB)
      const normalizedPageData = normalizePageData(pageData);
      const profile = normalizedPageData.profile;
      const profileUpdates: Record<string, unknown> = {
        page_data: normalizedPageData,
        updated_at: new Date().toISOString(),
      };
      if (profile && typeof profile === 'object') {
        if (profile.name) profileUpdates.name = profile.name;
        if (profile.username) profileUpdates.username = profile.username;
        if (profile.avatarUrl) profileUpdates.avatar_url = profile.avatarUrl;
        if (profile.coverUrl !== undefined) profileUpdates.cover_url = profile.coverUrl || null;
        if (profile.bioDescription !== undefined)
          profileUpdates.bio_description = profile.bioDescription;
        if (profile.category !== undefined) profileUpdates.category = profile.category || null;
        if (profile.location !== undefined) profileUpdates.location = profile.location || null;
        if (profile.customLink !== undefined)
          profileUpdates.custom_link = profile.customLink || null;
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

      const { data: rpcResult, error: rpcError } = await supabase.rpc('save_page_data', {
        p_profile_id: userId,
        p_page_data: normalizedPageData,
        p_profile: profile,
      });

      if (!rpcError) {
        if (rpcResult === false) {
          throw new Error('Perfil não encontrado ou sem permissão para salvar a página');
        }
        return { success: true };
      }

      if (rpcError.code !== 'PGRST202' && rpcError.code !== '42883') {
        console.error('Supabase RPC error saving page data:', rpcError);
        throw rpcError;
      }

      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId)
        .select('id')
        .maybeSingle();

      if (updateError) {
        console.error('Supabase error saving page data:', updateError);
        throw updateError;
      }

      if (!updatedProfile) {
        throw new Error('Perfil não encontrado ou sem permissão para salvar a página');
      }

      return { success: true };
    } catch (error) {
      console.error('Error saving page data:', error);
      return { success: false, error: getErrorMessage(error, 'Erro ao salvar página') };
    }
  }

  /**
   * Carregar dados da página do usuário
   */
  static async loadPageData(
    userId: string,
  ): Promise<{ success: boolean; pageData?: PageData; error?: string }> {
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
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Supabase error loading page data:', error);
        throw error;
      }

      if (!data || !data.page_data) {
        // Retornar dados padrão se não existirem
        const defaultPageData = createDefaultPageData();
        return { success: true, pageData: defaultPageData };
      }

      return { success: true, pageData: normalizePageData(data.page_data) };
    } catch (error) {
      console.error('Error loading page data:', error);
      return { success: false, error: getErrorMessage(error, 'Erro ao carregar página') };
    }
  }

  /**
   * Carrega página publicada sem exigir sessão autenticada.
   * A view pública limita os campos retornados pelo banco a conteúdo da bio.
   */
  static async loadPublicPageData(
    username: string,
  ): Promise<{ success: boolean; pageData?: PageData; error?: string }> {
    const normalizedUsername = normalizeUsername(username);
    if (!normalizedUsername || !/^[a-zA-Z0-9._-]+$/.test(normalizedUsername)) {
      return { success: false, error: 'Página não encontrada' };
    }

    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Página pública indisponível' };
    }

    try {
      const { data, error } = await supabase
        .from('public_profile_pages')
        .select(
          'username, name, bio_url, page_title, bio_description, avatar_url, category, location, custom_link, page_data, booking_workspace_slug',
        )
        .eq('username', normalizedUsername)
        .maybeSingle();

      if (error) throw error;
      if (!data || !data.page_data) {
        return { success: false, error: 'Página não encontrada' };
      }

      const storedPageData = data.page_data as Partial<PageData>;
      const storedProfile = (storedPageData.profile || {}) as Partial<UserProfile>;
      const profile: UserProfile = {
        ...storedProfile,
        name: data.name || storedProfile.name || normalizedUsername,
        username: data.username || normalizedUsername,
        email: '',
        plan: 'Gratuito',
        bioUrl: data.bio_url || `pandabio.com/${normalizedUsername}`,
        pageTitle: data.page_title || storedProfile.pageTitle || data.name || normalizedUsername,
        bioDescription: data.bio_description || storedProfile.bioDescription || '',
        avatarUrl: data.avatar_url || storedProfile.avatarUrl || '',
        category: data.category || storedProfile.category || undefined,
        location: data.location || storedProfile.location || undefined,
        customLink: data.custom_link || storedProfile.customLink || undefined,
      };

      return {
        success: true,
        pageData: normalizePageData({
          ...storedPageData,
          profile,
          published: true,
          lastUpdated: storedPageData.lastUpdated || new Date().toISOString(),
          bookingWorkspaceSlug: data.booking_workspace_slug || storedPageData.bookingWorkspaceSlug,
        }),
      };
    } catch (error) {
      console.error('Error loading public page:', error);
      return { success: false, error: 'Página não encontrada' };
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
