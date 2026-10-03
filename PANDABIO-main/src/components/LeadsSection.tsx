import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  Download,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  Smartphone,
  Trash2,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { BioLink, LeadItem, LeadStatus, ProductItem, TrackingEventType } from '../types';
import {
  PublicAnalyticsEvent,
  PublicAnalyticsSummary,
} from '../supabase/services/publicAnalyticsService';

type LeadsTab = 'overview' | 'all' | 'captures' | 'segments' | 'settings';
type ExportFormat = 'csv' | 'excel';

interface LeadsSectionProps {
  leads: LeadItem[];
  links: BioLink[];
  products: ProductItem[];
  username?: string;
  analytics?: PublicAnalyticsSummary;
  onUpdateLeadStatus?: (id: string, status: LeadStatus) => Promise<unknown>;
  onDeleteLead?: (id: string) => Promise<unknown>;
}

interface LeadSettings {
  highScore: number;
  mediumScore: number;
  retentionDays: number;
  consentRequired: boolean;
}

const defaultLeadSettings: LeadSettings = {
  highScore: 70,
  mediumScore: 25,
  retentionDays: 365,
  consentRequired: true,
};

const statusMeta: Record<LeadStatus, { label: string; className: string }> = {
  new: { label: 'Novo', className: 'bg-[#e8f1ff] text-[#2563eb]' },
  contacted: { label: 'Em contato', className: 'bg-[#fff5d6] text-[#a16207]' },
  interested: { label: 'Interessado', className: 'bg-[#f1eaff] text-[#7c3aed]' },
  converted: { label: 'Convertido', className: 'bg-[#e4f8ef] text-[#047857]' },
  lost: { label: 'Perdido', className: 'bg-[#f3f4f6] text-[#6b7280]' },
};

const eventLabels: Partial<Record<TrackingEventType, string>> = {
  view: 'Entrou na página',
  page_view: 'Entrou na página',
  click: 'Clicou em um link',
  link_click: 'Clicou em um link',
  product_view: 'Visualizou um produto',
  product_click: 'Clicou em um produto',
  service_view: 'Visualizou um serviço',
  booking_start: 'Iniciou um agendamento',
  booking_completed: 'Concluiu um agendamento',
  form_view: 'Visualizou formulário',
  form_submit: 'Preencheu formulário',
  whatsapp_click: 'Clicou em WhatsApp',
  phone_click: 'Clicou em telefone',
  email_click: 'Clicou em e-mail',
  social_click: 'Clicou em uma rede social',
  conversion: 'Realizou uma conversão',
};

const engagementEvents = new Set<TrackingEventType>([
  'click',
  'link_click',
  'product_view',
  'product_click',
  'service_view',
  'booking_start',
  'booking_completed',
  'form_view',
  'form_submit',
  'whatsapp_click',
  'phone_click',
  'email_click',
  'social_click',
  'conversion',
]);

const formatNumber = (value: number) => value.toLocaleString('pt-BR');
const formatPercent = (value: number) => `${value.toFixed(2).replace('.', ',')}%`;

const formatDate = (value?: string) => {
  if (!value) return 'Não informado';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Não informado';
  return date.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
};

const getSourceName = (value?: string | null) => {
  if (!value) return 'Acesso direto';
  const normalized = value.toLowerCase().trim();
  if (normalized.includes('instagram')) return 'Instagram';
  if (normalized.includes('facebook')) return 'Facebook';
  if (normalized.includes('tiktok')) return 'TikTok';
  if (normalized.includes('whatsapp')) return 'WhatsApp';
  if (normalized.includes('google')) return 'Google';
  try {
    return new URL(value).hostname.replace(/^www\./, '');
  } catch {
    return value || 'Outros';
  }
};

const sourceFromLead = (lead: LeadItem) =>
  lead.source || lead.channel || getSourceName(lead.referrer) || 'Outros';

const getLeadInterest = (lead: LeadItem, settings: LeadSettings = defaultLeadSettings) => {
  if (lead.interest) return lead.interest;
  if ((lead.score || 0) >= settings.highScore) return 'high';
  if ((lead.score || 0) >= settings.mediumScore) return 'medium';
  return 'low';
};

const getEventSource = (event: PublicAnalyticsEvent) =>
  event.source || getSourceName(event.referrer) || 'Acesso direto';

const getEventLabel = (event: PublicAnalyticsEvent) =>
  eventLabels[event.eventType] || 'Interagiu com a página';

