'use client';

import { useEffect, useState } from 'react';

/**
 * The visits members have planned at a program lead's own program (D-526,
 * attendance part A): who is coming, by first name, and whether they were
 * checked in. One database door (`my_program_visits`, program lead only); a
 * member's name, phone and the rest stay theirs.
 */
export interface ProgramVisit {
  readonly id: string;
  readonly memberId: string;
  readonly firstName: string;
  readonly startsAt: string;
  readonly endsAt: string | null;
  readonly status: 'scheduled' | 'attended' | 'missed' | 'cancelled';
  readonly serviceName: string | null;
  readonly checkedInAt: string | null;
  /** The member marked this visit themselves (D-535): the lead cannot undo it. Not how. */
  readonly markedByMember: boolean;
}

interface VisitRow {
  readonly appointment_id: string;
  readonly member_id: string;
  readonly first_name: string | null;
  readonly starts_at: string;
  readonly ends_at: string | null;
  readonly status: ProgramVisit['status'];
  readonly service_name: string | null;
  readonly checked_in_at: string | null;
}

export function visitsFromRows(rows: readonly VisitRow[], ownMarks: readonly string[] = []): ProgramVisit[] {
  const own = new Set(ownMarks);
  return rows.map((row) => ({
    id: row.appointment_id,
    memberId: row.member_id,
    firstName: row.first_name ?? '',
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    status: row.status,
    serviceName: row.service_name,
    checkedInAt: row.checked_in_at,
    markedByMember: own.has(row.appointment_id),
  }));
}

/** Read once when asked for (a real program lead with a program on file); empty otherwise or when it cannot be read. */
export function useProgramVisits(enabled: boolean): readonly ProgramVisit[] {
  const [visits, setVisits] = useState<readonly ProgramVisit[]>([]);
  useEffect(() => {
    if (!enabled) {
      setVisits([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const supabase = createClient();
        const { data, error } = await supabase.rpc('my_program_visits');
        // Which marks the member made themselves (D-535); a failed read leaves them as the lead's own.
        const own = await supabase.rpc('my_program_own_marks');
        if (cancelled) return;
        setVisits(error ? [] : visitsFromRows((data ?? []) as VisitRow[], own.error ? [] : ((own.data ?? []) as string[])));
      } catch {
        if (!cancelled) setVisits([]);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return visits;
}
