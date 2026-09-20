import React, { useMemo, useEffect } from 'react';
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
import { UserProfile, PageBlock, PageTheme, SocialPlatform } from '../types';
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

export type PreviewDevice = 'mobile' | 'desktop';

interface PagePreviewProps {
  profile: UserProfile;
  theme: PageTheme;
  blocks: PageBlock[];
  device: PreviewDevice;
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

export const PagePreview: React.FC<PagePreviewProps> = ({ profile, theme, blocks, device }) => {
  useEffect(() => {
    loadGoogleFont(theme.fontFamily);
  }, [theme.fontFamily]);

  const effectiveDark = useMemo(() => {
    if (theme.theme === 'dark') return true;
    if (theme.theme === 'light') return false;
    return (
      typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches
    );
  }, [theme.theme]);

  const fontFamily = FONT_CSS[theme.fontFamily] || `'${theme.fontFamily}', sans-serif`;

  const backgroundStyle = useMemo(() => {
    const gradientFrom =
      theme.customGradientFrom || theme.backgroundColorGradient?.from || '#FF7A00';
    const gradientTo = theme.customGradientTo || theme.backgroundColorGradient?.to || '#FF2E63';
    const angle = theme.backgroundColorGradient?.angle || 135;

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
      return theme.backgroundImage
        ? {
            backgroundImage: `url(${theme.backgroundImage})`,
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
    if (theme.backgroundType === 'image' && theme.backgroundImage) {
      return `url(${theme.backgroundImage}) center / cover no-repeat`;
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

  const textColor = effectiveDark ? theme.textColorDark || '#ffffff' : theme.textColor || '#131b2e';
  const secondaryTextColor = effectiveDark ? '#d1d5db' : '#464555';
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
  const cardCls = `${effectiveDark ? 'bg-white/10 border-white/10' : 'bg-white/95 border-black/5'} p-3.5 shadow-sm ${buttonRadius}`;
  const cardInnerCls = `${effectiveDark ? 'bg-white/10 border-white/10' : 'bg-white border-black/5'}`;
  const titleStrong = effectiveDark ? 'text-white' : 'text-[#131b2e]';

  const anim = ANIMATION_CLASS[theme.animationEffect || 'slideUp'] || '';
  const animation = theme.animationsEnabled ? anim : '';

  const accent = theme.customButtonColor || '#FF5E00';
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

  const getButtonStyle = (): { className: string; style?: React.CSSProperties } => {
    const base = `w-full font-bold ${buttonSize.padding} ${buttonSize.text} ${buttonRadius} ${animation} ${theme.buttonGlow ? 'pb-button-glow' : ''}`;
    const color = theme.customButtonColor;
    const text = theme.customButtonTextColor || '#ffffff';
    const shadowClass = theme.buttonShadow === false ? 'shadow-none' : 'shadow-sm';
    switch (buttonVariant) {
      case 'outline':
        return {
          className: `${base} ${shadowClass} border-2 ${color ? '' : effectiveDark ? 'border-white/70' : 'border-[#131b2e]'}`,
          style: {
            ...fxVars(),
            backgroundColor: 'transparent',
            borderColor: color || undefined,
            color: effectiveDark ? '#ffffff' : color || '#131b2e',
          },
        };
      case 'soft':
        return {
          className: `${base} ${shadowClass}`,
          style: {
            ...fxVars(),
            backgroundColor: color ? `${color}26` : '#f2f3ff',
            color: effectiveDark ? '#ffffff' : color || '#131b2e',
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

  const renderBlockButton = (children: React.ReactNode) => {
    const { className, style } = getButtonStyle();
    return (
      <button type="button" className={`${className} text-center`} style={style}>
        {children}
      </button>
    );
  };

  const renderBlock = (block: PageBlock) => {
    switch (block.type) {
      case 'link': {
        const iconMap = {
          social: Camera,
          whatsapp: MessageCircle,
          portfolio: Layers,
          store: ShoppingBag,
          custom: ExternalLink,
        } as const;
        const Icon = iconMap[(block.icon || 'custom') as keyof typeof iconMap] || ExternalLink;
        return renderBlockButton(
          <span className="flex items-center gap-2.5">
            <span className="p-1 rounded-lg bg-[#f2f3ff] shrink-0">
              <Icon className="w-4 h-4 text-[#3525cd]" />
            </span>
            <span className="truncate">{block.title || block.content || 'Meu link'}</span>
            <ExternalLink className="w-3 h-3 opacity-40 ml-auto shrink-0" />
          </span>,
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
        return (
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
                    <Play className="w-5 h-5 text-[#131b2e] ml-0.5" />
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
                    <Play className="w-4 h-4 text-[#131b2e] ml-0.5" />
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
      }
      case 'agendamento': {
        const currency = (value: number) =>
          value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        return (
          <div className={`${cardCls} space-y-1.5`}>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#FF7A00]" />
              <span className={`font-bold text-sm ${titleStrong}`}>
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
            {block.service && (
              <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-[#FF7A00]/15 text-[#FF7A00] font-bold">
                {block.service}
              </span>
            )}
            {(block.showPrice || block.showDuration) &&
              (block.price !== undefined || block.duration) && (
                <div className="flex items-center gap-2.5 pt-1">
                  {block.showPrice && block.price !== undefined && (
                    <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
                      <Tag className="w-3 h-3" /> {currency(block.price)}
                    </span>
                  )}
                  {block.showDuration && block.duration && (
                    <span className={`flex items-center gap-1 text-[11px] ${muted}`}>
                      <Clock className="w-3 h-3" /> {block.duration} min
                    </span>
                  )}
                </div>
              )}
            <button
              type="button"
              className={`w-full py-2.5 bg-[#FF7A00] text-white text-xs font-bold ${buttonRadius} ${animation}`}
              style={fxVars('#FF7A00')}
            >
              {block.content || 'Agendar agora'}
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
            <div className={cardCls}>
              <div className="flex items-center gap-2 mb-2.5">
                <span className="w-7 h-7 rounded-lg bg-[#FF7A00]/15 flex items-center justify-center shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5 text-[#FF7A00]" />
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
                          <ShoppingBag className="w-4 h-4 text-gray-400" />
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
                      <p className="text-[11px] font-black text-[#FF7A00] mt-0.5">
                        {typeof product.price === 'number' ? currency(product.price) : 'Consultar'}
                      </p>
                      <a
                        href={product.link || '#'}
                        rel="noopener noreferrer"
                        target={product.link ? '_blank' : undefined}
                        className={`block w-full mt-1.5 py-1.5 bg-[#131b2e] text-white text-[10px] font-bold text-center ${buttonRadius} ${animation}`}
                        style={fxVars('#131b2e')}
                      >
                        Comprar
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div className={cardCls}>
            <div className="flex items-start justify-between gap-2">
              <div>
                <span className={`text-[11px] uppercase tracking-wide ${muted}`}>Produto</span>
                <p className={`font-bold text-sm ${titleStrong}`}>
                  {block.productName || block.title || 'Produto'}
                </p>
              </div>
              {typeof block.productPrice === 'number' && (
                <span className="text-sm font-black text-[#FF7A00]">
                  {block.productPrice.toLocaleString('pt-BR', {
                    style: 'currency',
                    currency: 'BRL',
                  })}
                </span>
              )}
            </div>
            <button
              type="button"
              className={`w-full mt-2.5 py-2.5 bg-[#131b2e] text-white text-xs font-bold ${buttonRadius} ${animation}`}
              style={fxVars('#131b2e')}
            >
              Comprar
            </button>
          </div>
        );
      }
      case 'social': {
        const links = block.socialLinks?.filter((l) => l.url && l.url.trim()) || [];
        if (links.length === 0) {
          return (
            <div className="flex items-center justify-center gap-3 py-1">
              {SOCIAL_LINK_ICONS.map(({ platform, icon: Icon }) => (
                <span
                  key={platform}
                  className={`w-10 h-10 rounded-full border border-black/5 flex items-center justify-center ${effectiveDark ? 'bg-white/10 text-gray-300' : 'bg-white/95 text-[#131b2e]'}`}
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
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`w-10 h-10 rounded-full ${effectiveDark ? 'bg-white/10 border-white/10' : 'bg-white/95 border-black/5'} border flex items-center justify-center shadow-sm ${animation}`}
                  style={fxVars('#ffffff')}
                  title={PLATFORM_LABEL_PREVIEW[link.platform] || link.platform}
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
        if (whatsapp || email) {
          return (
            <div className="flex gap-2">
              {whatsapp && (
                <a
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex-1 px-4 py-3 shadow-sm border ${effectiveDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/95 border-black/5 text-[#131b2e]'} font-bold text-sm flex items-center justify-center gap-2 ${buttonRadius} ${animation}`}
                  style={fxVars('#ffffff')}
                >
                  <MessageCircle className="w-4 h-4 text-[#FF7A00]" />
                  WhatsApp
                </a>
              )}
              {email && (
                <a
                  href={`mailto:${email}`}
                  className={`flex-1 px-4 py-3 shadow-sm border ${effectiveDark ? 'bg-white/10 border-white/10 text-white' : 'bg-white/95 border-black/5 text-[#131b2e]'} font-bold text-sm flex items-center justify-center gap-2 ${buttonRadius} ${animation}`}
                  style={fxVars('#ffffff')}
                >
                  <Mail className="w-4 h-4 text-[#FF7A00]" />
                  E-mail
                </a>
              )}
            </div>
          );
        }
        return renderBlockButton(
          <span className="flex items-center gap-2.5 justify-center">
            <Mail className="w-4 h-4 text-[#FF7A00]" />
            {block.content || block.title || 'Entre em contato'}
          </span>,
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
        return (
          <div
            className={`${cardCls} flex items-center gap-3 ${animation}`}
            style={fxVars('#ffffff')}
          >
            <span className="w-9 h-9 rounded-lg bg-[#FF7A00]/15 flex items-center justify-center shrink-0">
              <Music className="w-4 h-4 text-[#FF7A00]" />
            </span>
            <div className="flex-1 min-w-0">
              <p className={`font-bold text-sm truncate ${titleStrong}`}>
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
            <span className="w-8 h-8 rounded-full bg-[#FF7A00] flex items-center justify-center shrink-0">
              <Play className="w-3.5 h-3.5 text-white ml-0.5" />
            </span>
          </div>
        );
      }
      case 'location':
        return (
          <div className={cardCls}>
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#FF7A00]" />
              <span className={`font-bold text-sm ${titleStrong}`}>
                {block.title || 'Localização'}
              </span>
            </div>
            {block.address && (
              <p className="text-xs mt-1" style={{ color: secondaryTextColor }}>
                {block.address}
              </p>
            )}
            {block.mapUrl ? (
              <button
                type="button"
                className={`w-full mt-2.5 py-2 bg-[#131b2e] text-white text-xs font-bold ${buttonRadius} ${animation}`}
                style={fxVars('#131b2e')}
              >
                Ver no mapa
              </button>
            ) : (
              <p className={`text-[11px] mt-2 ${muted}`}>Adicione o endereço na configuração</p>
            )}
          </div>
        );
      default:
        return renderBlockButton(
          <span className="flex items-center gap-2.5">
            <Link2 className="w-4 h-4 text-[#3525cd]" />
            {block.title || block.content || 'Bloco'}
          </span>,
        );
    }
  };

  return (
    <MotionConfig reducedMotion="user">
      <div
        className={`mx-auto ${device === 'mobile' ? 'max-w-[320px]' : 'max-w-full'} rounded-3xl overflow-hidden shadow-2xl border border-black/10`}
        style={{ ...backgroundStyle, fontFamily }}
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
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-20 h-20 mb-3 rounded-full p-1 bg-gradient-to-tr from-[#FF7A00] to-[#FF5500] shadow-lg ring-2 ring-white/25">
                <img
                  src={profile.avatarUrl}
                  alt={profile.name}
                  className="w-full h-full object-cover rounded-full bg-white"
                />
              </div>
              <h3
                className="font-bold text-lg tracking-tight text-white"
                style={{ textShadow: '0 1px 10px rgba(0,0,0,0.55)' }}
              >
                {profile.pageTitle || profile.name}
              </h3>
              <span
                className="text-xs font-semibold text-[#FFC99B]"
                style={{ textShadow: '0 1px 8px rgba(0,0,0,0.55)' }}
              >
                @{profile.username}
              </span>

              {profile.bioDescription && (
                <p
                  className={`mt-2 leading-relaxed ${textSizeClass.value} text-white/90`}
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
          <div className="px-5 pt-8 pb-5 text-center relative">
            <div className="w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-[#FF7A00] to-[#FF5500] mb-3">
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="w-full h-full object-cover rounded-full bg-white"
              />
            </div>
            <h3 className="font-bold text-lg tracking-tight" style={{ color: textColor }}>
              {profile.pageTitle || profile.name}
            </h3>
            <span className="text-xs font-semibold text-[#FF7A00]">@{profile.username}</span>

            {profile.bioDescription && (
              <p
                className={`mt-2 leading-relaxed ${textSizeClass.value}`}
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
        <div className="px-4 pb-6 space-y-2.5">
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
            <span className="flex items-center gap-1 text-[10px] text-gray-500">
              <Globe className="w-3 h-3" />
              <span className="truncate max-w-[200px]">{profile.customLink}</span>
            </span>
          )}
          <span className={`flex items-center gap-1 text-[10px] ${muted}`}>
            <PawPrint className="w-3 h-3" />
            <span className="font-semibold">PandaBio</span>
          </span>
        </div>
      </div>
    </MotionConfig>
  );
};
