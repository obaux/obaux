import { describe, expect, it } from 'vitest';
import { appUrl, inviteLink, readInvite } from './appUrl';
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

  it('builds an invite link to sign in, with the code and who it is for (D-254)', () => {
    expect(inviteLink('9T3YTVMT', 'admin')).toBe(`${APP_URL}/signin/?invite=9T3YTVMT&as=case-manager`);
    expect(inviteLink('9T3YTVMT', 'provider')).toBe(`${APP_URL}/signin/?invite=9T3YTVMT&as=program`);
    expect(inviteLink('9T3YTVMT', 'member')).toBe(`${APP_URL}/signin/?invite=9T3YTVMT&as=member`);
  });

  it('escapes the code rather than trusting it', () => {
    expect(inviteLink('AB/CD?x', 'member')).toBe(`${APP_URL}/signin/?invite=AB%2FCD%3Fx&as=member`);
  });

  it('reads a link back, and a missing or odd role is a member', () => {
    const read = (q: string) => readInvite(new URLSearchParams(q));
    expect(read('invite=9t3ytvmt&as=case-manager')).toEqual({ code: '9T3YTVMT', role: 'admin' });
    expect(read('invite=9T3YTVMT&as=program')).toEqual({ code: '9T3YTVMT', role: 'provider' });
    expect(read('invite=9T3YTVMT&as=super-admin')).toEqual({ code: '9T3YTVMT', role: 'member' });
    expect(read('as=program')).toBeNull();
  });
});
