import React from 'react';
import { NavSection, BioLink, ProductItem, LeadItem, UserProfile } from '../types';
import { PageEditor } from './PageEditor';

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
}

export const SectionViews: React.FC<SectionViewsProps> = ({ section, user, onUpdateUser }) => {
  // Renderizar PageEditor para a seção 'minha-pagina'
  if (section === 'minha-pagina' && user) {
    return <PageEditor user={user} onUpdateUser={onUpdateUser || (() => {})} />;
  }

  // Outras seções mantidas vazias por enquanto
  return (
    <div
      id={`section-empty-canvas-${section}`}
      className="w-full min-h-[500px]"
    />
  );
};

