import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { BigButton } from '../src/BigButton.js';
import { PlaceCard } from '../src/PlaceCard.js';
import { PlaceDetail } from '../src/PlaceDetail.js';
import { PersonCard } from '../src/PersonCard.js';
import { StepHeader } from '../src/StepHeader.js';
import { PointsBadge } from '../src/PointsBadge.js';
import { HelpBar } from '../src/HelpBar.js';
import { Loading } from '../src/Loading.js';
import { VoiceInput } from '../src/VoiceInput.js';
import { NavTile } from '../src/NavTile.js';
import { OnboardingSlides } from '../src/OnboardingSlides.js';
import { PlacesIcon } from '../src/icons.js';

/**
 * §12 makes accessibility build-blocking: "a11y test fails build on any WCAG AA
 * violation." This suite is that gate.
 *
 * jsdom has no layout engine, so colour-contrast and target-size rules cannot be
 * evaluated here — those are checked in the Playwright run against a real
 * browser (see apps/web). What axe CAN check in jsdom is structure: names,
 * roles, labels, heading order. That is most of what breaks a screen reader.
 */
async function expectNoViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: {
      // Needs real layout; covered by the browser-based run instead.
      'color-contrast': { enabled: false },
      'target-size': { enabled: false },
    },
  });

  if (results.violations.length > 0) {
    const detail = results.violations
      .map((v) => `  [${v.impact ?? 'unknown'}] ${v.id}: ${v.help}\n    ${v.nodes[0]?.html ?? ''}`)
      .join('\n');
    throw new Error(`${results.violations.length} accessibility violation(s):\n${detail}`);
  }
  expect(results.violations).toHaveLength(0);
}

const placeLabels = { save: 'Save', saved: 'Saved' };

const detailLabels = {
  hours: 'Opening hours',
  hoursOnGoogle: 'Check hours on Google',
  about: 'About program',
  address: 'Address',
};

describe('accessibility', () => {
  it('NavTile', async () => {
    const { container } = render(
      <NavTile
        href="/places/"
        icon={<PlacesIcon />}
        label="Places"
        description="Food, work, school and health near you."
        alertLabel="2 new"
      />,
    );
    await expectNoViolations(container);
  });

  it('OnboardingSlides', async () => {
    const { container } = render(
      <OnboardingSlides
        label="How Pam works"
        slides={[
          { id: 'a', image: '/onboarding/places.svg', text: 'Find places near you that can help.' },
          { id: 'b', image: '/onboarding/people.svg', text: 'A real person can answer questions.' },
        ]}
      />,
    );
    await expectNoViolations(container);
  });

  it('BigButton', async () => {
    const { container } = render(<BigButton label="Start" />);
    await expectNoViolations(container);
  });

  it('PlaceCard', async () => {
    const { container } = render(
      <main>
        <h1>Places</h1>
        <h2>Nearby</h2>
        <PlaceCard
          name="Riverside Learning Center"
          href="/place/?id=abc"
          description="GED classes and help with reading. Free to join."
          distanceLabel="1.2 miles"
          status={{ isOpen: true, label: 'Open until 5:00pm' }}
          audienceLabel="In a school"
          labels={placeLabels}
        />
      </main>,
    );
    await expectNoViolations(container);
  });

  it('PlaceDetail', async () => {
    const { container } = render(
      <main>
        <PlaceDetail
          name="Riverside Learning Center"
          category="education"
          categoryLabel="School and training"
          description="GED classes and help with reading."
          address="123 Main St"
          addressActions={{
            googleMapsHref: 'https://www.google.com/maps/dir/?api=1&destination=123%20Main%20St',
            appleMapsHref: 'https://maps.apple.com/?daddr=123%20Main%20St',
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
          }}
          distanceLabel="1.2 miles"
          status={{ isOpen: true, label: 'Open until 5:00pm' }}
          weekLines={[{ day: 'Monday', hours: '9:00am – 5:00pm' }]}
          hoursArePlaceholder
          placeholderNote="Sample hours. Call to check before you go."
          audienceLabel="In a school"
          hoursHref="https://maps.example/y"
          quickActionsLabel="Ways to reach this place"
          quickActions={[
            { id: 'directions', label: 'Get directions', description: 'Open in Google Maps', icon: <PlacesIcon />, href: 'https://maps.example/x', isExternal: true },
            { id: 'call', label: 'Call', description: '(555) 555-0100', icon: <PlacesIcon />, href: 'tel:+15555550100' },
          ]}
          labels={detailLabels}
        />
      </main>,
    );
    await expectNoViolations(container);
  });

  it('PersonCard', async () => {
    const { container } = render(
      <main>
        <h1>People</h1>
        <h2>Mentors</h2>
        <PersonCard
          firstName="Nia"
          roleLine="I can help you get your GED."
          sharedTags={['GED or high school', 'Computer skills']}
          orgBadgeLabel="Riverside Learning Center"
          messageLabel="Send a message"
        />
      </main>,
    );
    await expectNoViolations(container);
  });

  it('StepHeader', async () => {
    const { container } = render(
      <StepHeader current={2} total={4} title="What should we call you?" progressLabel="Step 2 of 4" />,
    );
    await expectNoViolations(container);
  });

  it('Loading', async () => {
    const { container } = render(<Loading label="Loading" />);
    await expectNoViolations(container);
  });

  it('PointsBadge', async () => {
    const { container } = render(<PointsBadge points={250} label="Your points" />);
    await expectNoViolations(container);
  });

  it('HelpBar', async () => {
    const { container } = render(
      <HelpBar label="Help" />,
    );
    await expectNoViolations(container);
  });

  it('VoiceInput', async () => {
    const { container } = render(
      <VoiceInput
        label="What should we call you?"
        value=""
        onChange={() => {}}
        micLabels={{ start: 'Tap to talk', listening: 'Listening' }}
      />,
    );
    await expectNoViolations(container);
  });
});
