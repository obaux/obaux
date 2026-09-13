import { defineConfig } from 'vitest/config';

/**
 * The web app's unit tests live beside the source. Playwright owns `e2e/`, and
 * without this Vitest collected those specs too and failed on `test.describe`
 * from the wrong runner.
 */
export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
