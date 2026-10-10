import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  APP_WAIT_MS,
  GOOGLE_MAPS_APP_STORE,
  GOOGLE_MAPS_PLAY_STORE,
  devicePlatform,
  mapsLaunchFor,
  openAppOrStore,
} from '../src/mapsLaunch.js';

const GOOGLE = 'https://www.google.com/maps/dir/?api=1&destination=1231%20N%20Broad%20St%2C%20Philadelphia';
const APPLE = 'https://maps.apple.com/?daddr=1231%20N%20Broad%20St%2C%20Philadelphia';

const IPHONE =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1';
const PIXEL =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';
const MAC =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15';

describe('devicePlatform', () => {
  it('tells an iPhone, an Android phone and a computer apart', () => {
    expect(devicePlatform(IPHONE)).toBe('ios');
    expect(devicePlatform(PIXEL)).toBe('android');
    expect(devicePlatform(MAC, 0)).toBe('other');
    expect(devicePlatform('jsdom')).toBe('other');
  });

  it('knows an iPad that calls itself a Mac, because a Mac has no touch screen', () => {
    expect(devicePlatform(MAC, 5)).toBe('ios');
  });
});

describe('mapsLaunchFor', () => {
  it('opens Google Maps on Android through an intent that falls back to the Play Store', () => {
    const launch = mapsLaunchFor('google', GOOGLE, 'android')!;
    expect(launch.href.startsWith('intent://www.google.com/maps/dir/?api=1&destination=')).toBe(true);
    expect(launch.href).toContain('scheme=https;package=com.google.android.apps.maps;');
    expect(launch.href).toContain(`S.browser_fallback_url=${encodeURIComponent(GOOGLE_MAPS_PLAY_STORE)};end`);
    expect(launch.isExternal).toBe(false);
    expect(launch.tryApp).toBeUndefined();
  });

  it('offers no Apple Maps on Android, where there is no such app', () => {
    expect(mapsLaunchFor('apple', APPLE, 'android')).toBeNull();
  });

  it('tries the Google Maps app on an iPhone, and has the App Store ready', () => {
    const launch = mapsLaunchFor('google', GOOGLE, 'ios')!;
    expect(launch.tryApp).toEqual({
      appUrl: `comgooglemaps://?daddr=${encodeURIComponent('1231 N Broad St, Philadelphia')}`,
      storeUrl: GOOGLE_MAPS_APP_STORE,
    });
    // Without script, the row is still Google's own link.
    expect(launch.href).toBe(GOOGLE);
  });

  it('carries coordinates to the iPhone app as they are', () => {
    const launch = mapsLaunchFor(
      'google',
      'https://www.google.com/maps/dir/?api=1&destination=39.97%2C-75.16&destination_place_id=abc',
      'ios',
    )!;
    expect(launch.tryApp?.appUrl).toBe('comgooglemaps://?daddr=39.97%2C-75.16');
  });

  it('gives Apple Maps on an iPhone as Apple\'s own link — the app comes with the phone', () => {
    expect(mapsLaunchFor('apple', APPLE, 'ios')).toEqual({ href: APPLE, isExternal: false });
  });

  it('gives a computer both maps\' web pages, in a new tab', () => {
    expect(mapsLaunchFor('google', GOOGLE, 'other')).toEqual({ href: GOOGLE, isExternal: true });
    expect(mapsLaunchFor('apple', APPLE, 'other')).toEqual({ href: APPLE, isExternal: true });
  });

  it('falls back to the plain link when a Google link has no destination to hand over', () => {
    const launch = mapsLaunchFor('google', 'https://www.google.com/maps/', 'ios')!;
    expect(launch.tryApp).toBeUndefined();
  });
});

describe('openAppOrStore', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  const fakeWindow = () => {
    const target = new EventTarget();
    const doc = Object.assign(new EventTarget(), { hidden: false });
    const win = Object.assign(target, { document: doc, location: { href: '' } });
    return win as unknown as Window & { location: { href: string }; document: Document & { hidden: boolean } };
  };

  it('tries the app first, then the store when nothing took the page', () => {
    const win = fakeWindow();
    openAppOrStore('comgooglemaps://?daddr=x', GOOGLE_MAPS_APP_STORE, win);
    expect(win.location.href).toBe('comgooglemaps://?daddr=x');
    vi.advanceTimersByTime(APP_WAIT_MS + 1);
    expect(win.location.href).toBe(GOOGLE_MAPS_APP_STORE);
  });

  it('leaves the store alone when the page was hidden — the app opened', () => {
    const win = fakeWindow();
    openAppOrStore('comgooglemaps://?daddr=x', GOOGLE_MAPS_APP_STORE, win);
    win.document.hidden = true;
    win.document.dispatchEvent(new Event('visibilitychange'));
    vi.advanceTimersByTime(APP_WAIT_MS * 3);
    expect(win.location.href).toBe('comgooglemaps://?daddr=x');
  });

  it('leaves the store alone when the page lost focus — a prompt, or the app', () => {
    const win = fakeWindow();
    openAppOrStore('comgooglemaps://?daddr=x', GOOGLE_MAPS_APP_STORE, win);
    win.dispatchEvent(new Event('blur'));
    vi.advanceTimersByTime(APP_WAIT_MS * 3);
    expect(win.location.href).toBe('comgooglemaps://?daddr=x');
  });
});
