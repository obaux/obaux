import { expect, test, type Page } from '@playwright/test';
import en from '@pam/config/locales/en.json';
import { settled } from './settled';

/**
 * The tabs on the privacy notice and the terms follow the reader (D-497). Will, 10 October, on his
 * phone: "the anchors that highlight chips get confused when two sections are in view on the same
 * screen: if I select 'Talking to a person' then select 'what you can do', the what you can do won't
 * always select". And: the tab is highlighted when its section is at the top of the page, and the row
 * of chips glides so the selected one is always visible.
 *
 * The rules: the highlighted tab is the section whose heading has reached the line under the two bars
 * (136px), the one at the top when two are in view; a tapped tab is highlighted at once and held until the
 * reader scrolls for themselves; the row of tabs moves so the highlighted one is wholly on screen; and
 * after a tap, focus goes to the section's heading. Each at 320 and 390 wide.
 */
const LINE = 136;

const toc = (page: Page) => page.getByRole('navigation', { name: en['legal.toc'] });
const tab = (page: Page, name: string) => toc(page).getByRole('link', { name, exact: true });
const current = (page: Page) => toc(page).locator('a[aria-current="true"]');

/** Waits until the page has stopped moving (a smooth scroll has finished). */
async function glided(page: Page) {
  await page.waitForFunction(
    () =>
      new Promise<boolean>((done) => {
        const y = window.scrollY;
        const x = document.querySelector('nav ul')?.scrollLeft ?? 0;
        setTimeout(() => done(window.scrollY === y && (document.querySelector('nav ul')?.scrollLeft ?? 0) === x), 160);
      }),
    undefined,
    { timeout: 8000 },
  );
}

/** Puts a section's top `top` px below the top of the screen, at once. */
async function scrollSection(page: Page, id: string, top: number) {
  await page.evaluate(
    ([sectionId, at]) => {
      const y = document.getElementById(sectionId as string)!.getBoundingClientRect().top + window.scrollY - (at as number);
      window.scrollTo({ top: y, behavior: 'instant' });
    },
    [id, top],
  );
  await page.waitForTimeout(250);
}

async function sectionIds(page: Page): Promise<string[]> {
  return toc(page)
    .getByRole('link')
    .evaluateAll((links) => links.map((l) => (l.getAttribute('href') ?? '').slice(1)));
}

/** Notes every change of the highlighted tab from now on, by name, in order. */
async function watchHighlight(page: Page) {
  await page.evaluate(() => {
    const w = window as unknown as { __seen: string[] };
    w.__seen = [];
    const nav = document.querySelector('nav[aria-label]')!;
    new MutationObserver(() => {
      const on = nav.querySelector('a[aria-current="true"]')?.textContent ?? '';
      if (w.__seen[w.__seen.length - 1] !== on) w.__seen.push(on);
    }).observe(nav, { subtree: true, attributes: true, attributeFilter: ['aria-current'] });
  });
}
const seen = (page: Page) => page.evaluate(() => (window as unknown as { __seen: string[] }).__seen);

