import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * Pam's one drawer (PamSheet, Will 17 October, card a93): a 48px notch across the top that closes on a tap, room above the title,
 * and one green link at the end of the title's row — "Done" where you pick or set something, "Close" where you only read. Checked on
 * the area drawer (a pick, so Done), which every drawer shares its frame with.
 */
const json = (body: unknown) => ({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });

async function open(page: Page) {
  await asMember(page);
  await page.route('**/rest/v1/rpc/search_areas*', (route) =>
    route.fulfill(json([{ id: 'a1', kind: 'zip', label: '19104', lat: 39.96, lon: -75.2 }])),
  );
  await page.goto('/');
  await settled(page);
  const opener = page.getByRole('button', { name: 'Change the area' });
  await opener.click();
  await expect(page.getByRole('textbox', { name: 'ZIP code' })).toBeVisible();
  return opener;
}

const panel = (page: Page) => page.locator('dialog[open] .astryx-bottom-sheet');

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
    const title = (await page.locator('dialog[open] h2').first().boundingBox())!;
    expect(title.y - box.y).toBeGreaterThanOrEqual(52);
  });

  test('the link says Done, sits in the title’s row at the end, and is the first control after the title for a screen reader', async ({ page }) => {
    await open(page);
    const link = page.locator('dialog[open]').getByRole('button', { name: 'Done' });
    await expect(link).toBeVisible();
    const heading = page.locator('dialog[open] h2').first();
    const h = (await heading.boundingBox())!;
    const l = (await link.boundingBox())!;
    expect(Math.abs(h.y + h.height / 2 - (l.y + l.height / 2))).toBeLessThan(12);
    expect(l.x).toBeGreaterThan(h.x + h.width / 2);
    expect(l.height).toBeGreaterThanOrEqual(48);
    // In document order the heading comes first and the link is the next control after it (the notch is hidden from both).
    const next = await heading.evaluate((el) => {
      const all = Array.from(el.closest('dialog')!.querySelectorAll<HTMLElement>('button, a[href], input, [tabindex="0"]'));
      const after = all.filter((n) => el.compareDocumentPosition(n) & Node.DOCUMENT_POSITION_FOLLOWING && !n.closest('[aria-hidden="true"]') && n.tabIndex >= 0);
      return after[0]?.textContent?.trim();
    });
    expect(next).toBe('Done');
    // The notch is not a second control for a screen reader or a keyboard.
    const notch = page.locator('dialog[open] button[aria-hidden="true"]');
    await expect(notch).toHaveCount(1);
    await expect(notch).toHaveAttribute('tabindex', '-1');
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
