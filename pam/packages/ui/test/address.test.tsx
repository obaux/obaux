import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlaceDetail } from '../src/PlaceDetail.js';
import { appleMapsHref, directionsHref } from '../src/PlaceCard.js';

const labels = {
  hours: 'Hours',
  hoursOnGoogle: 'Check hours on Google',
  about: 'About',
  address: 'Address',
};

const addressActions = {
  googleMapsHref: 'https://www.google.com/maps/dir/?api=1&destination=1231%20N%20Broad%20St',
  appleMapsHref: 'https://maps.apple.com/?daddr=1231%20N%20Broad%20St',
  labels: {
    copy: 'Copy address',
    copied: 'Address copied',
    copyFailed: 'Could not copy. Press and hold the address to copy it.',
    openIn: 'Open in…',
    openInTitle: 'Open in',
    googleMaps: 'Google Maps',
    appleMaps: 'Apple Maps',
    opensInApp: 'Opens in app',
  },
};

afterEach(() => {
  vi.restoreAllMocks();
});

describe('appleMapsHref (Will, 9 October 2026)', () => {
  it('sends Apple Maps to the address, spelled so it survives a link', () => {
    expect(appleMapsHref('1231 N Broad St, Philadelphia, PA')).toBe(
      'https://maps.apple.com/?daddr=1231%20N%20Broad%20St%2C%20Philadelphia%2C%20PA',
    );
  });

  it('prefers coordinates to the address, as the Google link does', () => {
    expect(appleMapsHref('1231 N Broad St', 39.97, -75.16)).toBe('https://maps.apple.com/?daddr=39.97%2C-75.16');
    // The two maps apps are sent to the same door.
    expect(directionsHref('1231 N Broad St', 39.97, -75.16)).toContain(encodeURIComponent('39.97,-75.16'));
  });

  it('has nothing to say when there is nowhere to go', () => {
    expect(appleMapsHref(null)).toBeUndefined();
    expect(appleMapsHref('')).toBeUndefined();
    expect(appleMapsHref(undefined, undefined, undefined)).toBeUndefined();
  });
});

