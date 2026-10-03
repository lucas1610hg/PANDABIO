import type { PublicAnalyticsEvent } from '../supabase/services/publicAnalyticsService';

export type StatisticsPeriod = '7d' | '30d' | '90d' | 'all';

export interface StatisticsWindow {
  start: number | null;
  end: number | null;
}

export interface StatisticsChartPoint {
  label: string;
  visits: number;
  clicks: number;
}

export const isViewEvent = (event: PublicAnalyticsEvent) =>
  event.eventType === 'view' || event.eventType === 'page_view';

export const isClickEvent = (event: PublicAnalyticsEvent) =>
  event.eventType === 'click' || event.eventType === 'link_click';

const DAY_IN_MS = 86400000;

export const periodDays: Record<Exclude<StatisticsPeriod, 'all'>, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
};

export const parseStatisticsDate = (value?: string | number | null): number | null => {
  if (value === undefined || value === null || value === '') return null;
  const timestamp = typeof value === 'number' ? value : Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : null;
};

const startOfDay = (value: number) => {
  const date = new Date(value);
  date.setHours(0, 0, 0, 0);
  return date.getTime();
};

export const getStatisticsWindow = (
  period: StatisticsPeriod,
  now = Date.now(),
): StatisticsWindow => {
  if (period === 'all') return { start: null, end: null };
  const end = startOfDay(now) + DAY_IN_MS;
  return { start: end - periodDays[period] * DAY_IN_MS, end };
};

export const filterStatisticsEvents = (
  events: PublicAnalyticsEvent[],
  window: StatisticsWindow,
): PublicAnalyticsEvent[] => {
  if (window.start === null || window.end === null) return events;
  return events.filter((event) => {
    const timestamp = parseStatisticsDate(event.createdAt);
    return timestamp !== null && timestamp >= window.start! && timestamp < window.end!;
  });
};

export const filterStatisticsItems = <T>(
  items: T[],
  getDate: (item: T) => string | number | null | undefined,
  window: StatisticsWindow,
): T[] => {
  if (window.start === null || window.end === null) return items;
  return items.filter((item) => {
    const timestamp = parseStatisticsDate(getDate(item));
    return timestamp !== null && timestamp >= window.start! && timestamp < window.end!;
  });
};

export const countUniqueVisitors = (events: PublicAnalyticsEvent[]): number => {
  const views = events.filter(isViewEvent);
  const visitorIds = new Set(views.map((event) => event.visitorId).filter(Boolean));
  return visitorIds.size || views.length;
};

export const getPreviousStatisticsWindow = (
  period: StatisticsPeriod,
  now = Date.now(),
): StatisticsWindow => {
  const current = getStatisticsWindow(period, now);
  if (current.start === null || current.end === null) return current;
  const duration = current.end - current.start;
  return { start: current.start - duration, end: current.start };
};

export const getPercentageChange = (current: number, previous: number): number | null => {
  if (previous === 0) return current === 0 ? 0 : null;
  return ((current - previous) / previous) * 100;
};

const formatChartLabel = (timestamp: number) =>
  new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });

export const buildStatisticsChart = (
  events: PublicAnalyticsEvent[],
  period: StatisticsPeriod,
  now = Date.now(),
): StatisticsChartPoint[] => {
  const datedEvents = events
    .map((event) => ({ event, timestamp: parseStatisticsDate(event.createdAt) }))
    .filter(
      (item): item is { event: PublicAnalyticsEvent; timestamp: number } => item.timestamp !== null,
    );

  if (datedEvents.length === 0) return [];

  let start: number;
  let bucketCount: number;
  let bucketSize: number;

  if (period === 'all') {
    const firstDay = startOfDay(Math.min(...datedEvents.map((item) => item.timestamp)));
    const lastDay = startOfDay(Math.max(...datedEvents.map((item) => item.timestamp)));
    const span = Math.max(lastDay - firstDay, 0);
    bucketCount = Math.min(30, Math.floor(span / DAY_IN_MS) + 1);
    bucketSize = Math.max(1, Math.ceil((span / DAY_IN_MS + 1) / bucketCount)) * DAY_IN_MS;
    start = firstDay;
  } else {
    const window = getStatisticsWindow(period, now);
    start = window.start!;
    bucketCount = period === '90d' ? 30 : periodDays[period];
    bucketSize = (periodDays[period] / bucketCount) * DAY_IN_MS;
  }

  return Array.from({ length: bucketCount }, (_, index) => {
    const bucketStart = start + index * bucketSize;
    const bucketEnd = bucketStart + bucketSize;
    const bucketEvents = datedEvents.filter(
      (item) => item.timestamp >= bucketStart && item.timestamp < bucketEnd,
    );
    return {
      label: formatChartLabel(bucketStart),
      visits: bucketEvents.filter((item) => isViewEvent(item.event)).length,
      clicks: bucketEvents.filter((item) => isClickEvent(item.event)).length,
    };
  });
};
