import { defineConfig } from 'vitest/config';

// The site's .tsx is written for Next's automatic JSX runtime; tests that render a post (post-dates.test.tsx) need the same.
export default defineConfig({ esbuild: { jsx: 'automatic' } });
