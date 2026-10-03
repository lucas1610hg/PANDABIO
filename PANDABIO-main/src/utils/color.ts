const HEX_COLOR_PATTERN = /^#(?:[0-9a-f]{3}|[0-9a-f]{6})$/i;

export function isHexColor(value: string | null | undefined): value is string {
  return typeof value === 'string' && HEX_COLOR_PATTERN.test(value.trim());
}

export function normalizeHexColor(value: string | null | undefined, fallback: string): string {
  const candidate = value?.trim();
  if (!candidate || !isHexColor(candidate)) return fallback;

  if (candidate.length === 4) {
    return `#${candidate[1]}${candidate[1]}${candidate[2]}${candidate[2]}${candidate[3]}${candidate[3]}`.toLowerCase();
  }

  return candidate.toLowerCase();
}

export function withAlpha(value: string, alpha: number): string {
  const color = normalizeHexColor(value, '#000000');
  const numericAlpha = Math.max(0, Math.min(1, alpha));
  const numeric = Number.parseInt(color.slice(1), 16);
  const red = (numeric >> 16) & 255;
  const green = (numeric >> 8) & 255;
  const blue = numeric & 255;
  return `rgba(${red}, ${green}, ${blue}, ${numericAlpha})`;
}
