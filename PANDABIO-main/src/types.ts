export type ScreenView = 'dashboard' | 'auth';

export type NavSection =
  | 'dashboard'
  | 'minha-pagina'
  | 'agendamentos'
  | 'estatisticas'
  | 'links'
  | 'conteudo'
  | 'produtos'
  | 'aparencia'
  | 'integracoes'
  | 'configuracoes'
  | 'plano'
  | 'ajuda'
  | 'perfil';

export type BlockType = 
  | 'link' 
  | 'text' 
  | 'image' 
  | 'video' 
  | 'agendamento' 
  | 'produto' 
  | 'social' 
  | 'contact' 
  | 'music' 
  | 'location';

export type ThemeType = 'light' | 'dark' | 'auto';

export type ButtonStyle = 'rounded' | 'square' | 'pill';

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
  category?: string;
  location?: string;
  customLink?: string;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  order: number;
  title?: string;
  content?: string;
  url?: string;
  imageUrl?: string;
  videoUrl?: string;
  icon?: string;
  active?: boolean;
  // Agendamento específico
  appointmentTitle?: string;
  appointmentDescription?: string;
  service?: string;
  showPrice?: boolean;
  showDuration?: boolean;
  // Produto específico
  productName?: string;
  productPrice?: number;
  // Social específico
  platform?: string;
  // Localização específica
  address?: string;
  mapUrl?: string;
}

export interface PageTheme {
  theme: ThemeType;
  backgroundColor: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImage?: string;
  buttonStyle: ButtonStyle;
  fontFamily: string;
  animationsEnabled: boolean;
}

export interface PageData {
  profile: UserProfile;
  blocks: PageBlock[];
  theme: PageTheme;
  published: boolean;
  lastUpdated: string;
}

export interface UserAccountData {
  profile: UserProfile;
  links: BioLink[];
  products: ProductItem[];
  leads: LeadItem[];
  activities: ActivityItem[];
  pageData?: PageData;
}
