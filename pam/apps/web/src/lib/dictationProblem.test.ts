import { describe, expect, it } from 'vitest';
import { dictationProblemFor } from './dictationProblem';

describe('dictationProblemFor (W4)', () => {
  it('says so when the microphone or the speech service is refused', () => {
    expect(dictationProblemFor('not-allowed')).toBe('blocked');
    expect(dictationProblemFor('service-not-allowed')).toBe('blocked');
  });

  it('says so when there is no microphone, no connection, or no such language', () => {
    expect(dictationProblemFor('audio-capture')).toBe('noMic');
    expect(dictationProblemFor('network')).toBe('offline');
    expect(dictationProblemFor('language-not-supported')).toBe('language');
  });

  it('says so for a code nobody expected, rather than showing nothing', () => {
    expect(dictationProblemFor('bad-grammar')).toBe('failed');
    expect(dictationProblemFor('')).toBe('failed');
  });

  it('shows nothing when the person stopped it or said nothing', () => {
    expect(dictationProblemFor('aborted')).toBeNull();
    expect(dictationProblemFor('no-speech')).toBeNull();
  });
});
