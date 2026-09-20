import React, { useState } from 'react';
import { Menu, Search, Bell, ExternalLink, Lock, CheckCircle, X } from 'lucide-react';
import { UserProfile } from '../types';

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileMenu?: () => void;
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenPhonePreview: () => void;
  onSwitchToAuth: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  onToggleMobileMenu,
  user,
  searchQuery,
  onSearchChange,
  onOpenPhonePreview,
  onSwitchToAuth,
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState<
    Array<{ id: number; title: string; desc: string; time: string; unread: boolean }>
  >([]);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleMenuClick = () => {
    if (window.innerWidth < 1024 && onToggleMobileMenu) {
      onToggleMobileMenu();
    } else {
      onToggleCollapse();
    }
  };

  return (
    <header
      id="main-header"
      className={`fixed top-0 right-0 h-16 bg-neutral-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.04)] z-30 flex items-center justify-between px-3 sm:px-6 transition-all duration-300 left-0 ${
        collapsed ? 'lg:left-20' : 'lg:left-64'
      }`}
    >
      {/* Left side: Mobile button, Search */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <button
          id="header-collapse-toggle"
          onClick={handleMenuClick}
          className="p-2 rounded-xl text-neutral-gray hover:bg-neutral-lighter hover:text-neutral-dark transition-colors flex items-center justify-center cursor-pointer shrink-0"
          title="Alternar Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div className="relative flex items-center min-w-0">
          <Search className="w-4 h-4 absolute left-3 text-neutral-gray-light pointer-events-none shrink-0" />
          <input
            id="global-search-input"
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Buscar..."
            className="pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 rounded-xl bg-neutral-light text-xs sm:text-sm text-neutral-dark placeholder:text-neutral-gray-light outline-none w-28 xs:w-36 sm:w-56 md:w-64 lg:w-72 transition-all focus:bg-neutral-lighter focus:ring-1 focus:ring-secondary-blue"
          />
        </div>
      </div>

      {/* Right side: Switch to Auth screen, Quick Status pill, Notifications, Profile avatar */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Screen Switcher Button (Auth / Login screen) */}
        <button
          id="btn-switch-to-auth"
          onClick={onSwitchToAuth}
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-neutral-border/60 text-xs font-semibold text-neutral-gray hover:text-primary-orange hover:border-primary-orange/40 transition-all shadow-xs cursor-pointer"
          title="Ver Tela de Login / Cadastro"
        >
          <Lock className="w-3.5 h-3.5 text-primary-orange" />
          <span className="hidden md:inline">Tela de Login</span>
          <span className="md:hidden">Login</span>
        </button>

        {/* Public Page online status pill */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-full bg-neutral-lighter text-neutral-gray text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-secondary-green animate-pulse" />
          <span className="text-secondary-green font-semibold">Página Online</span>
          <span className="text-neutral-border">•</span>
          <span className="text-primary-orange font-bold">{user.bioUrl}</span>
        </div>

        {/* Open public page / phone preview button */}
        <button
          id="btn-open-preview"
          onClick={onOpenPhonePreview}
          className="p-2 rounded-xl bg-neutral-light hover:bg-neutral-lighter text-neutral-gray hover:text-primary-orange transition-colors flex items-center justify-center cursor-pointer"
          title="Ver prévia da página pública no celular"
        >
          <ExternalLink className="w-4 h-4" />
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl text-neutral-gray hover:bg-neutral-lighter hover:text-neutral-dark transition-colors cursor-pointer"
            title="Notificações"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-functional-error-dark" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-72 sm:w-88 max-w-[calc(100vw-2rem)] bg-white rounded-2xl shadow-xl border border-black/5 p-4 z-50 animate-fadeIn">
              <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-neutral-dark">Notificações</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary-orange/15 text-primary-orange">
                      {unreadCount} novas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-[11px] text-secondary-blue hover:underline font-semibold cursor-pointer"
                    >
                      Ler todas
                    </button>
                  )}
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-3 max-h-72 overflow-y-auto">
                {notifications.length > 0 ? (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      className={`p-2.5 rounded-xl transition-colors ${
                        item.unread ? 'bg-neutral-light' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-semibold text-xs text-neutral-dark">
                          {item.title}
                        </span>
                        <span className="text-[10px] text-gray-400 shrink-0">{item.time}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5 leading-snug">{item.desc}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-xs text-gray-500">
                    Nenhuma notificação nova no momento.
                  </div>
                )}
              </div>

              <div className="pt-3 mt-2 border-t border-gray-100 text-center">
                <span className="text-xs text-emerald-600 font-medium flex items-center justify-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Sua bio está 100% ativa e monitorada
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Profile Avatar */}
        <div
          onClick={onOpenPhonePreview}
          className="w-8 h-8 rounded-full ring-2 ring-primary-orange/30 overflow-hidden cursor-pointer shrink-0"
          title={user.name}
        >
          <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
        </div>
      </div>
    </header>
  );
};
