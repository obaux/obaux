import type { Locator, Page } from '@playwright/test';

/**
 * Wait for a thing to have ARRIVED, not for a time.
 *
 * Pam's screens and sheets rise 8px as they fade in (`pam-rise`, D-269; Astryx's dialog enter is the same). `toBeVisible()` returns
 * while that runs, so a spec that reads a box (or a point inside it) then measures a thing that is 8px lower than it will be: under
 * load that read landed in the rise (drawers.spec: the band read at y=59 and the panel at 51; profile-skeleton: the real card at
 * 175.09 against the skeleton's 167.09: both exactly 8). The animation may be on the element, inside it, or on an ancestor (the
 * dialog around a sheet, the section wrapper around a card), so all three are waited for.
 *
 * Only an ARRIVAL is waited for: a finite animation that ends within a second (the rise is 260ms plus a stagger of up to 150ms). An
 * infinite one (a skeleton's pulse, a spinner) never finishes, and a long one is a thing a spec is measuring (the file name that
 * slides for up to five seconds, D-407), not an arrival; neither is waited for.
 *
 * - `arrived(locator)`: no finite animation or transition left on the element, inside it, or around it; fonts loaded; and its box the
 *   same on three frames running. Use before reading `boundingBox()` or `elementFromPoint` on something that has just appeared.
 * - `arrivedPage(page)`: the same for the whole document, without a box. `settled(page)` calls it.
 */
const ARRIVAL_MS = 1000;
const FINITE = `(a) => { const t = a.effect && a.effect.getComputedTiming ? a.effect.getComputedTiming() : null; return !t || (t.iterations !== Infinity && t.endTime <= ${ARRIVAL_MS}); }`;

export async function arrivedPage(page: Page): Promise<void> {
  await page.evaluate(async (finiteSource) => {
    const finite = new Function(`return (${finiteSource})`)() as (a: Animation) => boolean;
    await document.fonts.ready;
    // Anything started while the last wave finished is waited for in the next.
    for (let i = 0; i < 5; i += 1) {
      const running = document.getAnimations().filter(finite);
      if (running.length === 0) break;
      await Promise.all(running.map((a) => a.finished.catch(() => undefined)));
    }
    await new Promise((resolve) => requestAnimationFrame(resolve));
  }, FINITE);
}

export async function arrived(target: Locator): Promise<void> {
  await target.evaluate(async (el, finiteSource) => {
    const finite = new Function(`return (${finiteSource})`)() as (a: Animation) => boolean;
    await document.fonts.ready;
    const around = (): Animation[] => {
      const found = new Set<Animation>(el.getAnimations({ subtree: true }));
      for (let n = el.parentElement; n; n = n.parentElement) for (const a of n.getAnimations()) found.add(a);
      return [...found].filter(finite);
    };
    let previous = '';
    let still = 0;
    while (still < 3) {
      await Promise.all(around().map((a) => a.finished.catch(() => undefined)));
      await new Promise((resolve) => requestAnimationFrame(resolve));
      const r = el.getBoundingClientRect();
      const now = `${r.x},${r.y},${r.width},${r.height}`;
      still = now === previous ? still + 1 : 0;
      previous = now;
    }
  }, FINITE);
}
