import { describe, expect, it } from 'vitest';
import en from '../src/locales/en.json' with { type: 'json' };
import es from '../src/locales/es.json' with { type: 'json' };
import {
  NOTICES,
  NOTICE_LIST,
  NOTICE_I18N_KEYS,
  noticeForInviteError,
  type NoticeKey,
} from '../src/notices.js';
import { findDignityViolations, fleschKincaidGrade } from '../src/language.js';

const bundles = { en, es } as const satisfies Record<string, Record<string, string>>;

describe('notices (SOP §0 — never dead-end)', () => {
  it('translates every notice in both languages', () => {
    for (const key of NOTICE_I18N_KEYS) {
      expect(en, `en is missing ${key}`).toHaveProperty(key);
      expect(es, `es is missing ${key}`).toHaveProperty(key);
    }
  });

  it('keeps the English source and en.json identical', () => {
    // Two copies of the same sentence is how they drift. The reviewer reads the
    // copy in notices.ts next to the rule it implements; this keeps that honest.
    const bundle = en as Record<string, string>;
    for (const n of NOTICE_LIST) {
      expect(bundle[n.titleKey], `drift on ${n.titleKey}`).toBe(n.title);
      expect(bundle[n.bodyKey], `drift on ${n.bodyKey}`).toBe(n.body);
    }
  });

  it.each(NOTICE_LIST.map((n) => [n.key, n] as const))(
    '%s offers a way forward',
    (_key, notice) => {
      // §0: every screen has a visible way to get help. A notice that says what
      // went wrong and stops there is the dead end this rule exists to prevent.
      const body = notice.body.toLowerCase();
      const hasNextStep =
        notice.offersSupport ||
        /try|check|ask|pick|come back|show up|save/.test(body);
      expect(hasNextStep, `"${notice.title}" leaves the reader with nothing to do`).toBe(true);
    },
  );

  it('never blames the person reading it', () => {
    // "You do not have permission" tells someone they did something wrong.
    // "This person is in a different area" tells them what is true.
    const blaming =
      /you (do not|don't|cannot|can't) (have|access)|not allowed|denied|forbidden|unauthori[sz]ed|invalid|illegal|you failed|your (mistake|error|fault)/i;

    for (const n of NOTICE_LIST) {
      // "This is not your fault" matches the same words as blame while saying
      // the opposite, so reassurance is stripped before the check rather than
      // the check being loosened.
      const text = `${n.title} ${n.body}`.replace(/\bnot your (mistake|error|fault)\b/gi, '');
      expect(blaming.test(text), `"${n.title}" blames the reader`).toBe(false);
    }
  });

  it.each(Object.entries(bundles))('%s notice copy never discloses', (_l, bundle) => {
    const noticeOnly = Object.fromEntries(
      Object.entries(bundle).filter(([k]) => k.startsWith('notice.')),
    );
    expect(findDignityViolations(noticeOnly)).toEqual([]);
  });

  it('never reveals more than the reader is entitled to know', () => {
    // An admin looking outside their region learns their own scope, never
    // whether that person exists — otherwise this screen enumerates every
    // member in every region.
    const outOfRegion = NOTICES.admin_out_of_region;
    expect(outOfRegion.body).not.toMatch(/exists|not found|no such|no record|unknown (person|member)/i);
    expect(outOfRegion.body).toMatch(/your own area/i);
    // The call button was removed here deliberately (D-038): help lives in the
    // bottom bar, and a second one competes with it. The notice must still name
    // a next step, which the "offers a way forward" test above enforces.
    expect(outOfRegion.offersSupport).toBe(false);
    expect(outOfRegion.body).toMatch(/ask PAM support/i);
  });

  it('stays close to the grade-5 reading target', () => {
    const grades = NOTICE_LIST.map((n) => fleschKincaidGrade(`${n.title}. ${n.body}`));
    const over = NOTICE_LIST
      .map((n, i) => [n.key, Number(grades[i]!.toFixed(1))] as const)
      .filter(([, g]) => g > 6);
    expect(over, `notices above grade 6: ${JSON.stringify(over)}`).toEqual([]);
  });

  it('shows a banner for problems and an empty state for nothing-to-show', () => {
    // Astryx: banners are for a problem the reader must act on and render as
    // role="alert"; empty states are for an area with no data.
    expect(NOTICES.account_suspended.kind).toBe('banner');
    expect(NOTICES.something_went_wrong.kind).toBe('banner');
    expect(NOTICES.admin_out_of_region.kind).toBe('empty');
    expect(NOTICES.no_places_found.kind).toBe('empty');
  });

  it('maps every invite failure to its own message, and anything else to the fallback', () => {
    const cases: Record<string, NoticeKey> = {
      INVITE_NOT_FOUND: 'invite_not_found',
      INVITE_ALREADY_USED: 'invite_already_used',
      INVITE_EXPIRED: 'invite_expired',
      INVITE_PHONE_MISMATCH: 'invite_phone_mismatch',
    };
    for (const [code, key] of Object.entries(cases)) {
      expect(noticeForInviteError(code)).toBe(key);
    }
    // A raw database error must never reach someone typing in a code.
    expect(noticeForInviteError('23505')).toBe('something_went_wrong');
    expect(noticeForInviteError('')).toBe('something_went_wrong');
  });

  it('always offers the phone on the fallback', () => {
    // Everything unhandled lands here, so it is the one that must never
    // dead-end.
    expect(NOTICES.something_went_wrong.offersSupport).toBe(true);
  });
});
