import {
  PageTheme,
  CategoryPresetId,
  ButtonVariant,
  ButtonStyle,
  AnimationEffect,
  CardAnimation,
  AnimationSpeed,
} from '../types';
import {
  PawPrint,
  Sparkles,
  Dumbbell,
  UtensilsCrossed,
  Scissors,
  Flower2,
  Cpu,
  Flame,
  Gem,
  type LucideIcon,
} from 'lucide-react';

// ============================================
// FONTES GOOGLE FONTS
// ============================================

export interface FontOption {
  name: string;
  css: string;
  category: 'sans' | 'serif' | 'display' | 'hand';
}

export const FONT_OPTIONS: FontOption[] = [
  { name: 'Inter', css: "'Inter', sans-serif", category: 'sans' },
  { name: 'Poppins', css: "'Poppins', sans-serif", category: 'sans' },
  { name: 'Montserrat', css: "'Montserrat', sans-serif", category: 'sans' },
  { name: 'Roboto', css: "'Roboto', sans-serif", category: 'sans' },
  { name: 'Open Sans', css: "'Open Sans', sans-serif", category: 'sans' },
  { name: 'Nunito', css: "'Nunito', sans-serif", category: 'sans' },
  { name: 'Raleway', css: "'Raleway', sans-serif", category: 'sans' },
  { name: 'Space Grotesk', css: "'Space Grotesk', sans-serif", category: 'sans' },
  { name: 'Outfit', css: "'Outfit', sans-serif", category: 'sans' },
  { name: 'Sora', css: "'Sora', sans-serif", category: 'sans' },
  { name: 'Exo 2', css: "'Exo 2', sans-serif", category: 'sans' },
  { name: 'Merriweather', css: "'Merriweather', serif", category: 'serif' },
  { name: 'Playfair Display', css: "'Playfair Display', serif", category: 'serif' },
  { name: 'Lora', css: "'Lora', serif", category: 'serif' },
  { name: 'Oswald', css: "'Oswald', sans-serif", category: 'display' },
  { name: 'Bebas Neue', css: "'Bebas Neue', sans-serif", category: 'display' },
  { name: 'Caveat', css: "'Caveat', cursive", category: 'hand' },
  { name: 'Pacifico', css: "'Pacifico', cursive", category: 'hand' },
];

export const FONT_CSS: Record<string, string> = Object.fromEntries(
  FONT_OPTIONS.map((f) => [f.name, f.css])
);

// ============================================
// GRADIENTES PRONTOS
// ============================================

export interface GradientPreset {
  key: string;
  label: string;
  from: string;
  to: string;
}

export const GRADIENT_PRESET_LIST: GradientPreset[] = [
  { key: 'sunset', label: 'Pôr do sol', from: '#FF7A00', to: '#FF2E63' },
  { key: 'ocean', label: 'Oceano', from: '#0EA5E9', to: '#6366F1' },
  { key: 'forest', label: 'Floresta', from: '#10B981', to: '#0D9488' },
  { key: 'grape', label: 'Uva', from: '#8B5CF6', to: '#D946EF' },
  { key: 'peach', label: 'Pêssego', from: '#F97316', to: '#FBBF24' },
  { key: 'midnight', label: 'Meia-noite', from: '#0F172A', to: '#312E81' },
  { key: 'candy', label: 'Doce', from: '#F43F5E', to: '#FB7185' },
  { key: 'caribbean', label: 'Caribe', from: '#06B6D4', to: '#10B981' },
  { key: 'rose', label: 'Rosa', from: '#EC4899', to: '#F472B6' },
  { key: 'chocolate', label: 'Chocolate', from: '#7C2D12', to: '#B45309' },
  { key: 'steel', label: 'Aço', from: '#334155', to: '#64748B' },
  { key: 'royal', label: 'Royal', from: '#1E40AF', to: '#7C3AED' },
];

export const GRADIENT_PRESETS: Record<string, string> = Object.fromEntries(
  GRADIENT_PRESET_LIST.map((g) => [
    g.key,
    `linear-gradient(${g.from} 0%, ${g.to} 100%)`,
  ])
);

// ============================================
// VARIANTES DE BOTÃO
// ============================================

export interface ButtonVariantOption {
  id: ButtonVariant;
  label: string;
}

