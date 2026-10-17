'use client';

import { useEffect } from 'react';

/**
 * A row opens from anywhere on it (Will, 17 October: "it doesn't let me click on those items with a simple tap").
 *
 * Astryx's `Item`, for a row with an `href`, draws its link only around the label: a flex child between the icon and the chevron,
 * as tall as the words. A tap on the icon, on the chevron, or on the 20px above and below the words lands on the `<li>`, whose own
 * click handler only calls `onClick`, and a link row has none. So only the words opened the row: 31% of a Profile row, 22% of
 * Language. About 54 uses in 35 files sit on that one `Item` (every `MenuList`, every `ListItem` with an `href`).
 *
 * One handler for the whole app, on the document: a click inside an `.astryx-item` that has a direct child `<a href>`, and whose
 * target is not itself something that acts (a link, a button, a field, a switch…), clicks that link as a real tap on it would.
 * Next's client navigation and `target="_blank"` then behave as they always did. A modified click (new tab, new window) is left
 * alone.
 *
 * Also one empty `touchstart` listener on the page: Safari on iOS applies `:active` (every press colour in Astryx, and the press
 * layer to come) only on a page that has one.
 */
const ACTS =
  'a, button, input, select, textarea, label, summary, [role="button"], [role="switch"], [role="checkbox"], [role="radio"], [role="link"], [role="menuitem"], [contenteditable="true"]';

export function openRowOnTap(event: MouseEvent): void {
  if (event.defaultPrevented || event.button !== 0) return;
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
  const target = event.target;
  if (!(target instanceof Element) || target.closest(ACTS)) return;
  const row = target.closest('.astryx-item');
  if (!row || row.getAttribute('aria-disabled') === 'true' || row.hasAttribute('data-disabled')) return;
  const link = Array.from(row.children).find((child): child is HTMLAnchorElement => child instanceof HTMLAnchorElement && child.hasAttribute('href'));
  link?.click();
}

/** Mount once, in the app shell (and in Storybook's decorator). */
export function useRowTaps(): void {
  useEffect(() => {
    const noop = () => {};
    document.addEventListener('click', openRowOnTap);
    document.addEventListener('touchstart', noop, { passive: true });
    return () => {
      document.removeEventListener('click', openRowOnTap);
      document.removeEventListener('touchstart', noop);
    };
  }, []);
}
