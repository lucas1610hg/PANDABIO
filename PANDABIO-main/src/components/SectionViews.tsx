import React from 'react';
import { NavSection, BioLink, ProductItem, LeadItem, UserProfile, LeadStatus } from '../types';
import { PageEditor } from './PageEditor';
import { ProfileSection } from './ProfileSection';
import { LinksSection } from './LinksSection';
import { ProductsSection } from './ProductsSection';
import { AgendamentosSection } from './agendamentos/AgendamentosSection';
import { StatisticsSection } from './StatisticsSection';
import { LeadsSection } from './LeadsSection';
import { FormsSection } from './FormsSection';
import { SettingsSection } from './SettingsSection';
import { PlanSection } from './PlanSection';
import { HelpSection } from './HelpSection';
import { ActivityItem } from '../types';
import { KpiData } from './KpiMetrics';
import { PublicAnalyticsSummary } from '../supabase/services/publicAnalyticsService';

interface SectionViewsProps {
  section: NavSection;
  links?: BioLink[];
  products?: ProductItem[];
  leads?: LeadItem[];
  activities?: ActivityItem[];
  analytics?: PublicAnalyticsSummary;
  kpiData?: KpiData;
  user?: UserProfile;
  onToggleLink?: (id: string) => void;
  onToggleProduct?: (id: string) => void;
  onAddProduct?: (product: ProductItem) => void;
  onEditProduct?: (product: ProductItem) => void;
  onOpenCreateItem?: () => void;
  onOpenCreateProduct?: () => void;
  onOpenPhonePreview?: () => void;
  onUpdateUser?: (u: Partial<UserProfile>) => void | Promise<unknown>;
  onLogout?: () => void;
  onReorderLinks?: (reordered: BioLink[]) => void;
  onUpdateLeadStatus?: (id: string, status: LeadStatus) => Promise<unknown>;
  onDeleteLead?: (id: string) => Promise<unknown>;
}

export const SectionViews: React.FC<SectionViewsProps> = ({
  section,
  links,
  products,
  leads,
  activities,
  analytics,
  kpiData,
  user,
  onToggleLink,
  onToggleProduct,
  onAddProduct,
  onEditProduct,
  onOpenCreateItem,
  onOpenCreateProduct,
  onUpdateUser,
  onLogout,
  onReorderLinks,
  onUpdateLeadStatus,
  onDeleteLead,
}) => {
  // Renderizar PageEditor para a seção 'minha-pagina'
  if (section === 'minha-pagina' && user) {
    return (
      <PageEditor
        key={user.email || user.username || user.bioUrl || 'anonymous'}
        user={user}
        links={links || []}
        products={products || []}
      />
    );
  }

  // Seção de Estatísticas
  if (section === 'estatisticas') {
    return (
      <StatisticsSection
        links={links || []}
        products={products || []}
        leads={leads || []}
        activities={activities || []}
        analytics={analytics}
        kpiData={kpiData}
      />
    );
  }

  if (section === 'leads') {
    return (
      <LeadsSection
        leads={leads || []}
        links={links || []}
        products={products || []}
        username={user?.username}
        analytics={analytics}
        onUpdateLeadStatus={onUpdateLeadStatus}
        onDeleteLead={onDeleteLead}
      />
    );
  }

  if (section === 'formularios' && user) {
    return <FormsSection user={user} />;
  }
  // Seção de Perfil da conta
  if (section === 'perfil' && user) {
    return (
      <ProfileSection user={user} onUpdateUser={onUpdateUser || (() => {})} onLogout={onLogout} />
    );
  }

  // Seção de configurações da conta
  if (section === 'configuracoes' && user) {
    return (
      <SettingsSection key={user.email || user.username} user={user} onUpdateUser={onUpdateUser} />
    );
  }

  // Seção de Links
  if (section === 'links') {
    return (
      <LinksSection
        links={links || []}
        onToggleLink={onToggleLink || (() => {})}
        onAddLink={onOpenCreateItem || (() => {})}
        onReorder={onReorderLinks}
      />
    );
  }

  // Seção de Produtos
  if (section === 'produtos') {
    return (
      <ProductsSection
        products={products || []}
        onToggleProduct={onToggleProduct || (() => {})}
        onCreateProduct={onOpenCreateProduct || onOpenCreateItem || (() => {})}
        onAddProduct={onAddProduct || (() => {})}
        onEditProduct={onEditProduct || (() => {})}
      />
    );
  }

  // Seção de Agendamentos
  if (section === 'agendamentos') {
    return <AgendamentosSection />;
  }

  if (section === 'plano') {
    return <PlanSection user={user} />;
  }

  if (section === 'ajuda') {
    return <HelpSection />;
  }

  // Outras seções mantidas vazias por enquanto
  return <div id={`section-empty-canvas-${section}`} className="w-full min-h-[500px]" />;
};
