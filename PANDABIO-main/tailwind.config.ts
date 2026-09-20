import type { Config } from 'tailwindcss';
import { colors } from './src/theme/tokens';

const toKebab = (value: string) => value.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);

const extendColors: Record<string, string> = {};
for (const [group, palette] of Object.entries(colors)) {
  for (const [name, value] of Object.entries(palette)) {
    extendColors[`${group}-${toKebab(name)}`] = value;
  }
}

export default {
  theme: {
    extend: {
      colors: extendColors,
    },
  },
} satisfies Config;
