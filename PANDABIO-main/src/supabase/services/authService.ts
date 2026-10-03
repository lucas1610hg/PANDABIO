import { supabase, isSupabaseConfigured } from '../client';
import { UserProfile } from '../../types';
import {
  isValidUsername,
  normalizeUsername,
  usernameValidationMessage,
} from '../../utils/username';

/**
 * Serviço de autenticação
 */
export class AuthService {
  /**
   * Faz login com e-mail ou username e senha
   */
  static async signIn(
    identifier: string,
    password: string,
  ): Promise<{ success: boolean; user?: UserProfile; error?: string }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const email = await this.resolveLoginEmail(identifier);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      // Buscar perfil do usuário
      const profile =
        (await this.getUserProfile(data.user.id)) ||
        (await this.createProfile(data.user.id, {
          name: data.user.user_metadata?.name || data.user.email?.split('@')[0] || 'Usuário',
          username:
            data.user.user_metadata?.username ||
            this.buildFallbackUsername(data.user.email || email, data.user.id),
          email: data.user.email || email,
          avatarUrl: data.user.user_metadata?.avatar_url,
        }));

      if (!profile) {
        return {
          success: false,
          error: 'Login realizado, mas perfil não foi carregado. Execute a atualização do banco.',
        };
      }

      return {
        success: true,
        user: profile,
      };
    } catch (error) {
      console.error('Error signing in:', error);
      return { success: false, error: this.getAuthErrorMessage(error) };
    }
  }

  private static async resolveLoginEmail(identifier: string): Promise<string> {
    const normalizedIdentifier = identifier.trim().toLowerCase();

    if (normalizedIdentifier.includes('@')) {
      return normalizedIdentifier;
    }

    const username = normalizeUsername(normalizedIdentifier);
    if (!isValidUsername(username)) {
      throw new Error('Invalid login credentials');
    }

    if (!supabase) {
      throw new Error('Supabase não configurado');
    }

    const { data, error } = await supabase.rpc('resolve_login_email', {
      login_identifier: username,
    });

    if (error) throw error;
    if (!data) throw new Error('Invalid login credentials');

    return data;
  }

  private static buildFallbackUsername(email: string, userId: string): string {
    const emailUsername = normalizeUsername(email.split('@')[0]).replace(/[^a-z0-9._-]/g, '');
    const trimmedUsername = emailUsername.replace(/^[^a-z0-9]+|[^a-z0-9]+$/g, '').slice(0, 20);

    if (isValidUsername(trimmedUsername)) {
      return trimmedUsername;
    }

    return `usuario${userId.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;
  }

  private static getAuthErrorMessage(error: unknown): string {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === 'object' && error !== null && 'message' in error
          ? String(error.message)
          : String(error || '');
    const normalizedMessage = message.toLowerCase();

    if (normalizedMessage.includes('invalid login credentials')) {
      return 'E-mail, nome de usuário ou senha incorretos.';
    }

    if (normalizedMessage.includes('email not confirmed')) {
      return 'Confirme seu e-mail antes de entrar.';
    }

    if (
      normalizedMessage.includes('resolve_login_email') ||
      normalizedMessage.includes('could not find the function')
    ) {
      return 'Login por nome de usuário ainda não está habilitado no banco. Use o e-mail cadastrado ou aplique a migration de autenticação.';
    }

    if (normalizedMessage.includes('failed to fetch')) {
      return 'Não foi possível conectar ao servidor. Verifique a conexão e tente novamente.';
    }

    return message || 'Erro ao fazer login';
  }

  /**
   * Faz cadastro de novo usuário
   */
  static async signUp(
    email: string,
    password: string,
    metadata: Partial<UserProfile>,
  ): Promise<{
    success: boolean;
    user?: UserProfile;
    needsEmailConfirmation?: boolean;
    error?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    const username = normalizeUsername(metadata.username || '');
    if (!isValidUsername(username)) {
      return { success: false, error: usernameValidationMessage };
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: {
            name: metadata.name,
            username,
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
            username,
            email: normalizedEmail,
            plan: 'Gratuito',
            bioUrl: `pandabio.com/${username}`,
            pageTitle: `${metadata.name || 'Minha Página'} • Bio Oficial`,
            bioDescription: metadata.bioDescription || '',
            avatarUrl: metadata.avatarUrl || '',
          },
          needsEmailConfirmation: true,
        };
      }

      // Criar perfil no banco (se sessão foi criada imediatamente)
      if (data.user && data.session) {
        const profile = await this.createProfile(data.user.id, { ...metadata, username });

        return {
          success: true,
          user: profile || {
            name: metadata.name || '',
            username,
            email: normalizedEmail,
            plan: 'Gratuito',
            bioUrl: `pandabio.com/${username}`,
            pageTitle: `${metadata.name || 'Minha Página'} • Bio Oficial`,
            bioDescription: metadata.bioDescription || '',
            avatarUrl: metadata.avatarUrl || '',
          },
        };
      }

      return { success: false, error: 'Erro ao criar usuário' };
    } catch (error) {
      console.error('Error signing up:', error);
      return { success: false, error: this.getAuthErrorMessage(error) };
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
    } catch (error) {
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
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) throw error;
      if (!user) return {};

      const profile =
        (await this.getUserProfile(user.id)) ||
        (await this.createProfile(user.id, {
          name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
          username:
            user.user_metadata?.username || this.buildFallbackUsername(user.email || '', user.id),
          email: user.email || '',
          avatarUrl: user.user_metadata?.avatar_url,
        }));

      if (!profile) {
        return { error: 'Perfil não encontrado. Execute a atualização de autenticação no banco.' };
      }

      return { user: profile };
    } catch (error) {
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
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

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
        customDomain: data.custom_domain || undefined,
        customDomainVerified: data.custom_domain_verified === true,
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  /**
   * Cria o perfil do usuário
   */
  private static async createProfile(
    userId: string,
    metadata: Partial<UserProfile>,
  ): Promise<UserProfile | null> {
    if (!supabase) return null;

    try {
      const requestedUsername = normalizeUsername(
        metadata.username || metadata.email?.split('@')[0] || '',
      );
      const username = isValidUsername(requestedUsername)
        ? requestedUsername
        : this.buildFallbackUsername(metadata.email || '', userId);

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          name: metadata.name || '',
          username: username,
          email: metadata.email || '',
          plan: 'Gratuito',
          bio_url: `pandabio.com/${username}`,
          page_title: `${metadata.name || 'Minha Página'} • Bio Oficial`,
          bio_description: metadata.bioDescription,
          avatar_url: metadata.avatarUrl,
          cover_url: metadata.coverUrl,
          custom_domain: metadata.customDomain || null,
          custom_domain_verified: metadata.customDomainVerified || false,
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
        customDomain: data.custom_domain || undefined,
        customDomainVerified: data.custom_domain_verified === true,
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
    } catch (error) {
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
    } catch (error) {
      console.error('Error updating password:', error);
      return { success: false, error: error.message || 'Erro ao atualizar senha' };
    }
  }

  /**
   * Login com Google OAuth
   */
  static async signInWithGoogle(): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) throw error;

      // OAuth redireciona o usuário, então retornamos sucesso
      // O perfil será criado pelo trigger
      return { success: true };
    } catch (error) {
      console.error('Error signing in with Google:', error);
      return { success: false, error: error.message || 'Erro ao fazer login com Google' };
    }
  }

  /**
   * Login com Facebook OAuth
   */
  static async signInWithFacebook(): Promise<{
    success: boolean;
    user?: UserProfile;
    error?: string;
  }> {
    if (!isSupabaseConfigured() || !supabase) {
      return { success: false, error: 'Supabase não configurado' };
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'facebook',
        options: {
          redirectTo: window.location.href,
        },
      });

      if (error) throw error;

      // OAuth redireciona o usuário, então retornamos sucesso
      // O perfil será criado pelo trigger
      return { success: true };
    } catch (error) {
      console.error('Error signing in with Facebook:', error);
      return { success: false, error: error.message || 'Erro ao fazer login com Facebook' };
    }
  }
}
