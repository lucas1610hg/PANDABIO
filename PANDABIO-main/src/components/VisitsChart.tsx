import React, { useMemo, useState } from 'react';
import { TrendingUp, BarChart2 } from 'lucide-react';

type Timeframe = '7d' | '30d' | '90d' | '12m';

const TIMEFRAME_POINTS: Record<Timeframe, number> = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '12m': 12,
};

const TIMEFRAME_LABEL: Record<Timeframe, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  '12m': 'Últimos 12 meses',
};

interface VisitsChartProps {
  totalVisits?: number;
}

export const VisitsChart: React.FC<VisitsChartProps> = ({ totalVisits = 0 }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('7d');

  // Distribui o total de visitas em `points` valores que somam totalVisits
  const series = useMemo(() => {
    const points = TIMEFRAME_POINTS[timeframe];
    if (totalVisits <= 0) return Array.from({ length: points }, () => 0);

    const base = totalVisits / points;
    const values = Array.from({ length: points }, (_, i) => {
      const wave = 0.7 + 0.3 * (0.5 + 0.5 * Math.sin((i + 1) * 1.6));
      return base * wave;
    });
    const sum = values.reduce((a, b) => a + b, 0);
    const diff = totalVisits - sum;
    if (points > 0) values[points - 1] = Math.max(0, values[points - 1] + diff);
    return values;
  }, [totalVisits, timeframe]);

  const hasData = totalVisits > 0;

  const { linePath, areaPath, lastPoint } = useMemo(() => {
    const W = 540;
    const top = 30;
    const bottom = 165;
    const padX = 60;
    const padRight = 25;
    const maxVal = Math.max(...series, 1);
    const stepX = series.length > 1 ? (W - padX - padRight) / (series.length - 1) : 0;

    const coords = series.map((v, i) => ({
      x: padX + i * stepX,
      y: bottom - (v / maxVal) * (bottom - top),
    }));

    const linePath = coords.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
    const areaPath =
      coords.length > 0
        ? `${linePath} L ${coords[coords.length - 1].x},${bottom} L ${coords[0].x},${bottom} Z`
        : '';

    return { linePath, areaPath, lastPoint: coords[coords.length - 1] };
  }, [series]);

  return (
    <div
      id="chart-visits-card"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FFF3E6] flex items-center justify-center text-[#FF7A00]">
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-[#131b2e]">Visitas à página</h3>
            <span className="text-xs text-[#464555]">{TIMEFRAME_LABEL[timeframe]}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 overflow-x-auto max-w-full">
          {/* Timeframe buttons */}
          <div className="inline-flex p-1 bg-[#f2f3ff] rounded-xl text-[11px] sm:text-xs shrink-0">
            {(['7d', '30d', '90d', '12m'] as const).map((tf) => (
              <button
                key={tf}
                onClick={() => setTimeframe(tf)}
                className={`px-2 sm:px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  timeframe === tf
                    ? 'bg-[#FF7A00] text-white shadow-xs'
                    : 'text-[#464555] hover:text-[#131b2e]'
                }`}
              >
                {tf === '7d'
                  ? '7 dias'
                  : tf === '30d'
                    ? '30 dias'
                    : tf === '90d'
                      ? '90 dias'
                      : '12 meses'}
              </button>
            ))}
          </div>

          {/* Metric highlight */}
          <div className="hidden xl:flex flex-col items-end pl-2">
            <span className="text-base font-bold text-[#131b2e] leading-none">
              {totalVisits.toLocaleString('pt-BR')}
            </span>
            <span className="text-xs text-[#464555]">
              {hasData ? 'Visitas registradas' : 'Sem visitas'}
            </span>
          </div>
        </div>
      </div>

      {/* SVG Line / Empty state */}
      <div
        className="relative w-full h-64 pt-2 flex items-center justify-center"
        role="img"
        aria-label={`Gráfico de visitas - ${TIMEFRAME_LABEL[timeframe]}`}
      >
        {hasData ? (
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 540 220">
            <defs>
              <linearGradient id="orangeGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#FF7A00" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#FF7A00" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines */}
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
              <BarChart2 className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#131b2e]">
              Aguardando primeiras visitas
            </p>
            <p className="text-[11px] text-[#777587] max-w-xs mt-1">
              Compartilhe o link da sua bio para acompanhar o gráfico de tráfego em tempo real.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
