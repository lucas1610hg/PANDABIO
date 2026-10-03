import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenView, NavSection, BioLink, ProductItem, UserProfile, LeadStatus } from './types';
import { AuthScreen } from './components/AuthScreen';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { KpiMetrics } from './components/KpiMetrics';
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
import { ExternalLink, Waves } from 'lucide-react';
import { useSupabaseData } from './hooks/useSupabaseData';
import { AuthService } from './supabase/services/authService';
import { supabase } from './supabase/client';
import { PublicProfilePage } from './components/PublicProfilePage';
import { getPublicProfileSlug } from './utils/publicRoute';
import { getPageUrl } from './utils/pageUrl';

function AdminApp() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('auth');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [visitedSections, setVisitedSections] = useState<Set<NavSection>>(
    () => new Set<NavSection>(['dashboard']),
  );
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPhonePreviewOpen, setIsPhonePreviewOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [createItemInitialTab, setCreateItemInitialTab] = useState<'link' | 'product'>('link');
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [supabaseSessionActive, setSupabaseSessionActive] = useState<boolean | null>(
    supabase ? null : false,
  );

  const remoteData = useSupabaseData();
  const { refreshData: refreshRemoteData } = remoteData;
  const isUsingSupabaseData = supabaseSessionActive === true;
  const user = remoteData.user;
  const links = remoteData.links;
  const products = remoteData.products;
  const leads = remoteData.leads;
  const activities = remoteData.activities;
  const realKpiData = remoteData.realKpiData;
  const funnelData = remoteData.funnelData;

  // Handle OAuth callback
  useEffect(() => {
    if (!supabase) return;

    const client = supabase;
    let mounted = true;

    const loadSession = async () => {
      const { data } = await client.auth.getSession();
      if (!mounted) return;

      const sessionActive = Boolean(data.session);
      setSupabaseSessionActive(sessionActive);

      if (!sessionActive) {
        setCurrentScreen('auth');
        setActiveSection('dashboard');
        setVisitedSections(new Set<NavSection>(['dashboard']));
        return;
      }

      const profile = await AuthService.getCurrentUser();
      if (!mounted) return;

      if (profile.user) {
        setCurrentScreen('dashboard');
        setActiveSection('dashboard');
        setVisitedSections(new Set<NavSection>(['dashboard']));
      } else {
        setCurrentScreen('auth');
      }
      await refreshRemoteData();
    };

    void loadSession();

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;

      const sessionActive = Boolean(session);
      setSupabaseSessionActive(sessionActive);

      if (!sessionActive) {
        setCurrentScreen('auth');
        setActiveSection('dashboard');
        setVisitedSections(new Set<NavSection>(['dashboard']));
        return;
      }

      if (event === 'SIGNED_IN') {
        setCurrentScreen('dashboard');
        setActiveSection('dashboard');
        setVisitedSections(new Set<NavSection>(['dashboard']));
      }

      window.setTimeout(() => {
        if (mounted) void refreshRemoteData();
      }, 0);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [refreshRemoteData]);

  // Auth successful login
  const handleLoginSuccess = () => {
    setCurrentScreen('dashboard');
    setActiveSection('dashboard');
    setVisitedSections(new Set<NavSection>(['dashboard']));

    if (supabase) {
      void supabase.auth.getSession().then(({ data }) => {
        const sessionActive = Boolean(data.session);
        setSupabaseSessionActive(sessionActive);
        if (sessionActive) void refreshRemoteData();
      });
    }
  };

  // Logout
  const handleLogout = async () => {
    try {
      await AuthService.signOut();
    } finally {
      setSupabaseSessionActive(false);
      setCurrentScreen('auth');
      setActiveSection('dashboard');
      setVisitedSections(new Set<NavSection>(['dashboard']));
      setMobileMenuOpen(false);
    }
  };

  // Upgrade to PRO
  const handleUpgradeSuccess = () => {
    void remoteData.upgradeToPro();
  };

  // Filter links by search query
  const filteredLinks = links.filter(
    (l: BioLink) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handler functions using Supabase services
  const handleToggleLink = (id: string) => {
    void remoteData.toggleLink(id);
  };

  const handleAddLink = (newLink: BioLink) => {
    const { id: _id, ...linkData } = newLink;
    void remoteData.addLink(linkData);
  };

  const handleReorderLinks = (reordered: BioLink[]) => {
    void remoteData.reorderLinks(reordered);
  };

  const handleToggleProduct = (id: string) => {
    const product = products.find((item) => item.id === id);
    if (product) void remoteData.toggleProduct(id, product.status);
  };

  const handleAddProduct = (newProd: ProductItem) => {
    const { id: _id, ...productData } = newProd;
    void remoteData.addProduct(productData);
  };

  const handleEditProduct = (product: ProductItem) => {
    setEditingProduct(product);
    setCreateItemInitialTab('product');
    setIsCreateItemOpen(true);
  };

  const handleUpdateProduct = (updatedProduct: ProductItem) => {
    const { id, ...updates } = updatedProduct;
    void remoteData.updateProduct(id, updates);
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    return remoteData.updateProfile(updated);
  };

  const handleUpdateLeadStatus = (id: string, status: LeadStatus) => {
    return remoteData.updateLeadStatus(id, status);
  };

  const handleDeleteLead = (id: string) => {
    return remoteData.deleteLead(id);
  };

  if (supabase && supabaseSessionActive === null) {
    return (
      <div className="min-h-screen bg-[#F6EFE9] flex items-center justify-center text-[#464555]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="h-5 w-5 rounded-full border-2 border-[#FF7A00] border-t-transparent animate-spin" />
          Carregando sua conta...
        </div>
      </div>
    );
  }

  if (isUsingSupabaseData && !remoteData.loading && !user) {
    return (
      <div className="min-h-screen bg-[#F6EFE9] flex items-center justify-center px-5 text-center text-[#464555]">
        <div className="max-w-md rounded-2xl bg-white p-8 shadow-lg">
          <h1 className="text-xl font-extrabold text-[#131b2e]">Perfil não encontrado</h1>
          <p className="mt-2 text-sm">
            Sua sessão existe, mas seu perfil ainda não foi criado. Saia e entre novamente ou
            confira a configuração do banco.
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="mt-5 rounded-xl bg-[#131b2e] px-4 py-2.5 text-sm font-bold text-white"
          >
            Sair
          </button>
        </div>
      </div>
    );
  }

  if (currentScreen !== 'auth' && !user) {
    return (
      <div className="min-h-screen bg-[#F6EFE9] flex items-center justify-center text-[#464555]">
        <div className="flex items-center gap-3 text-sm font-semibold">
          <span className="h-5 w-5 rounded-full border-2 border-[#FF7A00] border-t-transparent animate-spin" />
          Carregando sua conta...
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {currentScreen === 'auth' ? (
        <AuthScreen key="auth-view" onLoginSuccess={handleLoginSuccess} />
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
              setVisitedSections((previous) => {
                if (previous.has(section)) return previous;

                const next = new Set(previous);
                next.add(section);
                return next;
              });
              setActiveSection(section);
              setMobileMenuOpen(false);
            }}
            user={user}
            linksCount={links.length}
            productsCount={products.length}
            leadsCount={leads.length}
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
              {/* Section: Dashboard (The Primary Dashboard Screen) */}
              <div hidden={activeSection !== 'dashboard'}>
                <div className="flex flex-col w-full gap-6">
                  {/* Welcome Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-1">
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <h1 className="text-2xl sm:text-3xl font-extrabold text-[#131b2e] tracking-tight">
                          Olá, {user.name.split(' ')[0]}!
                        </h1>
                        <Waves aria-hidden="true" className="w-7 h-7 text-[#FF7A00] select-none" />
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
                        <span className="text-[#FF7A00] font-bold">
                          {getPageUrl(user.bioUrl, user.username)}
                        </span>
                      </div>

                      <button
                        onClick={() => setIsPhonePreviewOpen(true)}
                        className="p-2 rounded-xl bg-[#f2f3ff] hover:bg-[#eaedff] text-[#464555] hover:text-[#FF7A00] transition-colors flex items-center justify-center cursor-pointer shadow-2xs"
                        title="Abrir prévia no celular"
                      >
                        <ExternalLink aria-hidden="true" className="w-4 h-4" />
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
                      onReorder={handleReorderLinks}
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
              </div>

              {Array.from(visitedSections)
                .filter((section) => section !== 'dashboard')
                .map((section) => (
                  <div key={section} hidden={activeSection !== section}>
                    <SectionViews
                      section={section}
                      links={links}
                      products={products}
                      leads={leads}
                      activities={activities}
                      analytics={remoteData.publicAnalytics}
                      kpiData={realKpiData}
                      user={user}
                      onToggleLink={handleToggleLink}
                      onToggleProduct={handleToggleProduct}
                      onAddProduct={handleAddProduct}
                      onEditProduct={handleEditProduct}
                      onOpenCreateItem={() => {
                        setCreateItemInitialTab('link');
                        setEditingProduct(null);
                        setIsCreateItemOpen(true);
                      }}
                      onOpenCreateProduct={() => {
                        setCreateItemInitialTab('product');
                        setEditingProduct(null);
                        setIsCreateItemOpen(true);
                      }}
                      onOpenPhonePreview={() => setIsPhonePreviewOpen(true)}
                      onUpdateUser={handleUpdateUser}
                      onLogout={handleLogout}
                      onReorderLinks={handleReorderLinks}
                      onUpdateLeadStatus={handleUpdateLeadStatus}
                      onDeleteLead={handleDeleteLead}
                    />
                  </div>
                ))}
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
            onClose={() => {
              setIsCreateItemOpen(false);
              setEditingProduct(null);
            }}
            initialTab={createItemInitialTab}
            onAddLink={handleAddLink}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            editingProduct={editingProduct}
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

export default function App() {
  const publicProfileSlug = getPublicProfileSlug();

  if (publicProfileSlug) {
    return <PublicProfilePage username={publicProfileSlug} />;
  }

  return <AdminApp />;
}
