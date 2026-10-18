import { describe, expect, it } from 'vitest';
import { groupPamInbox, pamWaitingCount, replyDuration, waitedFor, type PamInboxRow } from './pamInbox';

const row = (id: string, over: Partial<PamInboxRow>): PamInboxRow => ({
  conversationId: id,
  firstName: id,
  role: 'member',
  region: 'Philadelphia',
  programName: null,
  lastMessageAt: '2026-10-18T10:00:00Z',
  lastFromTeam: false,
  waitingSince: null,
  status: 'open',
  lastLine: '…',
  ...over,
});

describe('groupPamInbox (card a100)', () => {
  const rows = [
    row('aaliyah', { waitingSince: '2026-10-18T07:00:00Z', lastMessageAt: '2026-10-18T07:00:00Z' }),
    row('marcus', { waitingSince: '2026-10-16T09:00:00Z', lastMessageAt: '2026-10-18T09:30:00Z' }),
    row('dana', { lastFromTeam: true, lastMessageAt: '2026-10-13T12:00:00Z' }),
    row('lou', { lastFromTeam: true, lastMessageAt: '2026-10-17T12:00:00Z' }),
    row('old', { status: 'closed', lastMessageAt: '2026-10-01T12:00:00Z' }),
    row('reopened', { status: 'closed', waitingSince: '2026-10-18T08:00:00Z', lastMessageAt: '2026-10-18T08:00:00Z' }),
  ];
  const groups = groupPamInbox(rows);

  it('puts the longest wait first, even when that person wrote again since', () => {
    expect(groups.waiting.map((r) => r.conversationId)).toEqual(['marcus', 'aaliyah']);
  });
  it('lists answered conversations newest first', () => {
    expect(groups.answered.map((r) => r.conversationId)).toEqual(['lou', 'dana']);
  });
  it('keeps a closed conversation closed, whatever its last message', () => {
    expect(groups.closed.map((r) => r.conversationId)).toEqual(['reopened', 'old']);
  });
  it('counts only open conversations that wait, for Home (D-586)', () => {
    expect(pamWaitingCount(rows)).toBe(2);
    expect(pamWaitingCount([])).toBe(0);
  });
});

describe('waitedFor', () => {
  const now = new Date('2026-10-18T12:00:00Z');
  it('says the one unit a person would', () => {
    expect(waitedFor('2026-10-18T11:40:00Z', now)).toEqual({ unit: 'minutes', count: 20 });
    expect(waitedFor('2026-10-18T09:00:00Z', now)).toEqual({ unit: 'hours', count: 3 });
    expect(waitedFor('2026-10-16T09:00:00Z', now)).toEqual({ unit: 'days', count: 2 });
  });
  it('never says zero', () => {
    expect(waitedFor('2026-10-18T12:00:00Z', now)).toEqual({ unit: 'minutes', count: 1 });
  });
  it('rounds down at each boundary', () => {
    expect(waitedFor('2026-10-18T11:00:30Z', now)).toEqual({ unit: 'minutes', count: 59 });
    expect(waitedFor('2026-10-18T11:00:00Z', now)).toEqual({ unit: 'hours', count: 1 });
    expect(waitedFor('2026-10-17T12:00:01Z', now)).toEqual({ unit: 'hours', count: 23 });
  });
});

describe('replyDuration', () => {
  it('words a median in seconds the same way', () => {
    expect(replyDuration(2 * 3600 + 120)).toEqual({ unit: 'hours', count: 2 });
    expect(replyDuration(30)).toEqual({ unit: 'minutes', count: 1 });
  });
});
