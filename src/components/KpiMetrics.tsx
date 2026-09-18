import React from 'react';
import { Eye, Link as LinkIcon, Users, Target, ArrowUp } from 'lucide-react';

export interface KpiData {
  visits: number;
  visitsGrowth: number;
  ctrGeneral: number;

  clicks: number;
  clicksGrowth: number;
  clickRate: number;

  leads: number;
  leadsGrowth: number;
  leadConversionRate: number;

  conversions: number;
  conversionsGrowth: number;
  finalConversionRate: number;
}

interface KpiMetricsProps {
  data?: KpiData;
}

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  data = {
    visits: 0,
    visitsGrowth: 0,
    ctrGeneral: 0,

    clicks: 0,
    clicksGrowth: 0,
    clickRate: 0,

    leads: 0,
    leadsGrowth: 0,
    leadConversionRate: 0,

    conversions: 0,
    conversionsGrowth: 0,
    finalConversionRate: 0,
  },
}) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {/* Card 1: Visitas à página */}
      <div
        id="kpi-card-visits"
        className="flex flex-col justify-between bg-white rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 hover:shadow-md transition-all group"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3E6] flex items-center justify-center text-[#FF7A00]">
                <Eye className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#464555]">
                Visitas à página
              </span>
            </div>
            <span className="text-[#FF7A00]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-3xl sm:text-[32px] font-bold text-[#131b2e] leading-none tracking-tight">
                {data.visits.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#464555] mt-1.5 font-medium">
                {data.visitsGrowth > 0 ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-[#006e4b]" />
                    <span className="text-[#006e4b] font-semibold">+{data.visitsGrowth}%</span> nos últimos 7 dias
                  </>
                ) : (
                  <span>Últimos 7 dias</span>
                )}
              </span>
            </div>

            {/* Sparkline Orange */}
            <div className="w-20 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d={data.visits > 0 ? "M0,32 Q20,28 35,20 T70,8 L80,6" : "M0,25 L80,25"}
                  fill="none"
                  stroke="#FF7A00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  strokeDasharray={data.visits > 0 ? "none" : "3 3"}
                />
                <circle cx="80" cy={data.visits > 0 ? 6 : 25} fill="#FF7A00" r="3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
          <span className="text-[11px] text-[#464555]">CTR (clique geral)</span>
          <span className="text-[11px] font-bold text-[#131b2e]">
            {data.ctrGeneral.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      </div>

      {/* Card 2: Cliques nos links */}
      <div
        id="kpi-card-clicks"
        className="flex flex-col justify-between bg-white rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 hover:shadow-md transition-all group"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E6F8F3] flex items-center justify-center text-[#10B981]">
                <LinkIcon className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#464555]">
                Cliques nos links
              </span>
            </div>
            <span className="text-[#10B981]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-3xl sm:text-[32px] font-bold text-[#131b2e] leading-none tracking-tight">
                {data.clicks.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#464555] mt-1.5 font-medium">
                {data.clicksGrowth > 0 ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-[#006e4b]" />
                    <span className="text-[#006e4b] font-semibold">+{data.clicksGrowth}%</span> nos últimos 7 dias
                  </>
                ) : (
                  <span>Últimos 7 dias</span>
                )}
              </span>
            </div>

            {/* Sparkline Green */}
            <div className="w-20 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d={data.clicks > 0 ? "M0,34 Q25,30 45,16 T75,10 L80,8" : "M0,25 L80,25"}
                  fill="none"
                  stroke="#10B981"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  strokeDasharray={data.clicks > 0 ? "none" : "3 3"}
                />
                <circle cx="80" cy={data.clicks > 0 ? 8 : 25} fill="#10B981" r="3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
          <span className="text-[11px] text-[#464555]">Taxa de clique</span>
          <span className="text-[11px] font-bold text-[#131b2e]">
            {data.clickRate.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      </div>

      {/* Card 3: Leads capturados */}
      <div
        id="kpi-card-leads"
        className="flex flex-col justify-between bg-white rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 hover:shadow-md transition-all group"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#E0F2FE] flex items-center justify-center text-[#0284C7]">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#464555]">
                Leads capturados
              </span>
            </div>
            <span className="text-[#0284C7]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-3xl sm:text-[32px] font-bold text-[#131b2e] leading-none tracking-tight">
                {data.leads.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#464555] mt-1.5 font-medium">
                {data.leadsGrowth > 0 ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-[#006e4b]" />
                    <span className="text-[#006e4b] font-semibold">+{data.leadsGrowth}%</span> nos últimos 7 dias
                  </>
                ) : (
                  <span>Últimos 7 dias</span>
                )}
              </span>
            </div>

            {/* Sparkline Blue/Teal */}
            <div className="w-20 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d={data.leads > 0 ? "M0,30 Q20,32 40,22 T65,14 L80,10" : "M0,25 L80,25"}
                  fill="none"
                  stroke="#0284C7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  strokeDasharray={data.leads > 0 ? "none" : "3 3"}
                />
                <circle cx="80" cy={data.leads > 0 ? 10 : 25} fill="#0284C7" r="3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
          <span className="text-[11px] text-[#464555]">Conversão (visita → lead)</span>
          <span className="text-[11px] font-bold text-[#131b2e]">
            {data.leadConversionRate.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      </div>

      {/* Card 4: Conversões */}
      <div
        id="kpi-card-conversions"
        className="flex flex-col justify-between bg-white rounded-2xl p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] border border-[#eaedff]/60 hover:shadow-md transition-all group"
      >
        <div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FFF3E6] flex items-center justify-center text-[#FF7A00]">
                <Target className="w-5 h-5" />
              </div>
              <span className="text-xs font-medium text-[#464555]">
                Conversões
              </span>
            </div>
            <span className="text-[#FF7A00]">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </span>
          </div>

          <div className="flex items-baseline justify-between mt-4">
            <div className="flex flex-col">
              <span className="text-3xl sm:text-[32px] font-bold text-[#131b2e] leading-none tracking-tight">
                {data.conversions.toLocaleString('pt-BR')}
              </span>
              <span className="flex items-center gap-1 text-[11px] text-[#464555] mt-1.5 font-medium">
                {data.conversionsGrowth > 0 ? (
                  <>
                    <ArrowUp className="w-3.5 h-3.5 text-[#006e4b]" />
                    <span className="text-[#006e4b] font-semibold">+{data.conversionsGrowth}%</span> nos últimos 7 dias
                  </>
                ) : (
                  <span>Últimos 7 dias</span>
                )}
              </span>
            </div>

            {/* Sparkline Orange */}
            <div className="w-20 h-10 shrink-0">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 80 40">
                <path
                  d={data.conversions > 0 ? "M0,32 Q25,35 48,20 T72,14 L80,6" : "M0,25 L80,25"}
                  fill="none"
                  stroke="#FF7A00"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  strokeDasharray={data.conversions > 0 ? "none" : "3 3"}
                />
                <circle cx="80" cy={data.conversions > 0 ? 6 : 25} fill="#FF7A00" r="3" />
              </svg>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 mt-4 bg-[#f2f3ff]/70 -mx-4 -mb-4 px-4 py-2 rounded-b-2xl">
          <span className="text-[11px] text-[#464555]">Conversão final (venda)</span>
          <span className="text-[11px] font-bold text-[#131b2e]">
            {data.finalConversionRate.toFixed(1).replace('.', ',')}%
          </span>
        </div>
      </div>
    </div>
  );
};
