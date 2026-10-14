import { expect, test, type Page } from '@playwright/test';
import { settled } from './settled';
import { asMember } from './asMember';

/**
 * A visible highlight on focus that a script puts somewhere belongs to text boxes only (Will, 11 October: "Modals
 * and section links (from policy pages) are highlighted. That's not intended behavior. Let's rewrite the input
 * field rule to only mean text boxes"; D-523, which replaces D-411's focus line).
 *
 * Focus is moved so a screen reader lands in the right place: a dialog's content, a sheet, the photo viewer, the
 * section a contents link on Privacy or Terms jumps to. Those are `tabindex="-1"` and not controls, so they show
 * no ring in any input mode. Buttons and links keep the brand ring when somebody Tabs to them. A text box shows no ring
 * of ours at all, whatever put the focus there, and is still focused on arrival so the keyboard is up (Will, 14 October,
 * a83, reversing his 11 October rule: D-569). Supabase is stubbed at the network.
 */
const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

/** What is focused, and whether it shows a ring: its own outline, or the frame round a text field. */
async function focused(page: Page) {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement;
    const ring = (e: Element | null) => {
      if (!e) return false;
      const s = getComputedStyle(e);
      return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0;
    };
    return {
      tag: el.tagName.toLowerCase(),
      tabindex: el.getAttribute('tabindex'),
      // Its own outline, or the frame a text field is drawn in (the field's own box is the ring's home).
      ring: ring(el) || ring(el.parentElement) || ring(el.parentElement?.parentElement ?? null),
    };
  });
}

async function signedIn(page: Page, role: 'member' | 'provider' = 'member') {
  await page.addInitScript((userId: string) => {
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
  }, ME);
  await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id: ME })));
  await page.route('**/rest/v1/notifications*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));
  await page.route('**/rest/v1/profiles*', (route) =>
    route.fulfill(
      json({
        id: ME,
        role,
        org_id: '22222222-0000-0000-0000-0000000000aa',
        first_name: 'Marcus',
        region_id: null,
        regions: null,
        access_status: 'active',
        onboarded_at: '2026-09-14T00:00:00Z',
      }),
    ),
  );
}

const PLACE = {
  id: 'svc-1',
  name: 'Kirkbride Center',
  lookup_name: 'KIRKBRIDE CENTER',
  category: 'family_services',
  subcategory: null,
  address: '111 N 49th St, Philadelphia, PA 19139',
  phone: '+12155550100',
  place_id: null,
  lat: 39.9612,
  lon: -75.2172,
  description_plain: 'Treatment and counselling.',
  website: null,
  audience: null,
  hours: null,
};

const PROGRAM = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';
const policy = {
  id: 'conf',
  service_id: PROGRAM,
  title: 'Confidentiality',
  version: 1,
  replaces_id: null,
  created_at: '2026-10-06T10:00:00Z',
  archived_at: null,
  program_policy_files: [{ id: 'conf-f', path: `${PROGRAM}/conf.pdf`, name: 'conf.pdf', content_type: 'application/pdf', size_bytes: 1000, position: 0 }],
};

test.describe('a section a contents link jumps to', () => {
  for (const [name, path] of [['Privacy', '/privacy/'], ['Terms', '/terms/']] as const) {
    test(`${name}: no ring after a tap, and none by keyboard either`, async ({ page }) => {
      await page.goto(path);
      await settled(page);
      const tabs = page.getByRole('navigation', { name: 'On this page' }).getByRole('link');

      // Mouse: a tap on the second tab.
      await tabs.nth(1).click();
      let now = await focused(page);
      expect(now).toMatchObject({ tag: 'h2', tabindex: '-1', ring: false });

      // Keyboard: Tab to the third tab, Enter.
      await tabs.nth(1).focus();
      await page.keyboard.press('Tab');
      await page.keyboard.press('Enter');
      now = await focused(page);
      expect(now).toMatchObject({ tag: 'h2', tabindex: '-1', ring: false });

      // And Tab on from there still rings the next link.
      await page.keyboard.press('Tab');
      expect((await focused(page)).ring).toBe(true);
    });
  }
});

test.describe('a sheet', () => {
  test("the place's hours drawer shows no ring on what it focuses, mouse or keyboard; Tab rings the first button", async ({ page }) => {
    await signedIn(page);
    await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);
    await settled(page);

    // Mouse.
    const hours = page.getByRole('button', { name: /^Hours: / });
    await hours.click();
    const sheet = page.getByRole('dialog');
    await expect(sheet).toBeVisible();
    await expect.poll(async () => (await focused(page)).ring).toBe(false);
    await page.keyboard.press('Tab');
    const first = await focused(page);
    expect(first.tag).toMatch(/^(button|a)$/);
    expect(first.ring).toBe(true);
  });

  test('opened by keyboard: no ring on what it focuses; Tab rings the first button', async ({ page }) => {
    await signedIn(page);
    await page.route('**/rest/v1/rpc/service_detail*', (route) => route.fulfill(json([PLACE])));
    await page.goto(`/place/?id=${PLACE.id}`);
    await settled(page);

    const hours = page.getByRole('button', { name: /^Hours: / });
    await hours.focus();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect.poll(async () => (await focused(page)).ring).toBe(false);
    await page.keyboard.press('Tab');
    expect((await focused(page)).ring).toBe(true);
  });
});

