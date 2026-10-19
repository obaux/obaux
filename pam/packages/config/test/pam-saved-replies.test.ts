import { describe, expect, it } from 'vitest';
import { PAM_SAVED_REPLIES } from '../src/pamSavedReplies.js';
import { EN } from './_bundles.js';

/** The Pam team's saved replies (card a100): every one has words, and the legal one waits for its lawyer-read list. */
describe("the Pam team's saved replies", () => {
  it('each has English words', () => {
    for (const key of PAM_SAVED_REPLIES) expect(EN[key], key).toBeTruthy();
  });
  it('does not offer the legal reply before its list of free legal help is approved', () => {
    expect(PAM_SAVED_REPLIES).not.toContain('pam.saved.legal');
  });
  it('carries no justice words (Sage)', () => {
    for (const key of PAM_SAVED_REPLIES) expect(EN[key], key).not.toMatch(/parole|probation|offender|prison|jail|court/i);
  });
});
