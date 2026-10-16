import { describe, expect, it } from 'vitest';
import { QUESTION_LIMIT, replyContextFrom } from './replyContext';

describe('replyContextFrom', () => {
  it('reads the question and the time from the part after #', () => {
    expect(replyContextFrom('#q=How%20do%20I%20find%20my%20program%3F&at=2026-10-15T14:05:00Z')).toEqual({
      question: 'How do I find my program?',
      askedAt: '2026-10-15T14:05:00.000Z',
    });
  });
  it('is empty when there is nothing', () => {
    expect(replyContextFrom('')).toEqual({ question: null, askedAt: null });
    expect(replyContextFrom('#')).toEqual({ question: null, askedAt: null });
  });
  it('drops a time that is not a time, keeps the question', () => {
    expect(replyContextFrom('#q=hi&at=yesterday')).toEqual({ question: 'hi', askedAt: null });
  });
  it('takes control characters out and trims', () => {
    expect(replyContextFrom('#q=%20%00hello%07%20').question).toBe('hello');
  });
  it('cannot be longer than the form allows', () => {
    expect(replyContextFrom(`#q=${'x'.repeat(QUESTION_LIMIT + 500)}`).question).toHaveLength(QUESTION_LIMIT);
  });
  it('shows markup as the words it is: nothing is interpreted here', () => {
    expect(replyContextFrom('#q=%3Cb%3Ehi%3C%2Fb%3E').question).toBe('<b>hi</b>');
  });
});
