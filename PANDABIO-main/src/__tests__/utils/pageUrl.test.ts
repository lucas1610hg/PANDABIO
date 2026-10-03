import { describe, expect, it } from 'vitest';
import { getPageUrl, getPublicOrigin } from '../../utils/pageUrl';

describe('page URL helpers', () => {
  it('uses Vercel origin for legacy hosts during local development', () => {
    expect(getPublicOrigin()).toBe('https://pandabio-bice.vercel.app');
    expect(getPageUrl('pandabio.com/lucas', 'lucas')).toBe(
      'https://pandabio-bice.vercel.app/lucas',
    );
    expect(getPageUrl('panda.bio/lucas', 'lucas')).toBe(
      'https://pandabio-bice.vercel.app/lucas',
    );
  });

  it('preserves explicitly configured custom hosts', () => {
    expect(getPageUrl('https://meusite.com/lucas', 'lucas')).toBe('https://meusite.com/lucas');
  });
});
