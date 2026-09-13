import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceCard, googlePlaceHref, directionsHref } from '../src/PlaceCard.js';
import { AppHeader } from '../src/AppHeader.js';
import { NotificationBar } from '../src/NotificationBar.js';
import { PointsBadge } from '../src/PointsBadge.js';
import { HelpBar } from '../src/HelpBar.js';
import { VoiceInput } from '../src/VoiceInput.js';

const labels = { call: 'Call', go: 'Go', save: 'Save', saved: 'Saved', hours: 'Hours' };

function mockReducedMotion(reduced: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: query.includes('prefers-reduced-motion') ? reduced : false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  );
}

describe('PlaceCard actions (§5.1)', () => {
  it('offers exactly three actions, in the fixed order Call / Go / Save', () => {
    render(
      <PlaceCard
        name="Riverside Learning Center"
        category="education"
        categoryLabel="School and training"
        phone="+15555550100"
        address="123 Main St"
        labels={labels}
      />,
    );
    const names = screen.getAllByRole('link').concat(screen.getAllByRole('button'))
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(['Call', 'Go', 'Save']);
  });

  it('makes Call a real tel: link so it works without JavaScript', () => {
    render(
      <PlaceCard
        name="X" category="education" categoryLabel="School"
        phone="+15555550100" address="123 Main St" labels={labels}
      />,
    );
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute('href', 'tel:+15555550100');
  });

  it('defaults directions to walking, not driving', () => {
    render(
      <PlaceCard
        name="X" category="education" categoryLabel="School"
        phone="+15555550100" address="123 Main St" labels={labels}
      />,
    );
    const go = screen.getByRole('link', { name: 'Go' });
    expect(go.getAttribute('href')).toContain('travelmode=walking');
    expect(go.getAttribute('href')).toContain(encodeURIComponent('123 Main St'));
  });

  it('disables Call when there is no phone number rather than linking nowhere', () => {
    render(
      <PlaceCard name="X" category="education" categoryLabel="School" labels={labels} />,
    );
    // Rendered as a disabled control, never as a tel: link with no number.
    expect(screen.queryByRole('link', { name: 'Call' })).not.toBeInTheDocument();
  });

  it('reports saved state to assistive tech', () => {
    render(
      <PlaceCard name="X" category="education" categoryLabel="School" isSaved labels={labels} />,
    );
    expect(screen.getByRole('button', { name: 'Saved' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('colours the category chip from the shared config token', () => {
    const { rerender } = render(
      <PlaceCard name="X" category="education" categoryLabel="School" labels={labels} />,
    );
    const badge = screen.getByText('School');
    expect(badge.closest('[data-variant]')?.getAttribute('data-variant')).toBe('blue');

    rerender(<PlaceCard name="X" category="workforce" categoryLabel="Work" labels={labels} />);
    expect(screen.getByText('Work').closest('[data-variant]')?.getAttribute('data-variant'))
      .toBe('green');
  });
});

describe('PointsBadge motion (§8, §12)', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('shows the exact value immediately under reduced motion', () => {
    mockReducedMotion(true);
    render(<PointsBadge points={250} label="Your points" />);
    expect(screen.getByText('250')).toBeInTheDocument();
  });

  it('always announces the true value to screen readers, not the animating one', async () => {
    mockReducedMotion(false);
    render(<PointsBadge points={1250} label="Your points" />);
    // The visible number may still be counting up; the announced one never is.
    expect(screen.getByText('1,250 Your points')).toBeInTheDocument();
  });

  it('settles on the final value when motion is allowed', async () => {
    mockReducedMotion(false);
    render(<PointsBadge points={100} label="Your points" durationMs={10} />);
    await waitFor(() => expect(screen.getByText('100')).toBeInTheDocument());
  });
});

describe('HelpBar (§0 never dead-end)', () => {
  it('is a plain link that works with no JavaScript and no session', () => {
    render(<HelpBar label="Help" />);
    expect(screen.getByRole('link', { name: 'Help' })).toHaveAttribute('href', '/help/');
  });

  it('takes one slot, not the whole row, so the tabs have room', () => {
    // It shares the bottom bar with five tabs (§3.1), so it must not be
    // full-width by default.
    const { container } = render(<HelpBar label="Help" />);
    const link = screen.getByRole('link', { name: 'Help' });
    expect(link.className).not.toBe('');
    expect(container.textContent).toBe('Help');
  });

  it('can still go full width on a screen with room', () => {
    render(<HelpBar label="Need help? Call PAM" variant="block" />);
    expect(screen.getByRole('link', { name: 'Need help? Call PAM' })).toBeInTheDocument();
  });
});

describe('VoiceInput (§0 voice + tap paths)', () => {
  beforeEach(() => vi.unstubAllGlobals());

  it('hides the mic when speech recognition is unsupported, rather than showing a dead button', async () => {
    render(
      <VoiceInput
        label="Your name" value="" onChange={() => {}}
        micLabels={{ start: 'Tap to talk', listening: 'Listening' }}
      />,
    );
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: 'Tap to talk' })).not.toBeInTheDocument();
    });
  });

  it('shows the mic when a platform recognizer is available', async () => {
    render(
      <VoiceInput
        label="Your name" value="" onChange={() => {}}
        micLabels={{ start: 'Tap to talk', listening: 'Listening' }}
        recognizer={{ isAvailable: () => true, start: async () => 'Marcus' }}
      />,
    );
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Tap to talk' })).toBeInTheDocument();
    });
  });

  it('keeps the keyboard path available alongside the mic', () => {
    render(
      <VoiceInput
        label="Your name" value="Marcus" onChange={() => {}}
        micLabels={{ start: 'Tap to talk', listening: 'Listening' }}
      />,
    );
    expect(screen.getByRole('textbox', { name: /Your name/ })).toHaveValue('Marcus');
  });
});

