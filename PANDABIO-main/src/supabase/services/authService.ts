import { supabase, isSupabaseConfigured } from '../client';
import { UserProfile } from '../../types';

/**
 * Serviço de autenticação
 */
export class AuthService {
  /**
   * Faz login com email e senha
   */
  static async signIn(email: string, password: string): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Buscar perfil do usuário
      const profile = await this.getUserProfile(data.user.id);
      
      return { 
        success: true, 
        user: profile || undefined
      };
    } catch (error: any) {
      console.error('Error signing in:', error);
      return { success: false, error: error.message || 'Erro ao fazer login' };
    }
  }

  /**
   * Faz cadastro de novo usuário
   */
  static async signUp(email: string, password: string, metadata: Partial<UserProfile>): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: metadata.name,
            username: metadata.username,
            avatar_url: metadata.avatarUrl,
          },
          emailRedirectTo: window.location.href,
        },
      });

      if (error) throw error;

      // Criar perfil no banco (se o usuário foi criado imediatamente)
      if (data.user && !data.session) {
        // Usuário criado mas precisa confirmar email
        return { 
          success: true, 
          user: {
            name: metadata.name || '',
            username: metadata.username || '',
            email: email,
            plan: 'Gratuito',
            bioUrl: `panda.bio/${metadata.username || email.split('@')[0]}`,
            pageTitle: `${metadata.name || 'Minha Página'} • Bio Oficial`,
            bioDescription: metadata.bioDescription || '',
            avatarUrl: metadata.avatarUrl || '',
          }
        };
      }

      // Criar perfil no banco (se sessão foi criada imediatamente)
      if (data.user && data.session) {
        const profile = await this.createProfile(data.user.id, metadata);
        
        return { 
          success: true, 
          user: profile || {
            name: metadata.name || '',
            username: metadata.username || '',
            email: email,
            plan: 'Gratuito',
            bioUrl: `panda.bio/${metadata.username || email.split('@')[0]}`,
            pageTitle: `${metadata.name || 'Minha Página'} • Bio Oficial`,
            bioDescription: metadata.bioDescription || '',
            avatarUrl: metadata.avatarUrl || '',
          }
        };
      }

      return { success: false, error: 'Erro ao criar usuário' };
    } catch (error: any) {
      console.error('Error signing up:', error);
      return { success: false, error: error.message || 'Erro ao fazer cadastro' };
    }
  }

  /**
   * Faz logout
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error signing out:', error);
      return { success: false, error: error.message || 'Erro ao fazer logout' };
    }
  }

  /**
   * Obtém o usuário atual autenticado
   */
  static async getCurrentUser(): Promise<{ user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { error: 'Supabase não configurado' };
    }

    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return {};

      const profile = await this.getUserProfile(user.id);
      return { user: profile || undefined };
    } catch (error: any) {
      console.error('Error getting current user:', error);
      return { error: error.message || 'Erro ao obter usuário' };
    }
  }

  /**
   * Obtém o perfil do usuário pelo ID
   */
  private static async getUserProfile(userId: string): Promise<UserProfile | null> {
    if (!supabase) return null;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
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
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Cria o perfil do usuário
   */
  private static async createProfile(userId: string, metadata: Partial<UserProfile>): Promise<UserProfile | null> {
    if (!supabase) return null;
    
    try {
      const username = metadata.username || metadata.email?.split('@')[0] || 'usuario';
      
      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name: metadata.name || '',
          username: username,
          email: metadata.email || '',
          plan: 'Gratuito',
          bio_url: `panda.bio/${username}`,
          page_title: `${metadata.name || 'Minha Página'} • Bio Oficial`,
          bio_description: metadata.bioDescription,
          avatar_url: metadata.avatarUrl,
          cover_url: metadata.coverUrl,
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
        coverUrl: data.cover_url || undefined,
      };
    } catch (error) {
      console.error('Error creating profile:', error);
      return null;
    }
  }

  /**
   * Redefine senha do usuário
   */
  static async resetPassword(email: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error resetting password:', error);
      return { success: false, error: error.message || 'Erro ao redefinir senha' };
    }
  }

  /**
   * Atualiza senha do usuário
   */
  static async updatePassword(newPassword: string): Promise<{ success: boolean; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message || 'Erro ao atualizar senha' };
    }
  }

  /**
   * Login com Google OAuth
   */
  static async signInWithGoogle(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) throw error;

      // OAuth redireciona o usuário, então retornamos sucesso
      // O perfil será criado pelo trigger
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with Google:', error);
      return { success: false, error: error.message || 'Erro ao fazer login com Google' };
    }
  }

  /**
   * Login com Facebook OAuth
   */
  static async signInWithFacebook(): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) throw error;

      // OAuth redireciona o usuário, então retornamos sucesso
      // O perfil será criado pelo trigger
      return { success: true };
    } catch (error: any) {
      console.error('Error signing in with Facebook:', error);
      return { success: false, error: error.message || 'Erro ao fazer login com Facebook' };
    }
  }
}