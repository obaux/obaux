'use client';

import { useCallback, useEffect, useState } from 'react';
import { REVIEW_DAYS } from './programSetup';

/**
 * The programs a super admin has still to look at (D-386, part 6):
 * `programs_to_check()` reads them, `review_program_submission()` decides one.
 * Both are migration 20261010134145 and both check inside the database that the
 * caller is a super admin — nothing here is trusted to.
 *
 * The list carries the lead's first name and what they sent, never a contact
 * detail.
 */
export type CheckStatus = 'in_review' | 'changes_asked' | 'withdrawn';

export interface ProgramToCheck {
  readonly id: string;
  readonly serviceId: string;
  readonly kind: 'new' | 'change';
  readonly status: CheckStatus;
  readonly sentAt: string;
  readonly daysWaiting: number;
  /** A first send by what it sent; a change by the live program's name. */
  readonly programName: string;
  readonly details: Readonly<Record<string, string | null>>;
  readonly leadName: string | null;
  readonly replacesId: string | null;
  readonly replacedBy: string | null;
  readonly withdrawnAt: string | null;
}

export interface ProgramToCheckRow {
  readonly id: string;
  readonly service_id: string;
  readonly kind: string;
  readonly status: string;
  readonly sent_at: string;
  readonly days_waiting: number;
  readonly program_name: string | null;
  readonly details: Record<string, string | null> | null;
  readonly lead_name: string | null;
  readonly replaces_id: string | null;
  readonly replaced_by: string | null;
  readonly withdrawn_at: string | null;
}

export function programFromRow(row: ProgramToCheckRow): ProgramToCheck {
  return {
    id: row.id,
    serviceId: row.service_id,
    kind: row.kind === 'change' ? 'change' : 'new',
    status: row.status === 'withdrawn' ? 'withdrawn' : row.status === 'changes_asked' ? 'changes_asked' : 'in_review',
    sentAt: row.sent_at,
    daysWaiting: row.days_waiting,
    programName: row.program_name ?? '',
    details: row.details ?? {},
    leadName: row.lead_name,
    replacesId: row.replaces_id,
    replacedBy: row.replaced_by,
    withdrawnAt: row.withdrawn_at,
  };
}

/** Waiting longer than the lead's page says "taking longer" (D-386): the same three days. */
export const isLate = (program: ProgramToCheck): boolean =>
  program.status === 'in_review' && program.daysWaiting >= REVIEW_DAYS;

/** The things a lead can send, in the order a reviewer reads them. */
export const SENT_FIELDS = ['name', 'category', 'subcategory', 'description', 'address', 'phone', 'website'] as const;
export type SentField = (typeof SENT_FIELDS)[number];

/** The fields that were sent and have a value, in reading order. */
export function sentFields(program: ProgramToCheck): { field: SentField; value: string }[] {
  const out: { field: SentField; value: string }[] = [];
  for (const field of SENT_FIELDS) {
    const value = program.details[field];
    if (typeof value === 'string' && value.trim() !== '') out.push({ field, value });
  }
  return out;
}

export type ProgramsToCheckState =
  | { status: 'loading' }
  | { status: 'ready'; programs: readonly ProgramToCheck[] }
  | { status: 'error'; offline: boolean };

export function useProgramsToCheck(enabled: boolean): { state: ProgramsToCheckState; refresh: () => void } {
  const [state, setState] = useState<ProgramsToCheckState>({ status: 'loading' });
  const [nonce, setNonce] = useState(0);
  const refresh = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('programs_to_check');
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        setState({ status: 'ready', programs: ((data ?? []) as ProgramToCheckRow[]).map(programFromRow) });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, nonce]);

  return { state, refresh };
}

export type ProgramDecision = 'approved' | 'changes_asked' | 'discarded';

/** Decide one. Resolves false when the database refused or could not be reached. */
export async function reviewProgram(id: string, decision: ProgramDecision, note?: string): Promise<boolean> {
  try {
    const { createClient } = await import('./supabase');
    const { error } = await createClient().rpc('review_program_submission', {
      p_id: id,
      p_decision: decision,
      ...(note ? { p_note: note } : {}),
    });
    return !error;
  } catch {
    return false;
  }
}
