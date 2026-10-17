import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { PamSheet } from '../src/PamSheet.js';

describe('PamSheet', () => {
  // jsdom has no scrolling; Astryx's scroll lock calls it when a sheet closes.
  window.scrollTo = vi.fn();

  const sheet = (kind: 'read' | 'pick', word: string, onOpenChange = vi.fn()) =>
    render(
      <PamSheet isOpen onOpenChange={onOpenChange} label="Opening hours" kind={kind} actionLabel={word}>
        <p>Body</p>
      </PamSheet>,
    );

  it('a drawer you read says the word it is given, in a link after the title', () => {
    sheet('read', 'Close');
    const link = screen.getByRole('button', { name: 'Close' });
    expect(link).toHaveAttribute('data-sheet-action', 'read');
    const heading = screen.getByRole('heading', { name: 'Opening hours' });
    expect(heading.compareDocumentPosition(link) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('a drawer you pick in says Done', () => {
    sheet('pick', 'Done');
    expect(screen.getByRole('button', { name: 'Done' })).toHaveAttribute('data-sheet-action', 'pick');
  });

  it('the link and the notch both close it', () => {
    const onOpenChange = vi.fn();
    const { container } = sheet('read', 'Close', onOpenChange);
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    expect(onOpenChange).toHaveBeenLastCalledWith(false);
    onOpenChange.mockClear();
    const notch = document.querySelector('[data-sheet-notch]') as HTMLElement;
    expect(notch).toBeTruthy();
    fireEvent.click(notch);
    expect(onOpenChange).toHaveBeenCalledWith(false);
    void container;
  });

  it('the notch is not a control for a screen reader or a keyboard', () => {
    sheet('read', 'Close');
    const notch = document.querySelector('[data-sheet-notch]') as HTMLElement;
    expect(notch.getAttribute('aria-hidden')).toBe('true');
    expect(notch.tabIndex).toBe(-1);
  });

  it('a drawer that draws its own title under a picture has none in the row', () => {
    render(
      <PamSheet isOpen onOpenChange={() => {}} label="Bring a friend" kind="read" actionLabel="Close" title={null}>
        <p>Body</p>
      </PamSheet>,
    );
    expect(screen.queryByRole('heading', { name: 'Bring a friend' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close' })).toBeInTheDocument();
  });
});
