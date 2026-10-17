import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { VisitWidget, type VisitWidgetProps } from '../src/VisitCard.js';

// Stand-in words: the test is about the widget's shape, not the copy (A29).
const base: VisitWidgetProps = {
  eyebrow: 'Your next visit',
  day: 'Tuesday, 21 October',
  time: '10:00',
  hasLead: true,
  noteLabel: 'About this visit',
  note: 'The program can see this visit.',
  closeNoteLabel: 'Close',
  checkInLabel: 'Check in',
  changeLabel: 'Change',
  backLabel: 'Back',
  hereLabel: 'I am here',
  wentLabel: 'I went',
  changeDateLabel: 'Change date and time',
  cancelVisitLabel: 'Cancel visit',
};

const open = (container: HTMLElement) => Array.from(container.querySelectorAll('[data-visit-view]')).filter((v) => !v.hasAttribute('inert'));

describe('VisitWidget', () => {
  it('draws all three views, and only the one showing is reachable', () => {
    const { container } = render(<VisitWidget {...base} />);
    const views = container.querySelectorAll('[data-visit-view]');
    expect(views).toHaveLength(3);
    expect(open(container)).toHaveLength(1);
    expect(screen.getByText('Tuesday, 21 October')).toBeInTheDocument();
  });

  it('opens Check in and Change, and Back returns to the visit', () => {
    const { container } = render(<VisitWidget {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'Check in' }));
    expect(open(container)[0]?.getAttribute('data-visit-view')).toBe('checkin');
    fireEvent.click(screen.getByRole('button', { name: 'Back' }));
    expect(open(container)[0]?.getAttribute('data-visit-view')).toBe('visit');
    fireEvent.click(screen.getByRole('button', { name: 'Change' }));
    expect(open(container)[0]?.getAttribute('data-visit-view')).toBe('change');
  });

  it('Escape returns to the visit', () => {
    const { container } = render(<VisitWidget {...base} initialView="change" />);
    expect(open(container)[0]?.getAttribute('data-visit-view')).toBe('change');
    fireEvent.keyDown(screen.getByRole('button', { name: 'Cancel visit' }), { key: 'Escape' });
    expect(open(container)[0]?.getAttribute('data-visit-view')).toBe('visit');
  });

  it('calls back for each action', () => {
    const onHere = vi.fn();
    const onWent = vi.fn();
    const onCancelVisit = vi.fn();
    const onChangeDate = vi.fn();
    render(<VisitWidget {...base} initialView="checkin" onHere={onHere} onWent={onWent} />);
    fireEvent.click(screen.getByRole('button', { name: 'I am here' }));
    fireEvent.click(screen.getByRole('button', { name: 'I went' }));
    expect(onHere).toHaveBeenCalledTimes(1);
    expect(onWent).toHaveBeenCalledTimes(1);
    render(<VisitWidget {...base} initialView="change" onCancelVisit={onCancelVisit} onChangeDate={onChangeDate} />);
    fireEvent.click(screen.getByRole('button', { name: 'Cancel visit' }));
    fireEvent.click(screen.getByRole('button', { name: 'Change date and time' }));
    expect(onCancelVisit).toHaveBeenCalledTimes(1);
    expect(onChangeDate).toHaveBeenCalledTimes(1);
  });

  it('showsCheckIn={false} leaves Change alone', () => {
    render(<VisitWidget {...base} showsCheckIn={false} />);
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeInTheDocument();
  });

  it('a marked visit has no buttons and says so', () => {
    render(<VisitWidget {...base} isMarked markedTitle="Marked as there" markedDetail="Today" />);
    expect(screen.queryByRole('button', { name: 'Check in' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Change' })).not.toBeInTheDocument();
    expect(screen.getByText('Marked as there')).toBeInTheDocument();
  });

  it('the check-in result is announced politely', () => {
    const { container } = render(<VisitWidget {...base} initialView="checkin" checkInResult={<p>Done</p>} />);
    const live = Array.from(container.querySelectorAll('[aria-live="polite"]')).find((n) => n.textContent === 'Done');
    expect(live).toBeTruthy();
  });

  it('the note opens in a popover from the eye button', () => {
    render(<VisitWidget {...base} />);
    fireEvent.click(screen.getByRole('button', { name: 'About this visit' }));
    expect(screen.getByText('The program can see this visit.')).toBeInTheDocument();
  });
});
