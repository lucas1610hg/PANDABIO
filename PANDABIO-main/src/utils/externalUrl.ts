const ALLOWED_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);
const IMAGE_PROTOCOLS = new Set(['http:', 'https:']);

export const getSafeExternalUrl = (value?: string): string | null => {
  const candidate = value?.trim();
  if (!candidate) return null;

  const normalized = /^[a-z][a-z\d+.-]*:/i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(normalized);
    return ALLOWED_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};

export const getSafeImageUrl = (value?: string): string | null => {
  const candidate = value?.trim();
  if (!candidate) return null;

  const normalized = /^[a-z][a-z\d+.-]*:/i.test(candidate) ? candidate : `https://${candidate}`;

  try {
    const url = new URL(normalized);
    return IMAGE_PROTOCOLS.has(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
};
