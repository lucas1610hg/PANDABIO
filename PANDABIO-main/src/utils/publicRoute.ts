import { normalizeUsername, isValidUsername } from './username';

export const getPublicProfileSlug = (pathname?: string): string | null => {
  const currentPath = pathname ?? (typeof window === 'undefined' ? '/' : window.location.pathname);
  const segments = currentPath.split('/').filter(Boolean);

  if (segments.length !== 1) return null;

  let slug = segments[0];
  try {
    slug = decodeURIComponent(slug);
  } catch {
    return null;
  }

  slug = normalizeUsername(slug);

  if (!isValidUsername(slug)) return null;

  return slug;
};
