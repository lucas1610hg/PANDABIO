import React from 'react';
import { PieChart, Smartphone, Laptop } from 'lucide-react';
import { BioLink } from '../types';

interface TrafficSourcesCardProps {
  links?: BioLink[];
}

export const TrafficSourcesCard: React.FC<TrafficSourcesCardProps> = ({ links = [] }) => {
  const totalClicks = links.reduce((acc, l) => acc + (l.clicks || 0), 0);
  const hasTraffic = totalClicks > 0;

  // Derive sources from active links or empty
  const sources = hasTraffic
    ? links.slice(0, 4).map((l, i) => {
        const pct = totalClicks > 0 ? Math.round((l.clicks / totalClicks) * 100) : 0;
        const colors = ['#FF7A00', '#10B981', '#3525cd', '#F59E0B'];
        return {
          name: l.title,
          pct,
          color: colors[i % colors.length],
        };
      })
    : [];

  return (
    <div
      id="card-traffic-sources"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div>
        <div className="flex items-center justify-between pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFF3E6] text-[#FF7A00] flex items-center justify-center">
              <PieChart className="w-4 h-4" />
            </div>
            <div className="flex flex-col">
              <h4 className="text-sm font-bold text-[#131b2e] leading-tight">
                Fontes de tráfego
              </h4>
              <span className="text-[11px] text-[#464555]">
                Origem dos visitantes
              </span>
            </div>
          </div>
        </div>

        {/* SVG Donut Chart / Clean State */}
        <div className="flex items-center justify-center py-2 relative min-h-[140px]">
          {hasTraffic ? (
            <>
              <svg className="w-32 h-32 transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#FF7A00"
                  strokeWidth="14"
                  strokeDasharray="180 238"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="38"
                  fill="none"
                  stroke="#10B981"
                  strokeWidth="14"
                  strokeDasharray="58 238"
                  strokeDashoffset="-180"
                />
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
              <span className="text-xs font-semibold text-[#131b2e]">
                Nenhum tráfego computado
              </span>
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
      </div>

      {/* Device Split Row */}
      <div className="flex items-center justify-around pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl text-xs">
        <div className="flex items-center gap-1.5 text-[#464555]">
          <Smartphone className="w-4 h-4 text-[#FF7A00]" />
          <span>
            Mobile: <strong className="text-[#131b2e]">{hasTraffic ? '100%' : '0%'}</strong>
          </span>
        </div>
        <span className="text-[#c7c4d8]">•</span>
        <div className="flex items-center gap-1.5 text-[#464555]">
          <Laptop className="w-4 h-4 text-[#777587]" />
          <span>
            Desktop: <strong className="text-[#131b2e]">0%</strong>
          </span>
        </div>
      </div>
    </div>
  );
};
