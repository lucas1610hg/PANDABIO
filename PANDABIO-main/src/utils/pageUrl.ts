const LEGACY_PUBLIC_HOSTS = new Set([
  'pandabio.com',
  'www.pandabio.com',
  'panda.bio',
  'www.panda.bio',
]);

const FALLBACK_PUBLIC_ORIGIN = 'https://pandabio-bice.vercel.app';

const normalizeOrigin = (value: string): string => value.replace(/\/+$/, '');

export const getPublicOrigin = (): string => {
  const currentHostname = typeof window !== 'undefined' ? window.location.hostname : '';
  const isLocalHost = /^(localhost|127(?:\.\d{1,3}){3}|0\.0\.0\.0)$/.test(currentHostname);

  if (
    typeof window !== 'undefined' &&
    window.location.origin !== 'null' &&
    !isLocalHost
  ) {
    return normalizeOrigin(window.location.origin);
  }

  const configuredOrigin = import.meta.env.VITE_PUBLIC_APP_URL?.trim();
  return configuredOrigin ? normalizeOrigin(configuredOrigin) : FALLBACK_PUBLIC_ORIGIN;
};

const getBioUrlHost = (value: string): string | null => {
  try {
    const withProtocol = value.startsWith('http') ? value : `https://${value}`;
    return new URL(withProtocol).hostname.toLowerCase();
  } catch {
    return null;
  }
};

const isLegacyPublicHost = (hostname: string | null): boolean =>
  Boolean(
    hostname &&
      (LEGACY_PUBLIC_HOSTS.has(hostname) ||
        (hostname.startsWith('pandabio') && hostname.endsWith('.vercel.app'))),
  );

const getStoredPath = (value: string): string => {
  const withoutProtocol = value.replace(/^https?:\/\//, '');
  return withoutProtocol.split('/').slice(1).filter(Boolean).join('/');
};

export const getPageUrl = (bioUrl?: string, username?: string): string => {
  const normalizedBioUrl = bioUrl?.trim();
  const bioUrlHost = normalizedBioUrl ? getBioUrlHost(normalizedBioUrl) : null;

  if (normalizedBioUrl && (!bioUrlHost || !isLegacyPublicHost(bioUrlHost))) {
    return normalizedBioUrl.startsWith('http')
      ? normalizedBioUrl
      : `https://${normalizedBioUrl}`;
  }

  const slug = username?.trim() || (normalizedBioUrl ? getStoredPath(normalizedBioUrl) : '');
  return `${getPublicOrigin()}/${slug}`;
};
