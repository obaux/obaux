import { describe, expect, it, afterEach } from 'vitest';
import { appUrl, inviteLink } from './appUrl';

const original = process.env['NEXT_PUBLIC_APP_URL'];
afterEach(() => {
  if (original === undefined) delete process.env['NEXT_PUBLIC_APP_URL'];
  else process.env['NEXT_PUBLIC_APP_URL'] = original;
});

describe('the address every invite points at', () => {
  it('uses the configured public URL', () => {
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://pam.example.app';
    expect(inviteLink('9T3YTVMT')).toBe('https://pam.example.app/j/9T3YTVMT');
  });

  it('tolerates a trailing slash, which a hosting dashboard will add', () => {
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://pam.example.app/';
    expect(appUrl()).toBe('https://pam.example.app');
  });

  it('escapes the code rather than trusting it', () => {
    process.env['NEXT_PUBLIC_APP_URL'] = 'https://pam.example.app';
    expect(inviteLink('AB/CD?x')).toBe('https://pam.example.app/j/AB%2FCD%3Fx');
  });
});
