import { test, expect } from '@playwright/test';

/**
 * The one place the animations actually run.
 *
 * The rest of the suite runs with `prefers-reduced-motion: reduce`, which keeps
 * every assertion deterministic and exercises the path a member with vestibular
 * sensitivity gets. That leaves two things unproven, and both of them are ways
 * this could be quietly broken for everybody else:
 *
 *   1. That the motion happens at all.
 *   2. That it ends. An animation that never settles is an element stuck at
 *      opacity 0 — a blank screen that passes every other test in this repo,
 *      because they all run with motion off.
 */

test.use({ reducedMotion: 'no-preference' });

test.describe('with motion on', () => {
  test('a screen arrives, and finishes arriving', async ({ page }) => {
    await page.goto('/signin/');

    const card = page.getByRole('heading', { name: 'Sign in' });
    await expect(card).toBeVisible();

    // Settled: fully opaque, no transform left over. The failure this catches
    // is an animation that starts and never completes.
    await expect
      .poll(async () =>
        card.evaluate((el) => {
          const wrapper = el.closest('main')?.firstElementChild as HTMLElement | null;
          if (!wrapper) return null;
          const style = getComputedStyle(wrapper);
          return `${style.opacity}|${style.transform}`;
        }),
      )
      .toMatch(/^1\|(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });

  test('a press is felt, and let go of', async ({ page }) => {
    await page.goto('/signin/');
    const button = page.getByRole('button', { name: 'Send me a code' });
    const wrapper = () =>
      button.evaluate((el) => getComputedStyle(el.parentElement as HTMLElement).transform);

    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect.poll(wrapper).not.toBe('none');
    await page.mouse.up();

    // And it comes back. A button left at 97% is a button that looks broken.
    await expect.poll(wrapper).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
  });

  test('nothing moves for somebody who asked it not to', async ({ browser }) => {
    // The same screen, with the setting a member can turn on in their phone.
    // §8 and §12 both require this, and `MotionConfig reducedMotion="user"`
    // decides it once for the whole app — so this is the test that would catch
    // somebody bypassing the provider with a raw `motion` component.
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('/signin/');

    // Polled rather than read once: a fresh context under a loaded machine can
    // be measured before React has hydrated at all, and "no wrapper yet" is not
    // the same answer as "no movement".
    await expect(page.getByRole('heading', { name: 'Sign in' })).toBeVisible();
    await expect
      .poll(() =>
        page.getByRole('heading', { name: 'Sign in' }).evaluate((el) => {
          const wrapper = el.closest('main')?.firstElementChild as HTMLElement | null;
          return wrapper ? getComputedStyle(wrapper).transform : null;
        }),
      )
      .toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
    await context.close();
  });
});
