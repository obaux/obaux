import { describe, expect, it } from 'vitest';
import { APP_URL, legalUrl } from '../src/lib/links';

describe('links to Privacy and Terms carry where the reader came from (D-508)', () => {
  it('names the site and the page, encoded', () => {
    expect(legalUrl('privacy', '/support/start-here/')).toBe(`${APP_URL}/privacy/?from=site&return=%2Fsupport%2Fstart-here%2F`);
    expect(legalUrl('terms', '/')).toBe(`${APP_URL}/terms/?from=site&return=%2F`);
  });

  it('does not let a path break out of its own parameter', () => {
    const url = legalUrl('privacy', '/a&from=signin#x');
    expect(new URL(url).searchParams.get('from')).toBe('site');
    expect(new URL(url).searchParams.get('return')).toBe('/a&from=signin#x');
  });
});
