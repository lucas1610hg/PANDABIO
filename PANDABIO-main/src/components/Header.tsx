import React from 'react';
import { Menu, Search, Smartphone, UserCircle } from 'lucide-react';
import { NavSection, UserProfile } from '../types';

interface HeaderProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  onToggleMobileMenu?: () => void;
  activeSection: NavSection;
  user: UserProfile;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenPhonePreview: () => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  collapsed,
  onToggleCollapse,
  onToggleMobileMenu,
  activeSection,
  user,
  searchQuery,
  onSearchChange,
  onOpenPhonePreview,
  onOpenProfile,
}) => {
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
      className={`fixed top-0 right-0 h-16 border-b border-neutral-lighter/80 bg-neutral-background/85 backdrop-blur-xl shadow-[0_4px_18px_rgba(19,27,46,0.04)] z-30 flex items-center justify-between px-3 sm:px-6 transition-all duration-300 left-0 ${
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
          <Menu aria-hidden="true" className="w-5 h-5" />
        </button>

        {activeSection === 'dashboard' && (
          <div className="relative flex items-center min-w-0">
            <Search
              aria-hidden="true"
              className="w-4 h-4 absolute left-3 text-neutral-gray-light pointer-events-none shrink-0"
            />
            <input
              id="global-search-input"
              type="search"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar links"
              aria-label="Buscar links no painel"
              className="pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 rounded-xl bg-neutral-light text-xs sm:text-sm text-neutral-dark placeholder:text-neutral-gray-light outline-none w-28 xs:w-36 sm:w-56 md:w-64 lg:w-72 transition-all focus:bg-white focus:ring-2 focus:ring-primary-orange/30"
            />
          </div>
        )}
      </div>

      {/* Right side: Preview and account */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        <button
          id="btn-open-preview"
          type="button"
          onClick={onOpenPhonePreview}
          aria-label="Abrir prévia da página no celular"
          className="p-2 rounded-xl bg-neutral-light hover:bg-neutral-lighter text-neutral-gray hover:text-primary-orange transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
          title="Ver prévia da página pública no celular"
        >
          <Smartphone aria-hidden="true" className="w-4 h-4" />
        </button>

        <button
          id="btn-open-profile"
          type="button"
          onClick={onOpenProfile}
          aria-label={`Abrir perfil de ${user.name}`}
          title={`Perfil de ${user.name}`}
          className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-primary-orange-light text-sm font-bold text-primary-orange ring-1 ring-primary-orange/25 transition hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-orange"
        >
          {user.avatarUrl ? (
            <img src={user.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span aria-hidden="true">
              {user.name
                .trim()
                .split(/\s+/)
                .slice(0, 2)
                .map((part) => part[0])
                .join('')
                .toUpperCase() || <UserCircle className="h-5 w-5" />}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};
