import { describe, expect, it } from 'vitest';
import { appUrl, inviteLink } from './appUrl';
import { APP_URL } from './project';

describe('the address every invite points at', () => {
  it('is the checked-in address, so a link works with nothing configured', () => {
    // The failure this prevents: a deploy where a dashboard field was left
    // blank, and every invite text carries a link to localhost.
    expect(appUrl()).toBe(APP_URL);
    expect(appUrl()).toMatch(/^https:\/\//);
  });

  it('carries no trailing slash, so a link never doubles one', () => {
    expect(appUrl().endsWith('/')).toBe(false);
  });

  it('builds an invite link from it', () => {
    expect(inviteLink('9T3YTVMT')).toBe(`${APP_URL}/j/9T3YTVMT`);
  });

  it('escapes the code rather than trusting it', () => {
    expect(inviteLink('AB/CD?x')).toBe(`${APP_URL}/j/AB%2FCD%3Fx`);
  });
});
