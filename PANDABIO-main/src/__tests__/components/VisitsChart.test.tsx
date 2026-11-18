import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { VisitsChart } from '../../components/VisitsChart';
import type { PublicAnalyticsEvent } from '../../supabase/services/publicAnalyticsService';

const event = (eventType: PublicAnalyticsEvent['eventType'], createdAt: string) => ({
  eventType,
  targetId: null,
  deviceType: 'mobile' as const,
  referrer: null,
  createdAt,
});

describe('VisitsChart', () => {
  it('plots visit events for the selected period', async () => {
    const user = userEvent.setup();
    const now = Date.now();
    const events = [
      event('view', new Date(now).toISOString()),
      event('page_view', new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString()),
      event('view', new Date(now - 10 * 24 * 60 * 60 * 1000).toISOString()),
    ];

    render(<VisitsChart totalVisits={3} events={events} />);

    expect(
      screen.getByRole('img', { name: 'Gráfico de visitas — Últimos 7 dias: 2 visitas' }),
    ).toBeTruthy();

    await user.click(screen.getByRole('button', { name: 'Tudo' }));

    expect(
      screen.getByRole('img', { name: 'Gráfico de visitas — Todo o período: 3 visitas' }),
    ).toBeTruthy();
  });

  it('does not fabricate a trend when only an accumulated total is available', () => {
    render(<VisitsChart totalVisits={12} events={[]} />);

    expect(screen.getByText('Histórico por período indisponível')).toBeTruthy();
    expect(screen.getByText(/Há 12 visitas acumuladas/)).toBeTruthy();
  });

  it('distinguishes an empty selected period from missing date history', () => {
    const oldEvent = event('view', new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString());
    render(<VisitsChart totalVisits={1} events={[oldEvent]} />);

    expect(screen.getByText('Sem visitas neste período')).toBeTruthy();
    expect(screen.queryByText('Histórico por período indisponível')).toBeNull();
  });
});