export const BUTTON_VARIANTS: ButtonVariantOption[] = [
  { id: 'filled', label: 'Preenchido' },
  { id: 'outline', label: 'Contorno' },
  { id: 'soft', label: 'Suave' },
  { id: 'glass', label: 'Vidro' },
];

// ============================================
// FORMATOS DE BOTÃO
// ============================================

export interface ButtonStyleOption {
  id: ButtonStyle;
  label: string;
}

export const BUTTON_STYLE_OPTIONS: ButtonStyleOption[] = [
  { id: 'sharp', label: 'Reto' },
  { id: 'smooth', label: 'Sutil' },
  { id: 'square', label: 'Quadrado' },
  { id: 'rounded', label: 'Arredondado' },
  { id: 'soft', label: 'Redondo' },
  { id: 'pill', label: 'Pílula' },
  { id: 'corner', label: 'Chanfrado' },
  { id: 'chunky', label: '3D' },
];

// ============================================
// TAMANHOS
// ============================================

export const BUTTON_SIZES: { id: string; label: string; padding: string; text: string }[] = [
  { id: 'small', label: 'Pequeno', padding: 'px-4 py-2', text: 'text-sm' },
  { id: 'medium', label: 'Médio', padding: 'px-4 py-3', text: 'text-sm' },
  { id: 'large', label: 'Grande', padding: 'px-5 py-3.5', text: 'text-[15px]' },
];

export const TEXT_SIZES: { id: string; label: string; value: string }[] = [
  { id: 'small', label: 'Pequeno', value: 'text-[13px]' },
  { id: 'medium', label: 'Médio', value: 'text-sm' },
  { id: 'large', label: 'Grande', value: 'text-base' },
];

// ============================================
// EFEITOS DE ANIMAÇÃO
// ============================================

export interface AnimOption {
  id: AnimationEffect;
  label: string;
}

export const ANIMATION_OPTIONS: AnimOption[] = [
  { id: 'none', label: 'Nenhuma' },
  { id: 'fade', label: 'Fade' },
  { id: 'slideUp', label: 'Slide up' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'pulse', label: 'Pulso' },
  { id: 'wiggle', label: 'Onda' },
  { id: 'lift', label: 'Elevar' },
  { id: 'tilt', label: 'Inclinar' },
  { id: 'glow', label: 'Brilho' },
  { id: 'shine', label: 'Brilhar' },
  { id: 'grow', label: 'Crescer' },
  { id: 'sweep', label: 'Varrer' },
  { id: 'insetGlow', label: 'Brilho interno' },
  { id: 'split', label: 'Dividir' },
  { id: 'rise', label: 'Ondular' },
  { id: 'fill', label: 'Cobrir' },
  { id: 'diagonal', label: 'Diagonal' },
  { id: 'bubble', label: 'Bolha' },
  { id: 'borderDraw', label: 'Borda animada' },
  { id: 'corners', label: 'Cantos' },
  { id: 'underline', label: 'Sublinhado' },
];

export const ANIMATION_CLASS: Record<AnimationEffect, string> = {
  none: '',
  fade: 'transition-opacity hover:opacity-75',
  slideUp: 'transition-all hover:-translate-y-0.5 hover:shadow-lg',
  zoom: 'transition-transform hover:scale-[1.03] active:scale-[0.98]',
  pulse: 'transition-transform hover:animate-pulse-slow',
  wiggle: 'transition-transform hover:rotate-1',
  lift: 'transition-all hover:-translate-y-1 hover:shadow-xl',
  tilt: 'transition-transform hover:rotate-2 hover:scale-[1.02]',
  glow: 'pb-button-effect-glow',
  shine: 'pb-button-effect-shine',
  grow: 'transition-transform hover:scale-105 active:scale-100',
  sweep: 'pb-button-effect-sweep',
  insetGlow: 'pb-button-effect-inset-glow',
  split: 'pb-button-effect-split',
  rise: 'pb-button-effect-rise',
  fill: 'pb-button-effect-fill',
  diagonal: 'pb-button-effect-diagonal',
  bubble: 'pb-button-effect-bubble',
  borderDraw: 'pb-button-effect-border-draw',
  corners: 'pb-button-effect-corners',
  underline: 'pb-button-effect-underline',
};

