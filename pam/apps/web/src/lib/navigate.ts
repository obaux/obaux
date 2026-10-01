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
