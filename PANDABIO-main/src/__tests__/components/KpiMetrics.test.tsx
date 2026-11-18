import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { KpiMetrics } from '../../components/KpiMetrics';
import type { KpiData } from '../../components/KpiMetrics';

const data: KpiData = {
  visits: null,
  visitsGrowth: null,
  uniqueVisitors: null,
  clicks: 4,
  clicksGrowth: -20,
  clickRate: null,
  leads: 1,
  leadsGrowth: null,
  leadConversionRate: null,
  conversions: null,
  conversionsGrowth: null,
  finalConversionRate: null,
};

describe('KpiMetrics', () => {
  it('shows unavailable metrics and real downward trends without fabricated charts', () => {
    render(<KpiMetrics data={data} />);

    expect(screen.getAllByText('—').length).toBeGreaterThan(0);
    expect(screen.getByText('-20,0%')).toBeTruthy();
    expect(screen.getAllByText('Dados indisponíveis').length).toBeGreaterThan(0);
  });
});