for (const width of [320, 390]) {
  test.describe(`privacy tabs at ${width} wide`, () => {
    test.beforeEach(async ({ page }) => {
      await page.setViewportSize({ width, height: 700 });
      await page.goto('/privacy/');
      await settled(page);
    });

    test('with two sections in view, the one whose heading is at the top is highlighted', async ({ page }) => {
      const ids = await sectionIds(page);
      const names = await toc(page).getByRole('link').allTextContents();
      // The next section's heading is just below the line: both are on screen, the earlier one is at the top.
      await scrollSection(page, ids[3]!, LINE + 14);
      await expect(current(page)).toHaveText(names[2]!);
      // Now its heading has reached the line.
      await scrollSection(page, ids[3]!, LINE);
      await expect(current(page)).toHaveText(names[3]!);
    });

    test("Will's case: Talk to a person, then What you can do, selects What you can do and keeps it", async ({ page }) => {
      await watchHighlight(page);
      await tab(page, en['privacy.s.contact.title']).click();
      // The second tap lands in the middle of the first one's glide.
      await tab(page, en['privacy.s.your-choices.title']).click();
      await glided(page);

      await expect(current(page)).toHaveText(en['privacy.s.your-choices.title']);
      await page.waitForTimeout(600);
      await expect(current(page)).toHaveText(en['privacy.s.your-choices.title']);
      // Nothing else lit on the way except the two that were tapped, ending on the second.
      const names = await seen(page);
      expect(names[names.length - 1]).toBe(en['privacy.s.your-choices.title']);
      for (const name of names) {
        expect([en['privacy.s.contact.title'], en['privacy.s.your-choices.title']]).toContain(name);
      }
    });

    test('a tapped tab stays highlighted when the page cannot scroll far enough to bring it to the top', async ({ page }) => {
      const ids = await sectionIds(page);
      const names = await toc(page).getByRole('link').allTextContents();
      await watchHighlight(page);
      // The short sections at the foot of the page cannot reach the line: the tapped one still wins.
      for (const index of [ids.length - 1, ids.length - 2]) {
        await tab(page, names[index]!).click();
        await glided(page);
        await expect(current(page)).toHaveText(names[index]!);
        await page.waitForTimeout(400);
        await expect(current(page)).toHaveText(names[index]!);
      }
    });

    test('a tap lights its tab at once and nothing else lights while the page glides there', async ({ page }) => {
      const names = await toc(page).getByRole('link').allTextContents();
      await watchHighlight(page);
      await tab(page, names[6]!).click();
      await glided(page);
      await page.waitForTimeout(300);
      // Only the tapped tab was ever lit after the tap (the first entry may be the tab it left).
      const after = (await seen(page)).filter((name) => name !== names[0]);
      expect(after).toEqual([names[6]]);
    });

    test('the reader scrolling for themselves takes over again', async ({ page }) => {
      const names = await toc(page).getByRole('link').allTextContents();
      await tab(page, names[names.length - 1]!).click();
      await glided(page);
      await page.mouse.move(width / 2, 400);
      await page.mouse.wheel(0, -40);
      await page.evaluate(() => window.scrollTo({ top: 0, behavior: 'instant' }));
      await expect(current(page)).toHaveText(names[0]!);
    });

    test('the row of tabs moves so the highlighted tab is wholly on screen, reading on or tapping', async ({ page }) => {
      const ids = await sectionIds(page);
      const names = await toc(page).getByRole('link').allTextContents();

      const wholly = async (name: string) => {
        await expect(current(page)).toHaveText(name);
        await expect
          .poll(async () => {
            const box = await current(page).boundingBox();
            const row = await toc(page).locator('ul').boundingBox();
            return !!box && !!row && box.x >= Math.max(row.x, 0) - 0.5 && box.x + box.width <= Math.min(row.x + row.width, width) + 0.5;
          })
          .toBe(true);
      };

      // Reading on, section by section.
      for (const [index, id] of ids.entries()) {
        await scrollSection(page, id, LINE);
        await wholly(names[index]!);
      }
      // Tapping the first, then the last.
      await tab(page, names[0]!).click();
      await glided(page);
      await wholly(names[0]!);
      await tab(page, names[names.length - 1]!).click();
      await glided(page);
      await wholly(names[names.length - 1]!);
    });

    test("after a tap, focus is on the section's heading and the heading is under the bars", async ({ page }) => {
      await tab(page, en['privacy.s.limits.title']).click();
      await glided(page);
      const focused = await page.evaluate(() => {
        const el = document.activeElement as HTMLElement | null;
        return { tag: el?.tagName, text: el?.textContent?.trim(), top: el?.closest('section')?.getBoundingClientRect().top };
      });
      expect(focused.tag).toBe('H2');
      expect(focused.text).toBe(en['privacy.s.limits.title']);
      // Focus did not scroll the page anywhere else: the section sits where the tap put it.
      expect(Math.round(focused.top ?? 0)).toBeGreaterThanOrEqual(LINE - 3);
      expect(Math.round(focused.top ?? 0)).toBeLessThanOrEqual(LINE + 3);
    });
  });
}
