import { existsSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { HELP_DESK_URL, HELP_SAFETY_URL } from './helpDesk';
import { APP_URL, SITE_URL } from './project';

/**
 * The app's Help screen leads to the help desk on the website (A28). These fail if the route
 * moves on the site, or if the two apps stop agreeing on where the website is.
 */
const SITE = new URL('../../../site/src/', import.meta.url);

describe('the help desk address', () => {
  it('is the support centre on the website, not on the app', () => {
    expect(HELP_DESK_URL).toBe(`${SITE_URL}/support/`);
    expect(HELP_DESK_URL.startsWith(APP_URL)).toBe(false);
    expect(HELP_DESK_URL).toMatch(/^https:\/\/.+\/support\/$/);
  });

  it('has a Your safety post under it, which Talk to someone now opens', () => {
    expect(HELP_SAFETY_URL).toBe(`${HELP_DESK_URL}your-safety/`);
  });

  it('is a page the website builds', () => {
    expect(existsSync(new URL('app/(site)/support/page.tsx', SITE))).toBe(true);
  });

  it('is on the same website address the site itself uses', () => {
    // Same default in both places ("change both together"); an override is the build's own.
    const links = readFileSync(new URL('lib/links.ts', SITE), 'utf8');
    const siteDefault = /NEXT_PUBLIC_SITE_URL'\]\s*\?\?\s*'([^']+)'/.exec(links)?.[1];
    const appDefault = /NEXT_PUBLIC_SITE_URL'\]\s*\?\?\s*'([^']+)'/.exec(
      readFileSync(new URL('../lib/project.ts', import.meta.url), 'utf8'),
    )?.[1];
    expect(siteDefault, 'apps/site/src/lib/links.ts SITE_URL default not found').toBeDefined();
    expect(appDefault).toBe(siteDefault);
  });
});
