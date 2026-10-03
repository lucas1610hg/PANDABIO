import React, { useMemo, useState } from 'react';
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  BarChart3,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Eye,
  Globe2,
  Info,
  Laptop,
  Lightbulb,
  Link2,
  MousePointerClick,
  Smartphone,
  Tablet,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { ActivityItem, BioLink, LeadItem, ProductItem } from '../types';
import { KpiData } from './KpiMetrics';
import { PublicAnalyticsSummary } from '../supabase/services/publicAnalyticsService';
import {
  buildStatisticsChart,
  countUniqueVisitors,
  filterStatisticsEvents,
  filterStatisticsItems,
  getPercentageChange,
  getPreviousStatisticsWindow,
  getStatisticsWindow,
  isClickEvent,
  isViewEvent,
  parseStatisticsDate,
  periodDays,
} from '../utils/statistics';
import type { StatisticsChartPoint, StatisticsPeriod } from '../utils/statistics';

type Period = StatisticsPeriod;

interface StatisticsSectionProps {
  links: BioLink[];
  products: ProductItem[];
  leads: LeadItem[];
  activities: ActivityItem[];
  analytics?: PublicAnalyticsSummary;
  kpiData?: KpiData;
}

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const formatPercent = (value: number) => `${value.toFixed(1).replace('.', ',')}%`;

const periodLabel: Record<Period, string> = {
  '7d': 'Últimos 7 dias',
  '30d': 'Últimos 30 dias',
  '90d': 'Últimos 90 dias',
  all: 'Todo o período',
};

const getSourceName = (referrer: string | null) => {
  if (!referrer) return 'Acesso direto';
  try {
    return new URL(referrer).hostname.replace(/^www\./, '');
  } catch {
    return 'Outras fontes';
  }
};

const formatActivityDate = (activity: ActivityItem) => {
  const timestamp = parseStatisticsDate(activity.date) ?? parseStatisticsDate(activity.timestamp);
  if (!timestamp) return activity.timeAgo;
  return new Date(timestamp).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
};

const MetricCard: React.FC<{
  label: string;
  value: string;
  detail: string;
  icon: React.ReactNode;
  tone: 'orange' | 'green' | 'blue' | 'purple';
  badge?: string;
  trend?: number | null;
}> = ({ label, value, detail, icon, tone, badge = 'Atualizado', trend }) => {
  const tones = {
    orange: 'bg-[#fff3e6] text-[#ff7a00]',
    green: 'bg-[#e6f8f3] text-[#059669]',
    blue: 'bg-[#e0f2fe] text-[#0284c7]',
    purple: 'bg-[#efedff] text-[#3525cd]',
  };

  return (
    <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
      <div className="flex items-start justify-between gap-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${tones[tone]}`}>
          {icon}
        </div>
        <span className="rounded-full bg-[#f6f7fc] px-2 py-1 text-[10px] font-semibold text-[#777587]">
          {badge}
        </span>
      </div>
      <p className="mt-4 text-xs font-medium text-[#777587]">{label}</p>
      <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#131b2e]">{value}</p>
      <p className="mt-1 text-[11px] font-medium text-[#777587]">{detail}</p>
      {trend !== undefined && (
        <div
          className={`mt-2 flex items-center gap-1 text-[10px] font-bold ${
            trend === null || trend === 0
              ? 'text-[#969cb0]'
              : trend > 0
                ? 'text-[#059669]'
                : 'text-[#dc2626]'
          }`}
        >
          {trend === null ? (
            'Novo período'
          ) : trend === 0 ? (
            'Sem mudança'
          ) : (
            <>
              {trend > 0 ? (
                <ArrowUpRight className="h-3 w-3" />
              ) : (
                <ArrowDownRight className="h-3 w-3" />
              )}
              {formatPercent(Math.abs(trend))} vs. período anterior
            </>
          )}
        </div>
      )}
    </div>
  );
};

const EmptyChart: React.FC<{ message: string }> = ({ message }) => (
  <div className="flex h-[260px] flex-col items-center justify-center rounded-xl border border-dashed border-[#dfe3f4] bg-[#faf8ff] text-center">
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f0f1fb] text-[#969cb0]">
      <BarChart3 className="h-5 w-5" />
    </div>
    <p className="mt-3 text-sm font-bold text-[#131b2e]">Sem histórico suficiente</p>
    <p className="mt-1 max-w-xs text-xs text-[#777587]">{message}</p>
  </div>
);

