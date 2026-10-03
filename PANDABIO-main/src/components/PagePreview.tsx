import React, { useMemo, useEffect, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import {
  Camera,
  MessageCircle,
  Layers,
  ShoppingBag,
  ExternalLink,
  Image as ImageIcon,
  Calendar,
  Mail,
  Music,
  MapPin,
  Play,
  PawPrint,
  Link2,
  Clock,
  Globe,
  Tag,
  Instagram,
  Facebook,
  Music2,
  Linkedin,
  Pin,
  Youtube,
  AtSign,
} from 'lucide-react';
import { BioLink, UserProfile, PageBlock, PageTheme, SocialPlatform, CustomForm } from '../types';
import { PublicLeadCaptureResult } from '../supabase/services/publicAnalyticsService';
import { PublicBookingAvailability } from '../types_agendamentos';
import {
  FONT_CSS,
  ANIMATION_CLASS,
  BUTTON_SIZES,
  TEXT_SIZES,
  CARD_ANIMATION_PROPS,
  ANIMATION_SPEEDS,
} from '../theme/presets';
import { loadGoogleFont } from '../theme/loadFont';
import { buttonFxColors } from '../theme/effectColors';
import { getSafeExternalUrl, getSafeImageUrl } from '../utils/externalUrl';
import { getPreviewThemeTokens } from '../theme/themeTokens';

export type PreviewDevice = 'mobile' | 'desktop';

interface PagePreviewProps {
  profile: UserProfile;
  theme: PageTheme;
  blocks: PageBlock[];
  forms?: CustomForm[];
  links?: BioLink[];
  device: PreviewDevice;
  interactive?: boolean;
  onInteractiveClick?: (block: PageBlock) => void;
  onLeadCapture?: (
    block: PageBlock,
    input: {
      name: string;
      email: string;
      phone: string;
      consent: boolean;
      fields?: Record<string, string>;
    },
  ) => Promise<boolean | PublicLeadCaptureResult>;
  bookingAvailability?: PublicBookingAvailability[];
}

function getYouTubeThumbnail(url: string): string | null {
  const match =
    url.match(
      /(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{6,})/,
    ) || url.match(/youtube\.com\/watch\?.*[?&]v=([a-zA-Z0-9_-]{6,})/);
  return match ? `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg` : null;
}

const SOCIAL_LINK_ICONS: {
  platform: SocialPlatform;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { platform: 'instagram', icon: Instagram },
  { platform: 'facebook', icon: Facebook },
  { platform: 'tiktok', icon: Music2 },
  { platform: 'linkedin', icon: Linkedin },
  { platform: 'pinterest', icon: Pin },
  { platform: 'youtube', icon: Youtube },
  { platform: 'kwai', icon: Play },
  { platform: 'threads', icon: AtSign },
];

const PLATFORM_LABEL_PREVIEW: Record<SocialPlatform, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  tiktok: 'TikTok',
  linkedin: 'LinkedIn',
  pinterest: 'Pinterest',
  youtube: 'YouTube',
  kwai: 'Kwai',
  threads: 'Threads',
};

