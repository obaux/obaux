import { describe, expect, it } from 'vitest';
import { groupInbox, pamErrorFrom, type PamInboxRow } from './pam';

const row = (over: Partial<PamInboxRow>): PamInboxRow => ({
  conversationId: 'c', askerId: 'a', firstName: 'Ana', role: 'member', regionName: 'Philadelphia', programName: null,
  status: 'open', lastMessageAt: '2026-10-18T10:00:00Z', lastFrom: 'asker', waitingSince: null, preview: 'hi', ...over,
});

describe('groupInbox (Message Pam)', () => {
  it('puts the longest wait first, then answered newest first, then closed', () => {
    const rows = [
      row({ conversationId: 'newer-wait', waitingSince: '2026-10-18T09:00:00Z' }),
      row({ conversationId: 'older-wait', waitingSince: '2026-10-17T09:00:00Z' }),
      row({ conversationId: 'answered-old', lastFrom: 'team', lastMessageAt: '2026-10-16T09:00:00Z' }),
      row({ conversationId: 'answered-new', lastFrom: 'team', lastMessageAt: '2026-10-18T08:00:00Z' }),
      row({ conversationId: 'closed', status: 'closed', waitingSince: '2026-10-10T09:00:00Z' }),
    ];
    const g = groupInbox(rows);
    expect(g.waiting.map((r) => r.conversationId)).toEqual(['older-wait', 'newer-wait']);
    expect(g.answered.map((r) => r.conversationId)).toEqual(['answered-new', 'answered-old']);
    expect(g.closed.map((r) => r.conversationId)).toEqual(['closed']);
  });

  it('a closed conversation is never "waiting", however long the person has waited', () => {
    expect(groupInbox([row({ status: 'closed', waitingSince: '2026-01-01T00:00:00Z' })]).waiting).toEqual([]);
  });
});

describe('pamErrorFrom', () => {
  it('reads the code the database raised', () => {
    expect(pamErrorFrom('PAM_NO_ACTIVE_LEAD')).toBe('PAM_NO_ACTIVE_LEAD');
    expect(pamErrorFrom('new row ... PAM_RATE_LIMITED (P0001)')).toBe('PAM_RATE_LIMITED');
    expect(pamErrorFrom('ONLY_A_SUPER_ADMIN')).toBe('ONLY_A_SUPER_ADMIN');
  });
  it('anything else is OTHER, and nothing is a guess', () => {
    expect(pamErrorFrom('connection reset')).toBe('OTHER');
    expect(pamErrorFrom(undefined)).toBe('OTHER');
  });
});
