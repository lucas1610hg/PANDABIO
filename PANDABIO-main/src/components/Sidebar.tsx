import React, { useState } from 'react';
import { PANDABIO_ASSETS } from '../constants/assets';
import sidebarLogoImg from '../assets/images/regenerated_image_1789761089362.png';
import { getPageUrl } from '../utils/pageUrl';
import {
  Home,
  Smartphone,
  Link as LinkIcon,
  Package,
  Calendar,
  BarChart3,
  UsersRound,
  ClipboardList,
  Settings,
  Plus,
  PanelLeftClose,
  PanelLeft,
  ChevronRight,
  X,
  Sparkles,
  ExternalLink,
  LogOut,
  HelpCircle,
  CreditCard,
  User,
  LucideIcon,
} from 'lucide-react';
import { NavSection, UserProfile } from '../types';

interface NavItem {
  id: NavSection;
  label: string;
  icon: LucideIcon;
  count?: number;
  badge?: string;
  badgeColor?: string;
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeSection: NavSection;
  onSelectSection: (section: NavSection) => void;
  user: UserProfile;
  linksCount: number;
  productsCount?: number;
  leadsCount?: number;
  onCreateNew: () => void;
  onOpenUpgrade: () => void;
  onLogout: () => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggleCollapse,
  activeSection,
  onSelectSection,
  user,
  linksCount,
  productsCount = 0,
  leadsCount = 0,
  onCreateNew,
  onOpenUpgrade,
  onLogout,
  mobileOpen = false,
  onCloseMobile,
}) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleNavClick = (section: NavSection) => {
    onSelectSection(section);
    setProfileMenuOpen(false);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleCreateClick = () => {
    onCreateNew();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleUpgradeClick = () => {
    onOpenUpgrade();
    setProfileMenuOpen(false);
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const handleLogoutClick = () => {
    setProfileMenuOpen(false);
    onLogout();
    if (onCloseMobile) {
      onCloseMobile();
    }
  };

  const navItemsPrincipal: NavItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: Home,
    },
    {
      id: 'minha-pagina',
      label: 'Minha Página',
      icon: Smartphone,
      badge: 'Online',
      badgeColor: 'emerald',
    },
    {
      id: 'agendamentos',
      label: 'Agendamentos',
      icon: Calendar,
    },
    {
      id: 'estatisticas',
      label: 'Estatísticas',
      icon: BarChart3,
    },
    {
      id: 'leads',
      label: 'Leads',
      icon: UsersRound,
      count: leadsCount,
    },
    {
      id: 'formularios',
      label: 'Formulários',
      icon: ClipboardList,
    },
  ];

  const navItemsGestao: NavItem[] = [
    {
      id: 'links',
      label: 'Links',
      icon: LinkIcon,
      count: linksCount,
    },
    {
      id: 'produtos',
      label: 'Produtos',
      icon: Package,
      count: productsCount,
    },
  ];

  const navItemsFooter: NavItem[] = [
    {
      id: 'configuracoes',
      label: 'Configurações',
      icon: Settings,
    },
    {
      id: 'plano',
      label: 'Plano',
      icon: CreditCard,
    },
    {
      id: 'ajuda',
      label: 'Ajuda',
      icon: HelpCircle,
    },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {mobileOpen && (
        <div
          id="sidebar-mobile-backdrop"
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/70 backdrop-blur-xs z-40 lg:hidden transition-opacity duration-300"
        />
      )}

      <aside
        id="sidebar"
        className={`fixed left-0 top-0 h-full max-h-screen z-50 flex flex-col py-4 select-none bg-sidebar-dark shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-sidebar-border transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden sidebar-scrollbar touch-pan-y overscroll-contain ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${collapsed ? 'lg:w-20 lg:px-2.5' : 'lg:w-64 lg:px-3.5'} w-72 max-w-[85vw] px-3.5`}
        style={{
          backgroundImage:
            'radial-gradient(ellipse at 20% 0%, rgba(255, 102, 0, 0.04) 0%, transparent 60%)',
        }}
      >
        {/* Top Section */}
        <div id="sidebar-top-section" className="relative z-10 flex flex-col flex-1 shrink-0">
          {/* Header: Logo & Workspace Info */}
          <div
            id="sidebar-logo-container"
            className={`flex items-center justify-between ${
              collapsed ? 'lg:flex-col lg:items-center lg:gap-3 px-0' : 'px-1'
            } pt-1 pb-4 mb-2 min-h-[48px]`}
          >
            {/* Main Logo & Workspace badge */}
            <div
              className={`flex items-center gap-2.5 overflow-hidden group cursor-pointer ${
                collapsed ? 'flex lg:hidden' : 'flex'
              }`}
              onClick={() => handleNavClick('dashboard')}
            >
              <div className="relative">
                <img
                  src={sidebarLogoImg}
                  alt="PandaBio"
                  className="h-[114px] w-[181.05px] object-contain drop-shadow-[0_2px_10px_rgba(255,102,0,0.25)] transition-transform duration-200 group-hover:scale-[1.02]"
                  style={{ height: '114px', width: '181.0469px' }}
                />
              </div>
            </div>

            {/* Desktop Mini Avatar Icon when Collapsed */}
            {collapsed && (
              <button
                onClick={() => onToggleCollapse()}
                className="hidden lg:flex items-center justify-center w-11 h-11 rounded-xl p-0.5 bg-gradient-to-br from-primary-orange-strong to-primary-orange-burn hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,102,0,0.35)] group cursor-pointer border border-white/20 outline-none"
                title="PandaBio - Expandir menu"
              >
                <img
                  src={PANDABIO_ASSETS.logoMini}
                  alt="PandaBio"
                  className="w-full h-full object-cover rounded-[10px] bg-white transition-transform duration-200 group-hover:scale-105"
                />
              </button>
            )}

            <div className="flex items-center gap-1">
              {/* Desktop Toggle Button */}
              <button
                id="sidebar-toggle-btn"
                onClick={onToggleCollapse}
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-neutral-muted-soft hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all shrink-0 cursor-pointer"
                title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
              >
                {collapsed ? (
                  <PanelLeft aria-hidden="true" className="w-4 h-4" />
                ) : (
                  <PanelLeftClose aria-hidden="true" className="w-4 h-4" />
                )}
              </button>

              {/* Mobile Close Button (X) */}
              {onCloseMobile && (
                <button
                  id="sidebar-mobile-close-btn"
                  onClick={onCloseMobile}
                  className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-neutral-muted-soft hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
                  title="Fechar menu lateral"
                >
                  <X aria-hidden="true" className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Domain Pill (Visible when expanded) */}
          {!collapsed && (
            <a
              href={getPageUrl(user.bioUrl, user.username)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-1.5 mb-4 rounded-lg bg-sidebar-card hover:bg-sidebar-card-hover border border-sidebar-border-light hover:border-primary-orange-strong/40 text-neutral-muted-light hover:text-zinc-200 transition-all text-[11.5px] font-medium group"
              title="Abrir página pública"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                <span className="truncate text-zinc-300 font-mono text-[11px]">
                  {getPageUrl(user.bioUrl, user.username)}
                </span>
              </div>
              <ExternalLink
                aria-hidden="true"
                className="w-3.5 h-3.5 text-sidebar-icon group-hover:text-primary-orange shrink-0 transition-colors"
              />
            </a>
          )}

          {/* Primary Action: "Criar novo" */}
          <div className="relative mb-4">
            <button
              id="btn-create-new"
              onClick={handleCreateClick}
              className={`group relative flex items-center justify-between ${
                collapsed
                  ? 'lg:w-11 lg:h-11 lg:p-0 lg:mx-auto lg:justify-center w-full py-2.5 px-3.5'
                  : 'w-full py-2.5 px-3.5'
              } rounded-xl text-white text-[13.5px] font-semibold tracking-tight transition-all duration-200 hover:brightness-105 active:scale-[0.98] cursor-pointer shadow-[0_4px_16px_rgba(255,102,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-1 ring-white/20 bg-gradient-to-br from-primary-orange-strong to-primary-orange-deep`}
              title="Criar novo item"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0 border border-white/25">
                  <Plus aria-hidden="true" className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                </div>
                <span className={`whitespace-nowrap ${collapsed ? 'block lg:hidden' : 'block'}`}>
                  Criar novo
                </span>
              </div>
              <ChevronRight
                aria-hidden="true"
                className={`w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform ${
                  collapsed ? 'block lg:hidden' : 'block'
                }`}
              />
            </button>
          </div>

          {/* Section 1: PRINCIPAL */}
          <div className="flex flex-col mb-4">
            <div className={`px-2 mb-1.5 flex items-center ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-muted shrink-0">
                Principal
              </span>
              <div className="flex-1 h-[1px] bg-sidebar-divider ml-2.5" />
            </div>
            {collapsed && (
              <div className="hidden lg:block w-7 h-[1px] bg-white/[0.08] mx-auto my-2" />
            )}

            <nav className="flex flex-col gap-1">
              {navItemsPrincipal.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`group w-full flex items-center justify-between ${
                      collapsed ? 'lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
                    } rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-primary-orange-dark text-white font-semibold shadow-[0_2px_12px_rgba(255,85,0,0.32)] ring-1 ring-white/15'
                        : 'text-neutral-gray-medium hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-neutral-muted-dark group-hover:text-zinc-200'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      <span
                        className={`whitespace-nowrap truncate ${collapsed ? 'lg:hidden' : ''}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {/* Optional Right Badges */}
                    {!collapsed && (
                      <div className="flex items-center">
                        {item.count !== undefined && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                              isActive
                                ? 'bg-white/25 text-white border-white/30'
                                : 'bg-white/[0.05] text-neutral-muted-dark border-white/[0.06] group-hover:text-zinc-300 group-hover:bg-white/[0.08]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/25'
                                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Section 2: GESTÃO */}
          <div className="flex flex-col mb-4">
            <div className={`px-2 mb-1.5 flex items-center ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-neutral-muted shrink-0">
                Gestão
              </span>
              <div className="flex-1 h-[1px] bg-sidebar-divider ml-2.5" />
            </div>
            {collapsed && (
              <div className="hidden lg:block w-7 h-[1px] bg-white/[0.08] mx-auto my-2" />
            )}

            <nav className="flex flex-col gap-1">
              {navItemsGestao.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`group w-full flex items-center justify-between ${
                      collapsed ? 'lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
                    } rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-primary-orange-dark text-white font-semibold shadow-[0_2px_12px_rgba(255,85,0,0.32)] ring-1 ring-white/15'
                        : 'text-neutral-gray-medium hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-neutral-muted-dark group-hover:text-zinc-200'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      <span
                        className={`whitespace-nowrap truncate ${collapsed ? 'lg:hidden' : ''}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {!collapsed && (
                      <div className="flex items-center">
                        {item.count !== undefined && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                              isActive
                                ? 'bg-white/25 text-white border-white/30'
                                : 'bg-white/[0.05] text-neutral-muted-dark border-white/[0.06] group-hover:text-zinc-300 group-hover:bg-white/[0.08]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/25'
                                : 'bg-primary-orange-strong/10 text-primary-orange-highlight border-primary-orange-strong/25'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Divider */}
          {!collapsed && (
            <div className="flex items-center my-3">
              <div className="flex-1 h-[1px] bg-sidebar-divider" />
            </div>
          )}

          {/* Section 3: FOOTER ITEMS */}
          <div className="flex flex-col">
            <nav className="flex flex-col gap-1">
              {navItemsFooter.map((item) => {
                const Icon = item.icon;
                const isActive = activeSection === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavClick(item.id)}
                    className={`group w-full flex items-center justify-between ${
                      collapsed ? 'lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
                    } rounded-xl text-[13.5px] font-medium transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'bg-primary-orange-dark text-white font-semibold shadow-[0_2px_12px_rgba(255,85,0,0.32)] ring-1 ring-white/15'
                        : 'text-neutral-gray-medium hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-neutral-muted-dark group-hover:text-zinc-200'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      <span
                        className={`whitespace-nowrap truncate ${collapsed ? 'lg:hidden' : ''}`}
                      >
                        {item.label}
                      </span>
                    </div>

                    {!collapsed && (
                      <div className="flex items-center">
                        {item.count !== undefined && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                              isActive
                                ? 'bg-white/25 text-white border-white/30'
                                : 'bg-white/[0.05] text-neutral-muted-dark border-white/[0.06] group-hover:text-zinc-300 group-hover:bg-white/[0.08]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {item.badge && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/25'
                                : 'bg-primary-orange-strong/10 text-primary-orange-highlight border-primary-orange-strong/25'
                            }`}
                          >
                            {item.badge}
                          </span>
                        )}
                      </div>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sleek PRO Upgrade Card (When user is on free plan & expanded) */}
          {!collapsed && user.plan === 'Gratuito' && (
            <div className="mt-1 mb-3 p-3 rounded-xl bg-gradient-to-b from-sidebar-gradient-top to-sidebar-deep border border-sidebar-card-border relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary-orange-strong/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Sparkles aria-hidden="true" className="w-3.5 h-3.5 text-primary-orange" />
                    PandaBio PRO
                  </span>
                  <span className="text-[10px] font-semibold text-primary-orange bg-primary-orange-strong/15 px-1.5 py-0.5 rounded-full border border-primary-orange-strong/30">
                    -30% OFF
                  </span>
                </div>
                <p className="text-[11.5px] text-neutral-muted-light leading-snug">
                  Domínio próprio, 0% de taxas e métricas detalhadas.
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="mt-1 w-full py-1.5 px-2.5 rounded-lg bg-white/[0.08] hover:bg-primary-orange-strong text-zinc-200 hover:text-white text-[11.5px] font-semibold transition-all duration-200 text-center border border-white/[0.1] hover:border-transparent cursor-pointer shadow-xs"
                >
                  Conhecer planos
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer Section */}
        <div
          id="sidebar-footer"
          className="relative z-10 flex flex-col gap-1.5 pt-3 mt-auto border-t border-sidebar-divider shrink-0"
        >
          {/* Perfil */}
          <button
            type="button"
            onClick={() => handleNavClick('perfil')}
            className={`w-full flex items-center justify-between ${
              collapsed ? 'lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
            } rounded-xl text-neutral-gray-medium hover:text-white hover:bg-white/[0.05] transition-all text-[13.5px] font-medium group cursor-pointer ${
              activeSection === 'perfil' ? 'bg-white/[0.08] text-white font-semibold' : ''
            }`}
            title="Perfil"
          >
            <div className="flex items-center gap-3">
              <User
                aria-hidden="true"
                className="w-[18px] h-[18px] text-neutral-muted-dark group-hover:text-white shrink-0 transition-colors"
              />
              <span
                className={`whitespace-nowrap group-hover:text-white ${collapsed ? 'lg:hidden' : ''}`}
              >
                Perfil
              </span>
            </div>
          </button>

          {/* User Profile Card with Dropdown / Action */}
          <div className="relative">
            <div
              id="profile-card"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
              className={`relative flex items-center ${
                collapsed ? 'lg:justify-center lg:p-1.5 justify-between p-2' : 'justify-between p-2'
              } rounded-xl bg-sidebar-card hover:bg-sidebar-card-hover transition-all duration-200 border border-sidebar-border-light hover:border-sidebar-border-hover group cursor-pointer shadow-sm`}
              title={`${user.name} - Clique para opções`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full ring-1 ring-white/20 shrink-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-sidebar-card" />
                </div>
                <div className={`flex flex-col min-w-0 text-left ${collapsed ? 'lg:hidden' : ''}`}>
                  <span className="text-zinc-200 font-semibold text-[13px] leading-tight truncate group-hover:text-white transition-colors">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-neutral-muted-dark text-[11px] truncate">
                      @{user.username || 'usuario'}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.07] text-neutral-gray-medium border border-white/[0.08]">
                      {user.plan}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <ChevronRight
                  aria-hidden="true"
                  className={`w-4 h-4 text-sidebar-chevron group-hover:text-zinc-200 transition-transform duration-200 ${
                    profileMenuOpen ? '-rotate-90' : 'rotate-90'
                  }`}
                />
              </div>
            </div>

            {/* Profile Popover / Dropdown Menu */}
            {profileMenuOpen && (
              <div
                className={`absolute bottom-full mb-2 ${
                  collapsed ? 'left-0 w-56' : 'left-0 right-0'
                } z-50 p-1.5 rounded-xl bg-sidebar-elevated border border-sidebar-border-elevated shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col gap-1`}
              >
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-[11px] font-medium text-neutral-muted-dark">Conectado como</p>
                  <p className="text-[12.5px] font-semibold text-white truncate">{user.email}</p>
                </div>

                <button
                  onClick={handleUpgradeClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-primary-orange-highlight hover:bg-primary-orange-strong/10 hover:text-primary-orange-highlight-soft font-medium transition-colors cursor-pointer"
                >
                  <Sparkles aria-hidden="true" className="w-4 h-4 text-primary-orange" />
                  <span>Fazer upgrade para PRO</span>
                </button>

                <button
                  onClick={() => handleNavClick('configuracoes')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors cursor-pointer"
                >
                  <Settings aria-hidden="true" className="w-4 h-4 text-neutral-muted-dark" />
                  <span>Configurações da conta</span>
                </button>

                <a
                  href="https://pandabio.me/ajuda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors cursor-pointer"
                >
                  <HelpCircle aria-hidden="true" className="w-4 h-4 text-neutral-muted-dark" />
                  <span>Central de Ajuda</span>
                </a>

                <div className="h-[1px] bg-white/[0.06] my-1" />

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-rose-400 hover:bg-rose-500/10 font-medium transition-colors cursor-pointer"
                >
                  <LogOut aria-hidden="true" className="w-4 h-4 text-rose-400" />
                  <span>Sair da conta</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
