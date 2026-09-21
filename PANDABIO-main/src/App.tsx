import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ScreenView, NavSection, BioLink, ProductItem, UserProfile } from './types';
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
import { usePandaBioStore } from './store/usePandaBioStore';
import { usePandaBioData } from './hooks/usePandaBioData';
import { AuthService } from './supabase/services/authService';
import { supabase } from './supabase/client';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<NavSection>('dashboard');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isPhonePreviewOpen, setIsPhonePreviewOpen] = useState(false);
  const [isCreateItemOpen, setIsCreateItemOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);

  // Store hooks
  const {
    authenticate,
    logout,
    switchUser,
    toggleLink,
    addLink,
    reorderLinks,
    addProduct,
    updateUserProfile,
    upgradeToPro,
    getAllAccountsList,
  } = usePandaBioStore();
  const { user, links, products, leads, activities, realKpiData, funnelData } = usePandaBioData();
  const allUsersList = getAllAccountsList();

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      if (supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const profile = await AuthService.getCurrentUser();
          if (profile.user) {
            authenticate(profile.user.email || '', profile.user);
            setCurrentScreen('dashboard');
            setActiveSection('dashboard');
          }
        }
      }
    };

    handleOAuthCallback();
  }, []);

  // Switch between existing users
  const handleSwitchUser = (email: string) => {
    switchUser(email);
    setActiveSection('dashboard');
  };

  // Auth successful login
  const handleLoginSuccess = (userData: Partial<UserProfile>) => {
    const targetEmail = userData.email || 'usuario@email.com';
    authenticate(targetEmail, userData);
    setCurrentScreen('dashboard');
    setActiveSection('dashboard');
  };

  // Logout
  const handleLogout = () => {
    logout();
    setCurrentScreen('auth');
    setMobileMenuOpen(false);
  };

  // Upgrade to PRO
  const handleUpgradeSuccess = () => {
    upgradeToPro();
  };

  // Filter links by search query
  const filteredLinks = links.filter(
    (l: BioLink) =>
      l.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.url.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Handler functions using store methods
  const handleToggleLink = (id: string) => {
    toggleLink(id);
  };

  const handleAddLink = (newLink: BioLink) => {
    addLink(newLink);
  };

  const handleReorderLinks = (reordered: BioLink[]) => {
    reorderLinks(reordered);
  };

  const handleAddProduct = (newProd: ProductItem) => {
    addProduct(newProd);
  };

  const handleUpdateUser = (updated: Partial<UserProfile>) => {
    updateUserProfile(updated);
  };

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
              setActiveSection(section);
              setMobileMenuOpen(false);
            }}
            user={user}
            linksCount={links.length}
            productsCount={products.length}
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
              {/* Section: Dashboard (The Primary Dashboard Screen) */}
              {activeSection === 'dashboard' ? (
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
                        <span className="text-[#FF7A00] font-bold">{user.bioUrl}</span>
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
