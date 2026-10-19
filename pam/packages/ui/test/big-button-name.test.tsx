import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { BigButton } from '../src/BigButton.js';

const FSI = '⁨';
const PDI = '⁩';

describe('BigButton — its name is not drawn, so it carries no bidi isolates (D-435)', () => {
  it('a label and count built with isolates still give a plain name', () => {
    render(<BigButton label={`التالي ${FSI}Maria${PDI}`} badge={`2 من ${FSI}7${PDI}`} nameJoiner="، " />);
    const name = screen.getByRole('button').getAttribute('aria-label') ?? screen.getByRole('button').textContent ?? '';
    expect(name).not.toMatch(/[⁨⁩]/);
    expect(name).toContain('Maria');
  });
  it('a plain name is left as it was', () => {
    render(<BigButton label="Next" badge="2 of 7" nameJoiner=", " />);
    expect(screen.getByRole('button', { name: 'Next, 2 of 7' })).toBeInTheDocument();
  });
});