const BOOKING_DAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export const PagePreview: React.FC<PagePreviewProps> = ({
  profile,
  theme,
  blocks,
  forms = [],
  links = [],
  device,
  interactive = false,
  onInteractiveClick,
  onLeadCapture,
  bookingAvailability,
}) => {
  useEffect(() => {
    loadGoogleFont(theme.fontFamily);
  }, [theme.fontFamily]);

  const [systemDark, setSystemDark] = useState(false);
  const [captureForms, setCaptureForms] = useState<
    Record<string, { name: string; email: string; phone: string; consent: boolean }>
  >({});
  const [captureState, setCaptureState] = useState<
    Record<string, 'idle' | 'submitting' | 'success' | 'error'>
  >({});
  const [captureErrors, setCaptureErrors] = useState<Record<string, string>>({});
  const [customFormValues, setCustomFormValues] = useState<
    Record<string, Record<string, string | boolean>>
  >({});

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const updateSystemTheme = () => setSystemDark(mediaQuery.matches);
    updateSystemTheme();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', updateSystemTheme);
    } else {
      mediaQuery.addListener(updateSystemTheme);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', updateSystemTheme);
      } else {
        mediaQuery.removeListener(updateSystemTheme);
      }
    };
  }, []);

  const effectiveDark = useMemo(() => {
    if (theme.theme === 'dark') return true;
    if (theme.theme === 'light') return false;
    return systemDark;
  }, [systemDark, theme.theme]);

  const tokens = getPreviewThemeTokens(theme, effectiveDark);

  const fontFamily = FONT_CSS[theme.fontFamily] || `'${theme.fontFamily}', sans-serif`;

  const backgroundStyle = useMemo(() => {
    const gradientFrom =
      theme.customGradientFrom || theme.backgroundColorGradient?.from || '#FF7A00';
    const gradientTo = theme.customGradientTo || theme.backgroundColorGradient?.to || '#FF2E63';
    const angle = theme.backgroundColorGradient?.angle ?? 135;

    if (theme.backgroundType === 'gradient') {
      const darkG = theme.backgroundColorGradientDark;
      return {
        background:
          effectiveDark && darkG
            ? `linear-gradient(${darkG.angle}deg, ${darkG.from} 0%, ${darkG.to} 100%)`
            : `linear-gradient(${angle}deg, ${gradientFrom} 0%, ${gradientTo} 100%)`,
      };
    }
    if (theme.backgroundType === 'image') {
      const imageUrl = getSafeImageUrl(theme.backgroundImage);
      return imageUrl
        ? {
            backgroundImage: `url("${imageUrl.replace(/["\\)]/g, '\\$&')}")`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }
        : { background: effectiveDark ? theme.backgroundColorDark || '#0f172a' : '#e5e4e2' };
    }
    return {
      background: effectiveDark
        ? theme.backgroundColorDark || theme.backgroundColor
        : theme.backgroundColor || '#ffffff',
    };
  }, [
    theme.backgroundType,
    theme.backgroundColor,
    theme.backgroundColorDark,
    theme.backgroundColorGradient,
    theme.backgroundColorGradientDark,
    theme.customGradientFrom,
    theme.customGradientTo,
    theme.backgroundImage,
    effectiveDark,
  ]);

  // Replica exata do fundo efetivo da página (gradiente, cor ou imagem),
  // aplicada sobre a capa com máscara para a capa "derreter" no fundo.
  const coverMelt = useMemo(() => {
    const imageUrl = getSafeImageUrl(theme.backgroundImage);
    if (theme.backgroundType === 'image' && imageUrl) {
      return `url("${imageUrl.replace(/["\\)]/g, '\\$&')}") center / cover no-repeat`;
    }
    return (
      backgroundStyle.background ||
      (effectiveDark ? theme.backgroundColorDark || '#0f172a' : theme.backgroundColor || '#ffffff')
    );
  }, [
    theme.backgroundType,
    theme.backgroundImage,
    theme.backgroundColor,
    theme.backgroundColorDark,
    backgroundStyle,
    effectiveDark,
  ]);

  const coverHeight = Math.max(128, Math.min(340, theme.coverHeight ?? 200));

  const coverFadeIntensity = Math.max(0, Math.min(100, theme.coverFadeIntensity ?? 60));
  const coverFadeIntent = coverFadeIntensity / 100;
  // A fusão com o fundo começa a 60% (intensidade 0) e a 30% (intensidade 100):
  // a capa nunca fica inteiramente coberta pelo fundo da página.
  const meltStart = 60 - coverFadeIntent * 30;
  const meltEnd = Math.min(95, meltStart + 35);
  const coverFadeMask = `linear-gradient(
    to bottom,
    transparent ${meltStart}%,
    #000 ${meltEnd}%
  )`;
  // Degradê de legibilidade: escurece a base da capa (onde ficam texto e avatar)
  // na mesma proporção da "Intensidade do degradê" para nunca deixar o texto ilegível.
  const coverLegibility = `linear-gradient(
    to bottom,
    rgba(10, 12, 18, ${0.05 + coverFadeIntent * 0.18}) 0%,
    rgba(10, 12, 18, ${0.2 + coverFadeIntent * 0.3}) 55%,
    rgba(10, 12, 18, ${0.32 + coverFadeIntent * 0.28}) 100%
  )`;

  const textColor = tokens.text;
  const secondaryTextColor = tokens.secondaryText;
  const muted = effectiveDark ? 'text-gray-400' : 'text-gray-500';
  const buttonRadius = {
    sharp: 'rounded-none',
    smooth: 'rounded-md',
    square: 'rounded-lg',
    rounded: 'rounded-xl',
    soft: 'rounded-2xl',
    pill: 'rounded-full',
    corner: 'pb-btn-shape-corner',
    chunky: 'pb-btn-shape-chunky',
  }[theme.buttonStyle];
  // Cards de conteúdo (agendamento, produto, música...) que respeitam o tema escuro
  const cardCls = `${effectiveDark ? 'bg-white/10 border-white/10' : 'bg-white/95 border-black/5'} min-w-0 max-w-full p-3.5 shadow-sm ${buttonRadius}`;
  const cardInnerCls = `${effectiveDark ? 'bg-white/10 border-white/10' : 'bg-white border-black/5'}`;
  const titleStrong = '';
  const cardStyle = {
    backgroundColor: tokens.cardBackground,
    borderColor: tokens.cardBorder,
  };
  const cardInnerStyle = {
    backgroundColor: tokens.cardInnerBackground,
    borderColor: tokens.cardBorder,
  };

  const anim = ANIMATION_CLASS[theme.animationEffect || 'slideUp'] || '';
  const animation = theme.animationsEnabled ? anim : '';

  const accent = tokens.accent;
  const accentText = tokens.accentText;
  const fxVars = (bg?: string) => {
    const c = buttonFxColors(bg, accent);
    return { '--ac': c.ac, '--ac-fill': c.fill, '--ac-text': c.text } as React.CSSProperties;
  };

  const cardMotion =
    CARD_ANIMATION_PROPS[theme.cardAnimation || 'none'] || CARD_ANIMATION_PROPS.none;
  const animDuration = ANIMATION_SPEEDS.find((s) => s.id === theme.animationSpeed)?.duration || 0.4;

  const buttonVariant = theme.buttonVariant || 'filled';
  const buttonSize = BUTTON_SIZES.find((s) => s.id === theme.buttonSize) || BUTTON_SIZES[1];
  const textSizeClass = TEXT_SIZES.find((s) => s.id === theme.textSize) || TEXT_SIZES[1];

  const getButtonStyle = (extraClass = ''): { className: string; style?: React.CSSProperties } => {
    const base = `w-full min-w-0 max-w-full font-bold ${buttonSize.padding} ${buttonSize.text} ${buttonRadius} ${animation} ${theme.buttonGlow ? 'pb-button-glow' : ''} ${extraClass}`;
    const color = theme.customButtonColor ? accent : undefined;
    const text = theme.customButtonTextColor ? accentText : '#ffffff';
    const shadowClass = theme.buttonShadow === false ? 'shadow-none' : 'shadow-sm';
    switch (buttonVariant) {
      case 'outline':
        return {
          className: `${base} ${shadowClass} border-2 ${color ? '' : effectiveDark ? 'border-white/70' : 'border-[#131b2e]'}`,
          style: {
            ...fxVars(),
            backgroundColor: 'transparent',
            borderColor: color || undefined,
            color: color || (effectiveDark ? '#ffffff' : '#131b2e'),
          },
        };
      case 'soft':
        return {
          className: `${base} ${shadowClass}`,
          style: {
            ...fxVars(),
            backgroundColor: color ? tokens.accentSoft : '#f2f3ff',
            color: color || (effectiveDark ? '#ffffff' : '#131b2e'),
          },
        };
      case 'glass':
        return {
          className: `${base} backdrop-blur-md border ${effectiveDark ? 'bg-white/15 border-white/30 text-white' : 'bg-white/40 border-black/10 text-[#131b2e]'}`,
          style: {
            ...fxVars(),
            backgroundColor: effectiveDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
          },
        };
      case 'filled':
      default:
        return {
          className: `${base} ${color ? '' : 'bg-[#131b2e] text-white'} ${shadowClass}`,
          style: color
            ? { ...fxVars(color), backgroundColor: color, color: text }
            : { ...fxVars('#131b2e') },
        };
    }
  };

  const renderBlockButton = (children: React.ReactNode, href?: string, block?: PageBlock) => {
    const { className, style } = getButtonStyle();

    const normalizedHref = getSafeExternalUrl(href);
    if (interactive && normalizedHref) {
      return (
        <a
          href={normalizedHref}
          target="_blank"
          rel="noopener noreferrer"
          className={`${className} text-center`}
          style={style}
          onClick={() => block && onInteractiveClick?.(block)}
        >
          {children}
        </a>
      );
    }

    return (
      <button
        type="button"
        className={`${className} text-center`}
        style={style}
        onClick={() => interactive && block && onInteractiveClick?.(block)}
      >
        {children}
      </button>
    );
  };

  const renderBlock = (block: PageBlock) => {
    switch (block.type) {
      case 'form': {
        const customForm = block.form || forms.find((form) => form.id === block.formId);
        if (!customForm) {
          return (
            <div className={`${cardCls} text-center`} style={cardStyle}>
              <p className="text-sm font-extrabold">Formulário não configurado</p>
              <p className={`mt-1 text-[11px] ${muted}`}>Selecione um formulário no editor.</p>
            </div>
          );
        }
        const values = customFormValues[block.id] || {};
        const state = captureState[block.id] || 'idle';
        const setValue = (fieldId: string, value: string | boolean) =>
          setCustomFormValues((current) => ({
            ...current,
            [block.id]: { ...values, [fieldId]: value },
          }));
        return (
          <div className={`${cardCls} space-y-3`} style={{ ...cardStyle, ...fxVars('#ffffff') }}>
            <div>
              <p className="text-sm font-extrabold">{customForm.title}</p>
              {customForm.description && <p className={`mt-1 text-[11px] ${muted}`}>{customForm.description}</p>}
            </div>
            {state === 'success' ? (
              <p className="rounded-xl bg-[#e7f8f2] px-3 py-2 text-xs font-bold text-[#047857]">{customForm.successMessage}</p>
            ) : (
              <form
                className="space-y-2"
                onSubmit={async (event) => {
                  event.preventDefault();
                  if (!interactive || !onLeadCapture) return;
                  setCaptureState((current) => ({ ...current, [block.id]: 'submitting' }));
                  const result = await onLeadCapture(block, {
                    name: String(values.name || ''),
                    email: String(values.email || ''),
                    phone: String(values.phone || ''),
                    consent: values.consent === true,
                    fields: Object.fromEntries(
                      Object.entries(values)
                        .filter(([key]) => !['name', 'email', 'phone', 'consent'].includes(key))
                        .map(([key, value]) => [key, String(value)]),
                    ),
                  });
                  const success = typeof result === 'boolean' ? result : result.success;
                  const errorMessage = typeof result === 'boolean' ? '' : result.error || '';
                  setCaptureErrors((current) => ({ ...current, [block.id]: errorMessage }));
                  setCaptureState((current) => ({
                    ...current,
                    [block.id]: success ? 'success' : 'error',
                  }));
                }}
              >
                {customForm.fields.map((field) => {
                  const value = String(values[field.id] || '');
                  const common = {
                    required: field.required,
                    value,
                    placeholder: field.placeholder,
                    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setValue(field.id, event.target.value),
                    className: 'w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs outline-none focus:border-[#ff7a00]',
                  };
                  return (
                    <label key={field.id} className="block text-[11px] font-bold text-[#344054]">
                      {field.label}{field.required ? ' *' : ''}
                      {field.type === 'textarea' ? <textarea {...common} rows={3} /> : <input {...common} type={field.type === 'phone' ? 'tel' : field.type} />}
                    </label>
                  );
                })}
                <label className={`flex items-start gap-2 text-[10px] ${muted}`}>
                  <input required type="checkbox" checked={values.consent === true} onChange={(event) => setValue('consent', event.target.checked)} className="mt-0.5 accent-[#FF7A00]" />
                  <span>{customForm.consentText}</span>
                </label>
                <button type="submit" disabled={!interactive || state === 'submitting'} className={`${getButtonStyle().className} w-full text-center disabled:opacity-60`} style={getButtonStyle().style}>
                  {state === 'submitting' ? 'Enviando...' : customForm.buttonLabel}
                </button>
                {state === 'error' && (
                  <p className="text-[10px] font-semibold text-red-600">
                    {captureErrors[block.id] || 'Não foi possível enviar. Tente novamente.'}
                  </p>
                )}
              </form>
            )}
          </div>
        );
      }
      case 'link': {
        const iconMap = {
          social: Camera,
          whatsapp: MessageCircle,
          portfolio: Layers,
          store: ShoppingBag,
          custom: ExternalLink,
        } as const;
        const Icon = iconMap[(block.icon || 'custom') as keyof typeof iconMap] || ExternalLink;
        const sourceLinks = Array.isArray(block.linkIds)
          ? links.filter((link) => block.linkIds?.includes(link.id))
          : links;
        const activeLinks = sourceLinks.filter(
          (link) => link.active && getSafeExternalUrl(link.url),
        );

        if (Array.isArray(block.linkIds) && activeLinks.length === 0) return null;

        if (activeLinks.length > 0) {
          return (
            <div className="grid min-w-0 gap-2">
              {activeLinks.map((link) => {
                const LinkIcon =
                  iconMap[(link.type || link.icon || 'custom') as keyof typeof iconMap] ||
                  ExternalLink;
                return (
                  <React.Fragment key={link.id}>
                    {renderBlockButton(
                      <span className="flex min-w-0 w-full items-center gap-2.5">
                        <span
                          className="shrink-0 rounded-lg p-1"
                          style={{ backgroundColor: tokens.accentSoft }}
                        >
                          <LinkIcon className="h-4 w-4" style={{ color: accent }} />
                        </span>
                        <span className="min-w-0 flex-1 break-words text-left leading-snug line-clamp-2">
                          {link.title || 'Meu link'}
                        </span>
                        <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 opacity-40" />
                      </span>,
                      link.url,
                      block,
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          );
        }

        return renderBlockButton(
          <span className="flex min-w-0 w-full items-center gap-2.5">
            <span
              className="shrink-0 rounded-lg p-1"
              style={{ backgroundColor: tokens.accentSoft }}
            >
              <Icon className="h-4 w-4" style={{ color: accent }} />
            </span>
            <span className="min-w-0 flex-1 break-words text-left leading-snug line-clamp-2">
              {block.title || block.content || 'Meu link'}
            </span>
            <ExternalLink aria-hidden="true" className="h-3 w-3 shrink-0 opacity-40" />
          </span>,
          block.url,
          block,
        );
      }
      case 'text':
        return (
          <p
            className={`leading-relaxed ${textSizeClass.value}`}
            style={{ color: secondaryTextColor }}
          >
            {block.content || block.title || 'Texto informativo para sua audiência.'}
          </p>
        );
      case 'image': {
        const galleryImages = block.gallery?.images || [];
        const layout = block.gallery?.layout || 'grid';

        if (galleryImages.length > 0) {
          const tile = (img: { id: string; url: string }) => (
            <img key={img.id} src={img.url} alt="" className="w-full h-full object-cover" />
          );
          return (
            <div className={`${buttonRadius} overflow-hidden border border-black/5 bg-white/40`}>
              {layout === 'grid' && (
                <div className="relative">
                  <div
                    className={`grid ${galleryImages.length === 1 ? 'grid-cols-1' : 'grid-cols-2'} gap-1`}
                  >
                    {galleryImages.slice(0, 4).map((img) => (
                      <div
                        key={img.id}
                        className={`${galleryImages.length === 1 ? 'h-40' : 'h-28'} overflow-hidden`}
                      >
                        {tile(img)}
                      </div>
                    ))}
                  </div>
                  {galleryImages.length > 4 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-[10px] text-white font-semibold">
                      +{galleryImages.length - 4} imagens
                    </span>
                  )}
                </div>
              )}
              {layout === 'carousel' && (
                <div className="relative">
                  <div className="h-48 overflow-hidden">{tile(galleryImages[0])}</div>
                  {galleryImages.length > 4 && (
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/50 text-[10px] text-white font-semibold">
                      +{galleryImages.length - 4} imagens
                    </span>
                  )}
                </div>
              )}
              {layout === 'film' && (
                <div className="p-2 space-y-1.5">
                  <div className="h-32 overflow-hidden rounded-lg">{tile(galleryImages[0])}</div>
                  <div className="flex gap-1.5 overflow-hidden">
                    {galleryImages.slice(1, 4).map((img) => (
                      <div key={img.id} className="w-16 h-12 rounded-md overflow-hidden shrink-0">
                        {tile(img)}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        }

        return (
          <div className={`${buttonRadius} overflow-hidden border border-black/5 bg-white/40`}>
            {block.imageUrl ? (
              <img
                src={block.imageUrl}
                alt={block.title || 'Imagem'}
                className="w-full h-40 object-cover"
              />
            ) : (
              <div className="h-32 flex flex-col items-center justify-center gap-1">
                <ImageIcon className="w-6 h-6 text-gray-400" />
                <span className={`text-[11px] ${muted}`}>Imagem do bloco</span>
              </div>
            )}
          </div>
        );
      }
      case 'video': {
        const thumbnail =
          block.thumbnailUrl || (block.videoUrl ? getYouTubeThumbnail(block.videoUrl) : null);
        const videoCard = (
          <div className={`${buttonRadius} overflow-hidden border border-black/5 relative`}>
            {thumbnail ? (
              <div className="relative">
                <img
                  src={thumbnail}
                  alt={block.title || 'Vídeo'}
                  className="w-full h-32 object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center">
                  <span className="w-11 h-11 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                    <Play aria-hidden="true" className="w-5 h-5 text-[#131b2e] ml-0.5" />
                  </span>
                </span>
                <span
                  className={`absolute bottom-2 left-3 text-[11px] px-2 py-0.5 rounded bg-black/50 ${effectiveDark ? 'text-gray-200' : 'text-white'}`}
                >
                  {block.title || 'Vídeo'}
                </span>
              </div>
            ) : (
              <>
                <div className="h-24 bg-black/70 flex items-center justify-center">
                  <span className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                    <Play aria-hidden="true" className="w-4 h-4 text-[#131b2e] ml-0.5" />
                  </span>
                </div>
                <span
                  className={`absolute bottom-2 left-3 text-[11px] ${effectiveDark ? 'text-gray-300' : 'text-gray-200'}`}
                >
                  {block.title || 'Vídeo'}
                </span>
              </>
            )}
          </div>
        );
        const videoUrl = interactive ? getSafeExternalUrl(block.videoUrl) : null;
        return videoUrl ? (
          <a
            href={videoUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            onClick={() => onInteractiveClick?.(block)}
          >
            {videoCard}
          </a>
        ) : (
          videoCard
        );
      }
      case 'agendamento': {
        const currency = (value: number) =>
          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const configuredServices = bookingAvailability
          ? Array.from(
              new Map(
                bookingAvailability.map((item) => [
                  item.service_id,
                  {
                    name: item.service_name,
                    price: item.service_price,
                    duration: item.service_duration,
                  },
                ]),
              ).values(),
            )
          : [];
        const configuredDays = Array.from(
          new Set(bookingAvailability?.map((item) => item.day_of_week) || []),
        ).sort((left, right) => left - right);
        const configuredService =
          configuredServices.length === 1 ? configuredServices[0] : undefined;
        const serviceName = configuredService?.name;
        const servicePrice = configuredService?.price;
        const serviceDuration = configuredService?.duration;
        const shouldShowPrice = block.showPrice ?? Boolean(configuredService);
        const shouldShowDuration = block.showDuration ?? Boolean(configuredService);
        return (
          <div className={`${cardCls} space-y-1.5`} style={cardStyle}>
            <div className="flex min-w-0 items-center gap-2">
              <Calendar aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
              <span className={`min-w-0 break-words font-bold text-sm ${titleStrong}`}>
                {block.appointmentTitle || block.title || 'Agende seu horário'}
              </span>
            </div>
            {block.appointmentDescription && (
              <p
                className={`text-xs ${textSizeClass.value === 'text-base' ? 'text-sm' : 'text-xs'}`}
                style={{ color: secondaryTextColor }}
              >
                {block.appointmentDescription}
              </p>
            )}
            {serviceName && (
              <span
                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-bold"
                style={{ backgroundColor: tokens.accentSoft, color: accent }}
              >
                {serviceName}
              </span>
            )}
            {configuredServices.length > 0 && (
              <span className={`block text-[11px] ${muted}`}>
                {configuredServices.length === 1
                  ? '1 serviço disponível'
                  : `${configuredServices.length} serviços disponíveis`}
              </span>
            )}
            {configuredDays.length > 0 && (
              <span className={`block text-[11px] ${muted}`}>
                Dias: {configuredDays.map((day) => BOOKING_DAY_LABELS[day]).join(', ')}
              </span>
            )}
            {(shouldShowPrice || shouldShowDuration) &&
              (servicePrice !== undefined || serviceDuration) && (
                <div className="flex items-center gap-2.5 pt-1">
                  {shouldShowPrice && servicePrice !== undefined && (
                    <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
                      <Tag aria-hidden="true" className="w-3 h-3" /> {currency(servicePrice)}
                    </span>
                  )}
                  {shouldShowDuration && serviceDuration && (
                    <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
                      <Clock aria-hidden="true" className="w-3 h-3" /> {serviceDuration} min
                    </span>
                  )}
                </div>
              )}
            <button
              type="button"
              className={`w-full py-2.5 text-xs font-bold ${buttonRadius} ${animation}`}
              style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
              onClick={() => interactive && onInteractiveClick?.(block)}
            >
              {block.content || 'Ver agenda e horários'}
            </button>
          </div>
        );
      }
      case 'produto': {
        const currency = (value: number) =>
          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const hasCatalog = block.products && block.products.length > 0;

        if (hasCatalog) {
          return (
            <div className={cardCls} style={cardStyle}>
              <div className="flex items-center gap-2 mb-2.5">
                <span
                  className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: tokens.accentSoft }}
                >
                  <ShoppingBag
                    aria-hidden="true"
                    className="w-3.5 h-3.5"
                    style={{ color: accent }}
                  />
                </span>
                <span className={`font-bold text-sm ${titleStrong}`}>
                  {block.title || 'Meus produtos'}
                </span>
              </div>
              <div
                className={`grid gap-2 ${block.products!.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}
              >
                {block.products!.map((product) => (
                  <div
                    key={product.id}
                    className={`${cardInnerCls} rounded-xl overflow-hidden flex flex-col`}
                    style={cardInnerStyle}
                  >
                    <div
                      className={`h-[84px] ${effectiveDark ? 'bg-white/5' : 'bg-gray-100'} flex items-center justify-center overflow-hidden`}
                    >
                      {product.imageUrl ? (
                        <img
                          src={product.imageUrl}
                          alt={product.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="flex flex-col items-center gap-0.5">
                          <ShoppingBag aria-hidden="true" className="w-4 h-4 text-gray-500" />
                          <span className={`text-[9px] ${muted}`}>Sem imagem</span>
                        </span>
                      )}
                    </div>
                    <div className="p-2 flex-1 flex flex-col">
                      <p
                        className={`text-[11px] font-bold leading-tight line-clamp-2 ${titleStrong}`}
                      >
                        {product.name || 'Produto'}
                      </p>
                      <p className="text-[11px] font-black mt-0.5" style={{ color: accent }}>
                        {typeof product.price === 'number' ? currency(product.price) : 'Consultar'}
                      </p>
                      {product.description && (
                        <p className={`mt-1 line-clamp-2 text-[10px] leading-tight ${muted}`}>
                          {product.description}
                        </p>
                      )}
                      {getSafeExternalUrl(product.link) ? (
                        <a
                          href={getSafeExternalUrl(product.link) || undefined}
                          rel="noopener noreferrer"
                          target="_blank"
                          onClick={() => onInteractiveClick?.(block)}
                          className={`block w-full mt-1.5 py-1.5 text-[10px] font-bold text-center ${buttonRadius} ${animation}`}
                          style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
                        >
                          {product.purchaseType === 'whatsapp' ? 'Falar no WhatsApp' : 'Comprar'}
                        </a>
                      ) : (
                        <button
                          type="button"
                          onClick={() => interactive && onInteractiveClick?.(block)}
                          className={`block w-full mt-1.5 py-1.5 text-[10px] font-bold text-center ${buttonRadius} ${animation}`}
                          style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
                        >
                          {product.purchaseType === 'whatsapp' ? 'Falar no WhatsApp' : 'Comprar'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className={cardCls} style={cardStyle}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-[11px] uppercase tracking-wide ${muted}`}>Produto</span>
                <p className={`font-bold text-sm ${titleStrong}`}>
                  {block.productName || block.title || 'Produto'}
                </p>
              </div>
              {typeof block.productPrice === 'number' && (
                <span className="text-sm font-black" style={{ color: accent }}>
                  {block.productPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              )}
            </div>
            {interactive && getSafeExternalUrl(block.url) ? (
              <a
                href={getSafeExternalUrl(block.url) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`block w-full mt-2.5 py-2.5 text-xs font-bold text-center ${buttonRadius} ${animation}`}
                style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
                onClick={() => onInteractiveClick?.(block)}
              >
                Comprar
              </a>
            ) : (
              <button
                type="button"
                className={`w-full mt-2.5 py-2.5 text-xs font-bold ${buttonRadius} ${animation}`}
                style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
                onClick={() => interactive && onInteractiveClick?.(block)}
              >
                Comprar
              </button>
            )}
          </div>
        );
      }
      case 'social': {
        const links =
          block.socialLinks
            ?.map((link) => ({ ...link, safeUrl: getSafeExternalUrl(link.url) }))
            .filter((link) => link.safeUrl) || [];
        if (links.length === 0) {
          return (
            <div className="flex items-center justify-center gap-3 py-1">
              {SOCIAL_LINK_ICONS.map(({ platform, icon: Icon }) => (
                <span
                  key={platform}
                  className={`w-10 h-10 rounded-full border flex items-center justify-center ${effectiveDark ? 'bg-white/10 text-gray-300' : 'bg-white/95'}`}
                  style={{ borderColor: tokens.cardBorder, color: textColor }}
                  aria-label={platform}
                >
                  <Icon className="w-4 h-4" />
                </span>
              ))}
            </div>
          );
        }
        return (
          <div className="flex flex-wrap items-center justify-center gap-3 py-1">
            {links.map((link) => {
              const meta = SOCIAL_LINK_ICONS.find((s) => s.platform === link.platform);
              const Icon = meta?.icon || Link2;
              return (
                <a
                  key={link.id}
                  href={link.safeUrl || undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full ${effectiveDark ? 'bg-white/10' : 'bg-white/95'} border flex items-center justify-center shadow-sm ${animation}`}
                  style={{ ...fxVars('#ffffff'), borderColor: tokens.cardBorder, color: textColor }}
                  title={PLATFORM_LABEL_PREVIEW[link.platform] || link.platform}
                  onClick={() => onInteractiveClick?.(block)}
                >
                  <Icon className={`w-4 h-4 ${titleStrong}`} />
                </a>
              );
            })}
          </div>
        );
      }
      case 'contact': {
        const whatsapp = block.contact?.whatsapp?.trim();
        const email = block.contact?.email?.trim();
        if (block.contact?.captureEnabled && interactive && onLeadCapture) {
          const captureForm = captureForms[block.id] || {
            name: '',
            email: '',
            phone: '',
            consent: false,
          };
          const state = captureState[block.id] || 'idle';
          return (
            <div className={`${cardCls} space-y-3`} style={{ ...cardStyle, ...fxVars('#ffffff') }}>
              <div>
                <p className={`text-sm font-extrabold ${titleStrong}`}>
                  {block.contact.captureTitle || block.title || 'Receba novidades'}
                </p>
                <p className={`mt-1 text-[11px] ${muted}`}>
                  Preencha seus dados para receber contato.
                </p>
              </div>
              {state === 'success' ? (
                <p className="rounded-xl bg-[#e7f8f2] px-3 py-2 text-xs font-bold text-[#047857]">
                  Lead criado. Obrigado pelo interesse!
                </p>
              ) : (
                <form
                  className="space-y-2"
                  onSubmit={async (event) => {
                    event.preventDefault();
                    setCaptureState((current) => ({ ...current, [block.id]: 'submitting' }));
                    const result = await onLeadCapture(block, captureForm);
                    const success = typeof result === 'boolean' ? result : result.success;
                    const errorMessage = typeof result === 'boolean' ? '' : result.error || '';
                    setCaptureErrors((current) => ({ ...current, [block.id]: errorMessage }));
                    setCaptureState((current) => ({
                      ...current,
                      [block.id]: success ? 'success' : 'error',
                    }));
                  }}
                >
                  <input
                    required
                    value={captureForm.name}
                    onChange={(event) =>
                      setCaptureForms((current) => ({
                        ...current,
                        [block.id]: { ...captureForm, name: event.target.value },
                      }))
                    }
                    placeholder="Nome"
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs outline-none"
                  />
                  <input
                    required
                    type="email"
                    value={captureForm.email}
                    onChange={(event) =>
                      setCaptureForms((current) => ({
                        ...current,
                        [block.id]: { ...captureForm, email: event.target.value },
                      }))
                    }
                    placeholder="E-mail"
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs outline-none"
                  />
                  <input
                    value={captureForm.phone}
                    onChange={(event) =>
                      setCaptureForms((current) => ({
                        ...current,
                        [block.id]: { ...captureForm, phone: event.target.value },
                      }))
                    }
                    placeholder="WhatsApp"
                    className="w-full rounded-xl border border-black/10 bg-white/80 px-3 py-2 text-xs outline-none"
                  />
                  <label className={`flex items-start gap-2 text-[10px] ${muted}`}>
                    <input
                      required
                      type="checkbox"
                      checked={captureForm.consent}
                      onChange={(event) =>
                        setCaptureForms((current) => ({
                          ...current,
                          [block.id]: { ...captureForm, consent: event.target.checked },
                        }))
                      }
                      className="mt-0.5 accent-[#FF7A00]"
                    />
                    <span>
                      {block.contact.captureConsentText ||
                        'Aceito receber contato sobre esta oferta.'}
                    </span>
                  </label>
                  <button
                    type="submit"
                    disabled={state === 'submitting'}
                    className={`${getButtonStyle().className} w-full text-center disabled:opacity-60`}
                    style={getButtonStyle().style}
                  >
                    {state === 'submitting'
                      ? 'Enviando...'
                      : block.contact.captureButtonLabel || 'Quero receber'}
                  </button>
                  {state === 'error' && (
                    <p className="text-[10px] font-semibold text-red-600">
                      {captureErrors[block.id] || 'Não foi possível enviar. Tente novamente.'}
                    </p>
                  )}
                </form>
              )}
            </div>
          );
        }
        if (whatsapp || email) {
          return (
            <div className="grid min-w-0 grid-cols-1 gap-2 sm:grid-cols-2">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`min-w-0 max-w-full px-4 py-3 shadow-sm border ${effectiveDark ? 'bg-white/10' : 'bg-white/95'} font-bold text-sm flex items-center justify-center gap-2 ${buttonRadius} ${animation}`}
                  style={{ ...fxVars('#ffffff'), ...cardStyle, color: textColor }}
                  onClick={() => onInteractiveClick?.(block)}
                >
                  <MessageCircle aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
                  WhatsApp
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className={`min-w-0 max-w-full px-4 py-3 shadow-sm border ${effectiveDark ? 'bg-white/10' : 'bg-white/95'} font-bold text-sm flex items-center justify-center gap-2 ${buttonRadius} ${animation}`}
                  style={{ ...fxVars('#ffffff'), ...cardStyle, color: textColor }}
                  onClick={() => onInteractiveClick?.(block)}
                >
                  <Mail aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
                  E-mail
                </a>
              )}
            </div>
          );
        }
        return renderBlockButton(
          <span className="flex min-w-0 w-full items-center justify-center gap-2.5">
            <Mail aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
            <span className="min-w-0 break-words text-center">
              {block.content || block.title || 'Entre em contato'}
            </span>
          </span>,
          undefined,
          block,
        );
      }
      case 'music': {
        const provider =
          block.musicProvider ||
          (block.url?.includes('open.spotify.com')
            ? 'spotify'
            : block.url?.includes('youtube.com') || block.url?.includes('youtu.be')
              ? 'youtube'
              : 'outro');
        const musicCard = (
          <div
            className={`${cardCls} flex items-center gap-3 ${animation}`}
            style={{ ...cardStyle, ...fxVars('#ffffff') }}
          >
            <span
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: tokens.accentSoft }}
            >
              <Music aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`break-words font-bold text-sm line-clamp-2 ${titleStrong}`}>
                {block.title || 'Música'}
              </p>
              <p className={`text-[11px] ${muted}`}>{block.content || 'Ouça agora'}</p>
            </div>
            {provider !== 'outro' && (
              <span
                className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide ${
                  provider === 'spotify' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'
                }`}
              >
                {provider}
              </span>
            )}
            <span
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: accent }}
            >
              <Play
                aria-hidden="true"
                className="w-3.5 h-3.5 ml-0.5"
                style={{ color: accentText }}
              />
            </span>
          </div>
        );
        const musicUrl = interactive ? getSafeExternalUrl(block.url) : null;
        return musicUrl ? (
          <a
            href={musicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block"
            onClick={() => onInteractiveClick?.(block)}
          >
            {musicCard}
          </a>
        ) : (
          musicCard
        );
      }
      case 'location':
        return (
          <div className={cardCls} style={cardStyle}>
            <div className="flex min-w-0 items-center gap-2">
              <MapPin aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
              <span className={`min-w-0 break-words font-bold text-sm ${titleStrong}`}>
                {block.title || 'Localização'}
              </span>
            </div>
            {block.address && (
              <p className="mt-1 break-words text-xs" style={{ color: secondaryTextColor }}>
                {block.address}
              </p>
            )}
            {block.mapUrl && getSafeExternalUrl(block.mapUrl) ? (
              <a
                href={getSafeExternalUrl(block.mapUrl) || undefined}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full mt-2.5 py-2 text-xs font-bold ${buttonRadius} ${animation}`}
                style={{ ...fxVars(accent), backgroundColor: accent, color: accentText }}
                onClick={() => onInteractiveClick?.(block)}
              >
                Ver no mapa
              </a>
            ) : (
              <p className={`text-[11px] mt-2 ${muted}`}>Adicione o endereço na configuração</p>
            )}
          </div>
        );
      default:
        return renderBlockButton(
          <span className="flex min-w-0 w-full items-center gap-2.5">
            <Link2 aria-hidden="true" className="w-4 h-4" style={{ color: accent }} />
            <span className="min-w-0 flex-1 break-words text-left line-clamp-2">
              {block.title || block.content || 'Bloco'}
            </span>
          </span>,
          block.url,
          block,
        );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`mx-auto w-full min-w-0 ${device === 'mobile' ? 'max-w-[320px]' : 'max-w-full'} rounded-3xl overflow-x-clip shadow-2xl border border-black/10`}
        style={{ ...backgroundStyle, fontFamily, color: textColor }}
      >
        {/* Profile header */}
        {profile.coverUrl ? (
          <div
            className="relative flex flex-col items-center justify-center text-center px-5 overflow-hidden"
            style={{ minHeight: coverHeight, paddingTop: 32, paddingBottom: 24 }}
          >
            {/* Capa como fundo */}
            <div className="absolute inset-0">
              <img src={profile.coverUrl} alt="Capa" className="w-full h-full object-cover" />
              <div className="absolute inset-0" style={{ background: coverLegibility }} />
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background: coverMelt,
                  WebkitMaskImage: coverFadeMask,
                  maskImage: coverFadeMask,
                }}
              />
            </div>
            {/* Conteúdo por cima da capa */}
            <div className="relative z-10 flex min-w-0 w-full flex-col items-center">
              <div
                className="w-20 h-20 mb-3 rounded-full p-1 shadow-lg ring-2 ring-white/25"
                style={{ background: `linear-gradient(135deg, ${accent}, ${tokens.accentSoft})` }}
              >
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full bg-white"
                />
              </div>
              <h1
                className="max-w-full break-words font-bold text-lg tracking-tight text-white"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
              >
                {profile.pageTitle || profile.name}
              </h1>
              <span
                className="text-xs font-semibold text-[#FFC99B]"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}
              >
                @{profile.username}
              </span>

              {profile.bioDescription && (
                <p
                  className={`mt-2 max-w-full break-words leading-relaxed ${textSizeClass.value} text-white/90`}
                  style={{ textShadow: '0 1px 8px rgba(0,0,0,0.45)' }}
                >
                  {profile.bioDescription}
                </p>
              )}

              {(profile.category || profile.location) && (
                <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 text-[11px]">
                  {profile.category && (
                    <span className="px-2.5 py-1 rounded-full bg-white/15 border border-white/25 text-white font-medium backdrop-blur-sm">
                      {profile.category}
                    </span>
                  )}
                  {profile.location && (
                    <span className="px-2.5 py-1 rounded-full bg-black/25 border border-white/25 text-white font-medium backdrop-blur-sm">
                      {profile.location}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="relative min-w-0 px-5 pb-5 pt-8 text-center">
            <div
              className="w-20 h-20 mx-auto rounded-full p-1 mb-3"
              style={{ background: `linear-gradient(135deg, ${accent}, ${tokens.accentSoft})` }}
            >
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <h1
              className="max-w-full break-words font-bold text-lg tracking-tight"
              style={{ color: textColor }}
            >
              {profile.pageTitle || profile.name}
            </h1>
            <span className="text-xs font-semibold" style={{ color: accent }}>
              @{profile.username}
            </span>

            {profile.bioDescription && (
              <p
                className={`mt-2 max-w-full break-words leading-relaxed ${textSizeClass.value}`}
                style={{ color: secondaryTextColor }}
              >
                {profile.bioDescription}
              </p>
            )}

            {(profile.category || profile.location) && (
              <div className="flex flex-wrap items-center justify-center gap-2 mt-2.5 text-[11px]">
                {profile.category && (
                  <span
                    className={`px-2.5 py-1 rounded-full border font-medium ${effectiveDark ? 'bg-white/15 border-white/20 text-gray-200' : 'bg-white/80 border-black/5 text-gray-600'}`}
                  >
                    {profile.category}
                  </span>
                )}
                {profile.location && (
                  <span
                    className={`px-2.5 py-1 rounded-full border border-black/10 font-medium ${effectiveDark ? 'bg-white/15 text-gray-200' : 'bg-gray-100 text-gray-600'}`}
                  >
                    {profile.location}
                  </span>
                )}
              </div>
            )}
          </div>
        )}

        {/* Blocks */}
        <div className="min-w-0 px-4 pb-6 space-y-2.5">
          {blocks.length === 0 ? (
            <div
              className={`${buttonRadius} border-2 border-dashed ${effectiveDark ? 'border-white/20' : 'border-gray-300'} p-4 text-center`}
            >
              <p className={`text-xs font-semibold ${muted}`}>Nenhum bloco adicionado</p>
              <p className={`text-[10px] mt-0.5 ${muted}`}>
                Adicione blocos no editor para vê-los aqui.
              </p>
            </div>
          ) : (
            blocks
              .filter((b) => b.active !== false)
              .sort((a, b) => a.order - b.order)
              .map((block, index) => (
                <motion.div
                  key={block.id}
                  initial={theme.animationsEnabled ? cardMotion.initial : undefined}
                  animate={theme.animationsEnabled ? cardMotion.animate : undefined}
                  transition={
                    cardMotion.spring
                      ? {
                          type: 'spring',
                          bounce: 0.4,
                          duration: animDuration * 1.2,
                          delay: index * 0.06,
                        }
                      : { duration: animDuration, delay: index * 0.06 }
                  }
                >
                  {renderBlock(block)}
                </motion.div>
              ))
          )}
        </div>

        {/* Footer */}
        <div className="pb-5 flex flex-col items-center gap-1.5">
          {profile.customLink && (
            <span className="flex max-w-full items-center gap-1 text-[10px] text-gray-500">
              <Globe aria-hidden="true" className="w-3 h-3" />
              <span className="max-w-[200px] break-words text-center">{profile.customLink}</span>
            </span>
          )}
          <span className={`flex items-center gap-1 text-[10px] ${muted}`}>
            <PawPrint aria-hidden="true" className="w-3 h-3" />
            <span className="font-semibold">PandaBio</span>
          </span>
        </div>
      </div>
    </MotionConfig>
  );
};
