import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareSheet, shareText } from '../src/share.js';

type G = { Capacitor?: unknown };

afterEach(() => {
  delete (globalThis as G).Capacitor;
  // jsdom has no navigator.share; tests that add one remove it here.
  delete (navigator as { share?: unknown }).share;
});

describe('shareText (D-350)', () => {
  it('uses the native plugin inside the app, Android included', async () => {
    const share = vi.fn().mockResolvedValue({});
    (globalThis as G).Capacitor = { isNativePlatform: () => true, Plugins: { Share: { share } } };
    expect(canShareSheet()).toBe(true);
    expect(await shareText('Come with me', 'Bring a friend')).toBe(true);
    expect(share).toHaveBeenCalledWith({ text: 'Come with me', title: 'Bring a friend', dialogTitle: 'Bring a friend' });
  });

  it("uses the browser's sheet in a phone's browser", async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    expect(canShareSheet()).toBe(true);
    expect(await shareText('Come with me')).toBe(true);
    expect(share).toHaveBeenCalledWith({ text: 'Come with me' });
  });

  it('says there is no sheet on a desktop browser, so the caller copies', async () => {
    expect(canShareSheet()).toBe(false);
    expect(await shareText('Come with me')).toBe(false);
  });

  it('a closed sheet is not a failure', async () => {
    const share = vi.fn().mockRejectedValue(new Error('AbortError'));
    (globalThis as G).Capacitor = { isNativePlatform: () => true, Plugins: { Share: { share } } };
    expect(await shareText('Come with me')).toBe(true);
  });

  it('ignores the plugin on the web build, where Capacitor is not native', () => {
    (globalThis as G).Capacitor = { isNativePlatform: () => false, Plugins: { Share: { share: vi.fn() } } };
    expect(canShareSheet()).toBe(false);
  });
});
