import React, { useState } from 'react';
import { PANDABIO_ASSETS } from '../constants/assets';
import sidebarLogoImg from '../assets/images/regenerated_image_1789761089362.png';
import {
  Home,
  Smartphone,
  Link as LinkIcon,
  Package,
  Users,
  BarChart3,
  Palette,
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
  ArrowLeftRight,
} from 'lucide-react';
import { NavSection, UserProfile } from '../types';

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
  allUsers?: UserProfile[];
  onSwitchUser?: (email: string) => void;
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
  allUsers = [],
  onSwitchUser,
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

  const navItemsTrabalo = [
    {
      id: 'visao-geral' as NavSection,
      label: 'Visão geral',
      icon: Home,
    },
    {
      id: 'minha-pagina' as NavSection,
      label: 'Minha página',
      icon: Smartphone,
      badge: 'Online',
      badgeColor: 'emerald',
    },
    {
      id: 'links' as NavSection,
      label: 'Links',
      icon: LinkIcon,
      count: linksCount,
    },
    {
      id: 'produtos' as NavSection,
      label: 'Produtos',
      icon: Package,
      count: productsCount,
    },
  ];

  const navItemsCrescimento = [
    {
      id: 'leads' as NavSection,
      label: 'Leads',
      icon: Users,
      count: leadsCount,
    },
    {
      id: 'analytics' as NavSection,
      label: 'Analytics',
      icon: BarChart3,
    },
    {
      id: 'aparencia' as NavSection,
      label: 'Aparência',
      icon: Palette,
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
        className={`fixed left-0 top-0 h-full max-h-screen z-50 flex flex-col py-4 select-none shadow-[6px_0_30px_rgba(0,0,0,0.45)] border-r border-[#1c1e28] transition-all duration-300 ease-in-out overflow-y-auto overflow-x-hidden sidebar-scrollbar touch-pan-y overscroll-contain ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } ${
          collapsed ? 'lg:w-20 lg:px-2.5' : 'lg:w-64 lg:px-3.5'
        } w-72 max-w-[85vw] px-3.5`}
        style={{
          backgroundColor: '#0c0e14',
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
              onClick={() => handleNavClick('visao-geral')}
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
                className="hidden lg:flex items-center justify-center w-11 h-11 rounded-xl p-0.5 bg-gradient-to-br from-[#FF6600] to-[#FF4500] hover:scale-105 active:scale-95 transition-all shadow-[0_4px_14px_rgba(255,102,0,0.35)] group cursor-pointer border border-white/20 outline-none"
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
                className="hidden lg:flex items-center justify-center w-8 h-8 rounded-lg text-[#7c8294] hover:text-white hover:bg-white/[0.06] border border-transparent hover:border-white/[0.08] transition-all shrink-0 cursor-pointer"
                title={collapsed ? 'Expandir Menu' : 'Recolher Menu'}
              >
                {collapsed ? (
                  <PanelLeft className="w-4 h-4" />
                ) : (
                  <PanelLeftClose className="w-4 h-4" />
                )}
              </button>

              {/* Mobile Close Button (X) */}
              {onCloseMobile && (
                <button
                  id="sidebar-mobile-close-btn"
                  onClick={onCloseMobile}
                  className="lg:hidden flex items-center justify-center w-8 h-8 rounded-lg text-[#7c8294] hover:text-white hover:bg-white/[0.08] transition-colors shrink-0 cursor-pointer"
                  title="Fechar menu lateral"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {/* Quick Domain Pill (Visible when expanded) */}
          {!collapsed && (
            <a
              href={`https://${user.bioUrl}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-between px-3 py-1.5 mb-4 rounded-lg bg-[#141620] hover:bg-[#191c28] border border-[#232738] hover:border-[#FF6600]/40 text-[#8e94a6] hover:text-zinc-200 transition-all text-[11.5px] font-medium group"
              title="Abrir página pública"
            >
              <div className="flex items-center gap-2 truncate">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 ring-2 ring-emerald-500/20 shrink-0" />
                <span className="truncate text-zinc-300 font-mono text-[11px]">
                  {user.bioUrl}
                </span>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-[#676c7d] group-hover:text-[#FF7A00] shrink-0 transition-colors" />
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
              } rounded-xl text-white text-[13.5px] font-semibold tracking-tight transition-all duration-200 hover:brightness-105 active:scale-[0.98] cursor-pointer shadow-[0_4px_16px_rgba(255,102,0,0.32),inset_0_1px_1px_rgba(255,255,255,0.3)] ring-1 ring-white/20`}
              style={{
                background: 'linear-gradient(135deg, #FF6600 0%, #FF4D00 100%)',
              }}
              title="Criar novo item"
            >
              <div className="flex items-center gap-2.5">
                <div className="w-5 h-5 rounded-md bg-white/20 flex items-center justify-center shrink-0 border border-white/25">
                  <Plus className="w-3.5 h-3.5 text-white stroke-[2.5]" />
                </div>
                <span className={`whitespace-nowrap ${collapsed ? 'block lg:hidden' : 'block'}`}>
                  Criar novo
                </span>
              </div>
              <ChevronRight
                className={`w-4 h-4 text-white/80 group-hover:translate-x-0.5 transition-transform ${
                  collapsed ? 'block lg:hidden' : 'block'
                }`}
              />
            </button>
          </div>

          {/* Section 1: TRABALHO */}
          <div className="flex flex-col mb-4">
            <div className={`px-2 mb-1.5 flex items-center ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#606577] shrink-0">
                Trabalho
              </span>
              <div className="flex-1 h-[1px] bg-[#1d202d] ml-2.5" />
            </div>
            {collapsed && (
              <div className="hidden lg:block w-7 h-[1px] bg-white/[0.08] mx-auto my-2" />
            )}

            <nav className="flex flex-col gap-1">
              {navItemsTrabalo.map((item) => {
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
                        ? 'bg-[#FF5500] text-white font-semibold shadow-[0_2px_12px_rgba(255,85,0,0.32)] ring-1 ring-white/15'
                        : 'text-[#969cb0] hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#7d8396] group-hover:text-zinc-200'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      <span className={`whitespace-nowrap truncate ${collapsed ? 'lg:hidden' : ''}`}>
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
                                : 'bg-white/[0.05] text-[#7d8396] border-white/[0.06] group-hover:text-zinc-300 group-hover:bg-white/[0.08]'
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

          {/* Section 2: CRESCIMENTO */}
          <div className="flex flex-col mb-4">
            <div className={`px-2 mb-1.5 flex items-center ${collapsed ? 'lg:hidden' : ''}`}>
              <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#606577] shrink-0">
                Crescimento
              </span>
              <div className="flex-1 h-[1px] bg-[#1d202d] ml-2.5" />
            </div>
            {collapsed && (
              <div className="hidden lg:block w-7 h-[1px] bg-white/[0.08] mx-auto my-2" />
            )}

            <nav className="flex flex-col gap-1">
              {navItemsCrescimento.map((item) => {
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
                        ? 'bg-[#FF5500] text-white font-semibold shadow-[0_2px_12px_rgba(255,85,0,0.32)] ring-1 ring-white/15'
                        : 'text-[#969cb0] hover:text-zinc-100 hover:bg-white/[0.05]'
                    }`}
                    title={item.label}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon
                        className={`w-[18px] h-[18px] shrink-0 transition-colors ${
                          isActive
                            ? 'text-white'
                            : 'text-[#7d8396] group-hover:text-zinc-200'
                        }`}
                        strokeWidth={isActive ? 2.2 : 1.9}
                      />
                      <span className={`whitespace-nowrap truncate ${collapsed ? 'lg:hidden' : ''}`}>
                        {item.label}
                      </span>
                    </div>

                    {!collapsed && (
                      <div className="flex items-center">
                        {'count' in item && item.count !== undefined && (
                          <span
                            className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border transition-colors ${
                              isActive
                                ? 'bg-white/25 text-white border-white/30'
                                : 'bg-white/[0.05] text-[#7d8396] border-white/[0.06] group-hover:text-zinc-300 group-hover:bg-white/[0.08]'
                            }`}
                          >
                            {item.count}
                          </span>
                        )}
                        {'badge' in item && Boolean((item as any).badge) && (
                          <span
                            className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ${
                              isActive
                                ? 'bg-white/20 text-white border-white/25'
                                : 'bg-[#FF6600]/10 text-[#FF8533] border-[#FF6600]/25'
                            }`}
                          >
                            {(item as any).badge}
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
            <div className="mt-1 mb-3 p-3 rounded-xl bg-gradient-to-b from-[#181a25] to-[#12131c] border border-[#262a3c] relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF6600]/10 rounded-full blur-xl pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-[11px] font-bold text-white uppercase tracking-wider">
                    <Sparkles className="w-3.5 h-3.5 text-[#FF7A00]" />
                    PandaBio PRO
                  </span>
                  <span className="text-[10px] font-semibold text-[#FF7A00] bg-[#FF6600]/15 px-1.5 py-0.5 rounded-full border border-[#FF6600]/30">
                    -30% OFF
                  </span>
                </div>
                <p className="text-[11.5px] text-[#8e94a6] leading-snug">
                  Domínio próprio, 0% de taxas e métricas detalhadas.
                </p>
                <button
                  onClick={handleUpgradeClick}
                  className="mt-1 w-full py-1.5 px-2.5 rounded-lg bg-white/[0.08] hover:bg-[#FF6600] text-zinc-200 hover:text-white text-[11.5px] font-semibold transition-all duration-200 text-center border border-white/[0.1] hover:border-transparent cursor-pointer shadow-xs"
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
          className="relative z-10 flex flex-col gap-1.5 pt-3 mt-auto border-t border-[#1d202d] shrink-0"
        >
          {/* Configurações */}
          <button
            type="button"
            onClick={() => handleNavClick('configuracoes')}
            className={`w-full flex items-center justify-between ${
              collapsed ? 'lg:justify-center lg:px-0 px-3 py-2' : 'px-3 py-2'
            } rounded-xl text-[#969cb0] hover:text-white hover:bg-white/[0.05] transition-all text-[13.5px] font-medium group cursor-pointer ${
              activeSection === 'configuracoes'
                ? 'bg-white/[0.08] text-white font-semibold'
                : ''
            }`}
            title="Configurações"
          >
            <div className="flex items-center gap-3">
              <Settings className="w-[18px] h-[18px] text-[#7d8396] group-hover:text-white shrink-0 transition-colors" />
              <span className={`whitespace-nowrap group-hover:text-white ${collapsed ? 'lg:hidden' : ''}`}>
                Configurações
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
              } rounded-xl bg-[#141620] hover:bg-[#191c28] transition-all duration-200 border border-[#232738] hover:border-[#2f354d] group cursor-pointer shadow-sm`}
              title={`${user.name} - Clique para opções`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="relative w-8 h-8 rounded-full ring-1 ring-white/20 shrink-0">
                  <img
                    src={user.avatarUrl}
                    alt={user.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                  <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-[#141620]" />
                </div>
                <div className={`flex flex-col min-w-0 text-left ${collapsed ? 'lg:hidden' : ''}`}>
                  <span className="text-zinc-200 font-semibold text-[13px] leading-tight truncate group-hover:text-white transition-colors">
                    {user.name}
                  </span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[#7d8396] text-[11px] truncate">
                      @{user.username || 'usuario'}
                    </span>
                    <span className="text-[9.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-white/[0.07] text-[#969cb0] border border-white/[0.08]">
                      {user.plan}
                    </span>
                  </div>
                </div>
              </div>

              <div className={`flex items-center gap-1 ${collapsed ? 'lg:hidden' : ''}`}>
                <ChevronRight
                  className={`w-4 h-4 text-[#6b7182] group-hover:text-zinc-200 transition-transform duration-200 ${
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
                } z-50 p-1.5 rounded-xl bg-[#161823] border border-[#2a2f42] shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md flex flex-col gap-1`}
              >
                <div className="px-3 py-2 border-b border-white/[0.06] mb-1">
                  <p className="text-[11px] font-medium text-[#7d8396]">Conectado como</p>
                  <p className="text-[12.5px] font-semibold text-white truncate">{user.email}</p>
                </div>

                {/* Multi-account switcher */}
                {allUsers.length > 1 && onSwitchUser && (
                  <div className="px-2 py-1.5 bg-black/20 rounded-lg border border-white/[0.04] mb-1">
                    <div className="flex items-center gap-1.5 px-1 pb-1 text-[10px] font-semibold uppercase tracking-wider text-[#7d8396]">
                      <ArrowLeftRight className="w-3 h-3 text-[#FF7A00]" />
                      <span>Alternar Usuário</span>
                    </div>
                    <div className="flex flex-col gap-0.5">
                      {allUsers.map((acc) => {
                        const isCurrent = acc.email === user.email;
                        return (
                          <button
                            key={acc.email}
                            type="button"
                            onClick={() => {
                              onSwitchUser(acc.email);
                              setProfileMenuOpen(false);
                            }}
                            className={`flex items-center justify-between w-full px-2 py-1 rounded text-[11.5px] transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-white/[0.08] text-white font-medium'
                                : 'text-[#8e94a6] hover:text-white hover:bg-white/[0.04]'
                            }`}
                          >
                            <span className="truncate">{acc.name}</span>
                            {isCurrent && (
                              <span className="w-1.5 h-1.5 rounded-full bg-[#FF6600]" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleUpgradeClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-[#FF8533] hover:bg-[#FF6600]/10 hover:text-[#FF944D] font-medium transition-colors cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-[#FF7A00]" />
                  <span>Fazer upgrade para PRO</span>
                </button>

                <button
                  onClick={() => handleNavClick('configuracoes')}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors cursor-pointer"
                >
                  <Settings className="w-4 h-4 text-[#7d8396]" />
                  <span>Configurações da conta</span>
                </button>

                <a
                  href="https://pandabio.me/ajuda"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-zinc-300 hover:text-white hover:bg-white/[0.06] font-medium transition-colors cursor-pointer"
                >
                  <HelpCircle className="w-4 h-4 text-[#7d8396]" />
                  <span>Central de Ajuda</span>
                </a>

                <div className="h-[1px] bg-white/[0.06] my-1" />

                <button
                  onClick={handleLogoutClick}
                  className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] text-rose-400 hover:bg-rose-500/10 font-medium transition-colors cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-rose-400" />
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