describe('the address card', () => {
  const place = (extra: Partial<Parameters<typeof PlaceDetail>[0]> = {}) => (
    <main>
      <PlaceDetail
        category="education"
        categoryLabel="School and training"
        description="GED classes."
        address="1231 N Broad St, North Philadelphia"
        labels={labels}
        {...extra}
      />
    </main>
  );

  it('offers a small copy button, and the address itself opens the maps drawer', () => {
    render(place({ addressActions }));
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeTruthy();
    // The address is the link: its words are what is shown, and its spoken name
    // says what it does. There is no separate "Open in…" line.
    const link = screen.getByRole('button', { name: '1231 N Broad St, North Philadelphia. Open in…' });
    expect(link.textContent).toBe('1231 N Broad St, North Philadelphia');
    expect(link.getAttribute('aria-haspopup')).toBe('dialog');
    expect(screen.queryByText('Open in…')).toBeNull();
    // The apps are behind the drawer, not on the card.
    expect(screen.queryByRole('link', { name: /Google Maps/ })).toBeNull();
    expect(screen.queryByRole('link', { name: /Apple Maps/ })).toBeNull();
  });

  it('opens a drawer with Google Maps and Apple Maps, each a link to that app', async () => {
    render(place({ addressActions }));
    fireEvent.click(screen.getByRole('button', { name: /Open in…$/ }));
    const google = await screen.findByRole('link', { name: /^Google Maps/ });
    const apple = await screen.findByRole('link', { name: /^Apple Maps/ });
    expect(google.getAttribute('href')).toBe(addressActions.googleMapsHref);
    expect(apple.getAttribute('href')).toBe(addressActions.appleMapsHref);
    // Each row carries the app's own icon, as a picture with no words of its own
    // (the row's name says which app), the pair drawn at one size.
    const rowOf = (link: HTMLElement) => link.closest('li') ?? link.parentElement!.parentElement!;
    const gIcon = rowOf(google).querySelector('img');
    const aIcon = rowOf(apple).querySelector('img');
    expect(gIcon?.getAttribute('src')).toBe('/maps/google-maps.webp');
    expect(aIcon?.getAttribute('src')).toBe('/maps/apple-maps.webp');
    expect(gIcon?.getAttribute('alt')).toBe('');
    expect(aIcon?.getAttribute('alt')).toBe('');
    expect(gIcon?.getAttribute('width')).toBe(aIcon?.getAttribute('width'));
  });

  it('says under each app\'s name that it opens in the app', async () => {
    render(place({ addressActions }));
    fireEvent.click(screen.getByRole('button', { name: /Open in…$/ }));
    await screen.findByRole('link', { name: /Google Maps/ });
    expect(screen.getAllByText('Opens in app')).toHaveLength(2);
  });

  describe('on a phone', () => {
    const asDevice = (userAgent: string) =>
      vi.spyOn(window.navigator, 'userAgent', 'get').mockReturnValue(userAgent);

    it('on Android, sends Google Maps through an intent that falls back to the Play Store, and has no Apple Maps', async () => {
      asDevice('Mozilla/5.0 (Linux; Android 14; Pixel 8) Chrome/126.0.0.0 Mobile Safari/537.36');
      render(place({ addressActions }));
      fireEvent.click(screen.getByRole('button', { name: /Open in…$/ }));
      const google = await screen.findByRole('link', { name: /Google Maps/ });
      await waitFor(() => expect(google.getAttribute('href')).toMatch(/^intent:\/\//));
      expect(google.getAttribute('href')).toContain('S.browser_fallback_url=');
      expect(google.getAttribute('href')).toContain('play.google.com');
      expect(screen.queryByRole('link', { name: /Apple Maps/ })).toBeNull();
    });

    it('on an iPhone, tries the Google Maps app and then the App Store, and keeps Apple Maps', async () => {
      vi.useFakeTimers({ shouldAdvanceTime: true });
      asDevice('Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) Mobile/15E148 Safari/604.1');
      const assign = vi.fn();
      const original = window.location;
      Object.defineProperty(window, 'location', {
        configurable: true,
        value: Object.defineProperty({ ...original }, 'href', { set: assign, get: () => original.href }),
      });
      try {
        render(place({ addressActions }));
        fireEvent.click(screen.getByRole('button', { name: /Open in…$/ }));
        const apple = await screen.findByRole('link', { name: /Apple Maps/ });
        expect(apple.getAttribute('href')).toBe(addressActions.appleMapsHref);
        // Only script can tell whether the app is there, so this one is a button.
        const google = await screen.findByRole('button', { name: /Google Maps/ });
        fireEvent.click(google);
        expect(assign).toHaveBeenCalledWith(expect.stringMatching(/^comgooglemaps:\/\/\?daddr=/));
        vi.advanceTimersByTime(2100);
        expect(assign).toHaveBeenLastCalledWith(expect.stringContaining('apps.apple.com'));
      } finally {
        Object.defineProperty(window, 'location', { configurable: true, value: original });
        vi.useRealTimers();
      }
    });
  });

  it('offers only the app it has a link for', async () => {
    render(place({ addressActions: { ...addressActions, googleMapsHref: null } }));
    fireEvent.click(screen.getByRole('button', { name: /Open in…$/ }));
    expect(await screen.findByRole('link', { name: /^Apple Maps/ })).toBeTruthy();
    expect(screen.queryByRole('link', { name: /Google Maps/ })).toBeNull();
  });

  it('puts exactly the address on the clipboard — plain words, nothing hidden', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    render(place({ addressActions }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));
    await waitFor(() => expect(writeText).toHaveBeenCalledWith('1231 N Broad St, North Philadelphia'));
    expect(await screen.findByText('Address copied')).toBeTruthy();
  });

  it('says what to do instead when the clipboard refuses', async () => {
    Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
    render(place({ addressActions }));
    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }));
    expect(await screen.findByText(/Press and hold the address/)).toBeTruthy();
  });

  it('is only the words when nobody asks for the actions, or there is no address', () => {
    const { rerender } = render(place());
    expect(screen.queryByRole('button', { name: 'Copy address' })).toBeNull();
    expect(screen.queryByRole('button', { name: /Open in…/ })).toBeNull();
    rerender(place({ address: null, addressActions }));
    expect(screen.queryByRole('button', { name: 'Copy address' })).toBeNull();
  });

  it('leaves the address as plain words when there is no link to give, but keeps copy', () => {
    render(place({ addressActions: { ...addressActions, googleMapsHref: null, appleMapsHref: null } }));
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeTruthy();
    expect(screen.getByText('1231 N Broad St, North Philadelphia').closest('button')).toBeNull();
    expect(screen.queryByRole('button', { name: /Open in…/ })).toBeNull();
  });
});
