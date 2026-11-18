import { describe, expect, it, vi } from 'vitest';
import { fetchAllPages } from '../../utils/fetchAllPages';

describe('fetchAllPages', () => {
  it('loads every page until the final partial page', async () => {
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: [3], error: null });

    await expect(fetchAllPages(loadPage, 2)).resolves.toEqual({
      data: [1, 2, 3],
      error: null,
    });
    expect(loadPage).toHaveBeenNthCalledWith(1, 0, 1);
    expect(loadPage).toHaveBeenNthCalledWith(2, 2, 3);
  });

  it('returns query errors instead of presenting partial history as complete', async () => {
    const error = new Error('Falha ao carregar página');
    const loadPage = vi
      .fn()
      .mockResolvedValueOnce({ data: [1, 2], error: null })
      .mockResolvedValueOnce({ data: null, error });

    await expect(fetchAllPages(loadPage, 2)).resolves.toEqual({ data: null, error });
  });
});
