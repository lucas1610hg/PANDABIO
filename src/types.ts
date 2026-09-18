export type ScreenView = 'dashboard' | 'auth';

export type NavSection =
  | 'visao-geral'
  | 'minha-pagina'
  | 'links'
  | 'produtos'
  | 'leads'
  | 'analytics'
  | 'aparencia'
  | 'configuracoes';

export interface BioLink {
  id: string;
  title: string;
  url: string;
  clicks: number;
  leads: number;
  active: boolean;
  icon: string;
  type: 'social' | 'whatsapp' | 'portfolio' | 'store' | 'custom';
}

export interface ActivityItem {
  id: string;
  title: string;
  subtitle: string;
  timeAgo: string;
  type: 'lead' | 'clicks' | 'order' | 'visits';
  timestamp: string;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  salesCount: number;
  status: 'active' | 'draft';
  image?: string;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel: string;
  createdAt: string;
}

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  plan: 'Gratuito' | 'PRO';
  bioUrl: string;
  pageTitle: string;
  bioDescription: string;
  avatarUrl: string;
}
