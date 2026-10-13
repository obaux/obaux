import { expect, test, type Page } from '@playwright/test';
import { SUPPORTED_LOCALES, type Locale } from '@pam/config';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { settled } from './settled';

/**
 * The role chip beside the mark never breaks inside a word (b26: at 320px, with the bell, "Member" came out as
 * "Membe / r"). In every language, for every role that shows a chip, at 320 and 390: each word of the chip is on one
 * line, the chip is inside the screen, and the page does not scroll sideways. When the chip does not fit beside the
 * mark it sits under it.
 */
const BUNDLES: Record<Locale, Record<string, string>> = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar };
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
const ROLES = [
  ['member', 'role.member'],
  ['admin', 'role.admin'],
  ['provider', 'role.provider'],
] as const;

async function signedIn(page: Page, role: string, locale: Locale) {
  await page.addInitScript(
    ([userId, code]: [string, string]) => {
      const session = {
        access_token: 't',
        refresh_token: 'r',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated' },
      };
      for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
        window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      }
      window.localStorage.setItem('pam.locale', code);
    },
    [ME, locale] as [string, string],
  );
  await page.route('**/rest/v1/**', (route) => route.fulfill(json([])));
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({ id: ME, role, first_name: 'Pia', region_id: null, regions: null, access_status: 'active', onboarded_at: '2026-09-14T00:00:00Z', org_id: null }),
    ),
  );
}

for (const width of [320, 390]) {
  test.describe(`${width}px`, () => {
    test.use({ viewport: { width, height: 800 } });
    for (const locale of SUPPORTED_LOCALES) {
      for (const [role, key] of ROLES) {
        test(`${locale} · ${role}: the role chip keeps its words whole and on screen`, async ({ page }) => {
          await signedIn(page, role, locale);
          await page.goto('/places/');
          await settled(page);
          const label = BUNDLES[locale][key]!;
          const chip = page.locator('header').getByText(label, { exact: true }).first();
          await expect(chip).toBeVisible();
          const result = await chip.evaluate((el) => {
            const range = document.createRange();
            const words: string[] = [];
            const text = el.firstChild;
            const whole = el.textContent ?? '';
            // One rectangle per word, or the word was cut across lines.
            let start = 0;
            for (const part of whole.split(/(\s+)/)) {
              if (part.trim() && text) {
                range.setStart(text, start);
                range.setEnd(text, start + part.length);
                if (range.getClientRects().length > 1) words.push(part);
              }
              start += part.length;
            }
            const box = el.getBoundingClientRect();
            return { cut: words, left: box.left, right: box.right, vw: document.documentElement.clientWidth, scrollW: document.documentElement.scrollWidth };
          });
          expect(result.cut, `words broken across lines in "${label}"`).toEqual([]);
          expect(result.left).toBeGreaterThanOrEqual(0);
          expect(result.right).toBeLessThanOrEqual(result.vw);
          expect(result.scrollW).toBeLessThanOrEqual(result.vw);
        });
      }
    }
  });
}