// ============================================
// ANIMAÇÕES DE CARD (entrada)
// ============================================

export interface CardAnimOption {
  id: CardAnimation;
  label: string;
}

export const CARD_ANIMATION_OPTIONS: CardAnimOption[] = [
  { id: 'none', label: 'Sem animação' },
  { id: 'fade', label: 'Fade' },
  { id: 'slideUp', label: 'Subir' },
  { id: 'zoom', label: 'Zoom' },
  { id: 'slideLeft', label: 'Da direita' },
  { id: 'slideRight', label: 'Da esquerda' },
  { id: 'bounce', label: 'Quicar' },
  { id: 'flip', label: 'Virar' },
  { id: 'rotate', label: 'Girar' },
];

export interface CardMotionProps {
  initial: Record<string, number | string>;
  animate: Record<string, number | string>;
  spring?: boolean;
}

export const CARD_ANIMATION_PROPS: Record<CardAnimation, CardMotionProps> = {
  none: { initial: {}, animate: {} },
  fade: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  slideUp: { initial: { opacity: 0, y: 24 }, animate: { opacity: 1, y: 0 } },
  zoom: { initial: { opacity: 0, scale: 0.85 }, animate: { opacity: 1, scale: 1 } },
  slideLeft: { initial: { opacity: 0, x: 48 }, animate: { opacity: 1, x: 0 } },
  slideRight: { initial: { opacity: 0, x: -48 }, animate: { opacity: 1, x: 0 } },
  bounce: { initial: { opacity: 0, y: 40, scale: 0.95 }, animate: { opacity: 1, y: 0, scale: 1 }, spring: true },
  flip: {
    initial: { opacity: 0, rotateX: -90, transformPerspective: 800 },
    animate: { opacity: 1, rotateX: 0, transformPerspective: 800 },
  },
  rotate: { initial: { opacity: 0, rotate: -10, scale: 0.92 }, animate: { opacity: 1, rotate: 0, scale: 1 } },
};

export const ANIMATION_SPEEDS: { id: AnimationSpeed; label: string; duration: number }[] = [
  { id: 'fast', label: 'Rápida', duration: 0.25 },
  { id: 'normal', label: 'Normal', duration: 0.4 },
  { id: 'slow', label: 'Lenta', duration: 0.65 },
];

// ============================================
// TEMAS POR CATEGORIA
// ============================================

export interface CategoryPreset {
  id: CategoryPresetId;
  label: string;
  icon: LucideIcon;
  description: string;
  theme: Partial<PageTheme>;
}

