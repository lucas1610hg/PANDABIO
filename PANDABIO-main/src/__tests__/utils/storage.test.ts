import { describe, expect, it, beforeEach } from 'vitest';
import { safeStorage } from '../../utils/storage';

describe('safeStorage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('grava e lê um objeto no localStorage', () => {
    const payload = { id: '1', nome: 'João', ativo: true };
    expect(safeStorage.set('obj', payload)).toBe(true);
    expect(safeStorage.get<typeof payload>('obj', {} as typeof payload)).toEqual(payload);
  });

  it('retorna defaultValue quando a chave não existe', () => {
    expect(safeStorage.get('chave-inexistente', 'padrão')).toBe('padrão');
    expect(safeStorage.get<null>('outra', null)).toBeNull();
  });

  it('retorna defaultValue quando o JSON está corrompido', () => {
    localStorage.setItem('corrompido', '{not-json');
    expect(safeStorage.get('corrompido', 'fallback')).toBe('fallback');
  });

  it('remove uma chave específica', () => {
    safeStorage.set('a', 1);
    expect(safeStorage.remove('a')).toBe(true);
    expect(safeStorage.get('a', null)).toBeNull();
  });

  it('limpa todo o localStorage', () => {
    safeStorage.set('a', 1);
    safeStorage.set('b', 2);
    expect(safeStorage.clear()).toBe(true);
    expect(localStorage.length).toBe(0);
  });
});
