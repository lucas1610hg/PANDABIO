import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { TrafficSourcesCard } from '../../components/TrafficSourcesCard';
import type {
  PublicAnalyticsEvent,
  PublicAnalyticsSummary,
} from '../../supabase/services/publicAnalyticsService';

const now = new Date();
const event = (source: string | null, referrer: string | null): PublicAnalyticsEvent => ({
  eventType: 'view',
  targetId: null,
  deviceType: 'mobile',
  referrer,
  source,
  createdAt: now.toISOString(),
});

const analytics = (
  events: PublicAnalyticsEvent[],
  eventsAvailable = true,
): PublicAnalyticsSummary => ({
  visits: events.length,
  clicks: 0,
  uniqueVisitors: events.length,
  events,
  eventsAvailable,
  sales: [],
  salesAvailable: true,
});

describe('TrafficSourcesCard', () => {
  it('shows real visit attribution using UTM source and referrer domain', () => {
    render(
      <TrafficSourcesCard
        analytics={analytics([
          event('instagram', null),
          event('instagram', null),
          event('instagram', null),
          event(null, 'https://google.com/search'),
        ])}
      />,
    );

    expect(screen.getByRole('heading', { name: 'Origem do tráfego' })).toBeTruthy();
    expect(screen.getByText('instagram')).toBeTruthy();
    expect(screen.getByText('google.com')).toBeTruthy();
    expect(screen.getByText('75%')).toBeTruthy();
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('distinguishes missing analytics from an empty period', () => {
    const { rerender } = render(<TrafficSourcesCard analytics={analytics([], false)} />);
    expect(screen.getByText('Analytics indisponível')).toBeTruthy();

    rerender(<TrafficSourcesCard analytics={analytics([])} />);
    expect(screen.getByText('Sem visitas nos últimos 7 dias')).toBeTruthy();
  });
});
