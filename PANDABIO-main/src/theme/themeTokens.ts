import { PageTheme } from '../types';
import { contrastTextColorFor } from './effectColors';
import { normalizeHexColor, withAlpha } from '../utils/color';

export interface PreviewThemeTokens {
  accent: string;
  accentText: string;
  accentSoft: string;
  text: string;
  secondaryText: string;
  mutedText: string;
  cardBackground: string;
  cardInnerBackground: string;
  cardBorder: string;
}

export function getPreviewThemeTokens(
  theme: PageTheme,
  effectiveDark: boolean,
): PreviewThemeTokens {
  const accent = normalizeHexColor(theme.customButtonColor, '#ff7a00');
  const accentText = normalizeHexColor(theme.customButtonTextColor, contrastTextColorFor(accent));
  const text = normalizeHexColor(
    effectiveDark ? theme.textColorDark : theme.textColor,
    effectiveDark ? '#ffffff' : '#131b2e',
  );

  return {
    accent,
    accentText,
    accentSoft: withAlpha(accent, 0.14),
    text,
    secondaryText: effectiveDark ? '#d1d5db' : '#464555',
    mutedText: effectiveDark ? '#9ca3af' : '#6b7280',
    cardBackground: effectiveDark ? 'rgba(255,255,255,0.10)' : 'rgba(255,255,255,0.95)',
    cardInnerBackground: effectiveDark ? 'rgba(255,255,255,0.10)' : '#ffffff',
    cardBorder: effectiveDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.05)',
  };
}
