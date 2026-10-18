import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';
import en from '@pam/config/locales/en.json';
import ar from '@pam/config/locales/ar.json';

/**
 * Pam's one drawer (PamSheet, Will 17 October, card a93): a 48px notch across the top that closes on a tap, room above the title,
 * and one green link at the end of the title's row — "Done" where you pick or set something, "Close" where you only read. Checked on
 * the area drawer (a pick, so Done), which every drawer shares its frame with.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function open(page: Page, language: string | null = null) {
  await asMember(page, 'member', language);
  await page.route('**/rest/v1/rpc/search_areas*', (route) =>
    route.fulfill(json([{ id: 'a1', kind: 'zip', label: '19104', lat: 39.96, lon: -75.2 }])),
  );
  await page.goto('/');
  await settled(page);
  const prefix = (language === 'ar' ? ar : en)['places.changeArea'].split('{area}')[0]!.trim();
  const opener = page.locator(`button[aria-label^="${prefix}"]`).first();
  await opener.click();
  await expect(page.locator('dialog[open] input').first()).toBeVisible();
  await sheetHasArrived(page);
  return opener;
}

const panel = (page: Page) => page.locator('dialog[open] .astryx-bottom-sheet');

/**
 * The sheet has finished arriving. The `<dialog>` itself runs `pam-rise` (it rises 8px as it fades in), and that animation is on the
 * panel's ANCESTOR, so asking the panel for its animations never sees it: every measurement below that reads the panel's box and then
 * a point or a child (two moments) could straddle the 8px move. Under load that happened: a point 40px into the panel landed on the
 * title instead of the band, and a child's offset read 8px for 16 (full runs only; the box was read at y=59, the child at y=51).
 * So wait on the state itself: no animation or transition left on the dialog or anything in it, the fonts loaded, and the panel's
 * box the same on three frames running.
 */
async function sheetHasArrived(page: Page) {
  await page.evaluate(async () => {
    const dialog = document.querySelector('dialog[open]')!;
    const el = dialog.querySelector('.astryx-bottom-sheet')!;
    await document.fonts.ready;
    let previous = '';
    let still = 0;
    while (still < 3) {
      await Promise.all(dialog.getAnimations({ subtree: true }).map((a) => a.finished.catch(() => undefined)));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const r = el.getBoundingClientRect();
      const now = `${r.x},${r.y},${r.width},${r.height}`;
      still = now === previous ? still + 1 : 0;
      previous = now;
    }
  });
}

test.describe('the drawer standard', () => {
  test('the top of the sheet is a 48px band the full width, and a tap on it closes the drawer', async ({ page }) => {
    await open(page);
    const box = (await panel(page).boundingBox())!;
    const band = await page.evaluate(
      ({ x, y }) => {
        const el = document.elementFromPoint(x, y);
        const rect = el?.getBoundingClientRect();
        return { tag: el?.tagName, height: rect?.height ?? 0, width: rect?.width ?? 0 };
      },
      { x: box.x + box.width / 2, y: box.y + 40 },
    );
    expect(band.tag).toBe('BUTTON');
    expect(band.height).toBeGreaterThanOrEqual(48);
    expect(band.width).toBeGreaterThanOrEqual(box.width - 2);

    // A tap near the grip, where the old handle strip did nothing.
    await page.mouse.click(box.x + 40, box.y + 14);
    await expect(page.getByRole('textbox', { name: 'ZIP code' })).toHaveCount(0);
  });

  test('the title starts below the band, with room over it', async ({ page }) => {
    await open(page);
    const box = (await panel(page).boundingBox())!;
    // The words themselves, not the heading's padding box.
    const textTop = await page.locator('dialog[open] h2').first().evaluate((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return range.getBoundingClientRect().top;
    });
    expect(textTop - box.y).toBeGreaterThanOrEqual(52);
  });

  test('one round 48px button in the top corner says Done and has a checkmark; it is the first control after the title for a screen reader', async ({ page }) => {
    await open(page);
    const box = (await panel(page).boundingBox())!;
    const button = page.locator('dialog[open]').getByRole('button', { name: 'Done' });
    await expect(button).toBeVisible();
    // The button is the 48px tap target; the circle drawn in it is 36px, tucked 16px in from the top and the side (inside the rounded corner).
    const b = (await button.boundingBox())!;
    expect(b.width).toBeGreaterThanOrEqual(48);
    expect(b.height).toBeGreaterThanOrEqual(48);
    const c = (await button.locator('xpath=.//*[contains(@class,"astryx-stack")][1]').boundingBox())!;
    expect(Math.abs(c.width - 36)).toBeLessThan(1);
    expect(Math.abs(c.height - c.width), 'a circle, not an oval').toBeLessThan(1);
    expect(box.x + box.width - (c.x + c.width)).toBeGreaterThanOrEqual(12);
    expect(box.x + box.width - (c.x + c.width)).toBeLessThanOrEqual(20);
    expect(c.y - box.y).toBeGreaterThanOrEqual(12);
    expect(c.y - box.y).toBeLessThanOrEqual(20);
    // A checkmark for a drawer you pick in or only read: not an X.
    expect(await button.evaluate((el) => el.querySelector('svg path')?.getAttribute('d'))).toBe('M5 13l4 4L19 7');
    // In document order the heading comes first and the button is the next control after it (the notch is hidden from both).
    const heading = page.locator('dialog[open] h2').first();
    const next = await heading.evaluate((el) => {
      const all = Array.from(el.closest('dialog')!.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]'));
      const after = all.filter((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING && !n.closest('[aria-hidden="true"]') && n.tabIndex >= 0);
      return after[0]?.getAttribute('aria-label') ?? after[0]?.textContent?.trim();
    });
    expect(next).toBe('Done');
    // The notch is not a second control for a screen reader or a keyboard.
    const notch = page.locator('dialog[open] button[aria-hidden="true"]');
    await expect(notch).toHaveCount(1);
    await expect(notch).toHaveAttribute('tabindex', '-1');
  });

  test('in Arabic the button is in the top-left corner', async ({ page }) => {
    await open(page, 'ar');
    const box = (await panel(page).boundingBox())!;
    const button = page.locator('dialog[open] [data-sheet-action]');
    const b = (await button.boundingBox())!;
    // The 48px box is 10px in, so its 36px circle is 16px in.
    expect(b.x - box.x).toBeGreaterThanOrEqual(8);
    expect(b.x - box.x).toBeLessThanOrEqual(12);
    expect(b.y - box.y).toBeLessThanOrEqual(12);
  });

  test('Done and Escape both close it, and the focus goes back to where it came from', async ({ page }) => {
    const opener = await open(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('textbox', { name: 'ZIP code' })).toHaveCount(0);
    await expect(opener).toBeFocused();

    await opener.click();
    await page.getByRole('button', { name: 'Done' }).click();
    await expect(page.getByRole('textbox', { name: 'ZIP code' })).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
});
