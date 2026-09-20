import React from 'react';
import { Filter, Eye, Link as LinkIcon, Users, Target } from 'lucide-react';
import { FunnelData } from '../types';

interface ConversionFunnelProps {
  data?: FunnelData;
}

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  data = {
    visits: 0,
    clicks: 0,
    leads: 0,
    conversions: 0,
    ctr: 0,
    leadRate: 0,
    conversionRate: 0,
    leadToConversionRate: 0,
  },
}) => {
  return (
    <div
      id="conversion-funnel-card"
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 flex flex-col xl:flex-row xl:items-center justify-between gap-4"
    >
      {/* Title block */}
      <div className="flex items-center gap-3 min-w-[260px]">
        <div className="w-11 h-11 rounded-xl bg-[#FF7A00] text-white flex items-center justify-center shrink-0 shadow-sm">
          <Filter className="w-5 h-5" />
        </div>
        <div className="flex flex-col">
          <h2 className="text-base sm:text-lg font-bold text-[#131b2e] leading-tight">
            Seu funil de conversão
          </h2>
          <p className="text-xs text-[#464555]">
            Acompanhe a jornada dos seus visitantes em tempo real.
          </p>
        </div>
      </div>

      {/* Funnel Pipeline Steps */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 w-full xl:w-auto xl:flex-1">
        {/* Step 1: Visitas */}
        <div className="flex items-center gap-2 bg-[#f2f3ff] p-2.5 sm:px-3 sm:py-2 rounded-xl justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#FFF3E6] text-[#FF7A00] flex items-center justify-center shrink-0">
              <Eye className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#131b2e] leading-none truncate">
                {data.visits.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-[#464555] uppercase tracking-wider font-semibold truncate">
                Visitas
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#464555] font-semibold shrink-0">
            {data.visits > 0 ? `${data.ctr.toFixed(1).replace('.', ',')}%` : '0%'}
          </span>
        </div>

        {/* Step 2: Cliques */}
        <div className="flex items-center gap-2 bg-[#f2f3ff] p-2.5 sm:px-3 sm:py-2 rounded-xl justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#E6F8F3] text-[#10B981] flex items-center justify-center shrink-0">
              <LinkIcon className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#131b2e] leading-none truncate">
                {data.clicks.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-[#464555] uppercase tracking-wider font-semibold truncate">
                Cliques
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#464555] font-semibold shrink-0">
            {data.clicks > 0 ? `${data.leadRate.toFixed(1).replace('.', ',')}%` : '0%'}
          </span>
        </div>

        {/* Step 3: Leads */}
        <div className="flex items-center gap-2 bg-[#f2f3ff] p-2.5 sm:px-3 sm:py-2 rounded-xl justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-[#131b2e] leading-none truncate">
                {data.leads.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-[#464555] uppercase tracking-wider font-semibold truncate">
                Leads
              </span>
            </div>
          </div>
          <span className="text-[11px] text-[#464555] font-semibold shrink-0">
            {data.leads > 0 ? `${data.leadToConversionRate.toFixed(1).replace('.', ',')}%` : '0%'}
          </span>
        </div>

        {/* Step 4: Conversões */}
        <div className="flex items-center gap-2 bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-white p-2.5 sm:px-3.5 sm:py-2 rounded-xl shadow-[0_2px_8px_rgba(255,122,0,0.25)] justify-between min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-white/20 text-white flex items-center justify-center shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-xs sm:text-sm font-bold text-white leading-none truncate">
                {data.conversions.toLocaleString('pt-BR')}
              </span>
              <span className="text-[10px] text-orange-100 uppercase tracking-wider font-semibold truncate">
                Conversões
              </span>
            </div>
          </div>
          <span className="text-[11px] text-white font-bold shrink-0">
            {data.conversions > 0 ? 'Ativo' : '0'}
          </span>
        </div>
      </div>
    </div>
  );
};
