import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenView, NavSection, BioLink, ProductItem, UserProfile } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiMetrics, KpiData } from './components/KpiMetrics';
import { ConversionFunnel } from './components/ConversionFunnel';
import { VisitsChart } from './components/VisitsChart';
import { ClicksByLinkChart } from './components/ClicksByLinkChart';
import { LinksManagerCard } from './components/LinksManagerCard';
import { TrafficSourcesCard } from './components/TrafficSourcesCard';
import { RecentActivityCard } from './components/RecentActivityCard';
import { MascotCard } from './components/MascotCard';
import { PhonePreviewModal } from './components/PhonePreviewModal';
import { CreateItemModal } from './components/CreateItemModal';
import { DetailedReportModal } from './components/DetailedReportModal';
import { UpgradeModal } from './components/UpgradeModal';
import { SectionViews } from './components/SectionViews';
import { ExternalLink } from 'lucide-react';
import { multiUserStore, UserAccountData } from './services/multiUserStore';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('visao-geral');

  // Load active user account from isolated store
  const [activeAccount, setActiveAccount] = useState<UserAccountData>(() =>
    multiUserStore.getCurrentAccount()
  );
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>(() =>
    multiUserStore.getAllAccountsList()
  );

  const user = activeAccount.profile;
  const links = activeAccount.links;
  const products = activeAccount.products;
  const leads = activeAccount.leads;
  const activities = activeAccount.activities;

  // Sync state helpers
  const updateAccountState = useCallback(
    (updater: (prev: UserAccountData) => UserAccountData) => {
      setActiveAccount((prev) => {
        const next = updater(prev);
        multiUserStore.updateCurrentAccount(next);
        return next;
      });
    },
    []
  );

  // Search filter
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPhonePreviewOpen, setIsPhonePreviewOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Switch between existing users
  const handleSwitchUser = (email: string) => {
    const acc = multiUserStore.switchUser(email);
    setActiveAccount(acc);
    setAllUsersList(multiUserStore.getAllAccountsList());
    setActiveSection('visao-geral');
  };

  // Toggle link active status
  const handleToggleLink = (id: string) => {
    updateAccountState((prev) => ({
      ...prev,
      links: prev.links.map((l) => (l.id === id ? { ...l, active: !l.active } : l)),
    }));
  };

  // Add new link
  const handleAddLink = (newLink: BioLink) => {
    updateAccountState((prev) => ({
      ...prev,
      links: [newLink, ...prev.links],
      activities: [
        {
          id: `act-${Date.now()}`,
          title: `Novo link adicionado: ${newLink.title}`,
          subtitle: 'Publicado na bio',
          timeAgo: 'agora',
          type: 'clicks',
          timestamp: 'Agora mesmo',
        },
        ...prev.activities,
      ],
    }));
  };

  // Add new product
  const handleAddProduct = (newProd: ProductItem) => {
    updateAccountState((prev) => ({
      ...prev,
      products: [newProd, ...prev.products],
      activities: [
        {
          id: `act-${Date.now()}`,
          title: `Novo produto criado: ${newProd.name}`,
          subtitle: `R$ ${newProd.price.toFixed(2)}`,
          timeAgo: 'agora',
          type: 'order',
          timestamp: 'Agora mesmo',
        },
        ...prev.activities,
      ],
    }));
  };

  // Update user details
  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    updateAccountState((prev) => ({
      ...prev,
      profile: { ...prev.profile, ...updated },
    }));
    setAllUsersList(multiUserStore.getAllAccountsList());
  };

  // Auth successful login
  const handleLoginSuccess = (userData: Partial<UserProfile>) => {
    const targetEmail = userData.email || 'usuario@email.com';
    const loadedAccount = multiUserStore.authenticate(targetEmail, userData);
    setActiveAccount(loadedAccount);
    setAllUsersList(multiUserStore.getAllAccountsList());
    setCurrentScreen('dashboard');
    setActiveSection('visao-geral');
  };

  // Logout
  const handleLogout = () => {
    multiUserStore.logout();
    setCurrentScreen('auth');
    setMobileMenuOpen(false);
  };

  // Upgrade to PRO
  const handleUpgradeSuccess = () => {
    updateAccountState((prev) => ({
      ...prev,
      profile: { ...prev.profile, plan: 'PRO' },
    }));
    setAllUsersList(multiUserStore.getAllAccountsList());
  };

  // Calculate real metrics from user account data
  const realKpiData: KpiData = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const estimatedVisits = totalClicks > 0 ? totalClicks * 2 : 0;
    const ctr = estimatedVisits > 0 ? (totalClicks / estimatedVisits) * 100 : 0;
    const leadRate = totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0;
    const convRate = totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0;

    return {
      visits: estimatedVisits,
      visitsGrowth: 0,
      ctrGeneral: ctr,

      clicks: totalClicks,
      clicksGrowth: 0,
      clickRate: ctr,

      leads: totalLeads,
      leadsGrowth: 0,
      leadConversionRate: leadRate,

      conversions: totalConversions,
      conversionsGrowth: 0,
      finalConversionRate: convRate,
    };
  }, [links, leads, products]);

  const funnelData = useMemo(() => {
    const totalClicks = links.reduce((sum, l) => sum + (l.clicks || 0), 0);
    const totalLeads = leads.length;
    const totalConversions = products.reduce((sum, p) => sum + (p.salesCount || 0), 0);
    const estimatedVisits = totalClicks > 0 ? totalClicks * 2 : 0;

    return {
      visits: estimatedVisits,
      clicks: totalClicks,
      leads: totalLeads,
      conversions: totalConversions,
      ctr: estimatedVisits > 0 ? (totalClicks / estimatedVisits) * 100 : 0,
      leadRate: totalClicks > 0 ? (totalLeads / totalClicks) * 100 : 0,
      conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
    };
  }, [links, leads, products]);

  // Filter links by search query
  const filteredLinks = links.filter((l) =>
    l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    l.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'auth' ? (
        <AuthScreen
          key="auth-view"
          onLoginSuccess={handleLoginSuccess}
          onGoToDashboard={() => setCurrentScreen('dashboard')}
        />
      ) : (
        <motion.div
          key="dashboard-view"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="min-h-screen bg-[#F6EFE9] text-[#131b2e] flex flex-col font-sans"
        >
          {/* Main Navigation Sidebar */}
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            mobileOpen={mobileMenuOpen}
            onCloseMobile={() => setMobileMenuOpen(false)}
            activeSection={activeSection}
            onSelectSection={(section) => {
              setActiveSection(section);
              setMobileMenuOpen(false);
            }}
            user={user}
            linksCount={links.length}
            productsCount={products.length}
            leadsCount={leads.length}
            allUsers={allUsersList}
            onSwitchUser={handleSwitchUser}
            onCreateNew={() => {
              setIsCreateItemOpen(true);
              setMobileMenuOpen(false);
            }}
            onOpenUpgrade={() => {
              setIsUpgradeModalOpen(true);
              setMobileMenuOpen(false);
            }}
            onLogout={handleLogout}
          />

          {/* Main Content Area Container */}
          <div
            id="main-layout-container"
            className={`flex-1 flex flex-col transition-all duration-300 min-w-0 pl-0 ${
              sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
            }`}
          >
            {/* Header */}
            <Header
              collapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)}
              user={user}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onOpenPhonePreview={() => setIsPhonePreviewOpen(true)}
              onSwitchToAuth={() => setCurrentScreen('auth')}
            />

            {/* Dashboard Canvas */}
            <main className="relative pt-20 px-3.5 sm:px-6 md:px-8 pb-16 max-w-[1600px] w-full mx-auto min-w-0">
              {/* Section: Visão Geral (The Primary Dashboard Screen) */}
              {activeSection === 'visao-geral' ? (
                <div className="flex flex-col w-full gap-6">
                  {/* Welcome Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                          Olá, {user.name.split(' ')[0]}!
                        </h1>
                        <span aria-hidden="true" className="text-2xl select-none">
                          👋
                        </span>
                      </div>
                      <p className="text-xs sm:text-sm text-[#464555] mt-0.5">
                        Gerencie sua página de bio e monitore suas conversões em tempo real.
                      </p>
                    </div>

                    {/* Quick actions badge/pill */}
                    <div className="flex items-center gap-3 self-start md:self-auto">
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#eaedff] text-[#464555] text-xs font-medium">
                        <span className="w-2 h-2 rounded-full bg-[#10B981] animate-pulse" />
                        <span className="text-[#10B981] font-semibold">Página Online</span>
                        <span className="text-[#c7c4d8]">•</span>
                        <span className="text-[#FF7A00] font-bold">{user.bioUrl}</span>
                      </div>

                      <button
                        onClick={() => setIsPhonePreviewOpen(true)}
                        className="p-2 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464555] hover:text-[#FF7A00] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Abrir prévia no celular"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 4 Top KPI Metric Cards */}
                  <KpiMetrics data={realKpiData} />

                  {/* Conversion Funnel Banner */}
                  <ConversionFunnel data={funnelData} />

                  {/* Central Charts (2 Columns) */}
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
                    <VisitsChart totalVisits={realKpiData.visits} />
                    <ClicksByLinkChart links={links} />
                  </div>

                  {/* Bottom Grid with 4 Strategic Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 sm:gap-6 items-stretch">
                    <LinksManagerCard
                      links={filteredLinks}
                      onToggleLink={handleToggleLink}
                      onAddLink={() => setIsCreateItemOpen(true)}
                    />
                    <TrafficSourcesCard links={links} />
                    <RecentActivityCard
                      activities={activities}
                      onViewAll={() => setIsReportModalOpen(true)}
                    />
                    <MascotCard
                      hasActivity={links.length > 0 || activities.length > 0}
                      onOpenReport={() => setIsReportModalOpen(true)}
                    />
                  </div>
                </div>
              ) : (
                /* Sub-sections */
                <SectionViews
                  section={activeSection}
                  links={links}
                  products={products}
                  leads={leads}
                  user={user}
                  onToggleLink={handleToggleLink}
                  onOpenCreateItem={() => setIsCreateItemOpen(true)}
                  onOpenPhonePreview={() => setIsPhonePreviewOpen(true)}
                  onUpdateUser={handleUpdateUser}
                />
              )}
            </main>
          </div>

          {/* Phone Mockup Modal */}
          <PhonePreviewModal
            isOpen={isPhonePreviewOpen}
            onClose={() => setIsPhonePreviewOpen(false)}
            user={user}
            links={links}
          />

          {/* Create Item Modal */}
          <CreateItemModal
            isOpen={isCreateItemOpen}
            onClose={() => setIsCreateItemOpen(false)}
            onAddLink={handleAddLink}
            onAddProduct={handleAddProduct}
          />

          {/* Detailed Report Modal */}
          <DetailedReportModal
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            links={links}
            leads={leads}
          />

          {/* Upgrade PRO Modal */}
          <UpgradeModal
            isOpen={isUpgradeModalOpen}
            onClose={() => setIsUpgradeModalOpen(false)}
            onUpgradeSuccess={handleUpgradeSuccess}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
