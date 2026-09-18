import React from 'react';
import { NavSection, BioLink, ProductItem, LeadItem, UserProfile } from '../types';

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

export const SectionViews: React.FC<SectionViewsProps> = ({ section }) => {
  // Todas as seções mantidas limpas e vazias sem construção, deixando apenas o dashboard ativo
  return (
    <div
      id={`section-empty-canvas-${section}`}
      className="w-full min-h-[500px]"
    />
  );
};

