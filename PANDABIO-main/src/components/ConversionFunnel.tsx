import React from 'react';
import { Filter, Eye, Link as LinkIcon, Users, Target } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import type { FunnelData } from '../types';

interface ConversionFunnelProps {
  data?: FunnelData;
}

interface FunnelStep {
  label: string;
  value: number | null;
  rate: number | null;
  rateLabel: string;
  icon: LucideIcon;
  iconBackground: string;
  iconColor: string;
  highlighted?: boolean;
}

const formatNumber = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('pt-BR');

const formatRate = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(1).replace('.', ',')}%`;

export const ConversionFunnel: React.FC<ConversionFunnelProps> = ({
  data = {
    visits: null,
    clicks: null,
    leads: 0,
    conversions: null,
    ctr: null,
    leadRate: null,
    conversionRate: null,
    leadToConversionRate: null,
  },
}) => {
  const steps: FunnelStep[] = [
    {
      label: 'Visitas',
      value: data.visits,
      rate: data.ctr,
      rateLabel: 'cliques / visitas',
      icon: Eye,
      iconBackground: 'bg-[#FFF3E6]',
      iconColor: 'text-[#FF7A00]',
    },
    {
      label: 'Cliques',
      value: data.clicks,
      rate: data.leadRate,
      rateLabel: 'leads / cliques',
      icon: LinkIcon,
      iconBackground: 'bg-[#E6F8F3]',
      iconColor: 'text-[#10B981]',
    },
    {
      label: 'Leads',
      value: data.leads,
      rate: data.leadToConversionRate,
      rateLabel: 'vendas / leads',
      icon: Users,
      iconBackground: 'bg-[#E0F2FE]',
      iconColor: 'text-[#0284C7]',
    },
    {
      label: 'Vendas',
      value: data.conversions,
      rate: data.conversionRate,
      rateLabel: 'vendas / cliques',
      icon: Target,
      iconBackground: 'bg-white/20',
      iconColor: 'text-white',
      highlighted: true,
    },
  ];

  return (
    <section
      id="conversion-funnel-card"
      aria-labelledby="conversion-funnel-title"
      className="flex flex-col justify-between gap-4 rounded-2xl border border-[#eaedff]/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] sm:p-5 xl:flex-row xl:items-center"
    >
      <div className="flex min-w-0 items-center gap-3 xl:min-w-[260px]">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#FF7A00] text-white shadow-sm">
          <Filter aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="flex min-w-0 flex-col">
          <h2
            id="conversion-funnel-title"
            className="text-base font-bold leading-tight text-[#131b2e] sm:text-lg"
          >
            Seu funil de conversão
          </h2>
          <p className="text-xs text-[#464555]">Resultados dos últimos 7 dias.</p>
        </div>
      </div>

      <div className="grid w-full grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 xl:flex-1">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.label}
              className={`flex min-w-0 items-center justify-between gap-2 rounded-xl p-2.5 sm:px-3 sm:py-2 ${
                step.highlighted
                  ? 'bg-gradient-to-r from-[#FF7A00] to-[#FF5500] text-white shadow-[0_2px_8px_rgba(255,122,0,0.25)]'
                  : 'bg-[#f2f3ff]'
              }`}
            >
              <div className="flex min-w-0 items-center gap-2">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${step.iconBackground} ${step.iconColor}`}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                </div>
                <div className="flex min-w-0 flex-col">
                  <span
                    className={`truncate text-xs font-bold leading-none sm:text-sm ${
                      step.highlighted ? 'text-white' : 'text-[#131b2e]'
                    }`}
                  >
                    {formatNumber(step.value)}
                  </span>
                  <span
                    className={`truncate text-[10px] font-semibold uppercase tracking-wider ${
                      step.highlighted ? 'text-orange-100' : 'text-[#464555]'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
              </div>
              <span
                className={`shrink-0 text-[11px] font-semibold ${
                  step.highlighted ? 'text-white' : 'text-[#464555]'
                }`}
                aria-label={`${step.rateLabel}: ${formatRate(step.rate)}`}
                title={step.rateLabel}
              >
                {formatRate(step.rate)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
};
