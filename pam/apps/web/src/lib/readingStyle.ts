import type { Decor } from '@pam/ui/Reading';

/**
 * How the long, important screens look (Will, 9 October, D-416): "icons" draws a
 * small round icon on each card and a tick or a cross on each row; "plain" is
 * words only. Both are built so they can be judged side by side in Storybook
 * (Member › Reading options); this is the one line that picks what the app
 * itself shows, until Will decides.
 */
export const READING_STYLE: Decor = 'plain';

/** Reads `?decor=icons|plain` — Storybook's way of showing both on the same screen. */
export function decorFromParam(value: string | null | undefined): Decor {
  return value === 'icons' ? 'icons' : value === 'plain' ? 'plain' : READING_STYLE;
}
