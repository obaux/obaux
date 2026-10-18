import { describe, expect, it } from 'vitest';
import type { PamInboxRow } from './pam';
import { inboxGroups, pamWaitingCount, replyDuration, waitedFor, writtenIn } from './pamInbox';

const row = (id: string, over: Partial<PamInboxRow>): PamInboxRow => ({
  conversationId: id,
  askerId: `a-${id}`,
  firstName: id,
  role: 'member',
  regionName: 'Philadelphia',
  programName: null,
  status: 'open',
  lastMessageAt: '2026-10-18T10:00:00Z',
  lastFrom: 'asker',
  waitingSince: null,
  preview: '…',
  ...over,
});

describe('the inbox lists only conversations somebody wrote in (card a100)', () => {
  const rows = [
    row('aaliyah', { waitingSince: '2026-10-18T07:00:00Z', lastMessageAt: '2026-10-18T07:00:00Z' }),
    row('marcus', { waitingSince: '2026-10-16T09:00:00Z', lastMessageAt: '2026-10-18T09:30:00Z' }),
    row('dana', { lastFrom: 'team', lastMessageAt: '2026-10-13T12:00:00Z' }),
    // Pam's welcome and nothing else: every account has one, and it is not a conversation to answer.
    row('welcomed', { firstName: null, lastFrom: null, lastMessageAt: null, preview: null }),
    row('old', { status: 'closed', lastFrom: 'team', lastMessageAt: '2026-10-01T12:00:00Z' }),
  ];

  it('leaves out a conversation that holds only the welcome', () => {
    expect(writtenIn(rows).map((r) => r.conversationId)).not.toContain('welcomed');
  });
  it('groups the rest: longest wait first, then answered, then closed', () => {
    const groups = inboxGroups(rows);
    expect(groups.waiting.map((r) => r.conversationId)).toEqual(['marcus', 'aaliyah']);
    expect(groups.answered.map((r) => r.conversationId)).toEqual(['dana']);
    expect(groups.closed.map((r) => r.conversationId)).toEqual(['old']);
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
  it('rounds up, because the line says "within"', () => {
    expect(replyDuration(5400)).toEqual({ unit: 'hours', count: 2 });
    expect(replyDuration(3600)).toEqual({ unit: 'hours', count: 1 });
    expect(replyDuration(3601)).toEqual({ unit: 'hours', count: 2 });
    expect(replyDuration(30)).toEqual({ unit: 'minutes', count: 1 });
    expect(replyDuration(59 * 60 + 1)).toEqual({ unit: 'hours', count: 1 });
    expect(replyDuration(25 * 3600)).toEqual({ unit: 'days', count: 2 });
  });
});
