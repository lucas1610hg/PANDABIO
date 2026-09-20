// =========================================================
// PANDA BIO
// MÓDULO: MINHA PÁGINA - Tipos TypeScript
// Arquitetura baseada no schema_minha_pagina.sql
// =========================================================

// =========================================================
// ENUMS (equivalentes aos enums PostgreSQL)
// =========================================================

export type PageStatus = 'draft' | 'published' | 'archived';

export type BlockType = 
  | 'link'
  | 'text'
  | 'image'
  | 'video'
  | 'social'
  | 'booking'
  | 'product'
  | 'music'
  | 'contact'
  | 'location'
  | 'divider'
  | 'custom';

export type BlockVisibility = 'visible' | 'hidden' | 'scheduled';

export type BackgroundType = 'color' | 'gradient' | 'image' | 'video';

export type ButtonStyle = 'filled' | 'outlined' | 'ghost';

// =========================================================
// PERFIL DO USUÁRIO
// =========================================================

export interface Profile {
  id: string;
  username: string | null;
  display_name: string | null;
  bio: string | null;
  avatar_url: string | null;
  category: string | null;
  location: string | null;
  website_url: string | null;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
}

// =========================================================
// PÁGINA
// =========================================================

export interface BioPage {
  id: string;
  user_id: string;
  username: string;
  title: string | null;
  description: string | null;
  status: PageStatus;
  is_public: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

// =========================================================
// CONFIGURAÇÕES DA PÁGINA
// =========================================================

export interface PageSettings {
  page_id: string;
  show_avatar: boolean;
  show_name: boolean;
  show_bio: boolean;
  show_username: boolean;
  show_branding: boolean;
  enable_animations: boolean;
  enable_share_button: boolean;
  enable_qr_code: boolean;
  seo_title: string | null;
  seo_description: string | null;
  og_image_url: string | null;
  custom_css: string | null;
  created_at: string;
  updated_at: string;
}

// =========================================================
// TEMA / APARÊNCIA
// =========================================================

export interface PageTheme {
  page_id: string;
  theme_id: string;
  background_type: BackgroundType;
  background_color: string;
  background_gradient: any;
  background_image_url: string | null;
  background_video_url: string | null;
  text_color: string;
  secondary_text_color: string;
  button_background: string;
  button_text_color: string;
  button_border_color: string | null;
  button_radius: number;
  button_style: ButtonStyle;
  font_family: string;
  font_weight: number;
  page_width: number;
  custom_theme: any;
  created_at: string;
  updated_at: string;
}

// =========================================================
// BLOCOS DA PÁGINA
// =========================================================

export interface PageBlock {
  id: string;
  page_id: string;
  type: BlockType;
  title: string | null;
  description: string | null;
  position: number;
  visibility: BlockVisibility;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  data: BlockData;
  style: BlockStyle;
  created_at: string;
  updated_at: string;
}

// Tipos específicos de dados para cada tipo de bloco
export interface BlockData {
  // Dados para link
  url?: string;
  icon?: string;
  open_new_tab?: boolean;
  
  // Dados para texto
  content?: string;
  alignment?: 'left' | 'center' | 'right';
  
  // Dados para imagem
  image_url?: string;
  alt_text?: string;
  aspect_ratio?: string;
  
  // Dados para vídeo
  video_url?: string;
  thumbnail_url?: string;
  autoplay?: boolean;
  video_platform?: 'youtube' | 'vimeo' | 'direct';
  
  // Dados para social
  platform?: string;
  handle?: string;
  
  // Dados para booking (aponta para sistema de agendamento)
  booking_service_id?: string;
  show_price?: boolean;
  show_duration?: boolean;
  
  // Dados para produto
  product_id?: string;
  name?: string;
  price?: number;
  image?: string;
  
  // Dados para música
  track_url?: string;
  album_art?: string;
  artist?: string;
  title?: string;
  
  // Dados para contato
  email?: string;
  phone?: string;
  whatsapp?: string;
  
  // Dados para localização
  address?: string;
  map_url?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  
  // Dados customizados
  custom_data?: any;
}

export interface BlockStyle {
  background_color?: string;
  text_color?: string;
  border_radius?: number;
  padding?: number;
  margin?: number;
  custom_css?: string;
}

// =========================================================
// LINKS SOCIAIS
// =========================================================

export interface SocialLink {
  id: string;
  page_id: string;
  platform: string;
  username: string | null;
  url: string;
  icon: string | null;
  position: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// =========================================================
// ESTRUTURA COMPLETA DA PÁGINA
// =========================================================

export interface CompletePage {
  profile: Profile;
  page: BioPage;
  settings: PageSettings;
  theme: PageTheme;
  blocks: PageBlock[];
  social_links: SocialLink[];
}

// =========================================================
// TIPOS PARA O FRONTEND (para facilitar o uso)
// =========================================================

export interface UserProfile {
  name: string;
  username: string;
  email: string;
  plan: 'Gratuito' | 'PRO';
  bioUrl: string;
  pageTitle: string;
  bioDescription: string;
  avatarUrl: string;
  coverUrl?: string;
  category?: string;
  location?: string;
  customLink?: string;
}

// Legacy types para compatibilidade com código existente
export type { BlockType as LegacyBlockType };
export type { PageTheme as LegacyPageTheme };