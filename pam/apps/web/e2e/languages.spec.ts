import { expect, test, type Page } from '@playwright/test';
import { LANGUAGE_TAGS, SUPPORTED_LOCALES, SWITCHING_LANGUAGE, directionOf, type Locale } from '@pam/config';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { settled } from './settled';

/**
 * Seven languages (D-422). Each is its own chunk, fetched when somebody picks
 * it, and each sets the page's `lang` and `dir`. What these check is what
 * could be wrong in a real browser and right in every unit test: the chunk
 * arrives, the screen is really in that language, nothing spills past a 320px
 * phone, Arabic reads right to left, the device's language is honoured without
 * being saved as a choice, and the wait for a download says so, in the
 * language being switched to.
 */
const BUNDLES: Record<Locale, Record<string, string>> = {
  en,
  es,
  'pt-BR': ptBR,
  'zh-CN': zhCN,
  'zh-HK': zhHK,
  ru,
  ar,
};

/** The pages that need no account, and are therefore where a stranger's first words are read. */
const PAGES = ['/signin/', '/about/', '/privacy/', '/terms/'];

/**
 * Visible text that lies outside the screen. A sideways scroll check is not
 * enough: a container can crop what does not fit and the page never scrolls,
 * which is how a footer once lost half a word in Russian. Text inside a region
 * that scrolls sideways on purpose (the carousel, a strip of cards) is allowed
 * to run past the edge; nothing else is.
 */
async function offscreenText(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const width = document.documentElement.clientWidth;
    const found: string[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent?.trim();
      const el = node.parentElement;
      if (!text || !el) continue;
      const style = getComputedStyle(el);
      if (style.visibility === 'hidden' || style.display === 'none' || el.closest('[aria-hidden="true"]')) continue;
      let scrollsSideways = false;
      for (let up: HTMLElement | null = el; up && up !== document.body; up = up.parentElement) {
        const overflowX = getComputedStyle(up).overflowX;
        if (overflowX === 'auto' || overflowX === 'scroll') scrollsSideways = true;
      }
      if (scrollsSideways) continue;
      const range = document.createRange();
      range.selectNodeContents(node);
      for (const rect of range.getClientRects()) {
        if (rect.width === 0) continue;
        if (rect.left < -1 || rect.right > width + 1) found.push(`${text.slice(0, 40)} [${Math.round(rect.left)}..${Math.round(rect.right)} of ${width}]`);
      }
    }
    return [...new Set(found)];
  });
}

const choose = (page: Page, locale: Locale) =>
  page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);

