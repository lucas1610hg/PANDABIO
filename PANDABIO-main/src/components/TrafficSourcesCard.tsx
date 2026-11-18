import React, { useMemo, useState } from 'react';
import { PieChart } from 'lucide-react';
import type { PublicAnalyticsSummary } from '../supabase/services/publicAnalyticsService';
import {
  filterStatisticsEvents,
  getStatisticsWindow,
  getTrafficSourceName,
  isViewEvent,
} from '../utils/statistics';
import { Card } from './Card';

interface TrafficSourcesCardProps {
  analytics?: PublicAnalyticsSummary;
}

const COLORS = ['#FF7A00', '#10B981', '#3525cd', '#F59E0B', '#969cb0'];
const CIRCUMFERENCE = 2 * Math.PI * 38;

export const TrafficSourcesCard: React.FC<TrafficSourcesCardProps> = ({ analytics }) => {
  const [now] = useState(() => Date.now());
  const eventsAvailable = analytics?.eventsAvailable === true;
  const window = useMemo(() => getStatisticsWindow('7d', now), [now]);
  const visits = useMemo(
    () => filterStatisticsEvents(analytics?.events ?? [], window).filter(isViewEvent),
    [analytics?.events, window],
  );
  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    visits.forEach((event) => {
      const source = getTrafficSourceName(event);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });

    const sorted = [...counts.entries()].sort((first, second) => second[1] - first[1]);
    const top = sorted.slice(0, 4);
    const rest = sorted.slice(4).reduce((sum, [, count]) => sum + count, 0);
    if (rest > 0) top.push(['Outros', rest]);
    const total = visits.length;

    return top.map(([name, count], index) => ({
      name,
      count,
      pct: total > 0 ? (count / total) * 100 : 0,
      color: COLORS[index % COLORS.length],
    }));
  }, [visits]);
  const segments = useMemo(() => {
    return sources.map((source, index) => {
      const length = (source.pct / 100) * CIRCUMFERENCE;
      const offset = sources
        .slice(0, index)
        .reduce((sum, previous) => sum + (previous.pct / 100) * CIRCUMFERENCE, 0);
      return {
        ...source,
        dash: `${length} ${CIRCUMFERENCE - length}`,
        offset: -offset,
      };
    });
  }, [sources]);

  return (
    <Card
      id="card-traffic-sources"
      icon={<PieChart aria-hidden="true" className="w-4 h-4" />}
      iconBg="bg-[#FFF3E6]"
      iconColor="text-[#FF7A00]"
      title="Origem do tráfego"
      subtitle="Visitas por UTM ou domínio de referência · últimos 7 dias"
    >
      <div className="relative flex min-h-[140px] items-center justify-center py-2">
        {eventsAvailable && visits.length > 0 ? (
          <>
            <svg
              className="h-32 w-32 -rotate-90"
              viewBox="0 0 100 100"
              role="img"
              aria-label={`Origem das ${visits.length} visitas dos últimos 7 dias`}
            >
              {segments.map((segment) => (
                <circle
                  key={segment.name}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={segment.color}
                  strokeWidth="14"
                  strokeDasharray={segment.dash}
                  strokeDashoffset={segment.offset}
                />
              ))}
            </svg>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-[10px] font-semibold uppercase leading-tight text-[#777587]">
                Visitas
              </span>
              <span className="mt-0.5 text-base font-bold leading-none text-[#131b2e]">
                {visits.length.toLocaleString('pt-BR')}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center p-3 text-center">
            <div className="mb-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-[#f2f3ff] text-[#969cb0]">
              <PieChart aria-hidden="true" className="h-4 w-4" />
            </div>
            <span className="text-xs font-semibold text-[#131b2e]">
              {eventsAvailable ? 'Sem visitas nos últimos 7 dias' : 'Analytics indisponível'}
            </span>
            <span className="mt-0.5 max-w-[190px] text-[10px] text-[#777587]">
              {eventsAvailable
                ? 'A distribuição aparecerá quando sua página receber visitas.'
                : 'Não foi possível carregar as origens das visitas.'}
            </span>
          </div>
        )}
      </div>

      {eventsAvailable && sources.length > 0 && (
        <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between">
              <span className="flex min-w-0 items-center gap-1.5 truncate text-[#464555]">
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: source.color }}
                />
                <span className="truncate" title={source.name}>
                  {source.name}
                </span>
              </span>
              <span className="ml-1 shrink-0 font-bold text-[#131b2e]">
                {source.pct.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%
              </span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
