import { describe, expect, it } from 'vitest';
import {
  buildStatisticsChart,
  countUniqueVisitors,
  filterStatisticsEvents,
  getPercentageChange,
  getStatisticsWindow,
  parseStatisticsDate,
} from '../../utils/statistics';

const now = new Date('2026-09-29T12:00:00.000Z').getTime();

const event = (eventType: 'view' | 'click', createdAt: string) => ({
  eventType,
  targetId: null,
  deviceType: 'desktop' as const,
  referrer: null,
  visitorId: eventType === 'view' ? 'visitor-1' : null,
  createdAt,
});

describe('statistics helpers', () => {
  it('parses valid dates and ignores invalid dates', () => {
    expect(parseStatisticsDate('2026-09-29T12:00:00.000Z')).toBe(now);
    expect(parseStatisticsDate('invalid')).toBeNull();
    expect(parseStatisticsDate(null)).toBeNull();
  });

  it('excludes undated and out-of-range events from finite periods', () => {
    const events = [
      event('view', '2026-09-29T10:00:00.000Z'),
      event('click', '2026-08-01T10:00:00.000Z'),
      event('view', 'invalid'),
    ];
    const window = getStatisticsWindow('7d', now);

    expect(filterStatisticsEvents(events, window)).toHaveLength(1);
  });

  it('aggregates 90 days into readable 3-day buckets', () => {
    const events = [event('view', '2026-09-29T10:00:00.000Z')];

    expect(buildStatisticsChart(events, '90d', now)).toHaveLength(30);
    expect(buildStatisticsChart(events, '90d', now).at(-1)?.visits).toBe(1);
  });

  it('returns a null change for a metric with no previous baseline', () => {
    expect(getPercentageChange(3, 0)).toBeNull();
    expect(getPercentageChange(3, 2)).toBe(50);
    expect(getPercentageChange(0, 0)).toBe(0);
  });

  it('counts unique visitors and falls back to views for legacy events', () => {
    const events = [
      { ...event('view', '2026-09-29T10:00:00.000Z'), visitorId: 'visitor-1' },
      { ...event('view', '2026-09-29T11:00:00.000Z'), visitorId: 'visitor-1' },
      { ...event('view', '2026-09-29T12:00:00.000Z'), visitorId: 'visitor-2' },
    ];

    expect(countUniqueVisitors(events)).toBe(2);
    expect(countUniqueVisitors(events.map(({ visitorId, ...legacyEvent }) => legacyEvent))).toBe(3);
  });
});
