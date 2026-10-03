import { describe, expect, it } from 'vitest';
import { getPublicProfileSlug } from '../../utils/publicRoute';

describe('getPublicProfileSlug', () => {
  it('returns slug from public profile path', () => {
    expect(getPublicProfileSlug('/@criador')).toBe('criador');
    expect(getPublicProfileSlug('/criador.dev')).toBe('criador.dev');
  });

  it('does not treat admin paths as public profiles', () => {
    expect(getPublicProfileSlug('/')).toBeNull();
    expect(getPublicProfileSlug('/dashboard')).toBeNull();
    expect(getPublicProfileSlug('/auth')).toBeNull();
  });

  it('rejects nested or invalid paths', () => {
    expect(getPublicProfileSlug('/criador/links')).toBeNull();
    expect(getPublicProfileSlug('/criador com espaço')).toBeNull();
  });
});
