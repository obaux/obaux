import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

/**
 * StyleX is a compile-time system: `stylex.create` throws if it reaches the
 * runtime untransformed. Tests therefore run the real babel plugin, which means
 * they exercise the same styling pipeline the app build uses rather than a
 * stubbed one.
 */
export default defineConfig({
  plugins: [
    react({
      babel: {
        plugins: [
          [
            '@stylexjs/babel-plugin',
            {
              dev: true,
              runtimeInjection: true,
              unstable_moduleResolution: { type: 'commonJS', rootDir: process.cwd() },
            },
          ],
        ],
      },
    }),
  ],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['test/**/*.test.tsx'],
  },
});
