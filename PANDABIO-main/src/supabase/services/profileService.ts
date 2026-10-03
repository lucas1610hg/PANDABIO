import { supabase, isSupabaseConfigured } from '../client';
import { UserProfile } from '../../types';
import { isValidUsername, normalizeUsername } from '../../utils/username';

const PROFILE_COLUMNS =
  'id, name, username, email, plan, bio_url, page_title, bio_description, avatar_url, cover_url, category, location, custom_link, custom_domain, custom_domain_verified';

/**
 * Serviço para gerenciamento de perfis de usuário
 */
export class ProfileService {
  private static readonly profileIdCache = new Map<string, string>();
  private static readonly profileIdRequests = new Map<string, Promise<string | null>>();
  private static readonly profileCache = new Map<string, UserProfile>();
  private static readonly profileRequests = new Map<string, Promise<UserProfile | null>>();

  private static async getCurrentAuthUser() {
    if (!supabase) return null;

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession();

    if (error) throw error;
    return session?.user ?? null;
  }

  static cacheProfileId(userId: string, profileId: string): void {
    this.profileIdCache.set(userId, profileId);
  }

  static async ensureCurrentProfileId(profile: Partial<UserProfile> = {}): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const user = await this.getCurrentAuthUser();
      if (!user) return null;

      const existingProfileId = await this.getCurrentProfileId();
      if (existingProfileId) return existingProfileId;

