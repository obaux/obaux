import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PlaceCard } from '../src/PlaceCard.js';
import { PointsBadge } from '../src/PointsBadge.js';
import { HelpBar } from '../src/HelpBar.js';
import { VoiceInput } from '../src/VoiceInput.js';

const labels = { call: 'Call', go: 'Go', save: 'Save', saved: 'Saved' };

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
  it('is a plain tel: link that works with no JavaScript and no session', () => {
    render(<HelpBar supportPhone="+15555550199" label="Need help? Call PAM" />);
    expect(screen.getByRole('link', { name: 'Need help? Call PAM' }))
      .toHaveAttribute('href', 'tel:+15555550199');
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
