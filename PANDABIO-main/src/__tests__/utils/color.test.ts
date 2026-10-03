import { describe, expect, it } from 'vitest';
import { isHexColor, normalizeHexColor, withAlpha } from '../../utils/color';

describe('color utilities', () => {
  it('accepts only three or six digit hexadecimal colors', () => {
    expect(isHexColor('#abc')).toBe(true);
    expect(isHexColor('#AABBCC')).toBe(true);
    expect(isHexColor('red')).toBe(false);
    expect(isHexColor('#12')).toBe(false);
  });

  it('normalizes shorthand values and uses fallback for invalid values', () => {
    expect(normalizeHexColor('#AbC', '#000000')).toBe('#aabbcc');
    expect(normalizeHexColor('invalid', '#000000')).toBe('#000000');
  });

  it('clamps alpha values', () => {
    expect(withAlpha('#ff0000', 2)).toBe('rgba(255, 0, 0, 1)');
    expect(withAlpha('#000000', -1)).toBe('rgba(0, 0, 0, 0)');
  });
});
