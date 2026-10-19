import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * "Something is wrong here", and where it goes.
 *
 * The member using this screen is standing outside a place that is closed, or
 * that moved, or that never took new people — Pam sent them there. Three taps:
 * pick a reason, send, done.
 *
 * The reasons are the four the database accepts, and the fan-out to super
 * admins is a database trigger (0038), proved in `packages/db`. What a browser
 * can prove is that the screen sends one of those four, that it says nobody at
 * the place is told who reported it, and that arriving without a place is a
 * sentence rather than a broken form.
 */

const USER = '**/auth/v1/user*';
const PROFILES = '**/rest/v1/profiles*';
const FLAG = '**/rest/v1/rpc/flag_service*';

const ME = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
const PLACE = 'svc-1';

function json(body: unknown) {
  return { status: 200, contentType: 'application/json', body: JSON.stringify(body) };
}

async function signedIn(page: import('@playwright/test').Page) {
  const sent: { p_reason: string; p_note: string | null }[] = [];

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

  await page.route(USER, (route) => route.fulfill(json({ id: ME })));
  await page.route(PROFILES, (route) =>
    route.fulfill(json({ id: ME, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
  );
  await page.route(FLAG, async (route) => {
    sent.push(route.request().postDataJSON());
    await route.fulfill(json({ id: 'flag-1' }));
  });

  return sent;
}

test.describe('reporting a place', () => {
  test('offers the four standard reasons, and nothing to write from scratch', async ({ page }) => {
    await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);

    for (const label of [
      'It is closed',
      'It moved somewhere else',
      'They are not taking new people',
      'Something here is wrong, like the address or the phone',
    ]) {
      await expect(page.getByRole('radio', { name: label })).toBeVisible();
    }

    // A note is offered and is clearly optional — the fifth case, not the form.
    await expect(page.getByRole('textbox', { name: /you can skip this/ })).toBeVisible();
  });

  test('asks the question and does not explain: "nobody at the place is told" is on the Privacy page (D-608)', async ({ page }) => {
    // The person doing this usually has the least power in the situation; what happens to who they are is said in Privacy
    // (what-we-keep.p15), not above the reasons.
    await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);
    await expect(page.getByRole('radio', { name: 'It moved somewhere else' })).toBeVisible();
    await expect(page.getByText(/Nobody at the place is told who said so/)).toHaveCount(0);
    await expect(page.getByText(/Tell us what is wrong and we will check it/)).toHaveCount(0);
  });

  test('sends the reason the member picked, and says what happens next', async ({ page }) => {
    const sent = await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);

    // The screen is client-drawn (no radios in the page's HTML, so no tap can land before React has them), but a tap can still land during the
    // screen's first moments: wait for the page a person reads, and for the choice to be what they see, before sending (D-616: the report
    // carries what the screen shows).
    await settled(page);
    await page.getByRole('radio', { name: 'It moved somewhere else' }).click();
    await expect(page.getByRole('radio', { name: 'It moved somewhere else' })).toBeChecked();
    await page.getByRole('button', { name: 'Send this to Pam' }).click();

    await expect(page.getByRole('heading', { name: 'Thank you. We will check it.' })).toBeVisible();
    // The thank-you is the whole message (D-608).
    await expect(page.getByText('Somebody at Pam looks at every one of these.')).toHaveCount(0);
    await expect.poll(() => sent[0]?.p_reason).toBe('moved');
    // An empty note is null, not "" — the database stores nothing rather than
    // an empty string somebody has to interpret later.
    expect(sent[0]?.p_note).toBeNull();
  });

  test('arriving with no place is a sentence, not a form that cannot send', async ({ page }) => {
    await signedIn(page);
    await page.goto('/flag/');

    await expect(page.getByRole('heading', { name: 'We do not know which place' })).toBeVisible();
    // Two ways to Explore, where places are found now (D-217) — the round
    // back and the button — one more than strictly needed, as §0 asks.
    await expect(page.getByRole('link', { name: 'Find the place' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Explore' })).toBeVisible();
  });

  test('reaches this screen from the place\'s own screen', async ({ page }) => {
    // Reporting a place lives in the place's ⋯ menu since D-224 ("Flag
    // something", with its icon, in the bar's own menu — Will, 2 October), so
    // that menu is the route that has to work.
    await signedIn(page);
    await page.route('**/rest/v1/rpc/service_detail*', (route) =>
      route.fulfill(
        json([
          {
            id: PLACE,
            name: 'Example Learning Center',
            lookup_name: 'Example Learning Center',
            category: 'education',
            subcategory: null,
            address: '123 Main St',
            phone: '+12155550100',
            place_id: null,
            lat: 39.95,
            lon: -75.16,
            description_plain: 'Free classes and a computer room. Walk in and ask at the desk.',
            website: null,
            audience: null,
            hours: null,
          },
        ]),
      ),
    );
    await page.route('**/rest/v1/rpc/saved_places_mine*', (route) => route.fulfill(json([])));

    await page.goto(`/place/?id=${PLACE}`);
    await page.getByRole('button', { name: 'More options' }).click();
    await page.getByRole('menuitem', { name: 'Flag something' }).click();

    await expect(page).toHaveURL(new RegExp(`/flag/\\?place=${PLACE}$`));
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);
    await expect(page.getByRole('radio', { name: 'It is closed' })).toBeVisible();

    await settled(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
      .analyze();
    if (results.violations.length > 0) {
      console.error(results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'));
    }
    expect(results.violations).toEqual([]);
  });
});

test('a radio sits level with the first line of its label, whether the label wraps or not (Mira, 18 October)', async ({ page }) => {
  await signedIn(page);
  await page.goto(`/flag/?place=${PLACE}`);
  await settled(page);
  const radios = page.getByRole('radio');
  const count = await radios.count();
  expect(count).toBe(4);
  let wrapped = 0;
  for (let i = 0; i < count; i++) {
    const m = await radios.nth(i).evaluate((input) => {
      const row = input.closest('.astryx-item') as HTMLElement;
      const circle = (input.parentElement as HTMLElement).getBoundingClientRect();
      const label = row.querySelector('span[id]') as HTMLElement;
      const box = label.getBoundingClientRect();
      const line = parseFloat(getComputedStyle(label).lineHeight);
      // The first line's own box (an inline span is shorter than its line), whose middle is the middle of that line.
      const lines = Math.round((box.height - 17) / line) + 1;
      const firstLine = box.height - (lines - 1) * line;
      return { circleY: circle.y + circle.height / 2, firstLineY: box.y + firstLine / 2, lines };
    });
    if (m.lines > 1) wrapped++;
    expect(Math.abs(m.circleY - m.firstLineY)).toBeLessThanOrEqual(1);
  }
  // The long fourth reason wraps at every width the specs run at, so the case is really exercised.
  expect(wrapped).toBeGreaterThan(0);
});

const ALERT = /Something's wrong on our side|That took too long|Still not working/;

test('a report that did not go through is the small alert at the bottom, and what was picked stays (D-616)', async ({ page }) => {
  await signedIn(page);
  await page.route(FLAG, (route) => route.fulfill({ status: 500, contentType: 'application/json', body: JSON.stringify({ message: 'secret detail' }) }));
  await page.goto(`/flag/?place=${PLACE}`);
  await page.getByRole('radio', { name: 'It moved somewhere else' }).click();
  await page.getByRole('button', { name: 'Send this to Pam' }).click();
  await expect(page.getByRole('alert').filter({ hasText: ALERT })).toBeVisible();
  await expect(page.getByText('secret detail')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Thank you. We will check it.' })).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'It moved somewhere else' })).toBeChecked();
  await expect(page.getByRole('button', { name: 'Send this to Pam' })).toBeEnabled();
});
