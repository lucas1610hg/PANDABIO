import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '../supabase/client';
import { AuthService } from '../supabase/services/authService';
import { ProfileService } from '../supabase/services/profileService';
import { UserProfile } from '../types';

/**
 * Hook customizado para autenticação com Supabase
 * Gerencia estado de autenticação e perfil do usuário
 */
export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured() || !supabase) {
      setLoading(false);
      return;
    }

    const client = supabase;

    // Obter sessão atual
    const getSession = async () => {
      try {
        const { data: { session } } = await client.auth.getSession();
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await ProfileService.getCurrentProfile();
          setProfile(userProfile);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error getting session:', err);
        setError('Erro ao carregar sessão');
        setLoading(false);
      }
    };

    getSession();

    // Escutar mudanças de autenticação
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (_event, session) => {
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const userProfile = await ProfileService.getCurrentProfile();
          setProfile(userProfile);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setError(null);
    const result = await AuthService.signIn(email, password);
    
    if (result.success && result.user) {
      setProfile(result.user);
      return { success: true };
    }
    
    setError(result.error || 'Erro ao fazer login');
    return { success: false, error: result.error };
  };

  const signUp = async (email: string, password: string, metadata: Partial<UserProfile>) => {
    setError(null);
    const result = await AuthService.signUp(email, password, metadata);
    
    if (result.success && result.user) {
      setProfile(result.user);
      return { success: true };
    }
    
    setError(result.error || 'Erro ao fazer cadastro');
    return { success: false, error: result.error };
  };

  const signOut = async () => {
    setError(null);
    const result = await AuthService.signOut();
    
    if (result.success) {
      setUser(null);
      setProfile(null);
      return { success: true };
    }
    
    setError(result.error || 'Erro ao fazer logout');
    return { success: false, error: result.error };
  };

  const resetPassword = async (email: string) => {
    setError(null);
    const result = await AuthService.resetPassword(email);
    
    if (result.success) {
      return { success: true };
    }
    
    setError(result.error || 'Erro ao redefinir senha');
    return { success: false, error: result.error };
  };

  const updateProfile = async (updates: Partial<UserProfile>) => {
    if (!profile) return { success: false, error: 'Perfil não carregado' };
    
    setError(null);
    const updatedProfile = await ProfileService.upsertProfile(updates);
    
    if (updatedProfile) {
      setProfile(updatedProfile);
      return { success: true };
    }
    
    setError('Erro ao atualizar perfil');
    return { success: false, error: 'Erro ao atualizar perfil' };
  };

  return {
    user,
    profile,
    loading,
    error,
    isAuthenticated: !!user,
    isSupabaseConfigured,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
  };
};