import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

function getConfigurationError(): string | null {
  const missing = [
    !supabaseUrl && 'VITE_SUPABASE_URL',
    !supabaseAnonKey && 'VITE_SUPABASE_ANON_KEY',
  ].filter((value): value is string => Boolean(value));

  if (missing.length > 0) {
    return `Configuração do Supabase incompleta. Defina: ${missing.join(', ')}.`;
  }

  try {
    const url = new URL(supabaseUrl);
    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'VITE_SUPABASE_URL precisa usar HTTP ou HTTPS.';
    }
    if (import.meta.env.PROD && url.protocol !== 'https:') {
      return 'VITE_SUPABASE_URL precisa usar HTTPS em produção.';
    }
  } catch {
    return 'VITE_SUPABASE_URL não é uma URL válida.';
  }

  return null;
}

export const supabaseConfigError = getConfigurationError();

if (supabaseConfigError) {
  console.warn(supabaseConfigError);
}

export const supabase = !supabaseConfigError
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export const isSupabaseConfigured = () => {
  return !supabaseConfigError;
};
