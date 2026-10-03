import React, { useState } from 'react';
import { BarChart3 } from 'lucide-react';
import { BioLink } from '../types';

interface ClicksByLinkChartProps {
  links?: BioLink[];
}

export const ClicksByLinkChart: React.FC<ClicksByLinkChartProps> = ({ links = [] }) => {
  const [hoveredGroup, setHoveredGroup] = useState<string | null>(null);

  const activeLinks = links.slice(0, 4);
  const maxClicks = Math.max(...activeLinks.map((l) => l.clicks), 10);

  return (
    <div
      id="chart-clicks-by-link-card"
      className="flex flex-col justify-between bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E6F8F3] flex items-center justify-center text-[#10B981]">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-base font-bold text-[#131b2e]">
              Cliques por link
            </h3>
            <span className="text-xs text-[#464555]">Últimos 7 dias</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#10B981]" />
            <span className="text-[#464555] font-medium">Cliques</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-xs bg-[#FF7A00]" />
            <span className="text-[#464555] font-medium">Leads</span>
          </div>
        </div>
      </div>

      {/* SVG Comparative Bars / Empty State */}
      <div className="relative w-full h-64 pt-2 flex items-center justify-center">
        {activeLinks.length > 0 ? (
          <svg className="w-full h-full" preserveAspectRatio="none" viewBox="0 0 540 220">
            {/* Background Grid Lines */}
            <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="45" x2="520" y1="30" y2="30" />
            <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="45" x2="520" y1="75" y2="75" />
            <line stroke="#eaedff" strokeDasharray="3 3" strokeWidth="1" x1="45" x2="520" y1="120" y2="120" />
            <line stroke="#eaedff" strokeWidth="1" x1="45" x2="520" y1="165" y2="165" />

            {/* Y-Axis Values */}
            <text className="text-[11px]" fill="#777587" textAnchor="end" x="35" y="34">{maxClicks}</text>
            <text className="text-[11px]" fill="#777587" textAnchor="end" x="35" y="100">{Math.round(maxClicks / 2)}</text>
            <text className="text-[11px]" fill="#777587" textAnchor="end" x="35" y="169">0</text>

            {/* Dynamic Groups */}
            {activeLinks.map((item, idx) => {
              const posX = 75 + idx * 115;
              const clickBarHeight = maxClicks > 0 ? Math.max((item.clicks / maxClicks) * 120, 6) : 6;
              const leadBarHeight = maxClicks > 0 ? Math.max((item.leads / maxClicks) * 120, 4) : 4;

              return (
                <g
                  key={item.id}
                  transform={`translate(${posX}, 0)`}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredGroup(item.title)}
                  onMouseLeave={() => setHoveredGroup(null)}
                >
                  <text
                    className="text-[11px] font-bold"
                    fill="#131b2e"
                    textAnchor="middle"
                    x="11"
                    y={160 - clickBarHeight}
                  >
                    {item.clicks}
                  </text>

                  <rect
                    className="transition-all duration-200"
                    fill="#10B981"
                    height={clickBarHeight}
                    rx="4"
                    width="22"
                    x="0"
                    y={165 - clickBarHeight}
                  />

                  <rect
                    className="transition-all duration-200"
                    fill="#FF7A00"
                    height={leadBarHeight}
                    rx="4"
                    width="14"
                    x="26"
                    y={165 - leadBarHeight}
                  />

                  <text
                    className="text-[11px] font-semibold"
                    fill="#464555"
                    textAnchor="middle"
                    x="20"
                    y="188"
                  >
                    {item.title.length > 10 ? `${item.title.slice(0, 9)}…` : item.title}
                  </text>
                </g>
              );
            })}
          </svg>
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 bg-[#faf8ff] rounded-2xl border border-dashed border-[#eaedff] w-full h-full">
            <div className="w-10 h-10 rounded-full bg-[#f2f3ff] flex items-center justify-center text-[#969cb0] mb-2">
              <BarChart3 className="w-5 h-5" />
            </div>
            <p className="text-xs sm:text-sm font-bold text-[#131b2e]">
              Nenhum link com cliques ainda
            </p>
            <p className="text-[11px] text-[#777587] max-w-xs mt-1">
              Adicione links à sua bio para ver a comparação de cliques e leads por canal.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
