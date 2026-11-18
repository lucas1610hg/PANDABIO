import React, { useMemo, useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';
import type { PublicAnalyticsEvent } from '../supabase/services/publicAnalyticsService';
import {
  buildStatisticsChart,
  filterStatisticsEvents,
  getStatisticsWindow,
  parseStatisticsDate,
} from '../utils/statistics';
import type { StatisticsPeriod } from '../utils/statistics';

type Timeframe = StatisticsPeriod;

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
};

interface VisitsChartProps {
  totalVisits?: number | null;
  events?: PublicAnalyticsEvent[];
  eventsAvailable?: boolean;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');

export const VisitsChart: React.FC<VisitsChartProps> = ({
  totalVisits = 0,
  events = [],
  eventsAvailable = false,
}) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');
  const [now] = useState(() => Date.now());
  const chart = useMemo(() => {
    const window = getStatisticsWindow(timeframe, now);
    const periodEvents = filterStatisticsEvents(events, window);
    return buildStatisticsChart(periodEvents, timeframe, now);
  }, [events, timeframe, now]);
  const periodVisits = chart.reduce((sum, point) => sum + point.visits, 0);
  const hasData = chart.length > 0;
  const hasDatedHistory = events.some((event) => parseStatisticsDate(event.createdAt) !== null);

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const width = 540;
    const top = 30;
    const bottom = 165;
    const paddingLeft = 60;
    const paddingRight = 25;
    const maxValue = Math.max(...chart.map((point) => point.visits), 1);
    const stepX = chart.length > 1 ? (width - paddingLeft - paddingRight) / (chart.length - 1) : 0;
    const points = chart.map((point, index) => ({
      x: paddingLeft + index * stepX,
      y: bottom - (point.visits / maxValue) * (bottom - top),
    }));
    const linePath = points
      .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x},${point.y}`)
      .join(' ');
    const areaPath =
      points.length > 0
        ? `${linePath} L ${points[points.length - 1].x},${bottom} L ${points[0].x},${bottom} Z`
        : '';

    return { linePath, areaPath, lastPoint: points[points.length - 1] };
  }, [chart]);

  return (
    <div
      id="chart-visits-card"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3E6] flex items-center justify-center text-[#FF7A00]">
            <TrendingUp aria-hidden="true" className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-base font-bold text-[#131b2e]">Visitas à página</h2>
            <span className="text-xs text-[#464555]">{TIMEFRAME_LABEL[timeframe]}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto max-w-full">
          <div className="inline-flex p-1 bg-[#f2f3ff] rounded-xl text-[11px] sm:text-xs shrink-0">
            {(['7d', '30d', '90d', 'all'] as const).map((value) => (
              <button
                key={value}
                type="button"
                aria-pressed={timeframe === value}
                onClick={() => setTimeframe(value)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  timeframe === value
                    ? 'bg-[#FF7A00] text-white shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                {value === 'all'
                  ? 'Tudo'
                  : value === '7d'
                    ? '7 dias'
                    : value === '30d'
                      ? '30 dias'
                      : '90 dias'}
              </button>
            ))}
          </div>

          <div className="hidden xl:flex flex-col items-end pl-2">
            <span className="text-base font-bold text-[#131b2e] leading-none">
              {hasData ? formatNumber(periodVisits) : '—'}
            </span>
            <span className="text-xs text-[#464555]">
              {hasData ? 'Visitas no período' : 'Série temporal indisponível'}
            </span>
          </div>
        </div>
      </div>

      <div
        className="relative w-full h-64 pt-2 flex items-center justify-center"
        role="img"
        aria-label={
          hasData
            ? `Gráfico de visitas — ${TIMEFRAME_LABEL[timeframe]}: ${formatNumber(periodVisits)} visitas`
            : `Gráfico de visitas — ${TIMEFRAME_LABEL[timeframe]}: sem dados por período`
        }
      >
        {hasData ? (
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 540 220">
            <defs>
              <linearGradient id="orangeGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
              </linearGradient>
            </defs>
            <line
              stroke="#eaedff"
              strokeDasharray="3 3"
              strokeWidth="1"
              x1="45"
              x2="520"
              y1="45"
              y2="45"
            />
            <line
              stroke="#eaedff"
              strokeDasharray="3 3"
              strokeWidth="1"
              x1="45"
              x2="520"
              y1="105"
              y2="105"
            />
            <line stroke="#eaedff" strokeWidth="1" x1="45" x2="520" y1="165" y2="165" />
            <path d={areaPath} fill="url(#orangeGradient)" />
            <path
              d={linePath}
              fill="none"
              stroke="#FF7A00"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            {lastPoint && (
              <circle
                cx={lastPoint.x}
                cy={lastPoint.y}
                r="5"
                fill="#FF7A00"
                stroke="#ffffff"
                strokeWidth="2"
              />
            )}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[#faf8ff] rounded-2xl border border-dashed border-[#eaedff] w-full h-full">
            <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#969cb0] mb-2">
              <BarChart2 aria-hidden="true" className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#131b2e]">
              {hasDatedHistory
                ? 'Sem visitas neste período'
                : !eventsAvailable
                  ? 'Analytics indisponível'
                  : totalVisits !== null && totalVisits > 0
                    ? 'Histórico por período indisponível'
                    : 'Aguardando primeiras visitas'}
            </p>
            <p className="text-[11px] text-[#777587] max-w-xs mt-1">
              {hasDatedHistory
                ? 'Não houve visitas nesse intervalo. Amplie o período para consultar o histórico.'
                : !eventsAvailable
                  ? 'Não foi possível carregar o histórico de eventos. Tente novamente mais tarde.'
                  : totalVisits !== null && totalVisits > 0
                    ? `Há ${formatNumber(totalVisits)} visitas acumuladas, mas ainda não existe histórico por data para montar o gráfico.`
                    : 'Compartilhe o link da sua bio para acompanhar o gráfico de tráfego.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