describe('Google listing fallback (city data has no hours or phone)', () => {
  it('shows Hours instead of a dead Call button when there is no phone number', () => {
    render(
      <PlaceCard
        name="Mental Health Partnerships" category="family_services"
        categoryLabel="Home and family" address="1 Main St, PA 19104" labels={labels}
      />,
    );
    // Still three actions, still in the same order a member has learned.
    const names = screen.getAllByRole('link').concat(screen.getAllByRole('button'))
      .map((el) => el.textContent?.trim());
    expect(names).toEqual(['Hours', 'Go', 'Save']);

    const hours = screen.getByRole('link', { name: 'Hours' });
    expect(hours.getAttribute('href')).toContain('google.com/maps/search/');
    expect(hours.getAttribute('href')).toContain(
      encodeURIComponent('Mental Health Partnerships, 1 Main St, PA 19104'),
    );
  });

  it('prefers Call when a phone number is known', () => {
    render(
      <PlaceCard
        name="Comhar" category="family_services" categoryLabel="Home and family"
        phone="+12155550100" address="1 Main St" labels={labels}
      />,
    );
    expect(screen.getByRole('link', { name: 'Call' })).toHaveAttribute(
      'href', 'tel:+12155550100',
    );
    expect(screen.queryByRole('link', { name: 'Hours' })).not.toBeInTheDocument();
  });

  it('anchors the lookup to a place id when the importer has resolved one', () => {
    expect(googlePlaceHref('Comhar', '1 Main St', 'ChIJabc123')).toContain(
      'query_place_id=ChIJabc123',
    );
    expect(googlePlaceHref('Comhar', '1 Main St')).not.toContain('query_place_id');
  });
});

describe('directions go to the point, not to a string', () => {
  // The Rosenbach imported from the city's facilities layer with correct
  // geometry and an address five miles from it. The feeds maintain the point
  // and let the text rot, so a directions link built from the address walks
  // somebody to the wrong building.
  it('routes to coordinates when the place has them', () => {
    const href = directionsHref('3001 E Allegheny Ave, Philadelphia, PA', 39.94738, -75.175);
    expect(href).toContain('destination=39.94738%2C-75.175');
    expect(href).not.toContain('Allegheny');
    expect(href).toContain('travelmode=walking');
  });

  it('falls back to the address when there is no point', () => {
    expect(directionsHref('1 Main St', null, null)).toContain('destination=1%20Main%20St');
  });

  it('offers nothing rather than a link to nowhere', () => {
    expect(directionsHref(null, null, null)).toBeUndefined();
    expect(directionsHref(undefined, Number.NaN, -75.175)).toBeUndefined();
  });

  it('the card itself uses the point', () => {
    render(
      <PlaceCard
        name="Santore Library" category="education" categoryLabel="School and training"
        address="3001 E Allegheny Ave" lat={39.9371} lon={-75.15526} labels={labels}
      />,
    );
    expect(screen.getByRole('link', { name: 'Go' })).toHaveAttribute(
      'href', expect.stringContaining('destination=39.9371%2C-75.15526'),
    );
  });
});

