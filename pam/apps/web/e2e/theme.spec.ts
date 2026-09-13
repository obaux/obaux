import { expect, test } from '@playwright/test';

/**
 * The buttons wear the logo's colours, and stay readable doing it.
 *
 * PAM's accent is the wordmark's deep green on light grounds and Will's bright
 * green on dark ones. Those two are not a light/dark pair of one hue: one is a
 * deep fill carrying white text, the other a bright fill carrying near-black
 * text. Every hover and pressed colour is named per mode in `src/theme/pam.ts`
 * for that reason, and a wrong one is invisible until somebody with low vision
 * cannot read a button they have already pressed.
 *
 * So this measures what the browser actually paints: the fill and the label, in
 * rest, hover and pressed, in both modes. Not the token values — the resolved
 * ones, after the theme, the overlay and the cascade have all had their say.
 *
 * Disabled is deliberately absent. WCAG exempts disabled controls, and a
 * disabled button that still clears 4.5:1 does not look disabled.
 */

/**
 * What the browser will actually paint for a button, in its current state.
 *
 * Not `backgroundColor` alone: Astryx draws hover and pressed as a translucent
 * gradient layer over the fill, so the background colour of a pressed button is
 * the same value as at rest. The overlay's colour is in `background-image`, and
 * this composites the two the way the screen does. An earlier version of this
 * test read the background colour only, saw one value in all three states, and
 * would have passed a theme whose press did nothing at all.
 */
function composite(backgroundColor: string, backgroundImage: string): string {
  const base = backgroundColor.match(/[\d.]+/g)!.map(Number);
  const overlay = backgroundImage.match(/rgba?\([^)]+\)/)?.[0];
  if (!overlay) return backgroundColor;

  const [r, g, b, a = 1] = overlay.match(/[\d.]+/g)!.map(Number) as number[];
  const mix = (i: number, over: number) => Math.round(base[i]! * (1 - a) + over * a);
  return `rgb(${mix(0, r!)}, ${mix(1, g!)}, ${mix(2, b!)})`;
}

/** WCAG relative luminance, from an `rgb(...)` string. */
function luminance(colour: string): number {
  const [r, g, b] = colour.match(/[\d.]+/g)!.slice(0, 3).map(Number) as [number, number, number];
  const channel = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)];
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

const AA_TEXT = 4.5;

test.describe('the brand on a button', () => {
  test('the label clears 4.5:1 on the fill, at rest, hovered and pressed', async ({ page }) => {
    await page.goto('/gallery/');
    const button = page.getByRole('button', { name: 'Send me a code' });
    await expect(button).toBeVisible();

    const read = async () => {
      const { backgroundColor, backgroundImage, label } = await button.evaluate((el) => {
        const style = getComputedStyle(el);
        return {
          backgroundColor: style.backgroundColor,
          backgroundImage: style.backgroundImage,
          label: style.color,
        };
      });
      return { fill: composite(backgroundColor, backgroundImage), label };
    };

    const rest = await read();
    expect(contrast(rest.fill, rest.label), `rest: ${rest.fill} / ${rest.label}`).toBeGreaterThanOrEqual(AA_TEXT);

    await button.hover();
    const hover = await read();
    expect(contrast(hover.fill, hover.label), `hover: ${hover.fill} / ${hover.label}`).toBeGreaterThanOrEqual(AA_TEXT);

    // Pressed is a real pointer press held open, because :active cannot be
    // forced any other way and the pressed fill is the one this theme names
    // per mode rather than leaving to a generic tint.
    const box = (await button.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    const pressed = await read();
    await page.mouse.up();
    expect(contrast(pressed.fill, pressed.label), `pressed: ${pressed.fill} / ${pressed.label}`).toBeGreaterThanOrEqual(AA_TEXT);

    // A press that changes nothing is a press somebody cannot tell landed.
    expect(pressed.fill, 'pressed looks identical to rest').not.toBe(rest.fill);

    // Hover only exists where there is a pointer that can hover. On a touch
    // device Astryx suppresses the hover layer entirely and rest === hover,
    // which is right: a finger has no hover, and a phone that paints one
    // leaves a button looking stuck after it is tapped.
    const canHover = await page.evaluate(() => matchMedia('(hover: hover)').matches);
    if (canHover) expect(hover.fill, 'hover looks identical to rest').not.toBe(rest.fill);
  });

  test('the quieter buttons carry the brand as text, and stay readable', async ({ page }) => {
    // Secondary and ghost are most of the controls in PAM — Help, Back,
    // Privacy, Send it again — and they take the brand as their label colour
    // rather than staying grey while the primary turns green.
    await page.goto('/gallery/');

    for (const name of ['Help', 'Get help']) {
      const control = page.getByRole('link', { name }).first();
      const { fill, label, parentFill } = await control.evaluate((el) => {
        const style = getComputedStyle(el);
        const behind = (node: HTMLElement | null): string => {
          for (let el = node; el; el = el.parentElement) {
            const bg = getComputedStyle(el).backgroundColor;
            if (bg && !bg.startsWith('rgba(0, 0, 0, 0)')) return bg;
          }
          return 'rgb(255, 255, 255)';
        };
        return {
          fill: style.backgroundColor,
          label: style.color,
          parentFill: behind(el.parentElement),
        };
      });

      // A ghost button has no fill of its own, so the page behind it is what
      // its label has to be legible against.
      const ground = fill.startsWith('rgba(0, 0, 0, 0)') ? parentFill : fill;
      expect(contrast(ground, label), `${name}: ${label} on ${ground}`).toBeGreaterThanOrEqual(AA_TEXT);
    }
  });

  test('the focus ring is the brand, and stands out from the page', async ({ page }) => {
    // 3:1 against what surrounds it — the rule for a non-text indicator.
    await page.goto('/signin/');
    const field = page.getByLabel('Your phone number');
    await field.focus();

    const { ring, page: ground } = await field.evaluate((el) => ({
      ring: getComputedStyle(el.parentElement as HTMLElement).outlineColor,
      page: getComputedStyle(document.body).backgroundColor,
    }));

    expect(contrast(ring, ground), `ring ${ring} on ${ground}`).toBeGreaterThanOrEqual(3);
  });
});
