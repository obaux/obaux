import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { BringFriend } from '../src/BringFriend.js';

describe('BringFriend', () => {
  window.scrollTo = vi.fn();

  it('the link is an address: it reads left to right, from https://, in every language', () => {
    render(
      <BringFriend
        isOpen
        onOpenChange={() => {}}
        label="Traer a alguien"
        body="…"
        link="https://joinpam.org/signin/?as=member&at=2026-10-08T14%3A00%3A00.000Z"
        linkLabel="Link to send"
        copyLabel="Copy"
        copiedLabel="Copied"
        closeLabel="Close"
      />,
    );
    const field = screen.getByLabelText('Link to send') as HTMLInputElement;
    expect(field.value.startsWith('https://')).toBe(true);
    expect(field.getAttribute('dir') ?? field.closest('[dir]')?.getAttribute('dir')).toBe('ltr');
  });
});