      const requestedUsername = normalizeUsername(
        profile.username ||
          user.user_metadata?.username ||
          profile.email?.split('@')[0] ||
          user.email?.split('@')[0] ||
          '',
      );
      const username = isValidUsername(requestedUsername)
        ? requestedUsername
        : `usuario${user.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;

      const { data, error } = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          name: (profile.name || user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário')
            .trim()
            .slice(0, 50),
          username,
          email: profile.email?.trim().toLowerCase() || user.email || '',
          plan: profile.plan || 'Gratuito',
          bio_url: profile.bioUrl || `pandabio.com/${username}`,
          page_title: profile.pageTitle || 'Minha Página • Bio Oficial',
          bio_description: profile.bioDescription || '',
          avatar_url: profile.avatarUrl || null,
          cover_url: profile.coverUrl || null,
          category: profile.category || null,
          location: profile.location || null,
          custom_link: profile.customLink || null,
          custom_domain: profile.customDomain || null,
          custom_domain_verified: profile.customDomainVerified || false,
        })
        .select('id')
        .maybeSingle();

      if (data?.id) {
        this.profileIdCache.set(user.id, data.id);
        return data.id;
      }

      if (error && error.code !== '23505') throw error;

      return this.getCurrentProfileId();
    } catch (error) {
      console.error('Error ensuring current profile:', error);
      return null;
    }
  }

  /**
   * Obtém a chave de domínio do perfil associado à sessão atual.
   *
   * As tabelas de conteúdo referenciam `profiles.id`; `auth.users.id` é
   * usado apenas para localizar esse perfil.
   */
  static async getCurrentProfileId(): Promise<string | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const user = await this.getCurrentAuthUser();
      if (!user) return null;

      const cachedProfileId = this.profileIdCache.get(user.id);
      if (cachedProfileId) return cachedProfileId;

      const pendingRequest = this.profileIdRequests.get(user.id);
      if (pendingRequest) return pendingRequest;

      const request = (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        if (data?.id) this.profileIdCache.set(user.id, data.id);
        return data?.id || null;
      })();

      this.profileIdRequests.set(user.id, request);

      try {
        return await request;
      } finally {
        this.profileIdRequests.delete(user.id);
      }
    } catch (error) {
      console.error('Error fetching current profile ID:', error);
      return null;
    }
  }

  /**
   * Obtém o perfil do usuário atual
   */
  static async getCurrentProfile(): Promise<UserProfile | null> {
    if (!isSupabaseConfigured() || !supabase) return null;

    try {
      const user = await this.getCurrentAuthUser();
      if (!user) return null;

      const cachedProfile = this.profileCache.get(user.id);
      if (cachedProfile) return cachedProfile;

      const pendingRequest = this.profileRequests.get(user.id);
      if (pendingRequest) return pendingRequest;

      const request = (async () => {
        const { data, error } = await supabase
          .from('profiles')
          .select(PROFILE_COLUMNS)
          .eq('user_id', user.id)
          .order('created_at', { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;

        if (!data) {
          const requestedUsername = normalizeUsername(
            user.user_metadata?.username || user.email?.split('@')[0] || '',
          );
          const username = isValidUsername(requestedUsername)
            ? requestedUsername
            : `usuario${user.id.replace(/[^a-z0-9]/gi, '').slice(0, 8)}`;

          return this.upsertProfile({
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuário',
            username,
            email: user.email || '',
            avatarUrl: user.user_metadata?.avatar_url,
          });
        }

        this.profileIdCache.set(user.id, data.id);

        const profile = {
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
          customDomain: data.custom_domain || undefined,
          customDomainVerified: data.custom_domain_verified === true,
        };

        this.profileCache.set(user.id, profile);
        return profile;
      })();

      this.profileRequests.set(user.id, request);

      try {
        return await request;
      } finally {
        this.profileRequests.delete(user.id);
      }
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
      const user = await this.getCurrentAuthUser();
      if (!user) return null;

      // Correção: `upsert` com user_id requeria uma constraint UNIQUE em user_id.
      // Sem ela, cada chamada criava um NOVO registro duplicado. Agora atualiza
      // pelo user_id e, caso o perfil ainda não exista, faz o insert.
      const { data: existing, error: selectError } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      if (selectError) throw selectError;

      let data;
      if (existing?.id) {
        const updates: Record<string, unknown> = {};
        if (profile.name !== undefined) updates.name = profile.name.trim();
        if (profile.username !== undefined) {
          const username = normalizeUsername(profile.username);
          if (!isValidUsername(username)) return null;
          updates.username = username;
          updates.bio_url = `pandabio.com/${username}`;
        }
        if (profile.email !== undefined) updates.email = profile.email.trim().toLowerCase();
        if (profile.plan !== undefined) updates.plan = profile.plan;
        if (profile.bioUrl !== undefined && profile.username === undefined) {
          updates.bio_url = profile.bioUrl;
        }
        if (profile.pageTitle !== undefined) updates.page_title = profile.pageTitle;
        if (profile.bioDescription !== undefined) updates.bio_description = profile.bioDescription;
        if (profile.avatarUrl !== undefined) updates.avatar_url = profile.avatarUrl || null;
        if (profile.coverUrl !== undefined) updates.cover_url = profile.coverUrl || null;
        if (profile.category !== undefined) updates.category = profile.category || null;
        if (profile.location !== undefined) updates.location = profile.location || null;
        if (profile.customLink !== undefined) updates.custom_link = profile.customLink || null;
        if (profile.customDomain !== undefined)
          updates.custom_domain = profile.customDomain || null;
        if (profile.customDomainVerified !== undefined) {
          updates.custom_domain_verified = profile.customDomainVerified;
        }
        updates.updated_at = new Date().toISOString();

        const { data: updated, error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id)
          .select(PROFILE_COLUMNS)
          .single();
        if (error) throw error;
        data = updated;
      } else {
        const username = normalizeUsername(
          profile.username ||
            profile.email?.split('@')[0] ||
            user.email?.split('@')[0] ||
            'usuario',
        );
        if (!isValidUsername(username)) return null;

        const row = {
          user_id: user.id,
          name: profile.name?.trim() || user.user_metadata?.name || 'Usuário',
          username,
          email: profile.email?.trim().toLowerCase() || user.email || '',
          plan: profile.plan || 'Gratuito',
          bio_url: profile.bioUrl || `pandabio.com/${username}`,
          page_title: profile.pageTitle || 'Minha Página • Bio Oficial',
          bio_description: profile.bioDescription || '',
          avatar_url: profile.avatarUrl || null,
          cover_url: profile.coverUrl || null,
          category: profile.category || null,
          location: profile.location || null,
          custom_link: profile.customLink || null,
          custom_domain: profile.customDomain || null,
          custom_domain_verified: profile.customDomainVerified || false,
        };

        const { data: inserted, error } = await supabase
          .from('profiles')
          .insert(row)
          .select(PROFILE_COLUMNS)
          .single();
        if (error) throw error;
        data = inserted;
      }

      if (!data) return null;

      const updatedProfile = {
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
        customDomain: data.custom_domain || undefined,
        customDomainVerified: data.custom_domain_verified === true,
      };

      this.profileIdCache.set(user.id, data.id);
      this.profileCache.set(user.id, updatedProfile);
      return updatedProfile;
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
      const user = await this.getCurrentAuthUser();
      if (!user) return false;

      const { error } = await supabase
        .from('profiles')
        .update({ plan: 'PRO' })
        .eq('user_id', user.id);

      if (error) throw error;
      this.profileCache.delete(user.id);
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
      const { data, error } = await supabase.from('profiles').select('*');

      if (error) throw error;
      if (!data) return [];

      return data.map((profile) => ({
        name: profile.name,
        username: profile.username,
        email: profile.email,
        plan: profile.plan,
        bioUrl: profile.bio_url,
        pageTitle: profile.page_title,
        bioDescription: profile.bio_description || '',
        avatarUrl: profile.avatar_url || '',
        coverUrl: profile.cover_url || undefined,
        customDomain: profile.custom_domain || undefined,
        customDomainVerified: profile.custom_domain_verified === true,
      }));
    } catch (error) {
      console.error('Error fetching all profiles:', error);
      return [];
    }
  }
}
