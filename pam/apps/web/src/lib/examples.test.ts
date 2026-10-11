import { afterEach, describe, expect, it } from 'vitest';
import { showsExamples } from './examples';

/** A real account sees no examples; a preview, a demo account and Storybook do (D-518). */
describe('showsExamples', () => {
  afterEach(() => {
    delete (globalThis as { window?: unknown }).window;
  });

  it('is off for an ordinary account', () => {
    expect(showsExamples({})).toBe(false);
    expect(showsExamples({ demoRole: null, isDemo: false })).toBe(false);
  });

  it('is on for a super admin previewing a role, and for a demo account', () => {
    expect(showsExamples({ demoRole: 'member' })).toBe(true);
    expect(showsExamples({ isDemo: true })).toBe(true);
  });

  it('is on in Storybook only', () => {
    (globalThis as { window?: unknown }).window = { __STORYBOOK_PREVIEW__: {} };
    expect(showsExamples({})).toBe(true);
  });
});
