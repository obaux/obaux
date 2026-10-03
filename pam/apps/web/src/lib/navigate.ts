/**
 * A full-page navigation that something embedding the app can take over.
 *
 * In the app this is `window.location.assign(href)` and nothing else. It
 * first announces `pam:navigate`, cancelable, so Storybook's clickable
 * prototype (D-211) can show the screen itself instead of loading a URL that
 * does not exist inside Storybook — a page cannot override
 * `location.assign`, but it can listen for this.
 */
export function navigate(href: string): void {
  const proceed = window.dispatchEvent(new CustomEvent('pam:navigate', { detail: href, cancelable: true }));
  if (proceed) window.location.assign(href);
}

/**
 * One screen back, the way the browser's Back would go (D-250) — for a
 * screen that can be reached from more than one place, such as the legal
 * pages opened from Sign in. Announces `pam:back` first, cancelable, for the
 * Storybook prototype; otherwise `history.back()`. With nowhere to go back
 * to (the page was opened directly), goes to `fallback` instead.
 */
export function goBack(fallback: string): void {
  const proceed = window.dispatchEvent(new CustomEvent('pam:back', { cancelable: true }));
  if (!proceed) return;
  if (window.history.length > 1) window.history.back();
  else window.location.assign(fallback);
}
