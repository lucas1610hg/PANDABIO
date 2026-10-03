import { describe, expect, it } from 'vitest';
import { isValidUsername, normalizeUsername } from '../../utils/username';

describe('username rules', () => {
  it('normalizes public usernames', () => {
    expect(normalizeUsername(' @Lucas_Dev ')).toBe('lucas_dev');
  });

  it('rejects invalid and reserved usernames', () => {
    expect(isValidUsername('ab')).toBe(false);
    expect(isValidUsername('admin')).toBe(false);
    expect(isValidUsername('nome com espaço')).toBe(false);
  });

  it('accepts valid usernames', () => {
    expect(isValidUsername('lucas_dev')).toBe(true);
    expect(isValidUsername('criador.dev')).toBe(true);
  });
});
