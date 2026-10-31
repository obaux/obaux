'use client';

import { useEffect, useState } from 'react';

/**
 * How complete the place catalogue is, for the super admin (D-623; Will, 31 October: "visibility on how many programs exist
 * total. And a list of programs missing info … filtered and searchable"). `program_info_gaps()` counts the listed places and,
 * for a phone, a website, an address and real hours, how many need it and how many have it (Parks & Rec need only an address,
 * D-622). Asked with the list, it also returns each place that lacks something. It refuses anyone who is not a super admin.
 */
export const GAP_DETAILS = ['phone', 'website', 'address', 'hours'] as const;
export type GapDetail = (typeof GAP_DETAILS)[number];

export const PLACE_KINDS = ['health', 'library', 'parks', 'hand'] as const;
export type PlaceKind = (typeof PLACE_KINDS)[number];

export interface DetailCount {
  readonly need: number;
  readonly have: number;
}

export interface ProgramGapCounts {
  readonly total: number;
  readonly missing: number;
  readonly details: Readonly<Record<GapDetail, DetailCount>>;
}

export interface GapPlace {
  readonly id: string;
  readonly name: string;
  readonly address: string | null;
  readonly kind: PlaceKind;
  readonly missing: readonly GapDetail[];
}

export type ProgramGapsState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly counts: ProgramGapCounts; readonly places: readonly GapPlace[] }
  | { readonly status: 'error'; readonly offline: boolean };

const asNumber = (value: unknown): number => (typeof value === 'number' && Number.isFinite(value) ? value : 0);
const isDetail = (value: unknown): value is GapDetail => (GAP_DETAILS as readonly unknown[]).includes(value);
const asKind = (value: unknown): PlaceKind => ((PLACE_KINDS as readonly unknown[]).includes(value) ? (value as PlaceKind) : 'hand');

/** What the function answers, read defensively: an answer that is not the shape it should be is null, not a wrong number. */
export function readProgramGaps(raw: unknown): { counts: ProgramGapCounts; places: GapPlace[] } | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const r = raw as Record<string, unknown>;
  if (typeof r['total'] !== 'number') return null;
  const details = Object.fromEntries(
    GAP_DETAILS.map((d) => [d, { need: asNumber(r[`${d}_need`]), have: asNumber(r[`${d}_have`]) }]),
  ) as Record<GapDetail, DetailCount>;
  const places = Array.isArray(r['places'])
    ? (r['places'] as unknown[]).flatMap((p) => {
        if (!p || typeof p !== 'object') return [];
        const row = p as Record<string, unknown>;
        if (typeof row['id'] !== 'string' || typeof row['name'] !== 'string') return [];
        return [
          {
            id: row['id'],
            name: row['name'],
            address: typeof row['address'] === 'string' && row['address'].trim() ? row['address'] : null,
            kind: asKind(row['kind']),
            missing: Array.isArray(row['missing']) ? row['missing'].filter(isDetail) : [],
          },
        ];
      })
    : [];
  return { counts: { total: asNumber(r['total']), missing: asNumber(r['missing']), details }, places };
}

/** The counts for Home, or the counts and the list for Missing information. `refresh` asks again (Try again). */
export function useProgramGaps(enabled: boolean, withList: boolean, refresh = 0): ProgramGapsState {
  const [state, setState] = useState<ProgramGapsState>({ status: 'loading' });
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    setState({ status: 'loading' });
    void (async () => {
      try {
        const { createClient } = await import('./supabase');
        const { data, error } = await createClient().rpc('program_info_gaps', { p_with_list: withList });
        if (cancelled) return;
        const read = error ? null : readProgramGaps(data);
        if (!read) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        setState({ status: 'ready', ...read });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [enabled, withList, refresh]);
  return state;
}

export interface GapFilter {
  /** One detail, or null for anything missing. */
  readonly missing: GapDetail | null;
  /** One kind of place, or null for every kind. */
  readonly kind: PlaceKind | null;
  /** Words to find in the name or the address. */
  readonly query: string;
}

/** Lower case, accents dropped, spaces squeezed: "Café  Ave" finds "cafe ave". */
const fold = (text: string): string =>
  text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

/** The places the filters and the search keep, in the order the function gave them. Every word typed must be found. */
export function filterGaps(places: readonly GapPlace[], filter: GapFilter): GapPlace[] {
  const words = fold(filter.query).split(' ').filter(Boolean);
  return places.filter((p) => {
    if (filter.missing && !p.missing.includes(filter.missing)) return false;
    if (filter.kind && p.kind !== filter.kind) return false;
    if (words.length === 0) return true;
    const haystack = fold(`${p.name} ${p.address ?? ''}`);
    return words.every((w) => haystack.includes(w));
  });
}
