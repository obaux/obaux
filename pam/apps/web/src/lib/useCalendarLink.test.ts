import { describe, expect, it, vi } from 'vitest';
// The alert's provider draws with StyleX, which is compiled by the app's build, not by this test; only the helpers are under test here.
vi.mock('./malfunction', () => ({ useMalfunction: () => ({ show: () => undefined, clear: () => undefined }) }));

import { appleUrl, feedUrl, isAppleDevice } from './useCalendarLink';

describe('isAppleDevice', () => {
  it('is true for iPhone, iPad and Mac', () => {
    expect(isAppleDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 26_6 like Mac OS X) AppleWebKit/605.1.15 Safari/604.1')).toBe(true);
    expect(isAppleDevice('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X) AppleWebKit/605.1.15')).toBe(true);
    expect(isAppleDevice('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15')).toBe(true);
    expect(isAppleDevice('', 'MacIntel')).toBe(true);
  });
  it('is false on Android, Windows and Linux, where a webcal address opens nothing', () => {
    expect(isAppleDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126 Mobile Safari/537.36')).toBe(false);
    expect(isAppleDevice('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/126')).toBe(false);
    expect(isAppleDevice('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/126')).toBe(false);
  });
  it('shows the button when the device cannot be told', () => {
    expect(isAppleDevice('')).toBe(true);
    expect(isAppleDevice('SomeOtherBrowser/1.0')).toBe(true);
  });
});

describe('the addresses', () => {
  it('are the same address, over https and as webcal', () => {
    expect(appleUrl('abc')).toBe(feedUrl('abc').replace(/^https:/, 'webcal:'));
    expect(feedUrl('abc')).toMatch(/\/functions\/v1\/calendar-feed\/abc\.ics$/);
  });
});
