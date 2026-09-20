import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      include: [
        'src/store/usePandaBioStore.ts',
        'src/utils/storage.ts',
        'src/utils/normalizeIp.ts',
        'src/schemas/linkSchema.ts',
      ],
      reporter: ['text', 'html'],
    },
    include: ['src/__tests__/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, '.'),
    },
  },
});
