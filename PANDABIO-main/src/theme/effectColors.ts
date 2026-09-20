export interface ButtonFxColors {
  ac: string;
  fill: string;
  text: string;
}

function toRgb(hex: string): { r: number; g: number; b: number } | null {
  const m = hex.trim().match(/^#?([0-9a-f]{6})$/i);
  if (!m) return null;
  const v = parseInt(m[1], 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

export function luminanceOf(hex: string): number | null {
  const c = toRgb(hex);
  if (!c) return null;
  return (0.2126 * c.r + 0.7152 * c.g + 0.0722 * c.b) / 255;
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = toRgb(a);
  const cb = toRgb(b);
  if (!ca || !cb) return a;
  const r = Math.round(ca.r + (cb.r - ca.r) * t);
  const g = Math.round(ca.g + (cb.g - ca.g) * t);
  const bl = Math.round(ca.b + (cb.b - ca.b) * t);
  return `#${((r << 16) | (g << 8) | bl).toString(16).padStart(6, '0')}`;
}

export function contrastTextColorFor(fill: string): string {
  const lum = luminanceOf(fill);
  if (lum === null) return '#ffffff';
  return lum > 0.55 ? '#131b2e' : '#ffffff';
}

export function buttonFxColors(bgColor: string | undefined, accent: string): ButtonFxColors {
  const base = accent || '#FF5E00';
  const rgb = bgColor ? toRgb(bgColor) : null;
  if (rgb) {
    const { r, g, b } = rgb;
    const lum = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
    const mx = Math.max(r, g, b);
    const mn = Math.min(r, g, b);
    const sat = (mx - mn) / 255;
    if (sat > 0.35 && lum > 0.35) {
      const fill = lum > 0.45 ? '#131b2e' : mixHex(base, '#ffffff', 0.55);
      return { ac: base, fill, text: contrastTextColorFor(fill) };
    }
    if (lum < 0.3) {
      const fill = mixHex(base, '#ffffff', 0.45);
      return { ac: base, fill, text: contrastTextColorFor(fill) };
    }
  }
  return { ac: base, fill: base, text: contrastTextColorFor(base) };
}