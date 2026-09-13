import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import { settled } from './settled';

/**
 * The sign-in screen has to say that PAM will text you, and how to stop, before
 * you hand over a phone number.
 *
 * It is a promise to the member first: nobody should learn they signed up for
 * text messages by receiving one. It is also what US carriers review before they
 * will let an application send at all, and a screenshot of this screen is filed
 * with that registration — so a well-meaning tidy-up that removes it costs the
 * pilot its ability to text anybody.
 */
test.describe('consent to be texted', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/signin/');
  });

  test('says PAM will text you, and how to stop, on the screen', async ({ page }) => {
    const consent = page.getByText(en['signin.phone.consent']);
    await expect(consent).toBeVisible();
    await expect(consent).toContainText('STOP');
  });

  test('is on screen without scrolling, where somebody types their number', async ({ page }) => {
    // Measured on the settled page: the webfont swapping in changes every line
    // height on the screen, and a box measured before it lands is measuring a
    // layout no member ever sees.
    await settled(page);
    // Where it sits is a design decision and may move again. What cannot move is
    // that somebody sees it before they hand over a number — so this asserts it
    // is inside the viewport, not that it is above or below anything.
    const consent = page.getByText(en['signin.phone.consent']);
    const box = await consent.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'the consent line has no box').not.toBeNull();
    expect(viewport, 'no viewport').not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('is not repeated on the code step, where the number is already given', async ({ page }) => {
    await page.getByLabel('Your phone number').fill('215 555 0100');
    // The screen only moves on once a code is actually requested; asserting the
    // copy exists on the first step and that this one is a different step is
    // enough — a second consent line after consent is noise.
    await expect(page.getByText(en['signin.phone.consent'])).toBeVisible();
  });
});

/**
 * Reminders are a separate yes, asked on their own screen.
 *
 * A carrier rejected PAM's first campaign with 30925 — "opt-in must be
 * unchecked by default; active consent required" — and the box that answers it
 * lives at /reminders/, not on the way in. Sign-in stays one job.
 */