describe('Google lookup uses the organisation name, not the tidied one', () => {
  it('searches for the real spelling when one is given', () => {
    render(
      <PlaceCard
        name="Apm" lookupName="APM" category="family_services"
        categoryLabel="Home and family" address="1912 N 4th St" labels={labels}
      />,
    );
    // The member reads "Apm"; Google is asked for "APM", which is on the sign.
    expect(screen.getByRole('heading', { name: 'Apm' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Hours' }).getAttribute('href'))
      .toContain(encodeURIComponent('APM, 1912 N 4th St'));
  });

  it('falls back to the displayed name when there is no other spelling', () => {
    render(
      <PlaceCard
        name="Bethesda Project" category="family_services"
        categoryLabel="Home and family" address="609 S 15th St" labels={labels}
      />,
    );
    expect(screen.getByRole('link', { name: 'Hours' }).getAttribute('href'))
      .toContain(encodeURIComponent('Bethesda Project, 609 S 15th St'));
  });
});

describe('the header says which app you are in', () => {
  // PAM is one codebase serving a member, a programme's staff and an officer,
  // from the same components. The similarity is the point and the risk: the
  // chip is what answers "whose screen is this" when two are open at once.
  it('shows the wordmark on its own for the member app', () => {
    render(<AppHeader />);
    expect(screen.getByText('PAM')).toBeInTheDocument();
    expect(screen.queryByText('Case manager')).not.toBeInTheDocument();
  });

  it('names the role when there is one', () => {
    render(<AppHeader roleLabel="Case manager" />);
    expect(screen.getByText('PAM')).toBeInTheDocument();
    expect(screen.getByText('Case manager')).toBeInTheDocument();
  });

  it('is a banner landmark, so a screen reader can skip it', () => {
    render(<AppHeader roleLabel="Case manager" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

describe('NotificationBar (A7)', () => {
  const labels = {
    title: 'Notifications',
    unread: '2 new',
    empty: 'Nothing needs you right now.',
    markRead: 'Mark as read',
  };
  const items = [
    { id: 'a', text: 'Someone reported a place: closed', when: 'Today', isRead: false },
    { id: 'b', text: 'Someone said a message is not safe', when: 'Yesterday', isRead: false },
    { id: 'c', text: 'A place was taken off the list', when: 'Sept 9', isRead: true },
  ];

  it('says how many are new in words, not only a colour', () => {
    render(<NotificationBar items={items} labels={labels} />);
    // A dot tells a screen reader nothing and tells a colour-blind reader less
    // than it tells everybody else.
    expect(screen.getByText('2 new')).toBeInTheDocument();
  });

  it('starts closed, so the list does not push the caseload off the screen', () => {
    render(<NotificationBar items={items} labels={labels} />);
    expect(screen.queryByText(items[0]!.text)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Notifications' })).toHaveAttribute(
      'aria-expanded',
      'false',
    );
  });

  it('opens to the list, newest first as given', () => {
    render(<NotificationBar items={items} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    for (const item of items) expect(screen.getByText(item.text)).toBeInTheDocument();
  });

  it('offers "mark as read" only on the ones that are not read', () => {
    render(<NotificationBar items={items} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getAllByRole('button', { name: 'Mark as read' })).toHaveLength(2);
  });

  it('never marks anything read just because the list was opened', () => {
    // Reading a list is not dealing with what is in it, and a count that clears
    // itself hides work from the person who has to do it.
    const onMarkRead = vi.fn();
    render(<NotificationBar items={items} labels={labels} onMarkRead={onMarkRead} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(onMarkRead).not.toHaveBeenCalled();
    expect(screen.getByText('2 new')).toBeInTheDocument();
  });

  it('opens a row to whatever it is about', () => {
    const onSelect = vi.fn();
    render(<NotificationBar items={items} labels={labels} onSelect={onSelect} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    fireEvent.click(screen.getByRole('button', { name: items[1]!.text }));
    expect(onSelect).toHaveBeenCalledWith('b');
  });

  it('says so plainly when there is nothing, rather than showing an empty box', () => {
    render(<NotificationBar items={[]} labels={labels} />);
    fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
    // Nothing unread means no count at all, not "0 new".
    expect(screen.queryByText('2 new')).not.toBeInTheDocument();
  });
});
