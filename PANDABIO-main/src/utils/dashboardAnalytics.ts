import type { LeadItem } from '../types';
import type {
  PublicAnalyticsEvent,
  PublicAnalyticsSale,
} from '../supabase/services/publicAnalyticsService';
import {
  filterStatisticsEvents,
  filterStatisticsItems,
  countUniqueVisitors,
  getPercentageChange,
  getPreviousStatisticsWindow,
  getStatisticsWindow,
  isClickEvent,
  isViewEvent,
} from './statistics';

interface DashboardAnalyticsInput {
  events: PublicAnalyticsEvent[];
  eventsAvailable: boolean;
  leads: LeadItem[];
  sales: PublicAnalyticsSale[];
  salesAvailable: boolean;
  now?: number;
}

export function buildDashboardAnalytics({
  events,
  eventsAvailable,
  leads,
  sales,
  salesAvailable,
  now = Date.now(),
}: DashboardAnalyticsInput) {
  const currentWindow = getStatisticsWindow('7d', now);
  const previousWindow = getPreviousStatisticsWindow('7d', now);
  const currentEvents = filterStatisticsEvents(events, currentWindow);
  const previousEvents = filterStatisticsEvents(events, previousWindow);
  const visits = eventsAvailable ? currentEvents.filter(isViewEvent).length : null;
  const previousVisits = eventsAvailable ? previousEvents.filter(isViewEvent).length : null;
  const clicks = eventsAvailable ? currentEvents.filter(isClickEvent).length : null;
  const previousClicks = eventsAvailable ? previousEvents.filter(isClickEvent).length : null;
  const currentLeads = filterStatisticsItems(leads, (lead) => lead.createdAt, currentWindow).length;
  const previousLeads = filterStatisticsItems(
    leads,
    (lead) => lead.createdAt,
    previousWindow,
  ).length;
  const conversions = salesAvailable
    ? filterStatisticsItems(sales, (sale) => sale.createdAt, currentWindow).reduce(
        (sum, sale) => sum + Math.max(sale.quantity, 0),
        0,
      )
    : null;
  const previousConversions = salesAvailable
    ? filterStatisticsItems(sales, (sale) => sale.createdAt, previousWindow).reduce(
        (sum, sale) => sum + Math.max(sale.quantity, 0),
        0,
      )
    : null;

  return {
    kpis: {
      visits,
      visitsGrowth:
        visits === null || previousVisits === null
          ? null
          : getPercentageChange(visits, previousVisits),
      uniqueVisitors: eventsAvailable ? countUniqueVisitors(currentEvents) : null,
      clicks,
      clicksGrowth:
        clicks === null || previousClicks === null
          ? null
          : getPercentageChange(clicks, previousClicks),
      clickRate:
        visits === null || clicks === null || visits === 0 ? null : (clicks / visits) * 100,
      leads: currentLeads,
      leadsGrowth: getPercentageChange(currentLeads, previousLeads),
      leadConversionRate: visits === null || visits === 0 ? null : (currentLeads / visits) * 100,
      conversions,
      conversionsGrowth:
        conversions === null || previousConversions === null
          ? null
          : getPercentageChange(conversions, previousConversions),
      finalConversionRate:
        conversions === null || clicks === null
          ? null
          : clicks > 0
            ? (conversions / clicks) * 100
            : null,
    },
    funnel: {
      visits,
      clicks,
      leads: currentLeads,
      conversions,
      ctr: visits === null || clicks === null || visits === 0 ? null : (clicks / visits) * 100,
      leadRate: clicks === null || clicks === 0 ? null : (currentLeads / clicks) * 100,
      conversionRate:
        clicks === null || conversions === null
          ? null
          : clicks > 0
            ? (conversions / clicks) * 100
            : null,
      leadToConversionRate:
        conversions === null || currentLeads === 0 ? null : (conversions / currentLeads) * 100,
    },
  };
}
