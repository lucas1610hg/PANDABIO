import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ClicksByLinkChart } from '../../components/ClicksByLinkChart';
import type { BioLink } from '../../types';
import type { PublicAnalyticsEvent } from '../../supabase/services/publicAnalyticsService';

const links: BioLink[] = [
  {
    id: 'link-a',
    title: 'Link A',
    url: 'https://a.example',
    clicks: 500,
    leads: 10,
    active: true,
    icon: 'custom',
    type: 'custom',
  },
  {
    id: 'link-b',
    title: 'Link B',
    url: 'https://b.example',
    clicks: 20,
    leads: 1,
    active: true,
    icon: 'custom',
    type: 'custom',
  },
];

const event = (targetId: string): PublicAnalyticsEvent => ({
  eventType: 'link_click',
  targetId,
  deviceType: 'mobile',
  referrer: null,
  createdAt: new Date().toISOString(),
});

describe('ClicksByLinkChart', () => {
  it('uses recent attributed events instead of lifetime link counters', () => {
    render(
      <ClicksByLinkChart
        links={links}
        events={[event('link-b'), event('link-b')]}
        eventsAvailable
      />,
    );

    expect(screen.getByText('Link B')).toBeTruthy();
    expect(screen.queryByText('Link A')).toBeNull();
    expect(screen.getByText('2')).toBeTruthy();
  });

  it('distinguishes no clicks from unavailable analytics', () => {
    const { rerender } = render(<ClicksByLinkChart links={links} eventsAvailable />);
    expect(screen.getByText('Sem cliques no período')).toBeTruthy();

    rerender(<ClicksByLinkChart links={links} eventsAvailable={false} />);
    expect(screen.getByText('Dados indisponíveis')).toBeTruthy();
  });
});
