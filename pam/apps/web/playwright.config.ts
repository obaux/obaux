import { defineConfig, devices } from '@playwright/test';

/**
 * Browser-based checks — the ones jsdom cannot do.
 *
 * §12 names the target hardware: "Android 9 low-end (2 GB RAM), iPhone SE,
 * 320px width, throttled 3G." The projects below cover the two viewport
 * extremes; colour contrast and touch-target size need a real layout engine,
 * which is why the axe rules disabled in the unit suite are enabled here.
 */
/**
 * Some CI images ship a Chromium that does not match the build @playwright/test
 * expects. PLAYWRIGHT_CHROMIUM_PATH points at the existing binary rather than
 * downloading a second copy; unset, Playwright resolves its own as usual.
 */
const chromiumPath = process.env['PLAYWRIGHT_CHROMIUM_PATH'];
const launch = chromiumPath ? { executablePath: chromiumPath } : {};

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: Boolean(process.env['CI']),
  retries: process.env['CI'] ? 1 : 0,
  reporter: process.env['CI'] ? 'github' : 'list',

  use: {
    baseURL: 'http://127.0.0.1:3100',
    trace: 'on-first-retry',
  },

  projects: [
    {
      // §12: 320px is the narrowest width PAM must work at.
      name: 'narrow-320',
      use: {
        ...devices['Desktop Chrome'],
        // Animations off, for two reasons. It makes every assertion
        // deterministic — axe measures contrast on an element mid-fade and
        // fails it, and a box measured mid-transform is 8px from where it
        // lands. And it is a real member's setting: this is exactly what
        // somebody with vestibular sensitivity gets, so the whole suite runs
        // against that path. The animated path has its own spec (motion.spec.ts).
        reducedMotion: 'reduce',
        viewport: { width: 320, height: 640 },
        launchOptions: launch,
      },
    },
    {
      /*
       * Dark mode, at the same narrow width.
       *
       * Every check ran in the default light scheme until PAM shipped a page
       * that was illegible in dark: the theme's colours are `light-dark()`
       * pairs, so text went near-white while the page stayed on the browser's
       * white canvas. Nothing caught it, because nothing looked.
       */
      name: 'dark-320',
      use: {
        ...devices['Desktop Chrome'],
        // Animations off, for two reasons. It makes every assertion
        // deterministic — axe measures contrast on an element mid-fade and
        // fails it, and a box measured mid-transform is 8px from where it
        // lands. And it is a real member's setting: this is exactly what
        // somebody with vestibular sensitivity gets, so the whole suite runs
        // against that path. The animated path has its own spec (motion.spec.ts).
        reducedMotion: 'reduce',
        viewport: { width: 320, height: 640 },
        colorScheme: 'dark',
        launchOptions: launch,
      },
    },
    {
      // iPhone SE viewport on Chromium rather than WebKit: CI images commonly
      // ship Chromium only, and what these tests measure — contrast, target
      // size, overflow at a narrow width — does not depend on the engine.
      // Add a WebKit project wherever a full browser matrix is available.
      name: 'iphone-se-viewport',
      use: {
        ...devices['Desktop Chrome'],
        // Animations off, for two reasons. It makes every assertion
        // deterministic — axe measures contrast on an element mid-fade and
        // fails it, and a box measured mid-transform is 8px from where it
        // lands. And it is a real member's setting: this is exactly what
        // somebody with vestibular sensitivity gets, so the whole suite runs
        // against that path. The animated path has its own spec (motion.spec.ts).
        reducedMotion: 'reduce',
        viewport: { width: 375, height: 667 },
        isMobile: false,
        hasTouch: true,
        launchOptions: launch,
      },
    },
  ],

  // Serves the static export, which is exactly what Capacitor ships.
  webServer: {
    command: 'npx serve out -l 3100 --no-clipboard',
    url: 'http://127.0.0.1:3100',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
  },
});
