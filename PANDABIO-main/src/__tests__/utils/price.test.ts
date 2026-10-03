import { describe, expect, it } from 'vitest';
import { parsePriceInput } from '../../utils/price';

describe('parsePriceInput', () => {
  it.each([
    ['129,90', 129.9],
    ['1.234,56', 1234.56],
    ['129.90', 129.9],
    ['R$ 79,90', 79.9],
  ])('parses %s as %s', (value, expected) => {
    expect(parsePriceInput(value)).toBe(expected);
  });

  it('returns zero for empty or invalid input', () => {
    expect(parsePriceInput('')).toBe(0);
    expect(parsePriceInput('abc')).toBe(0);
  });
});
