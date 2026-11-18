import React, { useMemo, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import type { BioLink } from '../types';
import type { PublicAnalyticsEvent } from '../supabase/services/publicAnalyticsService';
import {
  countEventsByTarget,
  filterStatisticsEvents,
  getStatisticsWindow,
} from '../utils/statistics';

interface ClicksByLinkChartProps {
  links?: BioLink[];
  events?: PublicAnalyticsEvent[];
  eventsAvailable?: boolean;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export const ClicksByLinkChart: React.FC<ClicksByLinkChartProps> = ({
  links = [],
  events = [],
  eventsAvailable = false,
}) => {
  const [now] = useState(() => Date.now());
  const window = useMemo(() => getStatisticsWindow('7d', now), [now]);
  const periodEvents = useMemo(
    () =>
      filterStatisticsEvents(events, window).filter(
        (event) => event.eventType === 'click' || event.eventType === 'link_click',
      ),
    [events, window],
  );
  const clicksByTarget = useMemo(
    () =>
      countEventsByTarget(
        periodEvents,
        periodEvents.map((event) => event.eventType),
      ),
    [periodEvents],
  );
  const activeLinks = useMemo(
    () =>
      links
        .map((link) => ({ ...link, periodClicks: clicksByTarget.get(link.id) ?? 0 }))
        .filter((link) => link.periodClicks > 0)
        .sort((first, second) => second.periodClicks - first.periodClicks)
        .slice(0, 4),
    [clicksByTarget, links],
  );
  const maxClicks = Math.max(...activeLinks.map((link) => link.periodClicks), 1);

  const emptyMessage = eventsAvailable
    ? 'Ainda não há cliques atribuídos a links nos últimos 7 dias.'
    : 'Analytics indisponível. Não é possível comparar cliques por link.';

  return (
    <section
      id="chart-clicks-by-link-card"
      aria-labelledby="clicks-by-link-title"
      className="flex flex-col justify-between rounded-2xl border border-[#eaedff]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] sm:p-5"
    >
      <div className="flex flex-col justify-between gap-3 border-b border-[#f1f2f8] pb-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#E6F8F3] text-[#10B981]">
            <BarChart3 aria-hidden="true" className="h-4 w-4" />
          </div>
          <div className="flex flex-col">
            <h2 id="clicks-by-link-title" className="text-base font-bold text-[#131b2e]">
              Cliques por link
            </h2>
            <span className="text-xs text-[#464555]">Últimos 7 dias · eventos reais</span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs">
          <span className="h-2.5 w-2.5 rounded-sm bg-[#10B981]" aria-hidden="true" />
          <span className="font-medium text-[#464555]">Cliques atribuídos</span>
        </div>
      </div>

      <div className="relative flex h-64 w-full items-center justify-center pt-2">
        {activeLinks.length > 0 ? (
          <div className="flex h-full w-full items-end gap-3 overflow-x-auto rounded-xl bg-[#faf8ff] px-4 pb-8 pt-5 sm:gap-5">
            {activeLinks.map((link) => (
              <div
                key={link.id}
                className="group relative flex h-full min-w-[56px] flex-1 flex-col items-center justify-end"
              >
                <span className="mb-1 text-[11px] font-bold text-[#131b2e]">
                  {formatNumber(link.periodClicks)}
                </span>
                <div
                  className="min-h-1 w-full max-w-12 rounded-t-md bg-[#10B981] transition-all group-hover:brightness-110"
                  style={{ height: `${(link.periodClicks / maxClicks) * 78}%` }}
                  title={`${formatNumber(link.periodClicks)} cliques`}
                />
                <span
                  className="absolute -bottom-6 max-w-full truncate text-[10px] font-semibold text-[#464555]"
                  title={link.title}
                >
                  {link.title}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center rounded-2xl border border-dashed border-[#eaedff] bg-[#faf8ff] p-6 text-center">
            <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f3ff] text-[#969cb0]">
              <BarChart3 aria-hidden="true" className="h-5 w-5" />
            </div>
            <p className="text-xs font-bold text-[#131b2e]">
              {eventsAvailable ? 'Sem cliques no período' : 'Dados indisponíveis'}
            </p>
            <p className="mt-1 max-w-xs text-[11px] text-[#777587]">{emptyMessage}</p>
          </div>
        )}
      </div>
    </section>
  );
};
