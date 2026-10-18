import { test, expect, type Page } from '@playwright/test';
import { asMember } from './asMember';
import { settled } from './settled';

/**
 * A program lead's visit rows open the member from anywhere on them, the check-in circle apart (Iris's interaction run-through, W1).
 *
 * With a check-in circle the row carried no link, only the member's name did: a 24px link. The time ("9:00 AM · 60 min"), the line
 * under the name and the space between did nothing when tapped. This taps each row at its four corners (4px in), on the time, on the
 * line under the name and between the two, from a fresh page each time (a tap navigates away), and checks it opens the member's page.
 * The check-in circle is the one place that must NOT open it. Examples are on (a pretend program with visits and interested members).
 */
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.sessionStorage.setItem('pam.examples', '1'));
  await asMember(page, 'provider');
});

const WHERE = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'time', 'line', 'between'] as const;

/** The points on row `index` that are not the check-in circle or another control, measured on the page as it stands. */
async function pointsOnRow(page: Page, kind: 'visit' | 'interested', index: number) {
  return page.evaluate(
    ({ kind, index }) => {
      const ACTS = 'button, input, select, textarea, [role="button"], [role="switch"]';
      const rows =
        kind === 'visit'
          ? [...document.querySelectorAll<HTMLElement>('.astryx-item')].filter((r) => /\d{1,2}:\d{2}\s?[AP]M/.test(r.textContent ?? ''))
          : [...document.querySelectorAll<HTMLAnchorElement>('a[href^="/person/"]')].map((a) => {
              let card: HTMLElement = a;
              while (card.parentElement && !(card.getBoundingClientRect().width > 300 && card.getBoundingClientRect().height > 60)) card = card.parentElement;
              return card;
            });
      const row = rows[index];
      if (!row) return { count: rows.length, points: [] as { where: string; x: number; y: number }[], circle: null as null | { x: number; y: number } };
      row.scrollIntoView({ block: 'center' });
      const r = row.getBoundingClientRect();
      const kids = [...row.children].map((c) => c.getBoundingClientRect());
      const time = kids[0]!;
      const label = kids[1] ?? kids[0]!;
      const candidates: [string, number, number][] = [
        ['top-left', r.left + 4, r.top + 4],
        ['top-right', r.right - 4, r.top + 4],
        ['bottom-left', r.left + 4, r.bottom - 4],
        ['bottom-right', r.right - 4, r.bottom - 4],
        ['time', time.left + time.width / 2, time.top + time.height / 2],
        ['line', label.left + label.width / 2, label.bottom - 4],
        ['between', (time.right + label.left) / 2, r.top + r.height / 2],
      ];
      const points: { where: string; x: number; y: number }[] = [];
      for (const [where, x, y] of candidates) {
        const hit = document.elementFromPoint(x, y);
        if (!hit || !row.contains(hit)) continue;
        if (hit.closest(ACTS)) continue;
        points.push({ where, x, y });
      }
      const button = row.querySelector<HTMLElement>('button');
      const b = button?.getBoundingClientRect();
      return { count: rows.length, points, circle: b ? { x: b.left + b.width / 2, y: b.top + b.height / 2 } : null };
    },
    { kind, index },
  );
}

/**
 * Opens the page and, for a schedule, steps on to the first day or week that has a visit. The example schedule is a pattern of the
 * calendar, and on some days (a Sunday, for one) this week has nobody in it, so the page opens on a week with no rows.
 */
async function ready(page: Page, url: string, openDay = false) {
  await page.goto(url);
  await page.locator('html[data-row-taps]').waitFor({ state: 'attached' });
  await settled(page);
  await page.evaluate(() => document.fonts.ready);
  if (openDay) await page.getByText('Day', { exact: true }).first().click();
  if (url === '/interested/') return;
  for (let step = 0; step < 12; step++) {
    if ((await page.locator('.astryx-item', { hasText: /\d{1,2}:\d{2}\s?[AP]M/ }).count()) > 0) break;
    await page.getByRole('button', { name: /^Next/ }).first().click();
  }
}

async function tapEveryRow(page: Page, url: string, kind: 'visit' | 'interested', atLeast: number, openDay = false) {
  await ready(page, url, openDay);
  const { count } = await pointsOnRow(page, kind, 0);
  expect(count, `visit rows found on ${url}`).toBeGreaterThanOrEqual(atLeast);
  for (let index = 0; index < Math.min(count, 3); index++) {
    for (const where of WHERE) {
      await ready(page, url, openDay);
      const found = (await pointsOnRow(page, kind, index)).points.find((p) => p.where === where);
      if (!found) continue;
      await page.mouse.click(found.x, found.y);
      await expect(page, `a tap on the ${where} of row ${index} (${url})`).toHaveURL(/\/person\/\?id=/);
    }
  }
}

test('Home, Coming in (the week): a visit row opens the member from anywhere on it', async ({ page }) => {
  test.setTimeout(240_000);
  await tapEveryRow(page, '/', 'visit', 2);
});

test('Home, Coming in (the day): a visit row opens the member from anywhere on it', async ({ page }) => {
  test.setTimeout(240_000);
  await tapEveryRow(page, '/', 'visit', 1, true);
});

test('Your calendar: a visit row opens the member from anywhere on it', async ({ page }) => {
  test.setTimeout(240_000);
  await tapEveryRow(page, '/home/calendar/', 'visit', 2);
});

test('Members interested: a row opens the member from anywhere on it', async ({ page }) => {
  test.setTimeout(240_000);
  await tapEveryRow(page, '/interested/', 'interested', 2);
});

test('the check-in circle is still its own: it checks the member in and opens nothing', async ({ page }) => {
  await ready(page, '/');
  const { circle } = await pointsOnRow(page, 'visit', 0);
  expect(circle).not.toBeNull();
  await page.mouse.click(circle!.x, circle!.y);
  await expect(page).not.toHaveURL(/\/person\//);
  await expect(page.getByRole('button', { name: /^Undo check-in|Checked in/ }).or(page.getByText('Checked in')).first()).toBeVisible();
});
