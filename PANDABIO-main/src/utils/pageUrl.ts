export const getPageUrl = (bioUrl?: string, username?: string): string => {
  if (bioUrl) {
    return bioUrl.startsWith('http') ? bioUrl : `https://${bioUrl}`;
  }
  return `https://pandabio.com/${username || ''}`;
};