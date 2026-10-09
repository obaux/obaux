import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { CopyButton } from '../src/CopyButton.js';
import { FactGroup, FactRow, GuideCard, ReadCard, SectionHeading, SummaryCard } from '../src/Reading.js';
import { COPY_STATUS_MS } from '../src/clipboard.js';
import { CheckIcon, EyeIcon, PeopleIcon } from '../src/icons.js';

/**
 * The reading pieces and the copy icon (D-416, D-417). The copy icon's promise
 * is that it says what happened — so these tests press it and read what it
 * says, for a copy that works and one that is refused, check that the icon
 * really changes, that it goes back after 5 seconds, and that the status is
 * announced through a live region that is already in the page.
 */
const copy = { text: 'Hello', label: 'Copy this page', copiedLabel: 'Copied', failedLabel: 'Could not copy.' };

describe('CopyButton', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  const press = async () => {
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Copy this page' }));
    });
  };

  it('copies the text, says "Copied", swaps its icon for a tick, and resets after 5 seconds', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', { clipboard: { writeText } });
    const { container } = render(<CopyButton {...copy} />);
    expect(screen.queryByText('Copied')).toBeNull();
    const before = container.querySelector('button')?.innerHTML;

    await press();
    expect(writeText).toHaveBeenCalledWith('Hello');
    expect(screen.getByText('Copied')).toBeTruthy();
    // The icon is a different drawing, not the same one recoloured.
    expect(container.querySelector('button')?.innerHTML).not.toBe(before);

    // Still up just before 5 seconds, gone just after, and the icon is back.
    await act(async () => {
      vi.advanceTimersByTime(COPY_STATUS_MS - 100);
    });
    expect(screen.getByText('Copied')).toBeTruthy();
    await act(async () => {
      vi.advanceTimersByTime(200);
    });
    expect(screen.queryByText('Copied')).toBeNull();
    expect(container.querySelector('button')?.innerHTML).toBe(before);
  });

  it('says what to do instead when the clipboard refuses', async () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } });
    render(<CopyButton {...copy} />);
    await press();
    expect(screen.getByText('Could not copy.')).toBeTruthy();
    expect(screen.queryByText('Copied')).toBeNull();
    await act(async () => {
      vi.advanceTimersByTime(COPY_STATUS_MS + 100);
    });
    expect(screen.queryByText('Could not copy.')).toBeNull();
  });

  it('keeps a live region in the page before anything is said, so it is announced', () => {
    vi.stubGlobal('navigator', { clipboard: { writeText: vi.fn() } });
    const { container } = render(<CopyButton {...copy} />);
    const region = container.querySelector('[role="status"]');
    expect(region).not.toBeNull();
    expect(region?.getAttribute('aria-live')).toBe('polite');
    expect(region?.textContent).toBe('');
  });
});

async function expectNoViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
  });
  const detail = results.violations.map((v) => `${v.id}: ${v.help}\n  ${v.nodes[0]?.html ?? ''}`).join('\n');
  expect(results.violations, detail).toHaveLength(0);
}

describe('reading pieces', () => {
  it('have no structural accessibility violations', async () => {
    vi.useRealTimers();
    const { container } = render(
      <main>
        <h1>Page</h1>
        <GuideCard title="Your guide" body="The person who invited you." icon={<PeopleIcon />} />
        <SummaryCard
          title="The short version"
          lines={[
            { text: 'Your guide can see your plans.', mark: 'yes', icon: <EyeIcon /> },
            { text: 'Your guide cannot read your messages.', mark: 'no' },
          ]}
        />
        <ReadCard title="Can see" icon={<CheckIcon />}>
          <FactGroup title="Your plans">
            <FactRow lead="Your visits" mark="yes" />
            <FactRow lead="The last day you used Pam." detail="A program you joined sees this too." mark="yes" />
          </FactGroup>
        </ReadCard>
        <SectionHeading title="What we keep" icon={<CheckIcon />} />
      </main>,
    );
    await expectNoViolations(container);
  });

  it('draws a mark on every row, hides it from a screen reader, and always says it in words', () => {
    const { container } = render(
      <FactGroup>
        <FactRow lead="What you say to someone else" mark="no" />
      </FactGroup>,
    );
    expect(screen.getByText('What you say to someone else')).toBeTruthy();
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBe(1);
    svgs.forEach((svg) => expect(svg.getAttribute('aria-hidden')).toBe('true'));
  });
});
