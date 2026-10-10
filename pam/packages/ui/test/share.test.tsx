import { afterEach, describe, expect, it, vi } from 'vitest';
import { canShareSheet, shareText } from '../src/share.js';
import { copyLink } from '../src/clipboard.js';

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

describe('what leaves the app carries no isolates (D-435)', () => {
  // In Arabic `t` puts invisible first-strong isolates round each value, so a
  // sentence that mentions a link would hand somebody else's phone a link with
  // a character stuck to it. Whoever built the string, it is scrubbed here.
  const ISOLATED = 'تعال معي: \u2068https://pam.example/p?id=1\u2069';
  const PLAIN = 'تعال معي: https://pam.example/p?id=1';

  it('is taken out of the text given to the share sheet, native and browser', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    (globalThis as G).Capacitor = { isNativePlatform: () => true, Plugins: { Share: { share } } };
    await shareText(ISOLATED);
    expect(share).toHaveBeenCalledWith({ text: PLAIN });

    delete (globalThis as G).Capacitor;
    const browserShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: browserShare, configurable: true });
    await shareText(ISOLATED);
    expect(browserShare).toHaveBeenCalledWith({ text: PLAIN });
  });

  it('is taken out of what is copied', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    expect(await copyLink(ISOLATED)).toBe(true);
    expect(writeText).toHaveBeenCalledWith(PLAIN);
    delete (navigator as { clipboard?: unknown }).clipboard;
  });

  it('leaves marks a name may carry on purpose, and all other text, as it was', async () => {
    const share = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'share', { value: share, configurable: true });
    await shareText('a\u200Eb \u061C c');
    expect(share).toHaveBeenCalledWith({ text: 'a\u200Eb \u061C c' });
  });
});
