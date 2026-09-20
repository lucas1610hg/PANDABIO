import React, { useMemo } from 'react';
import { PieChart, Smartphone, Laptop } from 'lucide-react';
import { BioLink } from '../types';
import { Card } from './Card';

interface TrafficSourcesCardProps {
  links?: BioLink[];
}

const COLORS = ['#FF7A00', '#10B981', '#3525cd', '#F59E0B'];

export const TrafficSourcesCard: React.FC<TrafficSourcesCardProps> = ({ links = [] }) => {
  const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
  const hasTraffic = totalClicks > 0;

  // Fontes derivadas dos links, ordenadas por cliques, com segmento "Outros"
  const sources = useMemo(() => {
    if (!hasTraffic) return [] as { name: string; pct: number; pctRaw: number; color: string }[];

    const sorted = [...links]
      .filter((l) => (l.clicks || 0) > 0)
      .sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    const top = sorted.slice(0, 4);
    const shownClicks = top.reduce((s, l) => s + (l.clicks || 0), 0);

    const items = top.map((l, i) => ({
      name: l.title,
      pct: Math.round((l.clicks / totalClicks) * 100),
      pctRaw: (l.clicks / totalClicks) * 100,
      color: COLORS[i % COLORS.length],
    }));

    const rest = totalClicks - shownClicks;
    if (sorted.length > top.length && rest > 0) {
      items.push({
        name: 'Outros',
        pct: Math.round((rest / totalClicks) * 100),
        pctRaw: rest / totalClicks,
        color: '#969cb0',
      });
    }

    return items;
  }, [links, totalClicks, hasTraffic]);

  // Segmentos do donut via stroke-dasharray
  const segments = useMemo(() => {
    const C = 2 * Math.PI * 38;
    return sources.map((s, i) => {
      const prevLen = sources.slice(0, i).reduce((acc, p) => acc + (p.pctRaw / 100) * C, 0);
      const len = (s.pctRaw / 100) * C;
      return { ...s, dash: `${len} ${C - len}`, offset: -prevLen };
    });
  }, [sources]);

  return (
    <Card
      id="card-traffic-sources"
      icon={<PieChart className="w-4 h-4" />}
      iconBg="bg-[#FFF3E6]"
      iconColor="text-[#FF7A00]"
      title="Fontes de tráfego"
      subtitle="Origem dos visitantes"
      footer={
        <div className="flex items-center justify-around pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl text-xs">
          <div className="flex items-center gap-1.5 text-[#464555]">
            <Smartphone className="w-4 h-4 text-[#FF7A00]" />
            <span>
              Mobile: <strong className="text-[#131b2e]">—</strong>
            </span>
          </div>
          <span className="text-[#c7c4d8]">•</span>
          <div className="flex items-center gap-1.5 text-[#464555]">
            <Laptop className="w-4 h-4 text-[#777587]" />
            <span>
              Desktop: <strong className="text-[#131b2e]">—</strong>
            </span>
          </div>
        </div>
      }
    >
      {/* SVG Donut Chart / Clean State */}
      <div className="flex items-center justify-center py-2 relative min-h-[140px]">
        {hasTraffic && segments.length > 0 ? (
          <>
            <svg
              className="w-32 h-32 transform -rotate-90"
              viewBox="0 0 100 100"
              role="img"
              aria-label="Distribuição de cliques por link"
            >
              {segments.map((s) => (
                <circle
                  key={s.name}
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeDasharray={s.dash}
                  strokeDashoffset={s.offset}
                />
              ))}
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-[10px] text-[#777587] leading-tight uppercase font-semibold">
                Cliques
              </span>
              <span className="text-base font-bold text-[#131b2e] leading-none mt-0.5">
                {totalClicks.toLocaleString('pt-BR')}
              </span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-3">
            <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#969cb0] mb-1.5">
              <PieChart className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold text-[#131b2e]">Nenhum tráfego computado</span>
            <span className="text-[10px] text-[#777587] max-w-[170px] mt-0.5">
              O tráfego aparecerá aqui assim que seus links receberem acessos.
            </span>
          </div>
        )}
      </div>

      {/* Sources Breakdown Grid */}
      {hasTraffic && sources.length > 0 && (
        <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2 text-xs">
          {sources.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[#464555] truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="truncate">{item.name}</span>
              </span>
              <span className="font-bold text-[#131b2e] shrink-0 ml-1">{item.pct}%</span>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
