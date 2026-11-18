import { afterEach, describe, expect, it, vi } from 'vitest';

describe('Supabase client configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('reports missing public credentials without silently creating a client', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', '');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', '');
    vi.resetModules();

    const client = await import('../../supabase/client');

    expect(client.supabase).toBeNull();
    expect(client.isSupabaseConfigured()).toBe(false);
    expect(client.supabaseConfigError).toContain('VITE_SUPABASE_URL');
    expect(client.supabaseConfigError).toContain('VITE_SUPABASE_ANON_KEY');
  });

  it('rejects a malformed Supabase URL', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'not-a-url');
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'public-anon-key');
    vi.resetModules();

    const client = await import('../../supabase/client');

    expect(client.supabase).toBeNull();
    expect(client.supabaseConfigError).toBe('VITE_SUPABASE_URL não é uma URL válida.');
  });
});
