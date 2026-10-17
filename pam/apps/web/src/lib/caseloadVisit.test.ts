import { describe, expect, it } from 'vitest';
import { visitLineOf, visitLinesByMember, type VisitRow } from './caseloadVisit';

const NOW = Date.parse('2026-10-17T12:00:00Z');
const at = (days: number) => new Date(NOW + days * 86_400_000).toISOString();
const v = (days: number, status: string, member = 'm1'): VisitRow => ({ member_id: member, starts_at: at(days), status });

describe('the visit line on a member card (a93)', () => {
  it('shows the next visit first, the soonest one', () => {
    expect(visitLineOf([v(5, 'scheduled'), v(1, 'scheduled'), v(-2, 'attended')], NOW)).toEqual({ kind: 'next', at: at(1) });
  });
  it('otherwise the last visit they went to', () => {
    expect(visitLineOf([v(-9, 'attended'), v(-3, 'attended'), v(-1, 'missed')], NOW)).toEqual({ kind: 'went', at: at(-3) });
  });
  it('otherwise the last one they missed', () => {
    expect(visitLineOf([v(-9, 'missed'), v(-4, 'missed')], NOW)).toEqual({ kind: 'missed', at: at(-4) });
  });
  it('nothing when there are no visits, or only cancelled or unmarked past ones', () => {
    expect(visitLineOf([], NOW)).toBeNull();
    expect(visitLineOf([v(3, 'cancelled'), v(-2, 'scheduled')], NOW)).toBeNull();
  });
  it('a cancelled visit is never the next one', () => {
    expect(visitLineOf([v(1, 'cancelled'), v(-2, 'attended')], NOW)).toEqual({ kind: 'went', at: at(-2) });
  });
  it('splits one read of the whole list by member, and leaves out members with no line', () => {
    const lines = visitLinesByMember([v(2, 'scheduled', 'a'), v(-1, 'missed', 'b'), v(-1, 'scheduled', 'c')], NOW);
    expect([...lines.keys()].sort()).toEqual(['a', 'b']);
    expect(lines.get('a')?.kind).toBe('next');
    expect(lines.get('b')?.kind).toBe('missed');
  });
});
