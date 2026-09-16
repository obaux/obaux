import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceCard, googlePlaceHref, directionsHref } from '../src/PlaceCard.js';
import { AppHeader } from '../src/AppHeader.js';
import { NotificationBell } from '../src/NotificationBell.js';
import { NotificationList } from '../src/NotificationList.js';
import { PointsBadge } from '../src/PointsBadge.js';
import { HelpBar } from '../src/HelpBar.js';
import { Loading } from '../src/Loading.js';
import { VoiceInput } from '../src/VoiceInput.js';
import { NavTile } from '../src/NavTile.js';
import { OnboardingSlides } from '../src/OnboardingSlides.js';
import { PlacesIcon } from '../src/icons.js';

const labels = {
  call: 'Call',
  go: 'Go',
  save: 'Save',
  saved: 'Saved',
  hours: 'Hours',
  more: 'More about this place',
  share: 'Share this place',
  flag: 'Something is wrong here',
};

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

describe('PlaceCard — the four facts that decide whether to go', () => {
  const card = (extra: Record<string, unknown> = {}) =>
    render(
      <PlaceCard
        name="Riverside Learning Center"
        href="/place/?id=abc"
        description="GED classes and help with reading. Free."
        distanceLabel="0.4 miles"
        labels={labels}
        {...extra}
      />,
    );

  it('carries the name, the distance and one sentence — and nothing else to decide', () => {
    card({ status: { isOpen: true, label: 'Open until 5:00pm' } });

    expect(screen.getByRole('heading', { name: /Riverside/ })).toBeInTheDocument();
    expect(screen.getByText('0.4 miles')).toBeInTheDocument();
    expect(screen.getByText('Open until 5:00pm')).toBeInTheDocument();
    expect(screen.getByText(/GED classes/)).toBeInTheDocument();
  });

  it('is one link, over the whole card, named for the place', () => {
    // A "More" link in the corner is a 48px target on a 300px card, and the
    // member most likely to miss it is the one this app is for.
    card();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(1);
    expect(links[0]).toHaveAccessibleName(/Riverside Learning Center/);
    expect(links[0]).toHaveAttribute('href', '/place/?id=abc');
  });

  it('offers Save and nothing else — the rest moved inside', () => {
    card({ onSave: () => {} });
    const buttons = screen.getAllByRole('button');
    expect(buttons.map((b) => b.getAttribute('aria-label') ?? b.textContent?.trim())).toEqual([
      'Save',
    ]);
    expect(screen.queryByRole('link', { name: 'Go' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Call' })).not.toBeInTheDocument();
  });

  it('reports saved state to assistive tech, with the word it dropped', () => {
    card({ onSave: () => {}, isSaved: true });
    const saved = screen.getByRole('button', { name: 'Saved' });
    expect(saved).toHaveAttribute('aria-pressed', 'true');
  });

  it('shows who a place is for as a badge, not as prose', () => {
    // "Mark if inside a school. Make it visible to users." (Will, 16 September)
    card({ audienceLabel: 'In a school' });
    expect(screen.getByText('In a school')).toBeInTheDocument();
  });

  it('says nothing about opening hours when PAM does not know them', () => {
    // Not "Closed" — a place PAM knows nothing about is not a place that is
    // shut, and sending somebody away is as costly as sending them across town.
    card({ status: null });
    expect(screen.queryByText(/Open|Closed/)).not.toBeInTheDocument();
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

describe('the Google listing fallback (city data has no hours or phone)', () => {
  // The buttons this used to assert on now live on the place's own screen; the
  // link builders are still the thing worth pinning down, because a wrong one
  // sends somebody to the wrong building.
  it('anchors the lookup to a place id when the importer has resolved one', () => {
    expect(googlePlaceHref('Comhar', '1 Main St', 'ChIJabc123')).toContain(
      'query_place_id=ChIJabc123',
    );
    expect(googlePlaceHref('Comhar', '1 Main St')).not.toContain('query_place_id');
  });

  it('searches by name and address when it has not', () => {
    expect(googlePlaceHref('Mental Health Partnerships', '1 Main St, PA 19104')).toContain(
      encodeURIComponent('Mental Health Partnerships, 1 Main St, PA 19104'),
    );
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

  it('treats a NaN coordinate as no coordinate', () => {
    // `typeof NaN === 'number'`, so a naive check builds
    // "destination=NaN,-75.175" and sends somebody nowhere at all.
    expect(directionsHref('1 Main St', Number.NaN, -75.175)).toContain('1%20Main%20St');
  });
});

describe('Google lookup uses the organisation name, not the tidied one', () => {
  // Imported names are normalised for reading, which turns the acronym "APM"
  // into "Apm" — a worse search term than what is on the sign. The caller
  // passes the real spelling; the member still reads the tidy one.
  it('searches for the spelling that is on the building', () => {
    expect(googlePlaceHref('APM', '1912 N 4th St')).toContain(
      encodeURIComponent('APM, 1912 N 4th St'),
    );
  });

  it('falls back to the displayed name when there is no other spelling', () => {
    expect(googlePlaceHref('Bethesda Project', '609 S 15th St')).toContain(
      encodeURIComponent('Bethesda Project, 609 S 15th St'),
    );
  });
});

describe('the header says which app you are in', () => {
  // PAM is one codebase serving a member, a programme's staff and an officer,
  // from the same components. The similarity is the point and the risk: the
  // chip is what answers "whose screen is this" when two are open at once.
  it('shows the wordmark on its own for the member app', () => {
    render(<AppHeader />);
    expect(screen.getByRole('img', { name: 'PAM' })).toBeInTheDocument();
    expect(screen.queryByText('Case manager')).not.toBeInTheDocument();
  });

  it('names the role when there is one', () => {
    render(<AppHeader roleLabel="Case manager" />);
    expect(screen.getByRole('img', { name: 'PAM' })).toBeInTheDocument();
    expect(screen.getByText('Case manager')).toBeInTheDocument();
  });

  it('says "PAM" once, not once per artwork', () => {
    // Two files — lime on dark grounds, deep green on light ones — chosen by
    // <picture>. Only the <img> carries the alt, so a screen reader announces
    // the name once whichever one the browser paints.
    render(<AppHeader />);
    expect(screen.getAllByRole('img', { name: 'PAM' })).toHaveLength(1);
  });

  it('carries a mark for each colour scheme, so neither ground eats it', () => {
    const { container } = render(<AppHeader />);
    const sources = [...container.querySelectorAll('source')].map((el) => ({
      media: el.getAttribute('media'),
      src: el.getAttribute('srcset'),
    }));
    expect(sources).toEqual([
      { media: '(prefers-color-scheme: dark)', src: '/pam-wordmark-dark.svg' },
    ]);
    expect(container.querySelector('img')).toHaveAttribute('src', '/pam-wordmark-light.svg');
  });

  it('is a banner landmark, so a screen reader can skip it', () => {
    render(<AppHeader roleLabel="Case manager" />);
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });
});

describe('the bell (A7)', () => {
  it('says how many are new in its name, so the dot is never the only telling', () => {
    // The mark beside the bell is a dot rather than a count (Will, 13
    // September). A dot tells a screen reader nothing and tells a colour-blind
    // reader less than it tells everybody else, so the number lives in the
    // link's accessible name instead of disappearing with the badge.
    render(
      <NotificationBell href="/notifications/" label="Notifications" unreadCount={2} unreadLabel="2 new" />,
    );
    expect(screen.getByRole('link', { name: 'Notifications, 2 new' })).toBeInTheDocument();
  });

  it('says nothing at all when nothing is new', () => {
    render(
      <NotificationBell href="/notifications/" label="Notifications" unreadCount={0} unreadLabel="0 new" />,
    );
    expect(screen.queryByText('0 new')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
  });

  it('is a real link, so the list has its own address and its own Back', () => {
    render(
      <NotificationBell href="/notifications/" label="Notifications" unreadCount={1} unreadLabel="1 new" />,
    );
    expect(screen.getByRole('link', { name: 'Notifications, 1 new' })).toHaveAttribute(
      'href',
      '/notifications/',
    );
  });
});

describe('the notification list (A7)', () => {
  const labels = { empty: 'Nothing needs you right now.', new: 'New' };
  const items = [
    { id: 'a', text: 'J J Peters was reported: closed', when: 'Today', isNew: true },
    { id: 'b', text: 'A message from Marcus was reported', when: 'Yesterday', isNew: true },
    { id: 'c', text: 'Example Learning Center was taken off the list', when: 'Sept 9', isNew: false },
  ];

  it('shows every notice, newest first as given', () => {
    render(<NotificationList items={items} labels={labels} />);
    for (const item of items) expect(screen.getByText(item.text)).toBeInTheDocument();
  });

  it('labels the ones that are new, and only those', () => {
    render(<NotificationList items={items} labels={labels} />);
    expect(screen.getAllByText('New')).toHaveLength(2);
  });

  it('is a log, not a form: nothing here is a button', () => {
    // A row used to be a ghost button with no `onSelect` wired to it anywhere
    // in the app — tappable, and doing nothing. A log line does not need to be
    // clickable to be read.
    render(<NotificationList items={items} labels={labels} />);
    expect(screen.queryAllByRole('button')).toHaveLength(0);
  });

  it('says so plainly when there is nothing, rather than showing an empty box', () => {
    render(<NotificationList items={[]} labels={labels} />);
    expect(screen.getByText(labels.empty)).toBeInTheDocument();
  });
});

describe('the home screen tiles', () => {
  it('is one link for the whole tile, not a small link inside a big card', () => {
    // A 48px link sitting inside a card that also looks tappable is how
    // somebody taps twice and believes the app is broken.
    render(
      <NavTile
        href="/places/"
        icon={<PlacesIcon />}
        label="Places"
        description="Food, work, school and health near you."
      />,
    );
    const link = screen.getByRole('link', { name: 'Places' });
    expect(link).toHaveAttribute('href', '/places/');
    expect(screen.getAllByRole('link')).toHaveLength(1);
  });

  it('says what it is for, not just what it is called', () => {
    render(
      <NavTile
        href="/places/"
        icon={<PlacesIcon />}
        label="Places"
        description="Food, work, school and health near you."
      />,
    );
    expect(screen.getByText('Food, work, school and health near you.')).toBeInTheDocument();
  });

  it('says what is waiting in its name, so a dot is never the only telling', () => {
    // The dot is the glance. The words are what a screen reader gets, and what
    // anybody who cannot tell the dot from the icon beside it gets.
    const { rerender } = render(
      <NavTile
        href="/notifications/"
        icon={<PlacesIcon />}
        label="Notifications"
        description="What has happened and needs you."
        alertLabel="2 new"
      />,
    );
    expect(screen.getByRole('link', { name: 'Notifications, 2 new' })).toBeInTheDocument();

    rerender(
      <NavTile
        href="/notifications/"
        icon={<PlacesIcon />}
        label="Notifications"
        description="What has happened and needs you."
      />,
    );
    expect(screen.getByRole('link', { name: 'Notifications' })).toBeInTheDocument();
  });
});

describe('the way in explains itself first', () => {
  const slides = [
    { id: 'places', image: '/onboarding/places.svg', text: 'Find places near you that can help.' },
    { id: 'people', image: '/onboarding/people.svg', text: 'A real person can point you to the right one.' },
    { id: 'plan', image: '/onboarding/plan.svg', text: 'PAM reminds you before you go.' },
  ];

  it('puts every slide in the page, so nothing depends on being able to swipe', () => {
    // A carousel that only reveals its content to a swipe hides two thirds of
    // the explanation from a keyboard, a screen reader, and anybody whose
    // finger does not drag cleanly on a cracked screen.
    render(<OnboardingSlides slides={slides} label="How PAM works" />);
    for (const slide of slides) expect(screen.getByText(slide.text)).toBeInTheDocument();
  });

  it('names itself, so it can be skipped rather than waded through', () => {
    render(<OnboardingSlides slides={slides} label="How PAM works" />);
    expect(screen.getByRole('region', { name: 'How PAM works' })).toBeInTheDocument();
  });
});

/**
 * The spinner that replaced "Finding places nearby..." on every screen.
 *
 * Two things matter and neither is the animation: that a screen reader is told
 * something is happening, in the member's own language, and that the words are
 * not also painted on the screen — a ring plus a word is two things to read
 * where one will do, in whichever language PAM has not been translated into
 * yet.
 */
describe('Loading', () => {
  it('announces itself to a screen reader without drawing the word', () => {
    const { container } = render(<Loading label="Cargando" />);

    expect(screen.getByRole('status')).toHaveAccessibleName('Cargando');
    expect(container.textContent).toBe('');
  });

  it('fills the screen by default, and sits in the flow when asked', () => {
    // The default is the one that matters: a spinner tucked under the header
    // is not "in the middle of the screen", which is the whole request.
    const { container: screenful } = render(<Loading label="Loading" />);
    const { container: inline } = render(<Loading label="Loading" variant="inline" />);

    const box = (root: HTMLElement) => root.firstElementChild as HTMLElement;
    expect(box(screenful).className).not.toBe(box(inline).className);
  });
});
