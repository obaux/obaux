import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import axe from 'axe-core';
import { Notice } from '../src/Notice.js';
import { NOTICES } from '@pam/config';

const SUPPORT = '+12673095265';

async function expectNoViolations(container: HTMLElement): Promise<void> {
  const results = await axe.run(container, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] },
    rules: { 'color-contrast': { enabled: false }, 'target-size': { enabled: false } },
  });
  if (results.violations.length > 0) {
    throw new Error(results.violations.map((v) => `${v.id}: ${v.help}`).join('\n'));
  }
  expect(results.violations).toHaveLength(0);
}

describe('Notice — the out-of-region case Will raised', () => {
  const n = NOTICES.admin_out_of_region;

  it('explains the reason instead of showing an empty screen', () => {
    render(
      <Notice notice="admin_out_of_region" title={n.title} body={n.body} supportPhone={SUPPORT} />,
    );
    expect(screen.getByRole('heading', { name: n.title })).toBeInTheDocument();
    expect(screen.getByText(/only see people in your own area/i)).toBeInTheDocument();
  });

  it('does not repeat the call button that already lives in the bottom bar', () => {
    render(
      <Notice
        notice="admin_out_of_region" title={n.title} body={n.body}
        supportPhone={SUPPORT} callLabel="Call PAM"
      />,
    );
    // D-038: Help is persistent and one tap away. A second Call button here
    // teaches two places to look for the same thing, and this is not an
    // emergency — the admin simply cannot see someone outside their area.
    expect(screen.queryByRole('link', { name: /Call PAM/ })).not.toBeInTheDocument();
    // The way forward is still named, in words.
    expect(screen.getByText(/ask PAM support/i)).toBeInTheDocument();
  });

  it('still offers the call where the reader really is stuck', () => {
    // A suspended account cannot reach the bottom bar at all — they cannot get
    // past the sign-in screen — so that notice keeps its own call button.
    const suspended = NOTICES.account_suspended;
    render(
      <Notice
        notice="account_suspended" title={suspended.title} body={suspended.body}
        supportPhone={SUPPORT} callLabel="Call PAM"
      />,
    );
    expect(screen.getByRole('link', { name: /Call PAM/ })).toHaveAttribute(
      'href', `tel:${SUPPORT}`,
    );
  });

  it('renders as an empty state, not an alert', () => {
    // Nothing is broken — there is simply nothing here for this admin to see.
    const { container } = render(
      <Notice notice="admin_out_of_region" title={n.title} body={n.body} supportPhone={SUPPORT} />,
    );
    expect(container.querySelector('[role="alert"]')).toBeNull();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <main>
        <h1>My People</h1>
        <Notice notice="admin_out_of_region" title={n.title} body={n.body} supportPhone={SUPPORT} />
      </main>,
    );
    await expectNoViolations(container);
  });
});

describe('Notice — problems that need acting on', () => {
  it('announces a suspended account to assistive tech', () => {
    const n = NOTICES.account_suspended;
    const { container } = render(
      <Notice notice="account_suspended" title={n.title} body={n.body} supportPhone={SUPPORT} />,
    );
    // Astryx renders error and warning banners as role="alert".
    expect(container.querySelector('[role="alert"]')).not.toBeNull();
    expect(screen.getByRole('link', { name: /Call PAM/ })).toBeInTheDocument();
  });

  it('cannot be dismissed when it explains why someone is locked out', () => {
    const n = NOTICES.account_suspended;
    render(<Notice notice="account_suspended" title={n.title} body={n.body} supportPhone={SUPPORT} />);
    expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument();
  });

  it('offers to try again when a retry is possible', () => {
    const onPress = vi.fn();
    const n = NOTICES.something_went_wrong;
    render(
      <Notice
        notice="something_went_wrong" title={n.title} body={n.body}
        supportPhone={SUPPORT} retry={{ label: 'Try again', onPress }}
      />,
    );
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Call PAM/ })).toBeInTheDocument();
  });
});

describe("Notice — an admin's note, never their reason", () => {
  it('shows the note written for the person when there is one', () => {
    const n = NOTICES.feature_turned_off;
    render(
      <Notice
        notice="feature_turned_off" title={n.title} body={n.body} supportPhone={SUPPORT}
        userFacingNote="Chat is off for now. Call your case worker with questions."
      />,
    );
    expect(screen.getByText(/Chat is off for now/)).toBeInTheDocument();
    expect(screen.queryByText(n.body)).not.toBeInTheDocument();
  });

  it('falls back to the generic message when no note was written', () => {
    const n = NOTICES.feature_turned_off;
    render(
      <Notice notice="feature_turned_off" title={n.title} body={n.body} supportPhone={SUPPORT} />,
    );
    expect(screen.getByText(n.body)).toBeInTheDocument();
  });
});

describe('Notice — degrading safely', () => {
  it('still explains itself when no support number is configured', () => {
    const n = NOTICES.no_places_found;
    render(<Notice notice="no_places_found" title={n.title} body={n.body} />);
    expect(screen.getByRole('heading', { name: n.title })).toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Call/ })).not.toBeInTheDocument();
  });

  it('offers no call where calling cannot help', () => {
    const n = NOTICES.no_caseload_members;
    render(
      <Notice notice="no_caseload_members" title={n.title} body={n.body} supportPhone={SUPPORT} />,
    );
    // Nobody has redeemed an invite yet. Support cannot change that.
    expect(screen.queryByRole('link', { name: /Call/ })).not.toBeInTheDocument();
  });
});
