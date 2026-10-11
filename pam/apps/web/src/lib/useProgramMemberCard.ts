'use client';

import { useEffect, useState } from 'react';

/**
 * The small card a program lead sees for a member linked to their program (D-542): first name and the visits planned at THEIR
 * program, from `program_member_card`. Nothing else of the member is fetched or held here.
 */
export interface ProgramMemberCard {
  readonly memberId: string;
  readonly firstName: string;
  readonly visits: readonly {
    readonly id: string;
    readonly startsAt: string;
    readonly endsAt: string | null;
    readonly serviceName: string | null;
  }[];
}

export type ProgramMemberCardState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly card: ProgramMemberCard }
  | { readonly status: 'not-linked' };

interface CardJson {
  readonly member_id: string;
  readonly first_name: string | null;
  readonly visits: readonly {
    readonly appointment_id: string;
    readonly starts_at: string;
    readonly ends_at: string | null;
    readonly service_name: string | null;
  }[];
}

export function cardFromJson(json: CardJson): ProgramMemberCard {
  return {
    memberId: json.member_id,
    firstName: json.first_name ?? '',
    visits: (json.visits ?? []).map((v) => ({
      id: v.appointment_id,
      startsAt: v.starts_at,
      endsAt: v.ends_at,
      serviceName: v.service_name,
    })),
  };
}

export function useProgramMemberCard(memberId: string | null, enabled: boolean): ProgramMemberCardState {
  const [state, setState] = useState<ProgramMemberCardState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled || !memberId) {
      setState({ status: 'not-linked' });
      return;
    }
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('program_member_card', { p_member_id: memberId });
        if (cancelled) return;
        setState(error || !data ? { status: 'not-linked' } : { status: 'ready', card: cardFromJson(data as CardJson) });
      } catch {
        if (!cancelled) setState({ status: 'not-linked' });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [memberId, enabled]);
  return state;
}
