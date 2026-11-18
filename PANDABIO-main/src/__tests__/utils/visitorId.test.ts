import { describe, expect, it, vi } from 'vitest';
import { getOrCreateVisitorId } from '../../utils/visitorId';

describe('getOrCreateVisitorId', () => {
  it('reuses the persisted browser identifier', () => {
    const values = new Map<string, string>();
    const storage = {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
    };

    const first = getOrCreateVisitorId(storage);

    expect(getOrCreateVisitorId(storage)).toBe(first);
  });

  it('reports storage errors and still returns a session identifier', () => {
    const storage = {
      getItem: () => {
        throw new Error('Storage unavailable');
      },
      setItem: vi.fn(),
    };
    const onStorageError = vi.fn();

    expect(getOrCreateVisitorId(storage, onStorageError)).toMatch(/^visitor-|^[0-9a-f-]{36}$/i);
    expect(onStorageError).toHaveBeenCalledOnce();
  });
});
