import { expect, test, type Locator, type Page } from '@playwright/test';
import { SUPPORTED_LOCALES } from '@pam/config';
import en from '@pam/config/locales/en.json';
import ar from '@pam/config/locales/ar.json';
import es from '@pam/config/locales/es.json';
import { settled } from './settled';

/**
 * The list of languages shows all of them (S1, Iris's interaction run-through, 17 October 2026).
 *
 * Before somebody can sign in or sign up, the language list is the one control that decides whether they can read anything else.
 * Astryx stops a menu and a dropdown's list at 300px, which is six rows of 48px and a bit: Russian was cut in half and Arabic
 * was below the edge, with nothing to say there was more. The person who needs Arabic may read nothing else on the screen.
 *
 * So this opens each list, on the two screens that offer it before sign-in (the Sign in globe, a menu; and Sign up's "Choose a
 * language", a bottom sheet), at the smallest phone Pam is built for (320×568) and at 390×844, in English and in Arabic (where
 * the globe moves to the other corner and the list is drawn right to left), and checks that every language's row is inside the
 * list's own box, inside the screen, and that the list has nothing to scroll to. The checks are on the boxes, so a language added
 * later that does not fit fails here too.
 *
 * Sign up's field can be anywhere on a 568px screen, because the form scrolls (and a person, or Playwright, scrolls it clear of
 * the Next bar). A list opened under or over the field has seven rows (344px) of room on neither side at the middle of a 568px
 * screen: b62 moved the field there, and the popover ran off the screen. A sheet needs no room next to the field, so the list is
 * opened with the field where a click leaves it, 400px down and 256px down, and must be the same. On a screen too short for the
 * whole list, the sheet must stay on the screen and every row must be reachable by scrolling it.
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

/** The rows that cannot be got to: each is scrolled into view inside the list, then must be inside the list and the screen. */
async function unreachable(page: Page, listRole: 'menu' | 'listbox', rowRole: 'menuitemradio' | 'option'): Promise<string[]> {
  return page.evaluate(
    ({ listRole, rowRole }) => {
      const rows = [...document.querySelectorAll<HTMLElement>(`[role="${rowRole}"]`)].filter((row) => row.getBoundingClientRect().height > 0);
      const list = rows[0]?.closest<HTMLElement>(`[role="${listRole}"]`);
      if (!list) return ['no list'];
      const lost: string[] = [];
      for (const row of rows) {
        row.scrollIntoView({ block: 'nearest' });
        const b = row.getBoundingClientRect();
        const l = list.getBoundingClientRect();
        if (b.top < l.top - 0.5 || b.bottom > l.bottom + 0.5 || b.top < -0.5 || b.bottom > window.innerHeight + 0.5) lost.push((row.textContent ?? '').trim());
      }
      return lost;
    },
    { listRole, rowRole },
  );
}

/** Scroll the page until the field's top is `top` from the top of the screen, and say so if the page cannot go that far. */
async function placeField(field: Locator, top: number): Promise<void> {
  await field.evaluate((el, target) => window.scrollBy(0, el.getBoundingClientRect().top - target), top);
  await expect.poll(() => field.evaluate((el) => Math.round(el.getBoundingClientRect().top)), { message: `the field is ${top}px from the top` }).toBeGreaterThan(top - 3);
  expect(await field.evaluate((el) => Math.round(el.getBoundingClientRect().top))).toBeLessThan(top + 3);
}

const SIGN_UP = 'Sign up: "Choose a language"';

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

      async function signUp(page: Page): Promise<Locator> {
        await newcomer(page);
        await page.goto('/join/');
        await settled(page);
        return page.getByRole('combobox', { name: words['onboarding.language.title'] });
      }

      test(`${SIGN_UP} opens a list with all seven languages in it, none cut off`, async ({ page }) => {
        const field = await signUp(page);
        // As a person gets there: the click scrolls the field clear of the Next bar if it has to, wherever that leaves it.
        await field.click();
        const m = await measure(page, 'listbox', 'option');
        expect(m.rows.map((row) => row.name).length, 'every language has a row').toBe(SUPPORTED_LOCALES.length);
        expect(problems(m), 'rows the list hides, cuts off or lets run off the screen').toEqual([]);
      });

      // Only a short screen has a middle where neither the room over the field nor the room under it holds seven rows.
      if (size.height < 700) {
        for (const top of [400, 256]) {
          test(`${SIGN_UP} with the field ${top}px down opens a list with all seven languages in it, none cut off`, async ({ page }) => {
            const field = await signUp(page);
            await placeField(field, top);
            await field.click();
            const m = await measure(page, 'listbox', 'option');
            expect(m.rows.map((row) => row.name).length, 'every language has a row').toBe(SUPPORTED_LOCALES.length);
            expect(problems(m), 'rows the list hides, cuts off or lets run off the screen').toEqual([]);
          });
        }
      }
    });
  }
}

// A screen too short for seven rows (a phone on its side): what holds the list keeps to the screen and scrolls, every row reachable.
test.describe('320×320', () => {
  test.use({ viewport: { width: 320, height: 320 } });

  test(`${SIGN_UP} on a screen too short for the whole list stays on the screen, and every language can be scrolled to`, async ({ page }) => {
    await newcomer(page);
    await page.goto('/join/');
    await settled(page);
    await page.getByRole('combobox', { name: en['onboarding.language.title'] }).click();
    const m = await measure(page, 'listbox', 'option');
    expect(m.list, 'a list was found').not.toBeNull();
    // What the list sits in: the sheet (a dialog) or, in a menu, its popover.
    const holder = await page.evaluate(() => {
      const rows = [...document.querySelectorAll<HTMLElement>('[role="option"]')].filter((row) => row.getBoundingClientRect().height > 0);
      const box = rows[0]?.closest<HTMLElement>('dialog, [popover]')?.getBoundingClientRect();
      return box ? { top: box.top, bottom: box.bottom } : null;
    });
    expect(holder, 'the list sits in a sheet or a popover').not.toBeNull();
    expect(holder!.top, 'it starts on the screen').toBeGreaterThanOrEqual(-0.5);
    expect(holder!.bottom, 'it ends on the screen').toBeLessThanOrEqual(m.screen.height + 0.5);
    expect(await unreachable(page, 'listbox', 'option'), 'languages that cannot be scrolled to').toEqual([]);
  });
});

// What happens on a pick and on Escape: the list closes either way, and focus goes back to the field it opened from.
test.describe('Sign up: the list closes', () => {
  test.use({ viewport: { width: 320, height: 568 } });

  test('Escape closes it and focus goes back to the field; picking a language closes it and switches the page', async ({ page }) => {
    await newcomer(page);
    await page.goto('/join/');
    await settled(page);
    const field = page.getByRole('combobox', { name: en['onboarding.language.title'] });
    const list = page.getByRole('listbox');

    await field.click();
    await expect(list).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(list).toBeHidden();
    await expect(field).toBeFocused();

    await field.click();
    await page.getByRole('option', { name: 'Español' }).click();
    await expect(list).toBeHidden();
    await expect(page.getByRole('combobox', { name: es['onboarding.language.title'] })).toBeVisible();
  });
});
