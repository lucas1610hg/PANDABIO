/**
 * Design Tokens do PandaBio
 * Centraliza cores, espaçamentos e outros valores de design
 * Elimina strings mágicas e facilita manutenção
 */

export const colors = {
  primary: {
    orange: '#FF7A00',
    orangeDark: '#FF5500',
    orangeLight: '#FFF3E6',
    orangeMedium: '#e56e00',
  },
  secondary: {
    blue: '#3525cd',
    blueLight: '#dae2fd',
    blueDark: '#131b2e',
    green: '#10B981',
    greenLight: '#E6F8F3',
    greenDark: '#006e4b',
    teal: '#0284C7',
    tealLight: '#E0F2FE',
  },
  neutral: {
    dark: '#131b2e',
    gray: '#464555',
    grayLight: '#777587',
    grayMedium: '#969cb0',
    light: '#f2f3ff',
    lighter: '#eaedff',
    background: '#F6EFE9',
    white: '#ffffff',
  },
  functional: {
    success: '#10B981',
    error: '#ef4444',
    warning: '#F59E0B',
    info: '#3B82F6',
  },
  sidebar: {
    dark: '#0c0e14',
    border: '#1c1e28',
    divider: '#1d202d',
  },
};

export const spacing = {
  xs: '0.25rem', // 4px
  sm: '0.5rem', // 8px
  md: '1rem', // 16px
  lg: '1.5rem', // 24px
  xl: '2rem', // 32px
  '2xl': '3rem', // 48px
  '3xl': '4rem', // 64px
};

export const borderRadius = {
  sm: '0.375rem', // 6px
  md: '0.5rem', // 8px
  lg: '0.75rem', // 12px
  xl: '1rem', // 16px
  '2xl': '1.5rem', // 24px
  '3xl': '2rem', // 32px
  full: '9999px',
};

export const fontSize = {
  xs: '0.75rem', // 12px
  sm: '0.875rem', // 14px
  base: '1rem', // 16px
  lg: '1.125rem', // 18px
  xl: '1.25rem', // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.875rem', // 30px
  '4xl': '2.25rem', // 36px
};

export const fontWeight = {
  normal: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
  extrabold: '800',
  black: '900',
};

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
};

export const transitions = {
  fast: '150ms',
  base: '200ms',
  slow: '300ms',
  slower: '500ms',
};

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  fixed: 30,
  modal: 40,
  popover: 50,
  tooltip: 60,
};
