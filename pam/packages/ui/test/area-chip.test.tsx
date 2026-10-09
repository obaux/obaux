import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { isolate } from '@pam/config';
import { AreaChip } from '../src/AreaChip.js';

/**
 * In Arabic `t` writes "بالقرب من ⁨1231 N Broad St⁩": an address inside a
 * sentence, as a piece of its own (D-435). The chip gives that piece its own
 * box, so a line too long for it ends in an ellipsis at the end of the
 * address. How it is cut is a matter of layout, which Storybook shows
 * (Components › Inputs › AreaChip › Long address, in Arabic); what is checked
 * here is the structure that makes it possible, and that no other language's
 * chip changed.
 */
const ADDRESS = '1231 N Broad St, North Philadelphia';

describe('AreaChip', () => {
  it('puts a value written into the label in a box of its own, running the way it reads', () => {
    render(<AreaChip label={`بالقرب من ${isolate(ADDRESS)}`} changeLabel="تغيير المنطقة" onChange={() => {}} />);
    const value = screen.getByText(ADDRESS);
    expect(value.tagName).toBe('SPAN');
    expect(value).toHaveAttribute('dir', 'auto');
    // The words stay outside it, whole, and nothing invisible is left in the text.
    expect(screen.getByText('بالقرب من', { exact: false })).not.toBe(value);
    expect(screen.getByRole('button', { name: 'تغيير المنطقة' }).textContent).toBe(`بالقرب من ${ADDRESS}`);
  });

  it('draws a label with no value in it exactly as before: the text, in no box', () => {
    const { container } = render(<AreaChip label={`Near ${ADDRESS}`} changeLabel="Change the area" onChange={() => {}} />);
    const button = screen.getByRole('button', { name: 'Change the area' });
    expect(button).toHaveTextContent(`Near ${ADDRESS}`);
    expect(container.querySelector('[dir="auto"]')).toBeNull();
  });
});
