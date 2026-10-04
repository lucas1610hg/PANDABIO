export type ScreenView = 'dashboard' | 'auth';

export type NavSection =
  | 'dashboard'
  | 'minha-pagina'
  | 'agendamentos'
  | 'estatisticas'
  | 'leads'
  | 'formularios'
  | 'links'
  | 'produtos'
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
  | 'form'
  | 'social'
  | 'contact'
  | 'music'
  | 'location';

export type ThemeType = 'light' | 'dark' | 'auto';

export type ButtonStyle =
  'sharp' | 'smooth' | 'square' | 'rounded' | 'soft' | 'pill' | 'corner' | 'chunky';

export type ButtonVariant = 'filled' | 'outline' | 'soft' | 'glass';

export type ButtonSize = 'small' | 'medium' | 'large';

export type TextSize = 'small' | 'medium' | 'large';

export type AnimationEffect =
  | 'none'
  | 'fade'
  | 'slideUp'
  | 'zoom'
  | 'pulse'
  | 'wiggle'
  | 'lift'
  | 'tilt'
  | 'glow'
  | 'shine'
  | 'grow'
  | 'sweep'
  | 'insetGlow'
  | 'split'
  | 'rise'
  | 'fill'
  | 'diagonal'
  | 'bubble'
  | 'borderDraw'
  | 'corners'
  | 'underline';

export type CardAnimation =
  'none' | 'fade' | 'slideUp' | 'zoom' | 'slideLeft' | 'slideRight' | 'bounce' | 'flip' | 'rotate';

export type AnimationSpeed = 'fast' | 'normal' | 'slow';

export type CategoryPresetId =
  | 'padrao'
  | 'beleza'
  | 'fitness'
  | 'comida'
  | 'salao-masculino'
  | 'salao-feminino'
  | 'eletronicos'
  | 'panda-men'
  | 'panda-girl';

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
  date?: number;
}

export interface ProductItem {
  id: string;
  name: string;
  price: number;
  salesCount: number;
  status: 'active' | 'draft';
  image?: string;
  description?: string;
  sourceUrl?: string;
  purchaseUrl?: string;
  purchaseType?: 'sales' | 'whatsapp';
}

export interface BlockProduct {
  id: string;
  productId?: string;
  name: string;
  price?: number;
  description?: string;
  imageUrl?: string;
  link?: string;
  purchaseType?: 'sales' | 'whatsapp';
}

export type SocialPlatform =
  'instagram' | 'facebook' | 'tiktok' | 'linkedin' | 'pinterest' | 'youtube' | 'kwai' | 'threads';

export interface SocialLink {
  id: string;
  platform: SocialPlatform;
  url: string;
}

export type GalleryLayout = 'grid' | 'carousel' | 'film';

export interface BlockImage {
  id: string;
  url: string;
}

export interface GalleryData {
  images: BlockImage[];
  layout: GalleryLayout;
}

export interface LeadItem {
  id: string;
  name: string;
  email: string;
  phone: string;
  channel: string;
  createdAt: string;
  status?: LeadStatus;
  source?: string;
  medium?: string;
  campaign?: string;
  referrer?: string;
  landingPage?: string;
  device?: 'mobile' | 'desktop' | 'tablet';
  country?: string;
  city?: string;
  score?: number;
  interest?: LeadInterestLevel;
  firstAccessAt?: string;
  lastAccessAt?: string;
  relatedType?: 'product' | 'service' | 'link';
  relatedName?: string;
  linkId?: string;
  consentAt?: string;
  visitorId?: string;
  metadata?: Record<string, string>;
}

export type CustomFormFieldType = 'text' | 'email' | 'phone' | 'textarea';

export interface CustomFormField {
  id: string;
  label: string;
  type: CustomFormFieldType;
  placeholder?: string;
  required: boolean;
}

