import { describe, expect, it } from 'vitest';
import { buildDashboardAnalytics } from '../../utils/dashboardAnalytics';
import type { LeadItem } from '../../types';
import type {
  PublicAnalyticsEvent,
  PublicAnalyticsSale,
} from '../../supabase/services/publicAnalyticsService';

const now = new Date('2026-11-18T12:00:00.000Z').getTime();

const event = (
  eventType: PublicAnalyticsEvent['eventType'],
  createdAt: string,
): PublicAnalyticsEvent => ({
  eventType,
  targetId: null,
  deviceType: 'mobile',
  referrer: null,
  visitorId: 'visitor-1',
  createdAt,
});

const lead = (createdAt: string): LeadItem => ({
  id: `lead-${createdAt}`,
  name: 'Lead',
  email: 'lead@example.com',
  phone: '',
  channel: 'form',
  createdAt,
});

const sale = (createdAt: string, quantity = 1): PublicAnalyticsSale => ({
  productId: 'product-1',
  quantity,
  amount: 25,
  createdAt,
});

describe('buildDashboardAnalytics', () => {
  it('calculates the last seven days, prior-period changes, and actual sales dates', () => {
    const result = buildDashboardAnalytics({
      events: [
        event('view', '2026-11-17T10:00:00.000Z'),
        event('link_click', '2026-11-17T10:01:00.000Z'),
        event('view', '2026-11-10T10:00:00.000Z'),
      ],
      eventsAvailable: true,
      leads: [lead('2026-11-17T11:00:00.000Z'), lead('2026-11-10T11:00:00.000Z')],
      sales: [sale('2026-11-17T12:00:00.000Z', 2), sale('2026-11-10T12:00:00.000Z')],
      salesAvailable: true,
      now,
    });

    expect(result.kpis).toMatchObject({
      visits: 1,
      uniqueVisitors: 1,
      clicks: 1,
      leads: 1,
      conversions: 2,
      visitsGrowth: 0,
      clicksGrowth: null,
      leadConversionRate: 100,
      finalConversionRate: 200,
    });
    expect(result.funnel.conversions).toBe(2);
  });

  it('marks unavailable event and sales history instead of displaying false zeros', () => {
    const result = buildDashboardAnalytics({
      events: [],
      eventsAvailable: false,
      leads: [],
      sales: [],
      salesAvailable: false,
      now,
    });

    expect(result.kpis.visits).toBeNull();
    expect(result.kpis.clicks).toBeNull();
    expect(result.kpis.conversions).toBeNull();
    expect(result.funnel.ctr).toBeNull();
  });
});
