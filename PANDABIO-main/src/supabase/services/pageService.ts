import { supabase, isSupabaseConfigured } from '../client';
import { PageData, PageBlock, PageTheme } from '../../types';

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
      // Salvar os dados como JSON na tabela profiles usando id (profile_id)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          page_data: pageData,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId); // Mudado de user_id para id (profile_id)

      if (updateError) {
        console.error('Supabase error saving page data:', updateError);
        throw updateError;
      }

      return { success: true };
    } catch (error: any) {
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
          profile: {} as any,
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
    } catch (error: any) {
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
    } catch (error: any) {
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
        .eq('user_id', userId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('Error unpublishing page:', error);
      return { success: false, error: error.message || 'Erro ao despublicar página' };
    }
  }
}