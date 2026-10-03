import { describe, expect, it } from 'vitest';
import { defaultPageTheme } from '../../theme/presets';
import { getPreviewThemeTokens } from '../../theme/themeTokens';

describe('preview theme tokens', () => {
  it('uses custom colors across preview tokens', () => {
    const tokens = getPreviewThemeTokens(
      {
        ...defaultPageTheme(),
        customButtonColor: '#123456',
        customButtonTextColor: '#abcdef',
        textColor: '#654321',
      },
      false,
    );

    expect(tokens.accent).toBe('#123456');
    expect(tokens.accentText).toBe('#abcdef');
    expect(tokens.text).toBe('#654321');
    expect(tokens.accentSoft).toContain('rgba(18, 52, 86');
  });

  it('falls back safely when persisted colors are invalid', () => {
    const tokens = getPreviewThemeTokens(
      { ...defaultPageTheme(), customButtonColor: 'invalid', textColor: 'invalid' },
      false,
    );

    expect(tokens.accent).toBe('#ff7a00');
    expect(tokens.text).toBe('#131b2e');
  });
});
