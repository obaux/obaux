// Shared helpers for the check scripts. Needs Playwright with a Chromium build.
//   PLAYWRIGHT_PATH  where to require Playwright from   (default: 'playwright')
//   CHROMIUM_PATH    a Chromium executable to use       (default: Playwright's own)
// Chromium runs on a software GL stack (SwiftShader), so these prove correctness, not speed.
const path = require('path');

exports.PAGE = path.resolve(__dirname, '..', 'index.html');

exports.launch = async () => {
  const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright');
  return chromium.launch({
    executablePath: process.env.CHROMIUM_PATH || undefined,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'],
  });
};

// Opens the demo page at phone size, stops its own animation loop so a script can drive frames.
exports.open = async (browser, { width = 402, height = 500, dpr = 2, query = '' } = {}) => {
  const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: dpr });
  page.on('pageerror', e => console.log('page error:', e.message));
  await page.goto('file://' + exports.PAGE + query);
  await page.waitForFunction(() => window.hero && window.hero.slots);
  await page.evaluate(() => { cancelAnimationFrame(hero._raf); });
  return page;
};

exports.arg = (name, fallback) => { const i = process.argv.indexOf('--' + name); return i > 0 ? process.argv[i + 1] : fallback; };
