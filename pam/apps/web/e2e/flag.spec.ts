import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { settled } from './settled';

/**
 * "Something is wrong here", and where it goes.
 *
 * The member using this screen is standing outside a place that is closed, or
 * that moved, or that never took new people — PAM sent them there. Three taps:
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

  test('says nobody at the place is told who reported it', async ({ page }) => {
    // The person doing this usually has the least power in the situation. It is
    // stated rather than left to be assumed.
    await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);
    await expect(page.getByText(/Nobody at the place is told who said so/)).toBeVisible();
  });

  test('sends the reason the member picked, and says what happens next', async ({ page }) => {
    const sent = await signedIn(page);
    await page.goto(`/flag/?place=${PLACE}`);

    await page.getByRole('radio', { name: 'It moved somewhere else' }).click();
    await page.getByRole('button', { name: 'Send this to PAM' }).click();

    await expect(page.getByRole('heading', { name: 'Thank you. We will check it.' })).toBeVisible();
    await expect.poll(() => sent[0]?.p_reason).toBe('moved');
    // An empty note is null, not "" — the database stores nothing rather than
    // an empty string somebody has to interpret later.
    expect(sent[0]?.p_note).toBeNull();
  });

  test('arriving with no place is a sentence, not a form that cannot send', async ({ page }) => {
    await signedIn(page);
    await page.goto('/flag/');

    await expect(page.getByRole('heading', { name: 'We do not know which place' })).toBeVisible();
    // Two ways to the list — the arrow beside the title and the button — which
    // is one more than strictly needed and exactly what §0 asks for.
    await expect(page.getByRole('link', { name: 'Places' }).first()).toBeVisible();
    await expect(page.getByRole('link', { name: 'Back to Places' })).toBeVisible();
  });

  test('reaches this screen from the place\'s own screen', async ({ page }) => {
    // Reporting a place used to sit behind a "⋯" in the corner of the card,
    // which guaranteed nobody would find it. It is now a labelled row on the
    // place's screen — so that screen is the route that has to work.
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
    await page.getByRole('link', { name: 'Something is wrong here' }).click();

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
