import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PamSheet } from '../src/PamSheet.js';

describe('PamSheet', () => {
  // jsdom has no scrolling; Astryx's scroll lock calls it when a sheet closes.
  window.scrollTo = vi.fn();

  const sheet = (kind: 'review' | 'act', word: string, onOpenChange = vi.fn()) =>
    render(
      <PamSheet isOpen onOpenChange={onOpenChange} label="Opening hours" kind={kind} actionLabel={word}>
        <p>Body</p>
      </PamSheet>,
    );

  it('a drawer you read has a checkmark button, named by the word it is given, after the title', () => {
    sheet('review', 'Done');
    const button = screen.getByRole('button', { name: 'Done' });
    expect(button).toHaveAttribute('data-sheet-action', 'review');
    const heading = screen.getByRole('heading', { name: 'Opening hours' });
    expect(heading.compareDocumentPosition(button) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    // The checkmark and the X are different pictures.
    const check = button.querySelector('svg')!.innerHTML;
    document.body.innerHTML = '';
    sheet('act', 'Close');
    expect(screen.getByRole('button', { name: 'Close' }).querySelector('svg')!.innerHTML).not.toBe(check);
  });

  it('a drawer where something is done inside it has an X named Close', () => {
    sheet('act', 'Close');
    expect(screen.getByRole('button', { name: 'Close' })).toHaveAttribute('data-sheet-action', 'act');
  });

  it('the link and the notch both close it', () => {
    const onOpenChange = vi.fn();
    const { container } = sheet('review', 'Done', onOpenChange);
    fireEvent.click(screen.getByRole('button', { name: 'Done' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    const notch = document.querySelector('[data-sheet-notch]') as HTMLElement;
    expect(notch).toBeTruthy();
    fireEvent.click(notch);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    void container;
  });

  it('the notch is not a control for a screen reader or a keyboard', () => {
    sheet('review', 'Done');
    const notch = document.querySelector('[data-sheet-notch]') as HTMLElement;
    expect(notch.getAttribute('aria-hidden')).toBe('true');
    expect(notch.tabIndex).toBe(-1);
  });

  it('a drawer that draws its own title under a picture has none in the row', () => {
    render(
      <PamSheet isOpen onOpenChange={() => {}} label="Bring a friend" kind="act" actionLabel="Close" title={null}>
        <p>Body</p>
      </PamSheet>,
    );
    expect(screen.queryByRole('heading', { name: 'Bring a friend' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