export const StatisticsSection: React.FC<StatisticsSectionProps> = ({
  links,
  products,
  leads,
  activities,
  analytics,
  kpiData,
}) => {
  const [period, setPeriod] = useState<Period>('30d');
  const [periodMenuOpen, setPeriodMenuOpen] = useState(false);
  const [now] = useState(() => Date.now());
  const allEvents = useMemo(() => analytics?.events ?? [], [analytics?.events]);
  const allSales = useMemo(() => analytics?.sales ?? [], [analytics?.sales]);
  const hasEventHistory = allEvents.length > 0;
  const salesAvailable = analytics?.salesAvailable === true;

  const currentWindow = useMemo(() => getStatisticsWindow(period, now), [now, period]);
  const previousWindow = useMemo(() => getPreviousStatisticsWindow(period, now), [now, period]);
  const events = useMemo(
    () => filterStatisticsEvents(allEvents, currentWindow),
    [allEvents, currentWindow],
  );
  const previousEvents = useMemo(
    () => filterStatisticsEvents(allEvents, previousWindow),
    [allEvents, previousWindow],
  );
  const periodDataLabel = hasEventHistory ? periodLabel[period] : 'Dados acumulados';

  const totals = useMemo(() => {
    const fallbackClicks = links.reduce((sum, link) => sum + (link.clicks || 0), 0);
    const fallbackVisits = kpiData?.visits ?? fallbackClicks * 2;
    const fallbackClickTotal = kpiData?.clicks ?? fallbackClicks;
    const visits = hasEventHistory ? events.filter(isViewEvent).length : fallbackVisits;
    const clicks = hasEventHistory ? events.filter(isClickEvent).length : fallbackClickTotal;
    const leadsInPeriod = filterStatisticsItems(leads, (lead) => lead.createdAt, currentWindow);
    const leadsCount = hasEventHistory ? leadsInPeriod.length : leads.length;
    const productSalesTotal = products.reduce((sum, product) => sum + (product.salesCount || 0), 0);
    const recordedSalesTotal = allSales.reduce((sum, sale) => sum + Math.max(sale.quantity, 0), 0);
    const salesInPeriod = filterStatisticsItems(allSales, (sale) => sale.createdAt, currentWindow);
    const conversions = salesAvailable
      ? period === 'all'
        ? Math.max(recordedSalesTotal, productSalesTotal)
        : salesInPeriod.reduce((sum, sale) => sum + Math.max(sale.quantity, 0), 0)
      : productSalesTotal;
    const conversionRate =
      period === 'all' || !hasEventHistory || salesAvailable
        ? clicks > 0
          ? (conversions / clicks) * 100
          : 0
        : null;
    const leadToConversionRate =
      conversionRate === null ? null : leadsCount > 0 ? (conversions / leadsCount) * 100 : 0;

    return {
      visits,
      uniqueVisitors: hasEventHistory ? countUniqueVisitors(events) : 0,
      clicks,
      leads: leadsCount,
      conversions,
      ctr: visits > 0 ? (clicks / visits) * 100 : 0,
      leadRate: clicks > 0 ? (leadsCount / clicks) * 100 : 0,
      conversionRate,
      leadToConversionRate,
    };
  }, [
    allSales,
    currentWindow,
    events,
    hasEventHistory,
    kpiData,
    leads,
    links,
    period,
    products,
    salesAvailable,
  ]);

  const chart = useMemo<StatisticsChartPoint[]>(() => {
    if (!hasEventHistory || events.length === 0) return [];
    return buildStatisticsChart(events, period, now);
  }, [events, hasEventHistory, now, period]);

  const maxChartValue = Math.max(...chart.map((point) => Math.max(point.visits, point.clicks)), 1);

  const topLinks = useMemo(() => {
    const clicksByTarget = new Map<string, number>();
    events.forEach((event) => {
      if (isClickEvent(event) && event.targetId) {
        clicksByTarget.set(event.targetId, (clicksByTarget.get(event.targetId) ?? 0) + 1);
      }
    });
    return [...links]
      .map((link) => ({
        ...link,
        periodClicks: hasEventHistory ? (clicksByTarget.get(link.id) ?? 0) : link.clicks || 0,
      }))
      .sort((first, second) => second.periodClicks - first.periodClicks)
      .slice(0, 5);
  }, [events, hasEventHistory, links]);

  const sources = useMemo(() => {
    const counts = new Map<string, number>();
    events.filter(isViewEvent).forEach((event) => {
      const source = getSourceName(event.referrer);
      counts.set(source, (counts.get(source) ?? 0) + 1);
    });
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 4)
      .map(([name, count]) => ({ name, count, percentage: total ? (count / total) * 100 : 0 }));
  }, [events]);

  const devices = useMemo(() => {
    const counts = { mobile: 0, desktop: 0, tablet: 0 };
    events.filter(isViewEvent).forEach((event) => {
      counts[event.deviceType] += 1;
    });
    const total = counts.mobile + counts.desktop + counts.tablet;
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      percentage: total ? (count / total) * 100 : 0,
    }));
  }, [events]);

  const trends = useMemo(() => {
    if (!hasEventHistory || period === 'all') return undefined;
    const previousVisits = previousEvents.filter(isViewEvent).length;
    const previousClicks = previousEvents.filter(isClickEvent).length;
    const previousLeads = filterStatisticsItems(
      leads,
      (lead) => lead.createdAt,
      previousWindow,
    ).length;
    return {
      visits: getPercentageChange(totals.visits, previousVisits),
      clicks: getPercentageChange(totals.clicks, previousClicks),
      leads: getPercentageChange(totals.leads, previousLeads),
    };
  }, [hasEventHistory, leads, period, previousEvents, previousWindow, totals]);

  const activeLinks = links.filter((link) => link.active).length;
  const activeProducts = products.filter((product) => product.status === 'active').length;
  const averageDailyVisits = period === 'all' ? null : totals.visits / periodDays[period];
  const primaryDevice = [...devices].sort((first, second) => second.count - first.count)[0];

  const insights = useMemo(() => {
    const result: Array<{
      title: string;
      description: string;
      tone: 'info' | 'success' | 'warning';
    }> = [];

    if (!hasEventHistory) {
      result.push({
        title: 'Ative o histórico público',
        description:
          'Publique e compartilhe sua página para registrar visitas, cliques, dispositivos e origens.',
        tone: 'warning',
      });
    } else if (totals.visits === 0) {
      result.push({
        title: 'Ainda não há visitas no período',
        description: 'Compartilhe seu link público para começar a criar histórico de desempenho.',
        tone: 'warning',
      });
    } else if (totals.ctr < 3) {
      result.push({
        title: 'Melhore a chamada para ação',
        description: `CTR de ${formatPercent(totals.ctr)} indica espaço para revisar títulos, ordem e destaque dos links.`,
        tone: 'info',
      });
    } else {
      result.push({
        title: 'Sua página está gerando interação',
        description: `Os cliques representam ${formatPercent(totals.ctr)} das visualizações no período.`,
        tone: 'success',
      });
    }

    if (primaryDevice && primaryDevice.count > 0) {
      result.push({
        title: `Priorize experiência em ${primaryDevice.name}`,
        description: `${formatPercent(primaryDevice.percentage)} das visualizações vieram desse dispositivo.`,
        tone: 'info',
      });
    }

    if (activeLinks === 0 && links.length > 0) {
      result.push({
        title: 'Nenhum link está ativo',
        description: 'Ative pelo menos um link para facilitar próximas ações dos visitantes.',
        tone: 'warning',
      });
    }

    return result.slice(0, 3);
  }, [activeLinks, hasEventHistory, links.length, primaryDevice, totals]);

  const periodSummary = hasEventHistory
    ? `${events.length.toLocaleString('pt-BR')} eventos no período`
    : 'Sem histórico público sincronizado';

  const funnel = [
    { label: 'Visitas', value: totals.visits, color: '#ff7a00', icon: <Eye className="h-4 w-4" /> },
    {
      label: 'Cliques',
      value: totals.clicks,
      color: '#10b981',
      icon: <MousePointerClick className="h-4 w-4" />,
    },
    { label: 'Leads', value: totals.leads, color: '#0284c7', icon: <Users className="h-4 w-4" /> },
    {
      label: totals.conversionRate === null ? 'Vendas acumuladas' : 'Conversões',
      value: totals.conversions,
      color: '#3525cd',
      icon: <Target className="h-4 w-4" />,
    },
  ];

  const exportCsv = () => {
    const rows = [
      ['Métrica', 'Valor'],
      ['Período', periodLabel[period]],
      ['Fonte dos dados', hasEventHistory ? 'Eventos públicos' : 'Estimativas da conta'],
      ['Visitas', String(totals.visits)],
      ['Cliques', String(totals.clicks)],
      ['CTR', formatPercent(totals.ctr)],
      ['Leads', String(totals.leads)],
      ['Taxa de leads', formatPercent(totals.leadRate)],
      ['Conversões', String(totals.conversions)],
      [
        'Taxa final',
        totals.conversionRate === null
          ? 'Indisponível: histórico de vendas não sincronizado'
          : formatPercent(totals.conversionRate),
      ],
      [],
      ['Link', 'Cliques'],
      ...topLinks.map((link) => [link.title, String(link.periodClicks)]),
      [],
      ['Origem', 'Visitas', 'Percentual'],
      ...sources.map((source) => [
        source.name,
        String(source.count),
        formatPercent(source.percentage),
      ]),
      [],
      ['Dispositivo', 'Visualizações', 'Percentual'],
      ...devices.map((device) => [
        device.name,
        String(device.count),
        formatPercent(device.percentage),
      ]),
    ];
    const csv = rows
      .map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(';'))
      .join('\n');
    const blob = new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pandabio-estatisticas-${period}.csv`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section id="statistics-section" className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7a00] text-white shadow-[0_4px_14px_rgba(255,122,0,0.22)]">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#131b2e] sm:text-3xl">
                Estatísticas
              </h1>
              <p className="mt-0.5 text-xs text-[#777587] sm:text-sm">
                Entenda como visitantes interagem com sua página.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <button
              type="button"
              onClick={() => setPeriodMenuOpen((open) => !open)}
              aria-expanded={periodMenuOpen}
              aria-haspopup="listbox"
              className="flex items-center gap-2 rounded-xl border border-[#eaedff] bg-white px-3 py-2 text-xs font-bold text-[#464555] shadow-[0_1px_3px_rgba(15,23,42,0.04)]"
            >
              <CalendarDays className="h-4 w-4 text-[#ff7a00]" />
              {periodLabel[period]}
              <ChevronDown className="h-3.5 w-3.5" />
            </button>
            {periodMenuOpen && (
              <div
                role="listbox"
                className="absolute right-0 z-20 mt-2 w-44 rounded-xl border border-[#eaedff] bg-white p-1.5 shadow-xl"
              >
                {(Object.keys(periodLabel) as Period[]).map((option) => (
                  <button
                    key={option}
                    type="button"
                    role="option"
                    aria-selected={option === period}
                    onClick={() => {
                      setPeriod(option);
                      setPeriodMenuOpen(false);
                    }}
                    className={`w-full rounded-lg px-3 py-2 text-left text-xs font-semibold transition-colors ${
                      option === period
                        ? 'bg-[#fff3e6] text-[#ff7a00]'
                        : 'text-[#464555] hover:bg-[#f6f7fc]'
                    }`}
                  >
                    {periodLabel[option]}
                  </button>
                ))}
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={exportCsv}
            className="inline-flex items-center gap-2 rounded-xl bg-[#131b2e] px-3 py-2 text-xs font-bold text-white transition-colors hover:bg-[#252b40]"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div
        className={`flex items-start gap-3 rounded-2xl border p-4 text-xs ${
          hasEventHistory
            ? 'border-[#d6f2e8] bg-[#f3fcf8] text-[#17634d]'
            : 'border-[#ffe3c7] bg-[#fff9f2] text-[#8a4b08]'
        }`}
      >
        {hasEventHistory ? (
          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
        ) : (
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        )}
        <div>
          <p className="font-bold">
            {hasEventHistory ? 'Dados reais da página pública' : 'Modo estimado'}
          </p>
          <p className="mt-0.5 opacity-90">
            {hasEventHistory
              ? `${periodSummary}. ${salesAvailable ? 'Vendas possuem histórico por período.' : 'Vendas continuam acumuladas porque o histórico datado não está sincronizado.'}`
              : 'Visitas e cliques usam dados agregados da conta. Publique e receba tráfego para ativar filtros por período.'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Visualizações"
          value={formatNumber(totals.visits)}
          detail={periodDataLabel}
          icon={<Eye className="h-5 w-5" />}
          tone="orange"
          badge={hasEventHistory ? 'Dados reais' : 'Estimado'}
          trend={trends?.visits}
        />
        <MetricCard
          label="Cliques"
          value={formatNumber(totals.clicks)}
          detail={`CTR de ${formatPercent(totals.ctr)}`}
          icon={<Link2 className="h-5 w-5" />}
          tone="green"
          badge={hasEventHistory ? 'Dados reais' : 'Estimado'}
          trend={trends?.clicks}
        />
        <MetricCard
          label="Leads"
          value={formatNumber(totals.leads)}
          detail={`Conversão de ${formatPercent(totals.leadRate)}`}
          icon={<Users className="h-5 w-5" />}
          tone="blue"
          badge={hasEventHistory ? 'Dados reais' : 'Estimado'}
          trend={trends?.leads}
        />
        <MetricCard
          label="Conversões"
          value={formatNumber(totals.conversions)}
          detail={
            totals.conversionRate === null
              ? 'Vendas acumuladas · sem data por período'
              : `Taxa final de ${formatPercent(totals.conversionRate)}`
          }
          icon={<Target className="h-5 w-5" />}
          tone="purple"
          badge={hasEventHistory ? 'Acumulado' : 'Estimado'}
        />
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        {[
          {
            label: 'Visitantes únicos',
            value: hasEventHistory ? formatNumber(totals.uniqueVisitors) : '—',
            detail: 'identificados por navegador',
          },
          {
            label: 'Média diária',
            value: averageDailyVisits === null ? '—' : formatNumber(Math.round(averageDailyVisits)),
            detail: 'visualizações por dia',
          },
          {
            label: 'Links ativos',
            value: `${activeLinks}/${links.length}`,
            detail: 'links publicados',
          },
          {
            label: 'Produtos ativos',
            value: `${activeProducts}/${products.length}`,
            detail: 'produtos publicados',
          },
          {
            label: 'Origem principal',
            value: sources[0]?.name || '—',
            detail: primaryDevice
              ? `dispositivo: ${primaryDevice.name}`
              : 'sem origem identificada',
          },
        ].map((metric) => (
          <div
            key={metric.label}
            className="rounded-2xl border border-[#eaedff] bg-[#faf8ff] px-3 py-3"
          >
            <p className="text-[10px] font-bold uppercase tracking-wide text-[#969cb0]">
              {metric.label}
            </p>
            <p className="mt-1 truncate text-lg font-extrabold text-[#131b2e]">{metric.value}</p>
            <p className="mt-0.5 truncate text-[10px] font-medium text-[#777587]">
              {metric.detail}
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,1fr)]">
        <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-[#ff7a00]" />
                <h2 className="text-sm font-extrabold text-[#131b2e]">Evolução do tráfego</h2>
              </div>
              <p className="mt-1 text-[11px] text-[#777587]">Visitas e cliques por dia</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-semibold text-[#777587]">
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-[#ff7a00]" />
                Visitas
              </span>
              <span className="flex items-center gap-1.5">
                <i className="h-2.5 w-2.5 rounded-full bg-[#10b981]" />
                Cliques
              </span>
            </div>
          </div>
          {chart.length > 0 ? (
            <div className="flex h-[260px] items-end gap-1.5 overflow-hidden rounded-xl bg-[#faf8ff] px-2 pb-7 pt-5 sm:gap-2 sm:px-4">
              {chart.map((point, index) => (
                <div
                  key={point.label}
                  className="group relative flex h-full min-w-[8px] flex-1 items-end justify-center gap-0.5"
                >
                  <div
                    className="relative w-1/2 max-w-5 rounded-t-md bg-[#ff7a00] transition-all group-hover:brightness-110"
                    style={{
                      height: `${Math.max((point.visits / maxChartValue) * 100, point.visits ? 4 : 0)}%`,
                    }}
                    title={`${point.visits} visitas`}
                  />
                  <div
                    className="relative w-1/2 max-w-5 rounded-t-md bg-[#10b981] transition-all group-hover:brightness-110"
                    style={{
                      height: `${Math.max((point.clicks / maxChartValue) * 100, point.clicks ? 4 : 0)}%`,
                    }}
                    title={`${point.clicks} cliques`}
                  />
                  {(chart.length <= 7 || index % Math.ceil(chart.length / 6) === 0) && (
                    <span className="absolute -bottom-5 whitespace-nowrap text-[9px] font-semibold text-[#969cb0]">
                      {point.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <EmptyChart message="Os dados diários aparecerão quando sua página receber visitas pelo link público." />
          )}
        </div>

        <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[#3525cd]" />
            <h2 className="text-sm font-extrabold text-[#131b2e]">Funil de conversão</h2>
          </div>
          <p className="mt-1 text-[11px] text-[#777587]">
            {totals.conversionRate === null
              ? 'Vendas acumuladas; demais etapas seguem período selecionado'
              : 'Da primeira visita à conversão'}
          </p>
          <div className="mt-5 flex flex-col gap-3">
            {funnel.map((step, index) => {
              const base = Math.max(totals.visits, 1);
              const width = Math.min(100, Math.max((step.value / base) * 100, step.value ? 12 : 3));
              const transitionIsUnavailable =
                totals.conversionRate === null && index === funnel.length - 2;
              return (
                <div key={step.label}>
                  <div className="mb-1.5 flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-semibold text-[#464555]">
                      <span style={{ color: step.color }}>{step.icon}</span>
                      {step.label}
                    </span>
                    <span className="font-extrabold text-[#131b2e]">
                      {formatNumber(step.value)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[#f1f2f8]">
                    <div
                      className="h-2 rounded-full transition-all"
                      style={{ width: `${width}%`, backgroundColor: step.color }}
                    />
                  </div>
                  {index < funnel.length - 1 && (
                    <p className="mt-1 text-right text-[10px] font-semibold text-[#969cb0]">
                      {transitionIsUnavailable
                        ? 'Taxa indisponível para vendas acumuladas'
                        : `${formatPercent(
                            step.value > 0
                              ? Math.min(100, (funnel[index + 1].value / step.value) * 100)
                              : 0,
                          )} avançam`}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <MousePointerClick className="h-4 w-4 text-[#10b981]" />
                <h2 className="text-sm font-extrabold text-[#131b2e]">
                  Links com melhor desempenho
                </h2>
              </div>
              <p className="mt-1 text-[11px] text-[#777587]">Cliques atribuídos por link</p>
            </div>
            <span className="rounded-full bg-[#e6f8f3] px-2 py-1 text-[10px] font-bold text-[#059669]">
              Top 5
            </span>
          </div>
          <div className="mt-5 flex flex-col gap-4">
            {topLinks.length > 0 ? (
              topLinks.map((link, index) => {
                const max = Math.max(topLinks[0].periodClicks, 1);
                return (
                  <div key={link.id}>
                    <div className="mb-1.5 flex items-center justify-between gap-3 text-xs">
                      <span className="min-w-0 truncate font-bold text-[#464555]">
                        <b className="mr-2 text-[#969cb0]">0{index + 1}</b>
                        {link.title}
                      </span>
                      <span className="shrink-0 font-extrabold text-[#131b2e]">
                        {formatNumber(link.periodClicks)}
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-[#f1f2f8]">
                      <div
                        className="h-2 rounded-full bg-[#10b981]"
                        style={{
                          width: `${Math.max((link.periodClicks / max) * 100, link.periodClicks ? 6 : 2)}%`,
                        }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <EmptyChart message="Adicione links à sua página para comparar desempenho." />
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Globe2 className="h-4 w-4 text-[#ff7a00]" />
                <h2 className="text-sm font-extrabold text-[#131b2e]">Público e origem</h2>
              </div>
              <p className="mt-1 text-[11px] text-[#777587]">Dispositivo e fonte das visitas</p>
            </div>
            <span className="rounded-full bg-[#fff3e6] px-2 py-1 text-[10px] font-bold text-[#ff7a00]">
              {hasEventHistory ? 'Dados reais' : 'Aguardando dados'}
            </span>
          </div>
          {hasEventHistory ? (
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#969cb0]">
                  Dispositivos
                </p>
                {devices.map((device) => {
                  const Icon =
                    device.name === 'mobile'
                      ? Smartphone
                      : device.name === 'tablet'
                        ? Tablet
                        : Laptop;
                  return (
                    <div key={device.name} className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-[#777587]" />
                      <span className="flex-1 text-xs font-semibold capitalize text-[#464555]">
                        {device.name}
                      </span>
                      <span className="text-xs font-extrabold text-[#131b2e]">
                        {formatPercent(device.percentage)}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div className="flex flex-col gap-3">
                <p className="text-[10px] font-extrabold uppercase tracking-wider text-[#969cb0]">
                  Fontes
                </p>
                {sources.length > 0 ? (
                  sources.map((source) => (
                    <div key={source.name} className="flex items-center gap-2">
                      <Globe2 className="h-4 w-4 text-[#777587]" />
                      <span className="flex-1 truncate text-xs font-semibold text-[#464555]">
                        {source.name}
                      </span>
                      <span className="text-xs font-extrabold text-[#131b2e]">
                        {formatPercent(source.percentage)}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-[#969cb0]">Sem origem identificada.</p>
                )}
              </div>
            </div>
          ) : (
            <div className="mt-5 flex items-center gap-3 rounded-xl bg-[#faf8ff] p-4 text-xs text-[#777587]">
              <Globe2 className="h-5 w-5 shrink-0 text-[#969cb0]" />
              <span>
                Conecte sua página pública ao Supabase para acompanhar dispositivos e origens.
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-[#ff7a00]" />
          <h2 className="text-sm font-extrabold text-[#131b2e]">Recomendações</h2>
        </div>
        <p className="mt-1 text-[11px] text-[#777587]">Próximas ações com base nos seus dados</p>
        <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          {insights.map((insight) => {
            const styles = {
              info: 'border-[#dbeafe] bg-[#f7fbff] text-[#1d4ed8]',
              success: 'border-[#d6f2e8] bg-[#f3fcf8] text-[#047857]',
              warning: 'border-[#ffe3c7] bg-[#fff9f2] text-[#9a5b0b]',
            };
            const Icon =
              insight.tone === 'success'
                ? CheckCircle2
                : insight.tone === 'warning'
                  ? AlertTriangle
                  : Info;
            return (
              <div key={insight.title} className={`rounded-xl border p-3 ${styles[insight.tone]}`}>
                <div className="flex items-start gap-2">
                  <Icon className="mt-0.5 h-4 w-4 shrink-0" />
                  <div>
                    <p className="text-xs font-extrabold">{insight.title}</p>
                    <p className="mt-1 text-[11px] leading-relaxed opacity-90">
                      {insight.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)] sm:p-5">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#0284c7]" />
          <h2 className="text-sm font-extrabold text-[#131b2e]">Atividade recente</h2>
        </div>
        <p className="mt-1 text-[11px] text-[#777587]">Ações registradas na sua conta</p>
        {activities.length > 0 ? (
          <div className="mt-4 grid grid-cols-1 gap-2 md:grid-cols-2">
            {activities.slice(0, 6).map((activity) => (
              <div
                key={activity.id}
                className="flex items-center gap-3 rounded-xl bg-[#faf8ff] px-3 py-2.5"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#e0f2fe] text-[#0284c7]">
                  <Activity className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold text-[#131b2e]">{activity.title}</p>
                  <p className="truncate text-[11px] text-[#777587]">{activity.subtitle}</p>
                </div>
                <span className="shrink-0 text-[10px] font-semibold text-[#969cb0]">
                  {formatActivityDate(activity)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-4 rounded-xl border border-dashed border-[#dfe3f4] bg-[#faf8ff] p-5 text-center text-xs font-semibold text-[#969cb0]">
            Nenhuma atividade registrada ainda.
          </div>
        )}
      </div>
    </section>
  );
};
