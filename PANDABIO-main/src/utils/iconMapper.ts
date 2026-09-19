import { Camera, MessageCircle, Layers, ShoppingBag, ExternalLink, UserPlus, MousePointerClick, Clock } from 'lucide-react';

/**
 * Mapeamento centralizado de ícones para links e atividades
 * Elimina duplicação de código entre componentes
 */

export const getLinkIcon = (type: string) => {
  const iconMap = {
    social: Camera,
    whatsapp: MessageCircle,
    portfolio: Layers,
    store: ShoppingBag,
    custom: ExternalLink,
  };
  return iconMap[type as keyof typeof iconMap] || ExternalLink;
};

export const getLinkIconBg = (type: string) => {
  const bgMap = {
    social: 'bg-[#dae2fd]',
    whatsapp: 'bg-[#6ffbbe]/40',
    portfolio: 'bg-[#e0e0ff]',
    store: 'bg-[#dae2fd]',
    custom: 'bg-[#eaedff]',
  };
  return bgMap[type as keyof typeof bgMap] || 'bg-[#eaedff]';
};

export const getActivityIcon = (type: string) => {
  const iconMap = {
    lead: UserPlus,
    clicks: MousePointerClick,
    order: ShoppingBag,
    visits: Camera,
  };
  return iconMap[type as keyof typeof iconMap] || Clock;
};

export const getActivityIconBg = (type: string) => {
  const bgMap = {
    lead: 'bg-[#6ffbbe]/40',
    clicks: 'bg-[#dae2fd]',
    order: 'bg-[#FFF3E6]',
    visits: 'bg-[#e0e0ff]',
  };
  return bgMap[type as keyof typeof bgMap] || 'bg-[#eaedff]';
};