export const CATEGORY_PRESETS: CategoryPreset[] = [
  {
    id: 'padrao',
    label: 'Padrão',
    icon: PawPrint,
    description: 'Tema clássico PandaBio',
    theme: {
      theme: 'auto',
      backgroundType: 'gradient',
      backgroundColor: '#FF7A00',
      backgroundColorGradient: { from: '#FF7A00', to: '#FF2E63', angle: 135 },
      backgroundColorGradientDark: { from: '#1e1b4b', to: '#0f172a', angle: 135 },
      backgroundColorDark: '#0f172a',
      fontFamily: 'Inter',
      buttonStyle: 'rounded',
      buttonVariant: 'filled',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#131b2e',
      customButtonTextColor: '#ffffff',
      textColor: '#131b2e',
      textColorDark: '#ffffff',
      buttonShadow: true,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'slideUp',
      cardAnimation: 'slideUp',
      animationSpeed: 'normal',
      categoryPreset: 'padrao',
    },
  },
  {
    id: 'beleza',
    label: 'Beleza',
    icon: Sparkles,
    description: 'Rosa suave elegante para estética',
    theme: {
      theme: 'light',
      backgroundType: 'gradient',
      backgroundColor: '#EC4899',
      backgroundColorGradient: { from: '#FDF2F8', to: '#FCE7F3', angle: 160 },
      backgroundColorDark: '#2e1065',
      fontFamily: 'Playfair Display',
      buttonStyle: 'pill',
      buttonVariant: 'soft',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#EC4899',
      customButtonTextColor: '#ffffff',
      textColor: '#831843',
      textColorDark: '#FDF2F8',
      buttonShadow: false,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'fade',
      cardAnimation: 'fade',
      animationSpeed: 'normal',
      categoryPreset: 'beleza',
    },
  },
  {
    id: 'fitness',
    label: 'Fitness',
    icon: Dumbbell,
    description: 'Energia em tons escuros e verde-lima',
    theme: {
      theme: 'dark',
      backgroundType: 'gradient',
      backgroundColor: '#22c55e',
      backgroundColorGradient: { from: '#111827', to: '#1f2937', angle: 135 },
      backgroundColorDark: '#0a0f0b',
      fontFamily: 'Oswald',
      buttonStyle: 'square',
      buttonVariant: 'filled',
      buttonSize: 'large',
      textSize: 'medium',
      customButtonColor: '#22c55e',
      customButtonTextColor: '#0a0f0b',
      textColor: '#0a0f0b',
      textColorDark: '#ecfdf5',
      buttonShadow: true,
      buttonGlow: true,
      animationsEnabled: true,
      animationEffect: 'fill',
      cardAnimation: 'bounce',
      animationSpeed: 'fast',
      categoryPreset: 'fitness',
    },
  },
  {
    id: 'comida',
    label: 'Comida',
    icon: UtensilsCrossed,
    description: 'Aconchegante quente para restaurantes',
    theme: {
      theme: 'light',
      backgroundType: 'gradient',
      backgroundColor: '#f97316',
      backgroundColorGradient: { from: '#FFFBEB', to: '#FEF3C7', angle: 160 },
      backgroundColorDark: '#431407',
      fontFamily: 'Nunito',
      buttonStyle: 'rounded',
      buttonVariant: 'filled',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#EA580C',
      customButtonTextColor: '#ffffff',
      textColor: '#7C2D12',
      textColorDark: '#FEF3C7',
      buttonShadow: true,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'wiggle',
      cardAnimation: 'slideUp',
      animationSpeed: 'normal',
      categoryPreset: 'comida',
    },
  },
  {
    id: 'salao-masculino',
    label: 'Barber',
    icon: Scissors,
    description: 'Estilo urbano para barbearias',
    theme: {
      theme: 'dark',
      backgroundType: 'gradient',
      backgroundColor: '#b45309',
      backgroundColorGradient: { from: '#18181b', to: '#3f3f46', angle: 135 },
      backgroundColorDark: '#09090b',
      fontFamily: 'Bebas Neue',
      buttonStyle: 'square',
      buttonVariant: 'outline',
      buttonSize: 'medium',
      textSize: 'large',
      customButtonColor: '#F59E0B',
      customButtonTextColor: '#F59E0B',
      textColor: '#fafaf9',
      textColorDark: '#fafaf9',
      buttonShadow: false,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'borderDraw',
      cardAnimation: 'zoom',
      animationSpeed: 'normal',
      categoryPreset: 'salao-masculino',
    },
  },
  {
    id: 'salao-feminino',
    label: 'Salão feminino',
    icon: Flower2,
    description: 'Charme com tons lilás e dourado',
    theme: {
      theme: 'light',
      backgroundType: 'gradient',
      backgroundColor: '#a855f7',
      backgroundColorGradient: { from: '#FAF5FF', to: '#F3E8FF', angle: 150 },
      backgroundColorDark: '#3b0764',
      fontFamily: 'Poppins',
      buttonStyle: 'pill',
      buttonVariant: 'filled',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#9333EA',
      customButtonTextColor: '#ffffff',
      textColor: '#581C87',
      textColorDark: '#F3E8FF',
      buttonShadow: false,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'fade',
      cardAnimation: 'fade',
      animationSpeed: 'slow',
      categoryPreset: 'salao-feminino',
    },
  },
  {
    id: 'eletronicos',
    label: 'Eletrônicos',
    icon: Cpu,
    description: 'Futurista em azul e ciano',
    theme: {
      theme: 'dark',
      backgroundType: 'gradient',
      backgroundColor: '#06b6d4',
      backgroundColorGradient: { from: '#0f172a', to: '#164e63', angle: 135 },
      backgroundColorDark: '#082f49',
      fontFamily: 'Space Grotesk',
      buttonStyle: 'rounded',
      buttonVariant: 'glass',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#06b6d4',
      customButtonTextColor: '#ecfeff',
      textColor: '#ecfeff',
      textColorDark: '#ecfeff',
      buttonShadow: true,
      buttonGlow: true,
      animationsEnabled: true,
      animationEffect: 'sweep',
      cardAnimation: 'slideLeft',
      animationSpeed: 'normal',
      categoryPreset: 'eletronicos',
    },
  },
  {
    id: 'panda-men',
    label: 'Panda Men',
    icon: Flame,
    description: 'Visual masculino marcante',
    theme: {
      theme: 'dark',
      backgroundType: 'gradient',
      backgroundColor: '#FF7A00',
      backgroundColorGradient: { from: '#0c0e14', to: '#1f2937', angle: 135 },
      backgroundColorDark: '#0c0e14',
      fontFamily: 'Outfit',
      buttonStyle: 'square',
      buttonVariant: 'filled',
      buttonSize: 'large',
      textSize: 'medium',
      customButtonColor: '#FF7A00',
      customButtonTextColor: '#0c0e14',
      textColor: '#f9fafb',
      textColorDark: '#f9fafb',
      buttonShadow: true,
      buttonGlow: true,
      animationsEnabled: true,
      animationEffect: 'diagonal',
      cardAnimation: 'slideUp',
      animationSpeed: 'fast',
      categoryPreset: 'panda-men',
    },
  },
  {
    id: 'panda-girl',
    label: 'Panda Girl',
    icon: Gem,
    description: 'Feminino vibrante e moderno',
    theme: {
      theme: 'light',
      backgroundType: 'gradient',
      backgroundColor: '#f472b6',
      backgroundColorGradient: { from: '#FFF1F2', to: '#FCE7F3', angle: 150 },
      backgroundColorDark: '#500724',
      fontFamily: 'Pacifico',
      buttonStyle: 'pill',
      buttonVariant: 'soft',
      buttonSize: 'medium',
      textSize: 'medium',
      customButtonColor: '#db2777',
      customButtonTextColor: '#ffffff',
      textColor: '#9D174D',
      textColorDark: '#FCE7F3',
      buttonShadow: false,
      buttonGlow: false,
      animationsEnabled: true,
      animationEffect: 'shine',
      cardAnimation: 'slideUp',
      animationSpeed: 'normal',
      categoryPreset: 'panda-girl',
    },
  },
];

