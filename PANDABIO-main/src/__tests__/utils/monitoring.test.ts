import { afterEach, describe, expect, it, vi } from 'vitest';

const { init } = vi.hoisted(() => ({
  init: vi.fn(),
}));

vi.mock('@sentry/react', () => ({ init }));

describe('Sentry monitoring configuration', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
    init.mockClear();
  });

  it('initializes Sentry and removes user and request data when a DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', ' https://public-key@sentry.example/123 ');

    await import('../../utils/monitoring');

    expect(init).toHaveBeenCalledWith({
      dsn: 'https://public-key@sentry.example/123',
      environment: 'test',
      tracesSampleRate: 0,
      beforeSend: expect.any(Function),
    });

    const options = init.mock.calls[0][0];
    const event = {
      message: 'Unexpected error',
      user: { email: 'person@example.com' },
      request: { url: 'https://pandabio.example/lucas?token=private' },
    };

    expect(options.beforeSend(event, {})).toEqual({ message: 'Unexpected error' });
  });

  it('does not initialize Sentry when no DSN is configured', async () => {
    vi.stubEnv('VITE_SENTRY_DSN', '');

    await import('../../utils/monitoring');

    expect(init).not.toHaveBeenCalled();
  });
});
