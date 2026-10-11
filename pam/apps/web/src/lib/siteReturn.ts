import { SITE_URL } from './project';

/**
 * Where a legal page opened from the website goes Back to (D-508).
 *
 * The website's footer links here with `?from=site&return=<its own path>`. The
 * value comes out of a URL anybody can write, so it is trusted for nothing but
 * being a path on the website: it starts with a single "/", has no "//", no
 * backslash (browsers read `/\` as `//`), no scheme, no control or space
 * characters, and is not absurdly long. It is then joined onto the fixed site
 * address, so it cannot name another host whatever it holds. Anything else is
 * `null` and the page behaves as if it had not been opened from the site.
 */
const SAFE_PATH = /^\/[A-Za-z0-9\-._~!$&'()*+,;=:@%/?#]*$/;
const MAX_LENGTH = 200;

export function siteReturnPath(value: string | null | undefined): string | null {
  if (!value || value.length > MAX_LENGTH) return null;
  if (!SAFE_PATH.test(value)) return null;
  if (value.startsWith('//') || value.includes('//')) return null;
  if (value.includes(':') && /^\/[^/?#]*:/.test(value)) return null;
  return value;
}

/** The website address for a checked return path. */
export function siteReturnUrl(path: string): string {
  return `${SITE_URL}${path}`;
}
