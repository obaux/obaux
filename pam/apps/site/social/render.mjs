// Renders social/preview.html to public/og/social.png (1200×630).
// Run from apps/site:  node social/render.mjs
// Needs Playwright's Chromium (PLAYWRIGHT_BROWSERS_PATH, or CHROMIUM_PATH).
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const { chromium } = require('playwright-core');

const browser = await chromium.launch(
  process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {},
);
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.goto(pathToFileURL(join(here, 'preview.html')).href);
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: join(here, '..', 'public', 'og', 'social.png') });
await browser.close();
