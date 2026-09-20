const loadedFonts = new Set<string>();

export function loadGoogleFont(family: string): void {
  if (!family || loadedFonts.has(family)) return;
  if (typeof document === 'undefined') return;

  const slug = family.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  if (document.getElementById(`google-font-${slug}`)) return;

  const link = document.createElement('link');
  link.id = `google-font-${slug}`;
  link.rel = 'stylesheet';
  link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(
    family
  )}:wght@300;400;500;600;700;800&display=swap`;
  document.head.appendChild(link);
  loadedFonts.add(family);
}