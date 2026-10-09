import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { PlaceDetail } from '../src/PlaceDetail.js';
import { appleMapsHref, directionsHref } from '../src/PlaceCard.js';

const labels = {
  directions: 'How to get there',
  call: 'Call',
  website: 'Website',
  hours: 'Hours',
  hoursOnGoogle: 'Check hours on Google',
  about: 'About',
  address: 'Address',
  save: 'Save',
  saved: 'Saved',
  share: 'Share',
  flag: 'Report',
};

const addressActions = {
  appleMapsHref: 'https://maps.apple.com/?daddr=1231%20N%20Broad%20St',
  labels: {
    copy: 'Copy address',
    copied: 'Address copied',
    copyFailed: 'Could not copy. Press and hold the address to copy it.',
    appleMaps: 'Open in Apple Maps',
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

  it('offers a copy button and an Apple Maps link beside the address', () => {
    render(place({ addressActions }));
    expect(screen.getByText('1231 N Broad St, North Philadelphia')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeTruthy();
    const link = screen.getByRole('link', { name: 'Open in Apple Maps' });
    expect(link.getAttribute('href')).toBe(addressActions.appleMapsHref);
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
    expect(screen.queryByRole('link', { name: 'Open in Apple Maps' })).toBeNull();
    rerender(place({ address: null, addressActions }));
    expect(screen.queryByRole('button', { name: 'Copy address' })).toBeNull();
  });

  it('leaves the Apple Maps link out when there is no link to give', () => {
    render(place({ addressActions: { ...addressActions, appleMapsHref: null } }));
    expect(screen.getByRole('button', { name: 'Copy address' })).toBeTruthy();
    expect(screen.queryByRole('link', { name: 'Open in Apple Maps' })).toBeNull();
  });
});