test.describe('a confirm dialog', () => {
  async function open(page: Page, byKeyboard: boolean) {
    await signedIn(page, 'provider');
    await page.route('**/rest/v1/program_services*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/program_submissions*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/services*', (route) =>
      route.fulfill(json([{ id: PROGRAM, name: 'Fresh Start Kitchen', category: 'workforce', subcategory: null, description_plain: 'Words.', address: null, phone: null, website: null, needs_review: false, is_active: true, created_at: '2026-10-06T10:00:00Z' }])),
    );
    await page.route('**/rest/v1/program_policies*', (route) => route.fulfill(json([policy])));
    await page.goto('/program/policies/');
    await settled(page);
    await page.getByRole('button', { name: 'Edit' }).click();
    const remove = page.getByRole('button', { name: /Remove Confidentiality/ });
    if (byKeyboard) {
      await remove.focus();
      await page.keyboard.press('Enter');
    } else {
      await remove.click();
    }
    await expect(page.getByRole('dialog')).toBeVisible();
  }

  for (const byKeyboard of [false, true]) {
    test(`shows no ring on what it focuses (${byKeyboard ? 'keyboard' : 'mouse'}); Tab rings the first button`, async ({ page }) => {
      await open(page, byKeyboard);
      await expect.poll(async () => (await focused(page)).ring).toBe(false);
      await page.keyboard.press('Tab');
      const first = await focused(page);
      expect(first.tag).toBe('button');
      expect(first.ring).toBe(true);
    });
  }
});

test.describe('a search box focused on arrival is focused, so the keyboard is up, and shows no ring (D-569)', () => {
  test('the area drawer on Explore', async ({ page }) => {
    await signedIn(page);
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));
    await page.goto('/');
    await settled(page);
    await page.getByRole('button', { name: /Near/ }).first().click();
    const box = page.getByRole('searchbox').or(page.getByRole('textbox', { name: 'ZIP code' })).first();
    await expect(box).toBeVisible();
    await expect(box).toBeFocused();
    // No ring on the field or the frame round it (Will, 14 October, a83), once the drawer has finished opening.
    await page.waitForTimeout(600);
    expect((await focused(page)).ring).toBe(false);
    // A tap into a text box draws none either, and nor does Tab onto one.
    await page.getByRole('button', { name: 'Cancel' }).focus();
    await page.keyboard.press('Tab');
    await expect(box).toBeFocused();
    expect((await focused(page)).ring).toBe(false);
  });
});

/**
 * Astryx styles its own links, tiles, tabs and list rows, and on the help site its outline-style:none beat the
 * global :focus-visible rule, leaving no visible focus at all (Iris; Wren's note, 11 October). The app does not
 * have that gap: every control on Profile rings when Tab lands on it. Checked so it stays true.
 */
test.describe('Tab shows a ring on every control (the Astryx tiles, rows, tabs and buttons)', () => {
  test('Profile: the header buttons, the tiles, the list rows, Sign out and the tab bar', async ({ page }) => {
    await signedIn(page);
    await page.route('**/rest/v1/rpc/member_points*', (route) => route.fulfill(json(400)));
    await page.goto('/profile/');
    await settled(page);
    await page.locator('body').click({ position: { x: 5, y: 5 } });

    const seen: string[] = [];
    for (let i = 0; i < 14; i += 1) {
      await page.keyboard.press('Tab');
      const el = await page.evaluate(() => {
        const e = document.activeElement as HTMLElement;
        return { tag: e.tagName.toLowerCase(), name: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30) };
      });
      if (el.tag === 'body') break;
      // The ring grows in over a moment on some Astryx controls, so read it once it has.
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const s = getComputedStyle(document.activeElement as HTMLElement);
              return s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) >= 2;
            }),
          { message: `no ring on ${el.tag} "${el.name}"` },
        )
        .toBe(true);
      seen.push(`${el.tag}:${el.name}`);
    }
    // The tiles, the rows, Sign out and the tab bar were all reached.
    expect(seen.join('|')).toMatch(/Connections/);
    expect(seen.join('|')).toMatch(/Sign out/);
    expect(seen.length).toBeGreaterThanOrEqual(9);
  });
});

test.describe('a search field shows what is typed as typed, in any language (D-574 follow-up, Lena, a86)', () => {
  test('in Arabic "1500 Market" is not turned into "Market 1500"; empty, the placeholder follows the page', async ({ page }) => {
    await asMember(page, 'member', 'ar');
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));
    await page.route('**/rest/v1/rpc/search_areas*', (route) => route.fulfill(json([])));
    await page.goto('/');
    await settled(page);
    await page.getByRole('button').filter({ hasText: 'City Hall' }).first().click();
    const box = page.locator('.astryx-input-group[data-size="lg"] input').first();
    await expect(box).toBeVisible();
    const direction = () => box.evaluate((el) => getComputedStyle(el).direction);
    // Empty: the page's own direction, right to left in Arabic, so the placeholder reads the way the language does.
    expect(await direction()).toBe('rtl');
    await box.fill('1500 Market');
    // Latin words typed: left to right, number first, as typed.
    await expect.poll(direction).toBe('ltr');
    // Arabic words typed: right to left.
    await box.fill('شارع');
    await expect.poll(direction).toBe('rtl');
    await box.fill('');
    await expect.poll(direction).toBe('rtl');
  });
});