// ============================================
// HELPERS
// ============================================

// Campos "residuais" que vazam entre presets e precisam ser limpos ao
// aplicar um preset ou restaurar o padrão (se ficarem no estado, prevalecem
// sobre o preset no preview).
const RESIDUAL_FIELDS: Partial<PageTheme> = {
  customGradientFrom: undefined,
  customGradientTo: undefined,
  backgroundImage: undefined,
  backgroundColorGradientDark: undefined,
};

export function applyCategoryPreset(
  current: PageTheme,
  presetId: CategoryPresetId
): PageTheme {
  const preset = CATEGORY_PRESETS.find((p) => p.id === presetId);
  if (!preset) return current;
  return {
    ...current,
    ...RESIDUAL_FIELDS,
    ...preset.theme,
    categoryPreset: presetId,
  };
}

/** Campos que devem ser zerados ao restaurar o tema padrão. */
export function resetResidualFields(): Partial<PageTheme> {
  return { ...RESIDUAL_FIELDS };
}

export function defaultPageTheme(): PageTheme {
  return {
    theme: 'auto',
    backgroundColor: '#ffffff',
    backgroundType: 'gradient',
    backgroundColorGradient: { from: '#FF7A00', to: '#FF2E63', angle: 135 },
    backgroundColorDark: '#0f172a',
    buttonStyle: 'rounded',
    fontFamily: 'Inter',
    animationsEnabled: true,
    buttonVariant: 'filled',
    buttonSize: 'medium',
    textSize: 'medium',
    customButtonColor: '#131b2e',
    customButtonTextColor: '#ffffff',
    textColor: '#131b2e',
    textColorDark: '#ffffff',
    buttonShadow: true,
    buttonGlow: false,
    animationEffect: 'slideUp',
    cardAnimation: 'slideUp',
    animationSpeed: 'normal',
    coverHeight: 200,
    coverFadeIntensity: 60,
    categoryPreset: 'padrao',
  };
}