import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { AuthScreen } from '../../components/AuthScreen';

vi.mock('../../supabase/client', () => ({
  isSupabaseConfigured: () => false,
  supabase: null,
  supabaseConfigError: 'Configuração do Supabase incompleta. Defina: VITE_SUPABASE_URL.',
}));

describe('AuthScreen', () => {
  it('informa imediatamente quando a configuração do Supabase está ausente', () => {
    render(<AuthScreen onLoginSuccess={() => undefined} />);

    const alert = screen.getByRole('alert').textContent;
    expect(alert).toContain('Configuração do Supabase incompleta');
    expect(alert).toContain('VITE_SUPABASE_URL');
  });
});
