const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'dashboard',
  'help',
  'login',
  'pricing',
  'settings',
  'support',
]);

export const normalizeUsername = (value: string): string =>
  value.trim().replace(/^@+/, '').toLowerCase();

export const isValidUsername = (value: string): boolean => {
  const username = normalizeUsername(value);
  return (
    username.length >= 3 &&
    username.length <= 20 &&
    /^[a-z0-9](?:[a-z0-9._-]*[a-z0-9])?$/.test(username) &&
    !RESERVED_USERNAMES.has(username)
  );
};

export const usernameValidationMessage =
  'Username deve ter 3–20 caracteres, usar letras, números, ponto, hífen ou underline, e não pode ser reservado.';
