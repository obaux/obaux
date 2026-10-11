import { describe, expect, it } from 'vitest';
import { siteReturnPath, siteReturnUrl } from './siteReturn';

describe('siteReturnPath (D-508)', () => {
  it.each(['/', '/support/start-here/', '/for-families/?x=1', '/a/b#top'])('accepts %s', (v) => {
    expect(siteReturnPath(v)).toBe(v);
  });

  it.each([
    null,
    undefined,
    '',
    'support/',
    '//evil.example',
    '/\\evil.example',
    '/\\/evil.example',
    'https://evil.example/',
    'javascript:alert(1)',
    '/a//b',
    '/x y',
    '/x\n',
    '/%0d%0a'.replace('%0d%0a', '\u0000'),
    `/${'a'.repeat(300)}`,
  ])('rejects %j', (v) => {
    expect(siteReturnPath(v as string | null | undefined)).toBeNull();
  });

  it('joins onto the fixed site address', () => {
    expect(siteReturnUrl('/support/')).toBe('https://joinpam.org/support/');
  });
});