const getLeadTimeline = (lead: LeadItem, analytics?: PublicAnalyticsSummary) => {
  const matchingEvents = (analytics?.events || [])
    .filter((event) => lead.visitorId && event.visitorId === lead.visitorId)
    .sort((first, second) => Date.parse(first.createdAt) - Date.parse(second.createdAt));

  if (matchingEvents.length > 0) return matchingEvents;
  return [
    {
      eventType: 'form_submit' as const,
      targetId: lead.relatedName || null,
      deviceType: lead.device || 'desktop',
      referrer: lead.referrer || null,
      visitorId: lead.visitorId,
      createdAt: lead.createdAt,
    },
  ];
};

const MetricCard: React.FC<{
  label: string;
  value: number;
  detail: string;
  icon: React.ReactNode;
  tone: string;
}> = ({ label, value, detail, icon, tone }) => (
  <div className="rounded-2xl border border-[#eaedff] bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
    <div className="flex items-start justify-between gap-3">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>{icon}</div>
      <span className="rounded-full bg-[#f7f8fc] px-2 py-1 text-[10px] font-bold text-[#777587]">
        Atualizado
      </span>
    </div>
    <p className="mt-4 text-xs font-semibold text-[#777587]">{label}</p>
    <p className="mt-1 text-2xl font-extrabold tracking-tight text-[#131b2e]">
      {formatNumber(value)}
    </p>
    <p className="mt-1 text-[11px] font-medium text-[#777587]">{detail}</p>
  </div>
);

