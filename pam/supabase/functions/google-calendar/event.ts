// What one visit looks like in the member's "Pam visits" calendar (D-539). The same words as the calendar
// link (calendar-feed/ics.ts) and the same setting: DISCREET by default ("Pam visit", the time, a link to the
// visits screen with no id in it); with the member's switch, the program's name and address and a link to its page.
// Never: a note, the member's name, the service a program sees, attendance, points.

export interface Visit {
  readonly id: string;
  readonly starts_at: string;
  readonly ends_at: string | null;
  readonly place_id: string | null;
  readonly name: string | null;
  readonly address: string | null;
}

export interface VisitsAnswer {
  readonly show_details: boolean;
  readonly visits: readonly Visit[];
}

export const APP = 'https://app.joinpam.org';

export interface GoogleEvent {
  readonly id: string;
  readonly summary: string;
  readonly location?: string;
  readonly start: { readonly dateTime: string; readonly timeZone: 'UTC' };
  readonly end: { readonly dateTime: string; readonly timeZone: 'UTC' };
  readonly source: { readonly title: 'Pam'; readonly url: string };
  readonly transparency: 'opaque';
  readonly reminders: { readonly useDefault: false };
  readonly extendedProperties: { readonly private: { readonly pamVisit: string } };
}

/** Google's event ids are 5 to 1024 characters of a-v and 0-9; the visit's id without its dashes is one, and is the same every time. */
export const eventIdOf = (visitId: string): string => visitId.replace(/-/g, '').toLowerCase();

const iso = (date: Date) => date.toISOString().replace(/\.\d{3}Z$/, 'Z');

export function eventFor(visit: Visit, showDetails: boolean): GoogleEvent | null {
  const start = new Date(visit.starts_at);
  if (Number.isNaN(start.getTime())) return null;
  const parsedEnd = visit.ends_at ? new Date(visit.ends_at) : null;
  const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 3_600_000);
  const named = showDetails && visit.name;
  return {
    id: eventIdOf(visit.id),
    summary: named ? `Pam visit: ${visit.name}` : 'Pam visit',
    ...(showDetails && visit.address ? { location: visit.address } : {}),
    start: { dateTime: iso(start), timeZone: 'UTC' },
    end: { dateTime: iso(end), timeZone: 'UTC' },
    source: {
      title: 'Pam',
      url:
        showDetails && visit.place_id
          ? `${APP}/place/?id=${encodeURIComponent(visit.place_id)}&from=trips&trip=${encodeURIComponent(visit.id)}`
          : `${APP}/trips/`,
    },
    transparency: 'opaque',
    reminders: { useDefault: false },
    extendedProperties: { private: { pamVisit: visit.id } },
  };
}
