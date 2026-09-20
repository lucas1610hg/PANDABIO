/**
 * Normalização de IP para anonimização LGPD.
 * - IPv4: máscara /24 (ex: 203.0.113.45 → 203.0.113.0/24)
 * - IPv6: máscara /64 (ex: 2001:db8:85a3:1234:5678:abcd:1234:5678 → 2001:db8:85a3:1234::/64)
 * Valor null/undefined/inválido retorna null.
 */

const IPV4_RE = /^(25[0-5]|2[0-4]\d|1?\d?\d)(?:\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/;
const IPV6_RE = /^([\da-fA-F]{0,4}:){2,7}[\da-fA-F]{0,4}$/;

export function isIpv4(ip: string): boolean {
  return IPV4_RE.test(ip.trim());
}

export function isIpv6(ip: string): boolean {
  const trimmed = ip.trim();
  if (!IPV6_RE.test(trimmed)) {
    try {
      return trimmed.includes(':') && trimmed.split(':').length <= 8;
    } catch {
      return false;
    }
  }
  return true;
}

export function detectIpFamily(ip: string): 'v4' | 'v6' | null {
  if (!ip) return null;
  if (isIpv4(ip)) return 'v4';
  if (ip.includes(':') && (ip.split(':').length >= 2)) {
    return 'v6';
  }
  return null;
}

export function normalizeIpV4(ip: string): string {
  const parts = ip.trim().split('.').map(Number);
  if (parts.length !== 4 || parts.some((n) => Number.isNaN(n) || n < 0 || n > 255)) {
    return '0.0.0.0/24';
  }
  parts[3] = 0;
  return `${parts.join('.')}/24`;
}

export function normalizeIpV6(ip: string): string {
  const raw = ip.trim();
  const withoutCidr = raw.includes('/') ? raw.split('/')[0] : raw;
  let groups = withoutCidr.split(':');
  if (groups.length > 8) return '::/64';
  while (groups.length < 8) groups.push('0');
  groups = groups.slice(0, 8).map((g) => (g === '' ? '0' : g));
  return `${groups[0]}:${groups[1]}:${groups[2]}:${groups[3]}::/64`;
}

export function normalizeIp(ip: string | null | undefined): string | null {
  if (ip === null || ip === undefined) return null;
  const family = detectIpFamily(ip);
  if (!family) return null;
  return family === 'v4' ? normalizeIpV4(ip) : normalizeIpV6(ip);
}

export default normalizeIp;
