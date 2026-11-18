import React from 'react';
import {
  ArrowDownRight,
  ArrowUpRight,
  Eye,
  Link as LinkIcon,
  Minus,
  Target,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface KpiData {
  visits: number | null;
  visitsGrowth: number | null;
  uniqueVisitors: number | null;
  clicks: number | null;
  clicksGrowth: number | null;
  clickRate: number | null;
  leads: number;
  leadsGrowth: number | null;
  leadConversionRate: number | null;
  conversions: number | null;
  conversionsGrowth: number | null;
  finalConversionRate: number | null;
}

interface KpiMetricsProps {
  data?: KpiData;
}

interface MetricCardData {
  id: string;
  label: string;
  value: number | null;
  growth: number | null;
  detailLabel: string;
  detailValue: number | null;
  icon: LucideIcon;
  color: string;
  iconBackground: string;
}

const formatNumber = (value: number | null) =>
  value === null ? '—' : value.toLocaleString('pt-BR');

const formatPercentage = (value: number | null) =>
  value === null ? '—' : `${value.toFixed(1).replace('.', ',')}%`;

const GrowthIndicator: React.FC<{ value: number | null; metricAvailable: boolean }> = ({
  value,
  metricAvailable,
}) => {
  if (!metricAvailable) {
    return <span className="text-neutral-gray">Dados indisponíveis</span>;
  }
  if (value === null) {
    return <span className="text-neutral-gray">Sem base comparativa</span>;
  }

  const isPositive = value > 0;
  const isNegative = value < 0;
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;
  const colorClass = isPositive
    ? 'text-secondary-green-dark'
    : isNegative
      ? 'text-red-600'
      : 'text-neutral-gray';
  const sign = isPositive ? '+' : '';

  return (
    <span className={`inline-flex items-center gap-0.5 ${colorClass}`}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      <span className="font-semibold">
        {sign}
        {value.toFixed(1).replace('.', ',')}%
      </span>
      <span>vs. 7 dias anteriores</span>
    </span>
  );
};

export const KpiMetrics: React.FC<KpiMetricsProps> = ({
  data = {
    visits: null,
    visitsGrowth: null,
    uniqueVisitors: null,
    clicks: null,
    clicksGrowth: null,
    clickRate: null,
    leads: 0,
    leadsGrowth: null,
    leadConversionRate: null,
    conversions: null,
    conversionsGrowth: null,
    finalConversionRate: null,
  },
}) => {
  const metrics: MetricCardData[] = [
    {
      id: 'kpi-card-visits',
      label: 'Visitas à página',
      value: data.visits,
      growth: data.visitsGrowth,
      detailLabel: 'Visitantes únicos',
      detailValue: data.uniqueVisitors,
      icon: Eye,
      color: 'text-primary-orange',
      iconBackground: 'bg-primary-orange-light',
    },
    {
      id: 'kpi-card-clicks',
      label: 'Cliques nos links',
      value: data.clicks,
      growth: data.clicksGrowth,
      detailLabel: 'CTR (cliques / visitas)',
      detailValue: data.clickRate,
      icon: LinkIcon,
      color: 'text-secondary-green',
      iconBackground: 'bg-secondary-green-light',
    },
    {
      id: 'kpi-card-leads',
      label: 'Leads capturados',
      value: data.leads,
      growth: data.leadsGrowth,
      detailLabel: 'Conversão (visita → lead)',
      detailValue: data.leadConversionRate,
      icon: Users,
      color: 'text-secondary-teal',
      iconBackground: 'bg-secondary-teal-light',
    },
    {
      id: 'kpi-card-conversions',
      label: 'Vendas registradas',
      value: data.conversions,
      growth: data.conversionsGrowth,
      detailLabel: 'Conversão (clique → venda)',
      detailValue: data.finalConversionRate,
      icon: Target,
      color: 'text-primary-orange',
      iconBackground: 'bg-primary-orange-light',
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {metrics.map((metric) => {
        const Icon = metric.icon;
        return (
          <article
            id={metric.id}
            key={metric.id}
            className="flex flex-col justify-between rounded-2xl border border-neutral-lighter/60 bg-white p-4 shadow-[0_1px_3px_0_rgba(15,23,42,0.04)] transition-shadow hover:shadow-md"
          >
            <div>
              <div className="flex items-center gap-2.5">
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl ${metric.iconBackground} ${metric.color}`}
                >
                  <Icon aria-hidden="true" className="h-5 w-5" />
                </div>
                <span className="text-xs font-medium text-neutral-gray">{metric.label}</span>
              </div>

              <div className="mt-4">
                <span className="text-3xl font-bold leading-none tracking-tight text-neutral-dark sm:text-[32px]">
                  {formatNumber(metric.value)}
                </span>
                <span className="mt-2 flex min-h-4 items-center text-[11px] font-medium">
                  <GrowthIndicator value={metric.growth} metricAvailable={metric.value !== null} />
                </span>
              </div>
            </div>

            <div className="-mx-4 -mb-4 mt-4 flex items-center justify-between rounded-b-2xl bg-neutral-light/70 px-4 py-2">
              <span className="text-[11px] text-neutral-gray">{metric.detailLabel}</span>
              <span className="text-[11px] font-bold text-neutral-dark">
                {formatPercentage(metric.detailValue)}
              </span>
            </div>
          </article>
        );
      })}
    </div>
  );
};