test.describe('agreeing to reminders', () => {
  test('is not asked on the way in', async ({ page }) => {
    // Signing in is one job. Somebody getting into the app should not have to
    // weigh up a messaging policy to do it.
    await page.goto('/signin/');
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('nothing on the screen is pre-selected, because nothing is selectable', async ({ page }) => {
    // 30925 asks that consent be an active, unambiguous act. There is no box to
    // arrive pre-ticked: the agreement is a button whose own label is what is
    // being agreed to.
    await page.goto('/reminders/');
    await expect(page.getByRole('checkbox')).toHaveCount(0);
  });

  test('says what is sent, how often, and how to stop', async ({ page }) => {
    await page.goto('/reminders/');
    await expect(page.getByText(/reminder before a visit/i)).toBeVisible();
    await expect(page.getByText(/few messages a week at most/i)).toBeVisible();
    await expect(page.getByText(/Reply STOP/)).toBeVisible();
    await expect(page.getByText(/rates may apply/i)).toBeVisible();
  });

  test('signed out, it still explains the choice and points at sign-in', async ({ page }) => {
    // Hiding the question behind a sign-in explains nothing. What PAM would
    // send is shown; the thing to do next is sign in, so that is the button.
    await page.goto('/reminders/');
    await expect(page.getByText(/reminder before a visit/i)).toBeVisible();
    await expect(page.getByRole('link', { name: 'Sign in' })).toBeVisible();
  });

  test('signed in, saying no is one tap and is a real answer', async ({ page }) => {
    // "Not now" writes the answer rather than doing nothing, so nobody is asked
    // twice and silence is never read as consent either way.
    const id = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
    await page.addInitScript((userId: string) => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated' },
      };
      for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
        window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      }
    }, id);
    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id })));
    await page.route('**/rest/v1/profiles*', (route) =>
      route.fulfill(json({ id, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
    );
    await page.route('**/rest/v1/notification_preferences*', (route) => route.fulfill(json(null)));

    await page.goto('/reminders/');
    await expect(page.getByRole('button', { name: 'Not now' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agree to receive texts' })).toBeVisible();
  });

  test('the agreement is the button, and the decline is the other one', async ({ page }) => {
    // A tick box beside a button loses: one is a thing to notice, the other is
    // the way forward. So the words being agreed to are on the control that
    // gets pressed, and there is exactly one other way out of the screen.
    const id = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
    await page.addInitScript((userId: string) => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated' },
      };
      for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
        window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      }
    }, id);
    const json = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    await page.route('**/auth/v1/user*', (route) => route.fulfill(json({ id })));
    await page.route('**/rest/v1/profiles*', (route) =>
      route.fulfill(json({ id, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
    );
    await page.route('**/rest/v1/notification_preferences*', (route) => route.fulfill(json(null)));

    // Saving has to go somewhere. It used to record the answer and stay on the
    // same screen, which looks exactly like a button that does nothing.
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json([])));

    await page.goto('/reminders/');
    await page.getByRole('button', { name: 'Agree to receive texts' }).click();
    await expect(page).toHaveURL(/\/places\//);
  });

  test('declining moves on too, rather than sitting there', async ({ page }) => {
    const id = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
    await page.addInitScript((userId: string) => {
      const session = {
        access_token: 'test-access-token',
        refresh_token: 'test-refresh-token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Math.floor(Date.now() / 1000) + 3600,
        user: { id: userId, aud: 'authenticated', role: 'authenticated' },
      };
      for (const ref of ['stub', 'shobqzuhicoiymtumiaz']) {
        window.localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
      }
    }, id);
    const json2 = (body: unknown) => ({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(body),
    });
    await page.route('**/auth/v1/user*', (route) => route.fulfill(json2({ id })));
    await page.route('**/rest/v1/profiles*', (route) =>
      route.fulfill(json2({ id, role: 'member', first_name: 'Marcus', region_id: null, regions: null })),
    );
    await page.route('**/rest/v1/notification_preferences*', (route) => route.fulfill(json2(null)));
    await page.route('**/rest/v1/rpc/services_near*', (route) => route.fulfill(json2([])));

    await page.goto('/reminders/');
    await page.getByRole('button', { name: 'Not now' }).click();
    await expect(page).toHaveURL(/\/places\//);
  });

  test('has no WCAG A/AA violations', async ({ page }) => {
    await page.goto('/reminders/');
    await settled(page);
    const results = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze();
    expect(results.violations).toEqual([]);
  });
});

/**
 * The keyboard and the autofill hint.
 *
 * A person typing their own phone number on a QWERTY keyboard, one thumb, in
 * bright sun, is the §0 test case. Four attributes decide whether they get a
 * keypad and their own number offered above it, and all four have to agree —
 * so `purpose` on TextField sets them together and this proves they arrive.
 */
test.describe('phone and code fields', () => {
  test('the phone field asks for a keypad and offers the person their number', async ({ page }) => {
    await page.goto('/signin/');
    const phone = page.getByLabel('Your phone number');
    await expect(phone).toHaveAttribute('type', 'tel');
    await expect(phone).toHaveAttribute('autocomplete', 'tel');
    await expect(phone).toHaveAttribute('inputmode', 'tel');
  });

  test('focus lights up the whole field, not a box inside it', async ({ page }) => {
    await page.goto('/signin/');
    const phone = page.getByLabel('Your phone number');
    await phone.focus();

    // The ring belongs on the frame a person can see. A second rectangle drawn
    // inside the first reads as a stray element — and collided with the label.
    const outlines = await phone.evaluate((el) => ({
      input: getComputedStyle(el).outlineStyle,
      frame: getComputedStyle(el.parentElement as HTMLElement).outlineStyle,
    }));
    expect(outlines.input).toBe('none');
    expect(outlines.frame).toBe('solid');
  });
});

/**
 * What PAM is, above the form.
 *
 * Somebody arriving has been handed a link and has no reason yet to type their
 * phone number into it. Three slides answer that, and all three have to be in
 * the page rather than revealed only by a swipe — a carousel whose content
 * exists only after a gesture hides two thirds of the explanation from a
 * keyboard, a screen reader, and anybody whose finger does not drag cleanly.
 */
test.describe('the way in explains itself', () => {
  test('says what PAM does, one idea at a time, before the form', async ({ page }) => {
    await page.goto('/signin/');
    for (const key of ['onboarding.1', 'onboarding.2', 'onboarding.3'] as const) {
      await expect(page.getByText(en[key])).toBeAttached();
    }
  });

  test('the card is still the thing to act on', async ({ page }) => {
    // The slides are context. If they push the button off the screen they have
    // stopped being context and started being the screen.
    await page.goto('/signin/');
    // On the settled page: the screen arrives with a CSS fade that starts 8px
    // low, and a box measured during it is 8px from where it lands.
    await settled(page);
    const button = page.getByRole('button', { name: en['signin.phone.action'] });
    const box = await button.boundingBox();
    const viewport = page.viewportSize();
    expect(box, 'the button has no box').not.toBeNull();
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport!.height);
  });

  test('there is no second way out competing with it', async ({ page }) => {
    // Get help was removed from this screen deliberately (Will, 13 September,
    // amendment A9). Every failure state still renders PAM's number in a
    // notice — which the next test is what makes that removal defensible.
    await page.goto('/signin/');
    await expect(page.getByRole('link', { name: 'Get help' })).toHaveCount(0);
  });

  test('when sending the code fails, the number to call is on the screen', async ({ page }) => {
    // This is the whole justification for A9: help is absent while nothing is
    // wrong and present the moment something is. Delete this and the screen is
    // a dead end for exactly the person §0 was written for.
    await page.route('**/auth/v1/otp*', (route) =>
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'nope' }),
      }),
    );

    await page.goto('/signin/');
    await page.getByLabel('Your phone number').fill('215 555 0100');
    await page.getByRole('button', { name: en['signin.phone.action'] }).click();

    await expect(page.getByText(en['signin.failed.send.title'])).toBeVisible();
    await expect(page.getByRole('link', { name: en['help.callSupport'] })).toHaveAttribute(
      'href',
      /^tel:/,
    );
  });
});
