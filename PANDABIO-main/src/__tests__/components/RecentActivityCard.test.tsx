import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { RecentActivityCard } from '../../components/RecentActivityCard';
import type { ActivityItem } from '../../types';

const activity = (overrides: Partial<ActivityItem>): ActivityItem => ({
  id: 'activity-1',
  title: 'Atividade',
  subtitle: 'Detalhe',
  timeAgo: 'agora',
  type: 'clicks',
  timestamp: new Date().toISOString(),
  ...overrides,
});

describe('RecentActivityCard', () => {
  it('filters by the real timestamp and does not treat undated items as happening today', () => {
    render(
      <RecentActivityCard
        activities={[
          activity({ id: 'dated', title: 'Com data' }),
          activity({ id: 'undated', title: 'Sem data', timestamp: 'invalid-date' }),
        ]}
      />,
    );

    expect(screen.getByText('Com data')).toBeTruthy();
    expect(screen.queryByText('Sem data')).toBeNull();
  });
});
