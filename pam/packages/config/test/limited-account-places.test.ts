import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EN } from './_bundles.js';
import { NOTICES } from '../src/notices.js';

/**
 * A limited account can write to Pam (Will, card a100/a101, 18 October 2026: "Limited accounts can message Pam and vice versa, no limit
 * there"), and cannot send other messages. Seven places say what a limited account can do, and they say it in different words; when they
 * disagree the page a person reads says the opposite of the one they were told:
 *
 *   1. the Privacy page, `privacy.s.limits.p2`            4. the website post "I can't send messages" (`StartHere.tsx`)
 *   2. the Terms, `terms.s.limits.p2`                      5. "Case manager assignments" (`CaseManagerAssignments.tsx`)
 *   3. the app's notice, `notice.account_limited.body`     6. the account-status table in "Pam words" (`PamWords.tsx`)
 *      and its source in `notices.ts`
 *
 * They ship in one batch, with the conversation or after it (the notice and the posts say "write to Pam" and must not be live before a
 * limited person can). Nothing held the website posts to the policy until now.
 */

const PAM = fileURLToPath(new URL('../../../', import.meta.url));
const site = (name: string) => readFileSync(path.join(PAM, 'apps/site/src/content', name), 'utf8').replace(/\s+/g, ' ');
const noticeBody = (NOTICES as unknown as Record<string, { body: string }>)['account_limited']!.body;

describe('a limited account can write to Pam: every place says so', () => {
  it('the Privacy page and the Terms', () => {
    expect(EN['privacy.s.limits.p2']).toContain('can read messages and write to Pam, but cannot send other messages');
    expect(EN['terms.s.limits.p2']).toContain('it can read messages and write to Pam, but not send other messages');
  });

  it('the app\'s notice, in the bundle and in notices.ts, which are one sentence', () => {
    expect(EN['notice.account_limited.body']).toBe('You cannot send messages right now, except to Pam. Write to Pam and we will help you reach your guide.');
    expect(noticeBody).toBe(EN['notice.account_limited.body']);
  });

  it('the website\'s three posts', () => {
    const says = (file: string, phrase: string) => expect(site(file).includes(phrase), `${file} says: ${phrase}`).toBe(true);
    says('StartHere.tsx', 'You can still read your messages, and you can write to Pam.');
    says('StartHere.tsx', 'Write to Pam and we will help you reach your guide.');
    says('CaseManagerAssignments.tsx', 'A limited account can read messages and write to Pam, but can’t send other messages.');
    says('PamWords.tsx', 'A limited account can read messages and write to Pam, but cannot send other messages.');
  });

  it('no place still says a limited account cannot send, with nothing about Pam', () => {
    const old = /(read messages but (cannot|can’t|not) send them|You can still read your messages\.'|Your guide turned this off for your account)/;
    const places: Record<string, string> = {
      'privacy.s.limits.p2': EN['privacy.s.limits.p2']!,
      'terms.s.limits.p2': EN['terms.s.limits.p2']!,
      'notice.account_limited.body': EN['notice.account_limited.body']!,
      'notices.ts account_limited': noticeBody,
      'StartHere.tsx': site('StartHere.tsx'),
      'CaseManagerAssignments.tsx': site('CaseManagerAssignments.tsx'),
      'PamWords.tsx': site('PamWords.tsx'),
    };
    for (const [name, text] of Object.entries(places)) {
      expect(old.test(text), `${name} still says the old words (a limited account cannot send, with nothing about Pam)`).toBe(false);
    }
  });
});
