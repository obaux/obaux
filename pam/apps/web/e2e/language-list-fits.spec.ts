import { expect, test, type Page } from '@playwright/test';
import { SUPPORTED_LOCALES } from '@pam/config';
import en from '@pam/config/locales/en.json';
import ar from '@pam/config/locales/ar.json';
import { settled } from './settled';

/**
 * The list of languages shows all of them (S1, Iris's interaction run-through, 17 October 2026).
 *
 * Before somebody can sign in or sign up, the language list is the one control that decides whether they can read anything else.
 * Astryx stops a menu and a dropdown's list at 300px, which is six rows of 48px and a bit: Russian was cut in half and Arabic
 * was below the edge, with nothing to say there was more. The person who needs Arabic may read nothing else on the screen.
 *
 * So this opens each list, on the two screens that offer it before sign-in (the Sign in globe, and Sign up's "Choose a
 * language"), at the smallest phone Pam is built for (320×568) and at 390×844, in English and in Arabic (where the globe moves to
 * the other corner and the list is drawn right to left), and checks that every language's row is inside the list's own box,
 * inside the screen, and that the list has nothing to scroll to. The checks are on the boxes, so a language added later that
 * does not fit fails here too.
 */

const SIZES = [
  { width: 320, height: 568 },
  { width: 390, height: 844 },
] as const;

const NEWCOMER = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/** A verified phone with no Pam record yet, which is who sees Sign up (the same stub join.spec.ts uses). */
async function newcomer(page: Page): Promise<void> {
  await page.addInitScript((userId: string) => {
    const session = {
      access_token: 'test-access-token',
      refresh_token: 'test-refresh-token',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: userId, aud: 'authenticated', role: 'authenticated' },
    };
    for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  }, NEWCOMER);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: NEWCOMER })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/served_cities*', (route) => route.fulfill(json([{ city: 'Philadelphia' }])));
  await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(25)));
  await page.route('**/rest/v1/notification_preferences*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) => route.fulfill(json(null)));
}

interface Measured {
  readonly rows: readonly { name: string; top: number; bottom: number; left: number; right: number }[];
  readonly list: { top: number; bottom: number; left: number; right: number; scrollHeight: number; clientHeight: number } | null;
  readonly screen: { width: number; height: number };
}

/**
 * Where the rows are, once the list has stopped moving. The wait is for the list to be open and to hold still for two frames, so it
 * is the same wait whether the list fits or not: what fails when it does not is the check, not the wait.
 */
async function measure(page: Page, listRole: 'menu' | 'listbox', rowRole: 'menuitemradio' | 'option'): Promise<Measured> {
  const read = () =>
    page.evaluate(
      ({ listRole, rowRole }) => {
        // A menu keeps a hidden copy of its rows to measure them; only the ones on screen count.
        const rows = [...document.querySelectorAll<HTMLElement>(`[role="${rowRole}"]`)].filter((row) => row.getBoundingClientRect().height > 0);
        const list = rows[0]?.closest<HTMLElement>(`[role="${listRole}"]`) ?? null;
        const box = list?.getBoundingClientRect();
        return {
          rows: rows.map((row) => {
            const b = row.getBoundingClientRect();
            return { name: (row.textContent ?? '').replace(/\s+/g, ' ').trim(), top: b.top, bottom: b.bottom, left: b.left, right: b.right };
          }),
          list: list && box ? { top: box.top, bottom: box.bottom, left: box.left, right: box.right, scrollHeight: list.scrollHeight, clientHeight: list.clientHeight } : null,
          screen: { width: window.innerWidth, height: window.innerHeight },
        };
      },
      { listRole, rowRole },
    );
  let last = await read();
  await expect
    .poll(async () => {
      const next = await read();
      const still = JSON.stringify(next) === JSON.stringify(last);
      last = next;
      return still && next.rows.length === SUPPORTED_LOCALES.length;
    }, { message: 'the list opens and holds still' })
    .toBe(true);
  return last;
}

/** What is wrong with a list, in words: the rows it hides, cuts off or lets run off the screen, and whether it scrolls. */
function problems(m: Measured): string[] {
  const found: string[] = [];
  const list = m.list;
  if (!list) return ['no list was found around the rows'];
  for (const row of m.rows) {
    const where: string[] = [];
    if (row.top < list.top - 0.5 || row.bottom > list.bottom + 0.5) where.push(`outside its list (${Math.round(row.top)}–${Math.round(row.bottom)} in ${Math.round(list.top)}–${Math.round(list.bottom)})`);
    if (row.top < -0.5 || row.bottom > m.screen.height + 0.5) where.push(`off the screen (${Math.round(row.top)}–${Math.round(row.bottom)} of ${m.screen.height})`);
    if (row.left < -0.5 || row.right > m.screen.width + 0.5) where.push(`past the side of the screen (${Math.round(row.left)}–${Math.round(row.right)} of ${m.screen.width})`);
    if (where.length) found.push(`${row.name}: ${where.join(', ')}`);
  }
  if (list.scrollHeight > list.clientHeight + 1) found.push(`the list scrolls (${list.scrollHeight}px of rows in ${list.clientHeight}px)`);
  return found;
}

for (const size of SIZES) {
  for (const locale of ['en', 'ar'] as const) {
    const words: Record<string, string> = locale === 'ar' ? ar : en;

    test.describe(`${size.width}×${size.height}, ${locale}`, () => {
      test.use({ viewport: size });

      test.beforeEach(async ({ page }) => {
        await page.addInitScript((code) => localStorage.setItem('pam.locale', code), locale);
      });

      test('Sign in: the globe opens a list with all seven languages in it, none cut off', async ({ page }) => {
        await page.goto('/signin/');
        await settled(page);
        await page.getByRole('button', { name: words['language.title'] }).first().click();
        const m = await measure(page, 'menu', 'menuitemradio');
        expect(m.rows.map((row) => row.name).length, 'every language has a row').toBe(SUPPORTED_LOCALES.length);
        expect(problems(m), 'rows the list hides, cuts off or lets run off the screen').toEqual([]);
      });

      test('Sign up: "Choose a language" opens a list with all seven languages in it, none cut off', async ({ page }) => {
        await newcomer(page);
        await page.goto('/join/');
        await settled(page);
        await page.getByRole('combobox', { name: words['onboarding.language.title'] }).click();
        const m = await measure(page, 'listbox', 'option');
        expect(m.rows.map((row) => row.name).length, 'every language has a row').toBe(SUPPORTED_LOCALES.length);
        expect(problems(m), 'rows the list hides, cuts off or lets run off the screen').toEqual([]);
      });
    });
  }
}