test.describe('each language, from a saved choice', () => {
  for (const locale of SUPPORTED_LOCALES) {
    test(`${locale}: the page says so, reads the right way, and is in it`, async ({ page }) => {
      await choose(page, locale);
      await page.goto('/signin/');

      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await expect(page.locator('html')).toHaveAttribute('dir', directionOf(locale));
      // The screen's own words, in that language (not English with a different `lang`).
      await expect(page.getByText(BUNDLES[locale]['signin.phone.consent']!)).toBeVisible();
    });

    for (const path of PAGES) {
      test(`${locale}: ${path} keeps every word on the screen`, async ({ page }) => {
        await choose(page, locale);
        await page.goto(path);
        await expect(page.locator('html')).toHaveAttribute('lang', locale);
        await settled(page);
        const cropped = await offscreenText(page);
        expect(cropped, `${locale} ${path}: text outside the screen`).toEqual([]);
      });
    }
  }

  const iconCentre = async (page: Page, locale: Locale) => {
    const box = await page.getByRole('button', { name: BUNDLES[locale]['language.title']! }).first().boundingBox();
    return box!.x + box!.width / 2;
  };

  test('en: the language icon is in the right-hand corner', async ({ page }) => {
    await page.goto('/signin/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await iconCentre(page, 'en')).toBeGreaterThan(page.viewportSize()!.width / 2);
  });

  test('ar: the layout mirrors — the language icon is in the left-hand corner', async ({ page }) => {
    await choose(page, 'ar');
    await page.goto('/signin/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    expect(await iconCentre(page, 'ar')).toBeLessThan(page.viewportSize()!.width / 2);
  });

  test('ar: a phone number is still typed left to right', async ({ page }) => {
    await choose(page, 'ar');
    await page.goto('/signin/');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    const field = page.getByLabel(ar['signin.phone.label']!);
    await expect(field).toHaveCSS('direction', 'ltr');
  });
});

test.describe('starting from the language the device is set to', () => {
  test.describe('an Arabic phone', () => {
    test.use({ locale: 'ar-EG' });
    test('opens in Arabic, and does not remember that as a choice', async ({ page }) => {
      await page.goto('/signin/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
      await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
      expect(await page.evaluate(() => localStorage.getItem('pam.locale'))).toBeNull();
    });
  });

  test.describe('a phone in a language Pam does not speak', () => {
    test.use({ locale: 'vi-VN' });
    test('stays in English', async ({ page }) => {
      await page.goto('/signin/');
      await expect(page.getByText(en['signin.phone.consent']!)).toBeVisible();
      await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    });
  });

  test.describe('a Hong Kong phone', () => {
    test.use({ locale: 'zh-HK' });
    test('gets Traditional characters', async ({ page }) => {
      await page.goto('/signin/');
      await expect(page.locator('html')).toHaveAttribute('lang', 'zh-HK');
    });
  });

  test('a saved choice beats the device', async ({ page }) => {
    await choose(page, 'es');
    await page.goto('/signin/');
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
  });
});

test.describe('choosing a language', () => {
  const pickFromGlobe = async (page: Page, label: string) => {
    await page.getByRole('button', { name: en['language.title']! }).first().click();
    await page.getByRole('menuitemradio', { name: label }).click();
  };

  test('is remembered, and the page changes language', async ({ page }) => {
    await page.goto('/signin/');
    await pickFromGlobe(page, es['language.es']!);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByText(es['signin.phone.consent']!)).toBeVisible();
    expect(await page.evaluate(() => localStorage.getItem('pam.locale'))).toBe('es');
  });

  test('a slow download shows a loader that says what is happening, in the new language', async ({ page }) => {
    let slow = false;
    await page.route('**/_next/static/chunks/*.js', async (route) => {
      if (slow) await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/signin/');
    await expect(page.getByText(en['signin.phone.consent']!)).toBeVisible();

    slow = true;
    await pickFromGlobe(page, ar['language.ar']!);

    const loader = page.getByRole('status').filter({ hasText: SWITCHING_LANGUAGE.ar });
    await expect(loader).toBeVisible();
    // The line is drawn the way Arabic reads, while the page behind is still English.
    await expect(loader.locator('[lang="ar"]')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');

    await expect(page.locator('html')).toHaveAttribute('lang', 'ar', { timeout: 10_000 });
    await expect(page.getByText(ar['signin.phone.consent']!)).toBeVisible();
    await expect(loader).toBeHidden();
  });

  test('a fast switch shows no loader at all', async ({ page }) => {
    await page.goto('/signin/');
    await pickFromGlobe(page, es['language.es']!);
    await expect(page.locator('html')).toHaveAttribute('lang', 'es');
    await expect(page.getByRole('status').filter({ hasText: SWITCHING_LANGUAGE.es })).toHaveCount(0);
  });

  test('if the download fails, the language stays as it was', async ({ page }) => {
    await page.goto('/signin/');
    await page.route('**/_next/static/chunks/*.js', (route) => route.abort());
    await pickFromGlobe(page, ru['language.ru']!);
    await page.waitForTimeout(1500);
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    expect(await page.evaluate(() => localStorage.getItem('pam.locale'))).toBeNull();
  });
});

/**
 * The English tag before each language's name (Will, 10 October 2026): "RU
 * Русский", in every list of languages, the same seven tags whichever language
 * the page is in. Checked here in the sign-in menu, in all seven languages.
 */
test.describe('the English tag before each language name, in the sign-in menu', () => {
  for (const locale of SUPPORTED_LOCALES) {
    test(`${locale}: every language has its tag before its name, drawn left to right, and read as its name alone`, async ({ page }) => {
      await choose(page, locale);
      await page.goto('/signin/');
      await expect(page.locator('html')).toHaveAttribute('lang', locale);
      await page.getByRole('button', { name: BUNDLES[locale]['language.title']! }).first().click();
      await expect(page.getByRole('menuitemradio')).toHaveCount(SUPPORTED_LOCALES.length);

      const rtl = directionOf(locale) === 'rtl';
      const edges: number[] = [];
      for (const code of SUPPORTED_LOCALES) {
        const name = en[`language.${code}` as keyof typeof en] as string;
        // The row's accessible name is the language's own name and nothing else: the tag is hidden from a screen reader.
        const row = page.getByRole('menuitemradio', { name, exact: true });
        await expect(row, `${code} row`).toBeVisible();
        const tag = row.locator('[aria-hidden="true"]', { hasText: LANGUAGE_TAGS[code] }).first();
        await expect(tag).toHaveText(LANGUAGE_TAGS[code]);
        await expect(tag.locator('xpath=.//*[normalize-space()]').first()).toHaveCSS('direction', 'ltr');
        // The name keeps its own language.
        await expect(row.locator(`[lang="${code}"]`)).toHaveText(name);

        // The tag comes first: on the left in English, on the right in Arabic.
        const tagBox = (await tag.boundingBox())!;
        const nameBox = (await row.locator(`[lang="${code}"]`).boundingBox())!;
        if (rtl) expect(tagBox.x, `${code}: tag right of name`).toBeGreaterThan(nameBox.x);
        else expect(tagBox.x, `${code}: tag left of name`).toBeLessThan(nameBox.x);
        // And the names line up on one edge, whatever the tag's length.
        edges.push(Math.round(rtl ? nameBox.x + nameBox.width : nameBox.x));
      }
      expect(new Set(edges).size, `names line up: ${edges.join(', ')}`).toBe(1);
    });
  }
});

