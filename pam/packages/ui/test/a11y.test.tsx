import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import axe from 'axe-core';
import { BigButton } from '../src/BigButton.js';
import { PlaceCard } from '../src/PlaceCard.js';
import { PersonCard } from '../src/PersonCard.js';
import { StepHeader } from '../src/StepHeader.js';
import { PointsBadge } from '../src/PointsBadge.js';
import { HelpBar } from '../src/HelpBar.js';
import { VoiceInput } from '../src/VoiceInput.js';

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

const placeLabels = { call: 'Call', go: 'Go', save: 'Save', saved: 'Saved' };

describe('accessibility', () => {
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
          category="education"
          categoryLabel="School and training"
          distanceLabel="1.2 miles"
          isOpenNow
          openNowLabel="Open now"
          phone="+15555550100"
          address="123 Main St"
          labels={placeLabels}
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

  it('PointsBadge', async () => {
    const { container } = render(<PointsBadge points={250} label="Your points" />);
    await expectNoViolations(container);
  });

  it('HelpBar', async () => {
    const { container } = render(
      <HelpBar supportPhone="+15555550199" label="Need help? Call PAM" />,
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
