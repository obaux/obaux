import { describe, expect, it } from 'vitest';
import { displayPhone } from '../src/phone.js';

describe('displayPhone (D-306)', () => {
  it('reads a stored US number the way people say it', () => {
    expect(displayPhone('+12155550100')).toBe('(215) 555-0100');
    expect(displayPhone('2155550100')).toBe('(215) 555-0100');
    expect(displayPhone('215-555-0100')).toBe('(215) 555-0100');
  });

  it('shows anything else exactly as stored, rather than guessing', () => {
    expect(displayPhone('+44 20 7946 0000')).toBe('+44 20 7946 0000');
    expect(displayPhone('215-555-0100 ext 4')).toBe('215-555-0100 ext 4');
    expect(displayPhone('555-0100')).toBe('555-0100');
  });
});
