import { render, fireEvent } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { openRowOnTap } from '../src/tapRows.js';

/** A row as Astryx draws it: the link only around the label, an icon before it and a chevron after. */
function row(extra = '') {
  return render(
    <ul>
      <li className="astryx-item" data-testid="row" {...(extra === 'disabled' ? { 'aria-disabled': 'true' } : {})}>
        <span data-testid="icon">i</span>
        <a href="/language/" data-testid="link">
          Language
        </a>
        <span data-testid="chevron">&gt;</span>
        {extra === 'button' ? <button data-testid="inner">Copy</button> : null}
      </li>
    </ul>,
  );
}

describe('openRowOnTap', () => {
  afterEach(() => document.removeEventListener('click', openRowOnTap));

  const clicks = (container: HTMLElement) => {
    const link = container.querySelector('a')!;
    const spy = vi.fn((event: Event) => event.preventDefault());
    link.addEventListener('click', spy);
    document.addEventListener('click', openRowOnTap);
    return spy;
  };

  it.each(['row', 'icon', 'chevron'])('a tap on the %s clicks the row’s link', (id) => {
    const { container, getByTestId } = row();
    const spy = clicks(container);
    fireEvent.click(getByTestId(id));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('a tap on the link itself is the link’s own: not clicked a second time', () => {
    const { container, getByTestId } = row();
    const spy = clicks(container);
    fireEvent.click(getByTestId('link'));
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('a button in the row is left to act on its own', () => {
    const { container, getByTestId } = row('button');
    const spy = clicks(container);
    fireEvent.click(getByTestId('inner'));
    expect(spy).not.toHaveBeenCalled();
  });

  it('a disabled row and a modified click (new tab) are left alone', () => {
    const disabled = row('disabled');
    const spy = clicks(disabled.container);
    fireEvent.click(disabled.getByTestId('row'));
    expect(spy).not.toHaveBeenCalled();
    disabled.unmount();
    const plain = row();
    const spy2 = clicks(plain.container);
    fireEvent.click(plain.getByTestId('row'), { ctrlKey: true });
    expect(spy2).not.toHaveBeenCalled();
  });
});
