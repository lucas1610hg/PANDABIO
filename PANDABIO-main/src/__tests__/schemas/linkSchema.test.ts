import { describe, expect, it } from 'vitest';
import { linkSchema, productSchema, userSchema } from '../../schemas/linkSchema';

describe('linkSchema', () => {
  it('aceita um link válido', () => {
    const result = linkSchema.safeParse({
      title: 'Meu Instagram',
      url: 'https://instagram.com/user',
      type: 'social',
    });
    expect(result.success).toBe(true);
  });

  it('aceita URL sem protocolo (preenche https://)', () => {
    const result = linkSchema.safeParse({
      title: 'Meu Portfolio',
      url: 'portfolio.com.br',
      type: 'portfolio',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita título muito curto', () => {
    const result = linkSchema.safeParse({
      title: 'ab',
      url: 'https://example.com',
      type: 'custom',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita título com caracteres inválidos', () => {
    const result = linkSchema.safeParse({
      title: 'Título $$$',
      url: 'https://example.com',
      type: 'custom',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita URL inválida', () => {
    const result = linkSchema.safeParse({
      title: 'Link quebrado',
      url: 'não é uma url',
      type: 'whatsapp',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita tipo fora do enum', () => {
    const result = linkSchema.safeParse({
      title: 'Link válido',
      url: 'https://example.com',
      type: 'banana',
    });
    expect(result.success).toBe(false);
  });
});

describe('productSchema', () => {
  it('aceita produto válido', () => {
    const result = productSchema.safeParse({ name: 'Curso Online', price: 49.9 });
    expect(result.success).toBe(true);
  });

  it('rejeita preço negativo', () => {
    const result = productSchema.safeParse({ name: 'Curso Online', price: -5 });
    expect(result.success).toBe(false);
  });

  it('rejeita nome muito curto', () => {
    const result = productSchema.safeParse({ name: 'ab', price: 10 });
    expect(result.success).toBe(false);
  });
});

describe('userSchema', () => {
  it('aceita usuário válido', () => {
    const result = userSchema.safeParse({
      name: 'João Silva',
      username: 'joao_silva',
      email: 'joao@email.com',
    });
    expect(result.success).toBe(true);
  });

  it('rejeita e-mail inválido', () => {
    const result = userSchema.safeParse({
      name: 'João Silva',
      username: 'joao_silva',
      email: 'nao-e-email',
    });
    expect(result.success).toBe(false);
  });

  it('rejeita username com caracteres especiais', () => {
    const result = userSchema.safeParse({
      name: 'João Silva',
      username: 'joão!',
      email: 'joao@email.com',
    });
    expect(result.success).toBe(false);
  });
});
