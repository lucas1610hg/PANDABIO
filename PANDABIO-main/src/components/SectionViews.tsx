import React from 'react';
import { NavSection, BioLink, ProductItem, LeadItem, UserProfile } from '../types';
import { PageEditor } from './PageEditor';
import { ProfileSection } from './ProfileSection';
import { LinksSection } from './LinksSection';

interface SectionViewsProps {
  section: NavSection;
  links?: BioLink[];
  products?: ProductItem[];
  leads?: LeadItem[];
  user?: UserProfile;
  onToggleLink?: (id: string) => void;
  onOpenCreateItem?: () => void;
  onOpenPhonePreview?: () => void;
  onUpdateUser?: (u: Partial<UserProfile>) => void;
  onLogout?: () => void;
  onReorderLinks?: (reordered: BioLink[]) => void;
}

export const SectionViews: React.FC<SectionViewsProps> = ({
  section,
  links,
  user,
  onToggleLink,
  onOpenCreateItem,
  onUpdateUser,
  onLogout,
  onReorderLinks,
}) => {
  // Renderizar PageEditor para a seção 'minha-pagina'
  if (section === 'minha-pagina' && user) {
    return (
      <PageEditor
        key={user.email || user.username || user.bioUrl || 'anonymous'}
        user={user}
        onUpdateUser={onUpdateUser || (() => {})}
      />
    );
  }

  // Seção de Perfil da conta
  if (section === 'perfil' && user) {
    return (
      <ProfileSection
        user={user}
        onUpdateUser={onUpdateUser || (() => {})}
        onLogout={onLogout}
      />
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

  // Outras seções mantidas vazias por enquanto
  return <div id={`section-empty-canvas-${section}`} className="w-full min-h-[500px]" />;
};