export interface CustomForm {
  id: string;
  name: string;
  title: string;
  description?: string;
  buttonLabel: string;
  successMessage: string;
  consentText: string;
  fields: CustomFormField[];
  createdAt: string;
  updatedAt: string;
}

export type LeadStatus = 'new' | 'contacted' | 'interested' | 'converted' | 'lost';

export type LeadInterestLevel = 'low' | 'medium' | 'high';

export type TrackingEventType =
  | 'view'
  | 'click'
  | 'page_view'
  | 'link_click'
  | 'product_view'
  | 'product_click'
  | 'service_view'
  | 'booking_start'
  | 'booking_completed'
  | 'location_click'
  | 'form_view'
  | 'form_submit'
  | 'whatsapp_click'
  | 'phone_click'
  | 'email_click'
  | 'social_click'
  | 'conversion';

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
  customDomain?: string;
  customDomainVerified?: boolean;
}

export interface PageBlock {
  id: string;
  type: BlockType;
  order: number;
  title?: string;
  content?: string;
  url?: string;
  linkIds?: string[];
  imageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  gallery?: GalleryData;
  icon?: string;
  active?: boolean;
  // Agendamento específico
  appointmentTitle?: string;
  appointmentDescription?: string;
  serviceId?: string;
  service?: string;
  price?: number;
  duration?: number;
  showPrice?: boolean;
  showDuration?: boolean;
  // Produto específico
  productName?: string;
  productPrice?: number;
  products?: BlockProduct[];
  // Social específico
  platform?: string;
  socialLinks?: SocialLink[];
  // Música específica
  musicProvider?: MusicProvider;
  // Contato específico
  contact?: {
    whatsapp?: string;
    email?: string;
    captureEnabled?: boolean;
    captureTitle?: string;
    captureButtonLabel?: string;
    captureConsentText?: string;
  };
  formId?: string;
  form?: CustomForm;
  // Localização específica
  address?: string;
  mapUrl?: string;
}

export interface ThemeGradient {
  from: string;
  to: string;
  angle: number;
}

export interface PageTheme {
  theme: ThemeType;
  backgroundColor: string;
  backgroundType: 'color' | 'gradient' | 'image';
  backgroundImage?: string;
  buttonStyle: ButtonStyle;
  fontFamily: string;
  animationsEnabled: boolean;
  // Cores por tema (claro/escuro)
  backgroundColorDark?: string;
  backgroundColorGradient?: ThemeGradient;
  backgroundColorGradientDark?: ThemeGradient;
  customGradientFrom?: string;
  customGradientTo?: string;
  // Texto
  textColor?: string;
  textColorDark?: string;
  // Botão
  buttonVariant?: ButtonVariant;
  buttonSize?: ButtonSize;
  customButtonColor?: string;
  customButtonTextColor?: string;
  buttonShadow?: boolean;
  buttonGlow?: boolean;
  // Fonte
  textSize?: TextSize;
  // Animações
  animationEffect?: AnimationEffect;
  cardAnimation?: CardAnimation;
  animationSpeed?: AnimationSpeed;
  // Capa
  coverHeight?: number;
  coverFadeIntensity?: number;
  // Categoria / tema pronto
  categoryPreset?: CategoryPresetId;
}

export type MusicProvider = 'spotify' | 'youtube' | 'outro';

export interface FunnelData {
  visits: number;
  clicks: number;
  leads: number;
  conversions: number;
  ctr: number;
  leadRate: number;
  conversionRate: number;
  leadToConversionRate: number;
}

export interface PageData {
  profile: UserProfile;
  blocks: PageBlock[];
  forms?: CustomForm[];
  links?: BioLink[];
  theme: PageTheme;
  published: boolean;
  lastUpdated: string;
  bookingWorkspaceSlug?: string;
}

export interface UserAccountData {
  profile: UserProfile;
  links: BioLink[];
  products: ProductItem[];
  leads: LeadItem[];
  activities: ActivityItem[];
  pageData?: PageData;
}