const StatusBadge: React.FC<{ status: LeadStatus }> = ({ status }) => {
  const meta = statusMeta[status];
  return (
    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold ${meta.className}`}>
      {meta.label}
    </span>
  );
};

const EmptyState: React.FC<{ title: string; message: string }> = ({ title, message }) => (
  <div className="rounded-2xl border border-dashed border-[#dfe3f4] bg-[#faf8ff] px-5 py-12 text-center">
    <UsersRound className="mx-auto h-8 w-8 text-[#a1a7bb]" />
    <p className="mt-3 text-sm font-extrabold text-[#131b2e]">{title}</p>
    <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-[#777587]">{message}</p>
  </div>
);

export const LeadsSection: React.FC<LeadsSectionProps> = ({
  leads,
  links: _links,
  products: _products,
  username,
  analytics,
  onUpdateLeadStatus,
  onDeleteLead,
}) => {
  const [activeTab, setActiveTab] = useState<LeadsTab>('overview');
  const [localLeads, setLocalLeads] = useState<LeadItem[]>(leads);
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | LeadStatus>('all');
  const [segmentFilter, setSegmentFilter] = useState<'all' | 'high' | 'social' | 'not_converted'>(
    'all',
  );
  const [busyLeadId, setBusyLeadId] = useState<string | null>(null);
  const [leadSettings, setLeadSettings] = useState<LeadSettings>(() => {
    if (typeof window === 'undefined') return defaultLeadSettings;
    try {
      const stored = window.localStorage.getItem(
        `pandabio-leads-settings:${username || 'default'}`,
      );
      return stored ? { ...defaultLeadSettings, ...JSON.parse(stored) } : defaultLeadSettings;
    } catch {
      return defaultLeadSettings;
    }
  });
  const [settingsSaved, setSettingsSaved] = useState(false);

  useEffect(() => {
    const syncTimer = window.setTimeout(() => setLocalLeads(leads), 0);
    return () => window.clearTimeout(syncTimer);
  }, [leads]);

  const allEvents = useMemo(() => analytics?.events || [], [analytics?.events]);
  const visitors = analytics?.uniqueVisitors || analytics?.visits || 0;
  const engagedEvents = allEvents.filter((event) => engagementEvents.has(event.eventType));
  const interestedVisitorIds = new Set(
    engagedEvents
      .map((event) => event.visitorId)
      .filter((visitorId): visitorId is string => Boolean(visitorId)),
  );
  const interested = interestedVisitorIds.size || analytics?.clicks || engagedEvents.length;
  const converted = localLeads.filter((lead) => lead.status === 'converted').length;
  const conversionRate = visitors > 0 ? (localLeads.length / visitors) * 100 : 0;

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>();
    allEvents
      .filter((event) => event.eventType === 'view' || event.eventType === 'page_view')
      .forEach((event) => {
        const source = getEventSource(event);
        counts.set(source, (counts.get(source) || 0) + 1);
      });
    if (counts.size === 0) {
      localLeads.forEach((lead) => {
        const source = sourceFromLead(lead);
        counts.set(source, (counts.get(source) || 0) + 1);
      });
    }
    const total = [...counts.values()].reduce((sum, value) => sum + value, 0);
    return [...counts.entries()]
      .sort((first, second) => second[1] - first[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count, percentage: total > 0 ? (count / total) * 100 : 0 }));
  }, [allEvents, localLeads]);

  const sourceOptions = useMemo(
    () => [...new Set(localLeads.map((lead) => sourceFromLead(lead)))].sort(),
    [localLeads],
  );

  const segmentCounts = useMemo(
    () => ({
      highInterest: localLeads.filter((lead) => getLeadInterest(lead, leadSettings) === 'high')
        .length,
      social: localLeads.filter((lead) =>
        ['Instagram', 'TikTok', 'Facebook', 'WhatsApp'].includes(sourceFromLead(lead)),
      ).length,
      notConverted: localLeads.filter(
        (lead) => !['converted', 'lost'].includes(lead.status || 'new'),
      ).length,
    }),
    [localLeads, leadSettings],
  );

  const filteredLeads = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return localLeads.filter((lead) => {
      const matchesQuery =
        !normalizedQuery ||
        [lead.name, lead.email, lead.phone, sourceFromLead(lead), lead.relatedName]
          .filter(Boolean)
          .some((value) => String(value).toLowerCase().includes(normalizedQuery));
      const matchesSource = sourceFilter === 'all' || sourceFromLead(lead) === sourceFilter;
      const matchesStatus = statusFilter === 'all' || (lead.status || 'new') === statusFilter;
      const matchesSegment =
        segmentFilter === 'all' ||
        (segmentFilter === 'high' && getLeadInterest(lead, leadSettings) === 'high') ||
        (segmentFilter === 'social' &&
          ['Instagram', 'TikTok', 'Facebook', 'WhatsApp'].includes(sourceFromLead(lead))) ||
        (segmentFilter === 'not_converted' &&
          !['converted', 'lost'].includes(lead.status || 'new'));
      return matchesQuery && matchesSource && matchesStatus && matchesSegment;
    });
  }, [localLeads, query, sourceFilter, statusFilter, segmentFilter, leadSettings]);

  const selectedLead = localLeads.find((lead) => lead.id === selectedLeadId) || null;
  const recentLeads = localLeads.slice(0, 5);
  const funnel = [
    { label: 'Visitantes', value: visitors, color: 'bg-[#dbeafe] text-[#1d4ed8]' },
    {
      label: 'Engajamentos',
      value: engagedEvents.length || analytics?.clicks || 0,
      color: 'bg-[#ede9fe] text-[#6d28d9]',
    },
    { label: 'Interessados', value: interested, color: 'bg-[#fef3c7] text-[#a16207]' },
    { label: 'Leads', value: localLeads.length, color: 'bg-[#ffedd5] text-[#c2410c]' },
    { label: 'Convertidos', value: converted, color: 'bg-[#dcfce7] text-[#15803d]' },
  ];

  const updateStatus = async (lead: LeadItem, status: LeadStatus) => {
    const previous = lead.status || 'new';
    setBusyLeadId(lead.id);
    setLocalLeads((current) =>
      current.map((item) => (item.id === lead.id ? { ...item, status } : item)),
    );
    try {
      if (onUpdateLeadStatus) {
        const result = (await onUpdateLeadStatus(lead.id, status)) as
          { success?: boolean } | undefined;
        if (result?.success === false) {
          setLocalLeads((current) =>
            current.map((item) => (item.id === lead.id ? { ...item, status: previous } : item)),
          );
        }
      }
    } finally {
      setBusyLeadId(null);
    }
  };

  const deleteLead = async (lead: LeadItem) => {
    if (!window.confirm(`Excluir lead ${lead.name}? Esta ação não pode ser desfeita.`)) return;
    setBusyLeadId(lead.id);
    try {
      if (onDeleteLead) {
        const result = (await onDeleteLead(lead.id)) as { success?: boolean } | undefined;
        if (result?.success === false) return;
      }
      setLocalLeads((current) => current.filter((item) => item.id !== lead.id));
      setSelectedLeadId(null);
    } finally {
      setBusyLeadId(null);
    }
  };

  const exportLeads = (format: ExportFormat) => {
    const rows = filteredLeads.map((lead) => [
      lead.name,
      lead.email,
      lead.phone,
      sourceFromLead(lead),
      lead.relatedName || '',
      formatDate(lead.createdAt),
      statusMeta[lead.status || 'new'].label,
      lead.score ?? '',
      lead.campaign || '',
    ]);
    const headers = [
      'Nome',
      'Email',
      'WhatsApp',
      'Origem',
      'Produto ou serviço',
      'Data',
      'Status',
      'Score',
      'Campanha',
    ];
    const separator = format === 'excel' ? '\t' : ';';
    const content = [headers, ...rows]
      .map((row) =>
        row
          .map((value) =>
            format === 'excel' ? String(value) : `"${String(value).replaceAll('"', '""')}"`,
          )
          .join(separator),
      )
      .join('\n');
    const blob = new Blob([format === 'excel' ? content : `\ufeff${content}`], {
      type:
        format === 'excel' ? 'application/vnd.ms-excel;charset=utf-8;' : 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `pandabio-leads.${format === 'excel' ? 'xls' : 'csv'}`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const renderLeadList = () => {
    if (filteredLeads.length === 0) {
      return (
        <EmptyState
          title="Nenhum lead encontrado"
          message="Ajuste os filtros ou aguarde novos formulários de captura."
        />
      );
    }
    return (
      <div className="space-y-3">
        {filteredLeads.map((lead) => (
          <button
            key={lead.id}
            type="button"
            onClick={() => setSelectedLeadId(lead.id)}
            className="w-full rounded-2xl border border-[#eaedff] bg-white p-4 text-left shadow-[0_1px_3px_rgba(15,23,42,0.04)] transition hover:-translate-y-0.5 hover:border-[#ffcfad] hover:shadow-md"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#fff0e3] text-[#ff7a00]">
                    <UserRound className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-extrabold text-[#131b2e]">{lead.name}</p>
                    <p className="truncate text-xs text-[#777587]">
                      {lead.email}
                      {lead.phone ? ` · ${lead.phone}` : ''}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#464555]">
                  <span className="font-bold text-[#ff7a00]">{sourceFromLead(lead)}</span>
                  {lead.relatedName && (
                    <>
                      <span>·</span>
                      <span>
                        {lead.relatedType === 'service' ? 'Serviço' : 'Produto'}: {lead.relatedName}
                      </span>
                    </>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-[#777587]">
                  {formatDate(lead.createdAt)}
                  {lead.campaign ? ` · Campanha: ${lead.campaign}` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2 sm:flex-col sm:items-end">
                <StatusBadge status={lead.status || 'new'} />
                <span className="text-[10px] font-bold text-[#777587]">
                  Score {lead.score ?? 70}
                </span>
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  };

  const renderLeadDetail = () => {
    if (!selectedLead) return null;
    const timeline = getLeadTimeline(selectedLead, analytics);
    return (
      <aside className="rounded-2xl border border-[#eaedff] bg-white p-5 shadow-[0_1px_3px_rgba(15,23,42,0.04)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#ff7a00]">
              Lead identificado
            </p>
            <h2 className="mt-1 text-xl font-extrabold text-[#131b2e]">{selectedLead.name}</h2>
            <p className="mt-1 text-xs text-[#777587]">
              {selectedLead.email || 'E-mail não informado'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar detalhe do lead"
            onClick={() => setSelectedLeadId(null)}
            className="rounded-lg p-2 text-[#777587] hover:bg-[#f6f7fc]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusBadge status={selectedLead.status || 'new'} />
          <span className="rounded-full bg-[#f6f7fc] px-2.5 py-1 text-[10px] font-bold text-[#464555]">
            Score {selectedLead.score ?? 70}
          </span>
          <span className="rounded-full bg-[#f6f7fc] px-2.5 py-1 text-[10px] font-bold text-[#464555]">
            {getLeadInterest(selectedLead, leadSettings) === 'high'
              ? 'Alto interesse'
              : getLeadInterest(selectedLead, leadSettings) === 'medium'
                ? 'Médio interesse'
                : 'Baixo interesse'}
          </span>
          <select
            aria-label="Status do lead"
            value={selectedLead.status || 'new'}
            disabled={busyLeadId === selectedLead.id}
            onChange={(event) => void updateStatus(selectedLead, event.target.value as LeadStatus)}
            className="rounded-full border border-[#eaedff] bg-white px-2.5 py-1 text-[10px] font-bold text-[#464555] outline-none"
          >
            {Object.entries(statusMeta).map(([status, meta]) => (
              <option key={status} value={status}>
                {meta.label}
              </option>
            ))}
          </select>
        </div>
        <div className="mt-5 grid grid-cols-1 gap-3 text-xs sm:grid-cols-2">
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">Nome</span>
            <p className="mt-1 font-semibold text-[#131b2e]">{selectedLead.name}</p>
          </div>
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">WhatsApp</span>
            <p className="mt-1 font-semibold text-[#131b2e]">
              {selectedLead.phone || 'Não informado'}
            </p>
          </div>
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">Origem</span>
            <p className="mt-1 font-semibold text-[#131b2e]">{sourceFromLead(selectedLead)}</p>
            <p className="mt-1 text-[10px] text-[#777587]">
              Identidade do visitante:{' '}
              {selectedLead.visitorId ? 'associada por consentimento' : 'desconhecida'}
            </p>
          </div>
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">Campanha</span>
            <p className="mt-1 font-semibold text-[#131b2e]">
              {selectedLead.campaign || 'Não informada'}
            </p>
          </div>
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">Primeiro acesso</span>
            <p className="mt-1 font-semibold text-[#131b2e]">
              {formatDate(selectedLead.firstAccessAt || selectedLead.createdAt)}
            </p>
          </div>
          <div className="rounded-xl bg-[#faf8ff] p-3">
            <span className="font-bold text-[#777587]">Último acesso</span>
            <p className="mt-1 font-semibold text-[#131b2e]">
              {formatDate(selectedLead.lastAccessAt || selectedLead.createdAt)}
            </p>
          </div>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <a
            href={`mailto:${selectedLead.email}`}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#131b2e] px-3 py-2 text-xs font-bold text-white"
          >
            <Mail className="h-3.5 w-3.5" /> E-mail
          </a>
          {selectedLead.phone && (
            <a
              href={`tel:${selectedLead.phone}`}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#e7f8f2] px-3 py-2 text-xs font-bold text-[#047857]"
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </a>
          )}
          <button
            type="button"
            disabled={busyLeadId === selectedLead.id}
            onClick={() => void deleteLead(selectedLead)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#fee2e2] px-3 py-2 text-xs font-bold text-[#dc2626] disabled:opacity-50"
          >
            <Trash2 className="h-3.5 w-3.5" /> Excluir
          </button>
        </div>
        <div className="mt-5 border-t border-[#f0f1f8] pt-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-extrabold text-[#131b2e]">Comportamento</h3>
            <span className="text-[10px] font-semibold text-[#777587]">
              Eventos atribuídos quando identificados
            </span>
          </div>
          <div className="mt-4 space-y-3">
            {timeline.map((event, index) => (
              <div key={`${event.createdAt}-${index}`} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span className="mt-1 h-2.5 w-2.5 rounded-full bg-[#ff7a00]" />
                  {index < timeline.length - 1 && (
                    <span className="mt-1 h-full w-px bg-[#ffd8bc]" />
                  )}
                </div>
                <div className="pb-2">
                  <p className="text-xs font-bold text-[#131b2e]">{getEventLabel(event)}</p>
                  <p className="mt-0.5 text-[10px] text-[#777587]">
                    {formatDate(event.createdAt)}
                    {event.targetId ? ` · ${event.targetId}` : ''}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    );
  };

  return (
    <section id="leads-section" className="flex w-full flex-col gap-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7a00] text-white shadow-[0_4px_14px_rgba(255,122,0,0.22)]">
              <UsersRound className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-[#131b2e] sm:text-3xl">
                Leads
              </h1>
              <p className="mt-0.5 text-xs text-[#777587] sm:text-sm">
                Acompanhe pessoas que demonstraram interesse através da sua página.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => exportLeads('csv')}
            className="inline-flex items-center gap-2 rounded-xl border border-[#eaedff] bg-white px-3 py-2 text-xs font-bold text-[#464555] hover:border-[#ffcfad]"
          >
            <Download className="h-4 w-4 text-[#ff7a00]" /> Exportar CSV
          </button>
          <button
            type="button"
            onClick={() => exportLeads('excel')}
            className="inline-flex items-center gap-2 rounded-xl bg-[#131b2e] px-3 py-2 text-xs font-bold text-white hover:bg-[#252b40]"
          >
            <Download className="h-4 w-4" /> Excel
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 rounded-2xl border border-[#eaedff] bg-white p-2">
        {(
          [
            ['overview', 'Visão geral'],
            ['all', 'Todos os leads'],
            ['captures', 'Capturas'],
            ['segments', 'Segmentos'],
            ['settings', 'Configurações'],
          ] as const
        ).map(([tab, label]) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`rounded-xl px-3 py-2 text-xs font-bold transition ${activeTab === tab ? 'bg-[#fff0e3] text-[#ff7a00]' : 'text-[#777587] hover:bg-[#f6f7fc]'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              label="Visitantes"
              value={visitors}
              detail="Pessoas que acessaram sua página"
              icon={<UsersRound className="h-5 w-5" />}
              tone="bg-[#e0f2fe] text-[#0284c7]"
            />
            <MetricCard
              label="Interessados"
              value={interested}
              detail="Visitantes com ação relevante"
              icon={<BarChart3 className="h-5 w-5" />}
              tone="bg-[#ede9fe] text-[#7c3aed]"
            />
            <MetricCard
              label="Leads"
              value={localLeads.length}
              detail="Pessoas que forneceram contato"
              icon={<UserRound className="h-5 w-5" />}
              tone="bg-[#fff0e3] text-[#ff7a00]"
            />
            <MetricCard
              label="Convertidos"
              value={converted}
              detail="Leads que concluíram ação comercial"
              icon={<Check className="h-5 w-5" />}
              tone="bg-[#e4f8ef] text-[#047857]"
            />
          </div>
          <div className="rounded-2xl border border-[#ffd8bc] bg-[#fff9f2] p-4">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#a85b16]">
              Taxa de conversão
            </p>
            <p className="mt-1 text-xl font-extrabold text-[#131b2e]">
              {formatNumber(localLeads.length)} leads / {formatNumber(visitors)} visitantes ={' '}
              {formatPercent(conversionRate)}
            </p>
            <p className="mt-1 text-xs text-[#777587]">
              Lead é contado somente quando a pessoa fornece dado que permite contato ou
              identificação.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            <div className="rounded-2xl border border-[#eaedff] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#131b2e]">
                    De onde seus visitantes estão vindo?
                  </h2>
                  <p className="mt-1 text-xs text-[#777587]">
                    Origem/referrer e UTM não identificam automaticamente o perfil da pessoa.
                  </p>
                </div>
                <MapPin className="h-5 w-5 text-[#ff7a00]" />
              </div>
              <div className="mt-5 space-y-3">
                {sourceCounts.length === 0 ? (
                  <EmptyState
                    title="Sem origem registrada"
                    message="Publique sua página e use parâmetros UTM para começar a medir fontes."
                  />
                ) : (
                  sourceCounts.map((source) => (
                    <div key={source.name}>
                      <div className="mb-1 flex items-center justify-between text-xs">
                        <span className="font-bold text-[#464555]">{source.name}</span>
                        <span className="text-[#777587]">
                          {formatNumber(source.count)} · {formatPercent(source.percentage)}
                        </span>
                      </div>
                      <div className="h-2 overflow-hidden rounded-full bg-[#f1f2f8]">
                        <div
                          className="h-full rounded-full bg-[#ff7a00]"
                          style={{ width: `${Math.max(source.percentage, 2)}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
            <div className="rounded-2xl border border-[#eaedff] bg-white p-5">
              <div className="flex items-start justify-between">
                <div>
                  <h2 className="text-sm font-extrabold text-[#131b2e]">Funil de conversão</h2>
                  <p className="mt-1 text-xs text-[#777587]">
                    Visitante, interessado, lead e conversão são conceitos diferentes.
                  </p>
                </div>
                <ArrowDown className="h-5 w-5 text-[#ff7a00]" />
              </div>
              <div className="mt-5 space-y-2">
                {funnel.map((item, index) => (
                  <React.Fragment key={item.label}>
                    <div
                      className={`flex items-center justify-between rounded-xl px-4 py-3 ${item.color}`}
                    >
                      <span className="text-xs font-bold">{item.label}</span>
                      <span className="text-lg font-extrabold">{formatNumber(item.value)}</span>
                    </div>
                    {index < funnel.length - 1 && (
                      <div className="flex justify-center">
                        <ArrowDown className="h-4 w-4 text-[#c7c4d8]" />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-[#eaedff] bg-white p-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-extrabold text-[#131b2e]">Atividade recente</h2>
                <p className="mt-1 text-xs text-[#777587]">
                  Leads identificados e sua origem declarada ou capturada.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setActiveTab('all')}
                className="inline-flex items-center gap-1 text-xs font-bold text-[#ff7a00]"
              >
                Ver todos <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="mt-4">
              {recentLeads.length === 0 ? (
                <EmptyState
                  title="Nenhum lead ainda"
                  message="Crie uma captura na sua página para começar a receber contatos."
                />
              ) : (
                <div className="divide-y divide-[#f0f1f8]">
                  {recentLeads.map((lead) => (
                    <button
                      key={lead.id}
                      type="button"
                      onClick={() => {
                        setSelectedLeadId(lead.id);
                        setActiveTab('all');
                      }}
                      className="flex w-full items-center justify-between gap-3 py-3 text-left"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-xs font-extrabold text-[#131b2e]">
                          {lead.name}
                        </p>
                        <p className="mt-1 truncate text-[11px] text-[#777587]">
                          {sourceFromLead(lead)}
                          {lead.relatedName ? ` · ${lead.relatedName}` : ''}
                        </p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className="text-[10px] text-[#777587]">
                          {formatDate(lead.createdAt)}
                        </span>
                        <StatusBadge status={lead.status || 'new'} />
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'all' && (
        <>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
            <div className="min-w-0">
              <div className="mb-4 grid grid-cols-1 gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px]">
                <label className="relative block">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#a1a7bb]" />
                  <input
                    aria-label="Buscar lead"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Buscar lead..."
                    className="w-full rounded-xl border border-[#eaedff] bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-[#ffb37c]"
                  />
                </label>
                <select
                  aria-label="Filtrar por origem"
                  value={sourceFilter}
                  onChange={(event) => setSourceFilter(event.target.value)}
                  className="rounded-xl border border-[#eaedff] bg-white px-3 py-2.5 text-xs font-semibold text-[#464555] outline-none"
                >
                  <option value="all">Todas as origens</option>
                  {sourceOptions.map((source) => (
                    <option key={source} value={source}>
                      {source}
                    </option>
                  ))}
                </select>
                <select
                  aria-label="Filtrar por status"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value as 'all' | LeadStatus)}
                  className="rounded-xl border border-[#eaedff] bg-white px-3 py-2.5 text-xs font-semibold text-[#464555] outline-none"
                >
                  <option value="all">Todos os status</option>
                  {Object.entries(statusMeta).map(([status, meta]) => (
                    <option key={status} value={status}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
              {renderLeadList()}
            </div>
            {renderLeadDetail()}
          </div>
        </>
      )}

      {activeTab === 'captures' && (
        <div className="rounded-2xl border border-[#eaedff] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#131b2e]">Capturas de lead</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777587]">
            Configure ofertas e formulários como “Receba 10% de desconto”. Campos recomendados:
            nome, WhatsApp e e-mail. A captura deve exibir consentimento antes de salvar dados
            pessoais.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-[#faf8ff] p-4">
              <p className="text-xs font-bold text-[#131b2e]">Nome</p>
              <p className="mt-1 text-[11px] text-[#777587]">Identifica o contato.</p>
            </div>
            <div className="rounded-xl bg-[#faf8ff] p-4">
              <p className="text-xs font-bold text-[#131b2e]">WhatsApp</p>
              <p className="mt-1 text-[11px] text-[#777587]">Permite contato comercial.</p>
            </div>
            <div className="rounded-xl bg-[#faf8ff] p-4">
              <p className="text-xs font-bold text-[#131b2e]">E-mail</p>
              <p className="mt-1 text-[11px] text-[#777587]">Permite comunicação autorizada.</p>
            </div>
          </div>
          <p className="mt-5 rounded-xl border border-[#dce8ff] bg-[#f5f8ff] p-3 text-xs leading-5 text-[#31537f]">
            Para publicar esta captura, abra <strong>Minha Página</strong>, edite um bloco
            <strong> Contato</strong> e ative <strong>Captura de lead</strong>. O formulário exige
            consentimento, registra UTM/referrer e cria lead no CRM sem identificar perfil social.
          </p>
        </div>
      )}
      {activeTab === 'segments' && (
        <div className="rounded-2xl border border-[#eaedff] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#131b2e]">Segmentos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777587]">
            Use origem, campanha, status, score e produto ou serviço relacionado para organizar
            públicos comerciais. Clique em um segmento para abrir a lista filtrada.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            {[
              [
                'high',
                'Alto interesse',
                `${segmentCounts.highInterest} leads`,
                `Score a partir de ${leadSettings.highScore} pontos.`,
              ],
              [
                'social',
                'Origem social',
                `${segmentCounts.social} leads`,
                'Instagram, TikTok, Facebook ou WhatsApp.',
              ],
              [
                'not_converted',
                'Não convertidos',
                `${segmentCounts.notConverted} leads`,
                'Leads novos, em contato ou interessados.',
              ],
            ].map(([value, label, count, description]) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setSegmentFilter(value as typeof segmentFilter);
                  setActiveTab('all');
                }}
                className={`rounded-xl border p-4 text-left transition ${
                  segmentFilter === value
                    ? 'border-[#ffb37c] bg-[#fff8f2]'
                    : 'border-[#eaedff] hover:border-[#ffcfad]'
                }`}
              >
                <p className="text-xs font-bold text-[#131b2e]">{label}</p>
                <p className="mt-1 text-sm font-extrabold text-[#ff7a00]">{count}</p>
                <p className="mt-1 text-[11px] text-[#777587]">{description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
      {activeTab === 'settings' && (
        <div className="rounded-2xl border border-[#eaedff] bg-white p-6">
          <h2 className="text-lg font-extrabold text-[#131b2e]">Configurações de Leads</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#777587]">
            Defina score, consentimento, retenção e integrações sem misturar identidade individual
            com origem de tráfego.
          </p>
          <div className="mt-5 grid grid-cols-1 gap-3 md:grid-cols-3">
            <label className="rounded-xl border border-[#eaedff] p-4">
              <span className="text-xs font-bold text-[#131b2e]">Score alto</span>
              <input
                type="number"
                min={1}
                max={100}
                value={leadSettings.highScore}
                onChange={(event) =>
                  setLeadSettings((current) => ({
                    ...current,
                    highScore: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-[#eaedff] px-3 py-2 text-sm"
              />
            </label>
            <label className="rounded-xl border border-[#eaedff] p-4">
              <span className="text-xs font-bold text-[#131b2e]">Score médio</span>
              <input
                type="number"
                min={0}
                max={99}
                value={leadSettings.mediumScore}
                onChange={(event) =>
                  setLeadSettings((current) => ({
                    ...current,
                    mediumScore: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-[#eaedff] px-3 py-2 text-sm"
              />
            </label>
            <label className="rounded-xl border border-[#eaedff] p-4">
              <span className="text-xs font-bold text-[#131b2e]">Retenção de dados (dias)</span>
              <input
                type="number"
                min={30}
                max={3650}
                value={leadSettings.retentionDays}
                onChange={(event) =>
                  setLeadSettings((current) => ({
                    ...current,
                    retentionDays: Number(event.target.value),
                  }))
                }
                className="mt-2 w-full rounded-lg border border-[#eaedff] px-3 py-2 text-sm"
              />
            </label>
          </div>
          <label className="mt-3 flex items-start gap-3 rounded-xl border border-[#eaedff] p-4">
            <input
              type="checkbox"
              checked={leadSettings.consentRequired}
              onChange={(event) =>
                setLeadSettings((current) => ({
                  ...current,
                  consentRequired: event.target.checked,
                }))
              }
              className="mt-0.5 h-4 w-4 accent-[#ff7a00]"
            />
            <span>
              <span className="block text-xs font-bold text-[#131b2e]">Exigir consentimento</span>
              <span className="mt-1 block text-[11px] text-[#777587]">
                Formulários públicos devem registrar consentimento antes de criar lead.
              </span>
            </span>
          </label>
          <button
            type="button"
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.localStorage.setItem(
                  `pandabio-leads-settings:${username || 'default'}`,
                  JSON.stringify(leadSettings),
                );
              }
              setSettingsSaved(true);
              window.setTimeout(() => setSettingsSaved(false), 1800);
            }}
            className="mt-4 rounded-xl bg-[#131b2e] px-4 py-2.5 text-xs font-bold text-white"
          >
            {settingsSaved ? 'Configurações salvas' : 'Salvar configurações'}
          </button>
          <div className="mt-5 space-y-3">
            <div className="flex items-start gap-3 rounded-xl bg-[#faf8ff] p-4">
              <Smartphone className="mt-0.5 h-4 w-4 text-[#ff7a00]" />
              <div>
                <p className="text-xs font-bold text-[#131b2e]">Rastreamento responsável</p>
                <p className="mt-1 text-[11px] leading-5 text-[#777587]">
                  Origem, UTM e referrer mostram contexto da visita, não o perfil exato da pessoa. A
                  identidade só fica associada quando o visitante fornece dados e há consentimento.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-xl bg-[#faf8ff] p-4">
              <CalendarDays className="mt-0.5 h-4 w-4 text-[#ff7a00]" />
              <div>
                <p className="text-xs font-bold text-[#131b2e]">Retenção e exclusão</p>
                <p className="mt-1 text-[11px] leading-5 text-[#777587]">
                  O proprietário pode excluir leads. Solicitações de exclusão e políticas de
                  retenção devem seguir as regras de privacidade aplicáveis.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
