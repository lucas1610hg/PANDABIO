import { describe, expect, it } from 'vitest';
import normalizeIp, { isIpv4, isIpv6, detectIpFamily } from '../../utils/normalizeIp';

describe('normalizeIp (LGPD anonimização)', () => {
  it('normaliza IPv4 para /24', () => {
    expect(normalizeIp('203.0.113.45')).toBe('203.0.113.0/24');
  });

  it('normaliza IPv6 para /64', () => {
    expect(normalizeIp('2001:db8:85a3:1234:5678:abcd:1234:5678')).toBe('2001:db8:85a3:1234::/64');
  });

  it('retorna null para null e undefined', () => {
    expect(normalizeIp(null)).toBeNull();
    expect(normalizeIp(undefined)).toBeNull();
  });

  it('retorna null para valores inválidos', () => {
    expect(normalizeIp('')).toBeNull();
    expect(normalizeIp('999.999.999.999')).toBeNull();
    expect(normalizeIp('texto-solto')).toBeNull();
  });

  it('detecta o tipo de IP corretamente', () => {
    expect(isIpv4('8.8.8.8')).toBe(true);
    expect(isIpv6('2001:db8::1')).toBe(true);
    expect(detectIpFamily('8.8.8.8')).toBe('v4');
    expect(detectIpFamily('2001:db8::1')).toBe('v6');
    expect(detectIpFamily('invalido')).toBeNull();
  });

  it('normaliza IPv4 com boa ancoragem (zera o último octeto)', () => {
    expect(normalizeIp('10.1.2.200')).toBe('10.1.2.0/24');
  });
});
