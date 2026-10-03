import { describe, expect, it } from 'vitest';
import { isMissingRelationError } from '../../supabase/services/publicAnalyticsService';

describe('public analytics database errors', () => {
  it('recognizes missing PostgREST relations without exposing an app error', () => {
    expect(isMissingRelationError({ code: 'PGRST205', message: 'Table not found' })).toBe(true);
    expect(
      isMissingRelationError({ message: 'relation public.public_page_events does not exist' }),
    ).toBe(true);
  });

  it('does not hide unrelated database failures', () => {
    expect(isMissingRelationError({ code: '42501', message: 'permission denied' })).toBe(false);
    expect(isMissingRelationError(null)).toBe(false);
  });
});
