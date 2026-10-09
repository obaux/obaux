'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

/**
 * A page title that steps down to fit (D-413).
 *
 * Titles are drawn at 34px, which holds "Privacy" and "Notificaciones" on a
 * 320px screen. It does not hold "Конфиденциальность" — one word, 380px wide —
 * and a word cannot wrap. Every other piece of text in Pam wraps when it runs
 * out of room; a title that is *one word* has nowhere to go, so it gets
 * smaller, only as far as it has to (34 → 30 → 27 → 24px). Body text, buttons
 * and labels never shrink: they are the words somebody reads to act, and Pam
 * sets them at a size an older reader can see. If even the smallest step is
 * too wide, the word breaks (`overflow-wrap: anywhere`) — a last resort,
 * never a crop.
 *
 * **Measured once, not searched for.** The widest word is measured at the
 * largest size (a canvas, in the heading's own font), and the size is worked
 * out from that: width scales with size. Trying sizes one after another and
 * reading the page between them looks simpler, and does not work for somebody
 * who has asked their phone to reduce motion — Pam gives those readers a
 * near-zero transition, and a style read in the same frame as a change still
 * returns the old value (found by the audit, which runs that way).
 *
 * Right for any language and any word, after fonts load and when the width
 * changes (turning the phone), rather than a table of the ones somebody
 * thought of. Chinese needs none of it: it breaks between any two characters.
 */
export const TITLE_SIZES = [34, 30, 27, 24] as const;

// Layout effects warn on a server render in older React; there is nothing to
// measure there, and the static page paints at full size until it hydrates.
const useLayout = typeof window === 'undefined' ? useEffect : useLayoutEffect;

/** Characters a browser may break between: no word to be too wide. */
const BREAKS_ANYWHERE = /[⺀-鿿豈-﫿＀-￯]/;

let canvas: CanvasRenderingContext2D | null | undefined;
function context(): CanvasRenderingContext2D | null {
  if (canvas === undefined) canvas = document.createElement('canvas').getContext('2d');
  return canvas;
}

function widestWord(text: string, el: HTMLElement): number {
  const ctx = context();
  if (!ctx) return 0;
  const css = getComputedStyle(el);
  ctx.font = `${css.fontStyle} ${css.fontWeight} ${TITLE_SIZES[0]}px ${css.fontFamily}`;
  let widest = 0;
  for (const word of text.split(/[\s­-]+/)) {
    if (word && !BREAKS_ANYWHERE.test(word)) widest = Math.max(widest, ctx.measureText(word).width);
  }
  return widest;
}

export function useFitTitle<T extends HTMLElement>(text: string) {
  const ref = useRef<T | null>(null);
  // Bumped when the width changes or a font arrives: a fresh fit is wanted.
  const [pass, setPass] = useState(0);
  const [fit, setFit] = useState<{ size: number; mustBreak: boolean }>({ size: TITLE_SIZES[0], mustBreak: false });

  useLayout(() => {
    const el = ref.current;
    // Nothing to fit while it is hidden (a title read out but not drawn).
    if (!el || el.clientWidth < 2) return;
    const room = el.clientWidth;
    const widest = widestWord(text, el);
    const size = TITLE_SIZES.find((px) => (widest * px) / TITLE_SIZES[0] <= room);
    const next = size === undefined
      ? { size: TITLE_SIZES[TITLE_SIZES.length - 1]!, mustBreak: true }
      : { size, mustBreak: false };
    setFit((was) => (was.size === next.size && was.mustBreak === next.mustBreak ? was : next));
  }, [text, pass]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let width = el.clientWidth;
    const again = () => setPass((n) => n + 1);
    const watcher = typeof ResizeObserver === 'undefined'
      ? null
      : new ResizeObserver(() => {
          if (el.clientWidth !== width) {
            width = el.clientWidth;
            again();
          }
        });
    watcher?.observe(el);
    let live = true;
    void document.fonts?.ready.then(() => live && again());
    return () => {
      live = false;
      watcher?.disconnect();
    };
  }, []);

  return { ref, size: fit.size, mustBreak: fit.mustBreak };
}
