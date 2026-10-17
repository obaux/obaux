import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * A row opens from anywhere on it (Will, 17 October: "When I'm in Profile and I try to click on the items under my hero card …
 * it doesn't let me click on those items with a simple tap").
 *
 * Astryx draws a link row's `<a>` only around the label; the icon, the chevron and the room above and below the words were dead
 * (31% of a Profile row, 22% of Language). `useRowTaps` (packages/ui/src/tapRows.ts) clicks that link for a tap anywhere else on
 * the row. This taps every link row on each screen at its four inner corners (4px in), its icon and its chevron, and checks each
 * tap opens the row's own place. A hit-area test measures every side it claims.
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
});

interface RowPoint {
  readonly href: string;
  readonly where: string;
  readonly x: number;
  readonly y: number;
}

/** Every internal link row on the page, and the points on it to tap. A point on something else that acts (a trailing button) is left out. */
async function points(page: Page): Promise<RowPoint[]> {
  return page.evaluate(() => {
    const ACTS = 'a, button, input, select, textarea, label, summary, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="link"], [role="menuitem"]';
    const out: { href: string; where: string; x: number; y: number }[] = [];
    for (const row of Array.from(document.querySelectorAll<HTMLElement>('.astryx-item'))) {
      const link = Array.from(row.children).find((c): c is HTMLAnchorElement => c instanceof HTMLAnchorElement && c.hasAttribute('href'));
      const href = link?.getAttribute('href') ?? '';
      if (!link || !href.startsWith('/') || link.getAttribute('target') === '_blank') continue;
      row.scrollIntoView({ block: 'center' });
      const r = row.getBoundingClientRect();
      if (r.height === 0 || r.bottom < 0 || r.top > innerHeight) continue;
      const first = row.firstElementChild!.getBoundingClientRect();
      const last = row.lastElementChild!.getBoundingClientRect();
      const candidates: [string, number, number][] = [
        ['top-left', r.left + 4, r.top + 4],
        ['top-right', r.right - 4, r.top + 4],
        ['bottom-left', r.left + 4, r.bottom - 4],
        ['bottom-right', r.right - 4, r.bottom - 4],
        ['icon', first.left + first.width / 2, first.top + first.height / 2],
        ['chevron', last.left + last.width / 2, last.top + last.height / 2],
      ];
      for (const [where, x, y] of candidates) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || !row.contains(hit)) continue;
        const acting = hit.closest(ACTS);
        if (acting && acting !== link && row.contains(acting)) continue;
        out.push({ href, where, x, y });
      }
    }
    return out;
  });
}

async function tapEveryRow(page: Page, url: string, expectAtLeast: number) {
  await page.goto(url);
  await settled(page);
  // Rows are read one at a time, so the page is reloaded between taps (a tap navigates away).
  const rows = new Set((await points(page)).map((p) => p.href));
  expect(rows.size, `link rows found on ${url}`).toBeGreaterThanOrEqual(expectAtLeast);
  for (const href of rows) {
    for (const where of ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'icon', 'chevron']) {
      await page.goto(url);
      await settled(page);
      const point = (await points(page)).find((p) => p.href === href && p.where === where);
      if (!point) continue;
      await page.mouse.click(point.x, point.y);
      await expect(page, `a tap on the ${where} of the row for ${href} (${url})`).toHaveURL(new RegExp(`${href.replace(/[.*+?^${}()|[\]\\?]/g, '\\$&').split('?')[0]}`));
    }
  }
}

test.describe('every link row opens from anywhere on it', () => {
  test('Profile, a member', async ({ page }) => {
    await asMember(page);
    await tapEveryRow(page, '/profile/', 4);
  });

  test('Profile, a super admin', async ({ page }) => {
    await asMember(page, 'super_admin');
    await tapEveryRow(page, '/profile/', 3);
  });

  test('Legal', async ({ page }) => {
    await asMember(page);
    await tapEveryRow(page, '/legal/', 3);
  });

  test('Help', async ({ page }) => {
    await asMember(page);
    await tapEveryRow(page, '/help/', 2);
  });
});
