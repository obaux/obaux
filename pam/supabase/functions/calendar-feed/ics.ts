// The calendar file for a member's Pam visits (D-538, D-604): iCalendar, read-only, UTC times.
//
// Three shapes.
//   A LINK (D-604, the member's versioned address and the one-visit add): every event is the place's name alone as its title, its address as
//   the location, and the start and end; no link, no description, no "Pam visit". Anyone who sees the calendar sees a place and a time, and
//   nothing that says the member uses Pam. The lines a person never sees stay (BEGIN/END, VERSION, PRODID, UID, DTSTAMP, TRANSP).
//   A LEGACY link (D-538, made before D-604 and kept until its owner makes a new one), unchanged: DISCREET (the default) says only
//   "Pam visit", with the time and a link to the visits screen; DETAILS (the member's own switch) adds the place's name, its address and a link
//   to its page.
// Never in any: a note, the member's name, the service a program sees, attendance, points.
//
// This file is also what the app makes a one-visit add from (`buildVisitFile`, `googleEventUrl`), on the phone: the same events, the same
// fields, nothing sent to Pam.

export interface FeedVisit {
  readonly id: string;
  readonly starts_at: string;
  readonly ends_at: string | null;
  readonly place_id?: string | null;
  readonly name: string | null;
  readonly address: string | null;
}

export interface Feed {
  /** 'link' for a versioned address (D-604); absent for a legacy one. */
  readonly kind?: 'link';
  readonly show_details?: boolean;
  readonly visits: readonly FeedVisit[];
}

export const APP = 'https://app.joinpam.org';

const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** iCalendar text values: backslash, semicolon, comma and line breaks are escaped. */
export const escapeText = (text: string) =>
  text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

const encoder = new TextEncoder();

/** Lines longer than 75 octets are folded (RFC 5545 3.1): CRLF and a space, never inside a character. */
export function fold(line: string): string {
  if (encoder.encode(line).length <= 75) return line;
  const parts: string[] = [];
  let current = '';
  let size = 0;
  let limit = 75;
  for (const char of line) {
    const bytes = encoder.encode(char).length;
    if (size + bytes > limit) {
      parts.push(current);
      current = '';
      size = 0;
      limit = 74; // the leading space counts
    }
    current += char;
    size += bytes;
  }
  parts.push(current);
  return parts.join('\r\n ');
}

/** The lines of one event for a link or a one-visit add: UID, DTSTAMP, DTSTART, DTEND, SUMMARY (the place), LOCATION (the address), TRANSP. */
export function linkEventLines(visit: FeedVisit, now: Date): string[] {
  const start = new Date(visit.starts_at);
  const parsedEnd = visit.ends_at ? new Date(visit.ends_at) : null;
  const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 3_600_000);
  const lines = [
    'BEGIN:VEVENT',
    `UID:${visit.id}@joinpam.org`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${stamp(start)}`,
    `DTEND:${stamp(end)}`,
    // The place's name alone. If a place has none on file the title is the address, never "Pam".
    `SUMMARY:${escapeText(visit.name ?? visit.address ?? 'Visit')}`,
  ];
  if (visit.address) lines.push(`LOCATION:${escapeText(visit.address)}`);
  lines.push('TRANSP:OPAQUE', 'END:VEVENT');
  return lines;
}

/** The calendar's name in the member's own calendar list: neutral, not "Pam" (D-604; Sage's word to confirm). */
export const LINK_CALENDAR_NAME = 'Visits';

/** One visit as a calendar file, made on the phone for Apple Calendar or Outlook to open (D-604): the same event as the feed's. */
export function buildVisitFile(visit: FeedVisit, now: Date = new Date()): string {
  if (Number.isNaN(new Date(visit.starts_at).getTime())) return '';
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Pam//Visits//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', ...linkEventLines(visit, now), 'END:VCALENDAR'];
  return lines.map(fold).join('\r\n') + '\r\n';
}

/**
 * Google Calendar's page for adding one event (D-604), opened by a tap: the place's name as the title, the address, the time and the member's
 * own time zone (so the page shows it where they are). Nothing else: no details, no link. Nothing about this goes through Pam.
 */
export function googleEventUrl(visit: FeedVisit, timeZone?: string): string {
  const start = new Date(visit.starts_at);
  const parsedEnd = visit.ends_at ? new Date(visit.ends_at) : null;
  const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 3_600_000);
  const query = new URLSearchParams({ action: 'TEMPLATE', text: visit.name ?? visit.address ?? 'Visit', dates: `${stamp(start)}/${stamp(end)}` });
  if (visit.address) query.set('location', visit.address);
  if (timeZone) query.set('ctz', timeZone);
  return `https://calendar.google.com/calendar/render?${query.toString()}`;
}

export function buildCalendar(feed: Feed, now: Date = new Date()): string {
  const isLink = feed.kind === 'link';
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pam//Visits//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${isLink ? LINK_CALENDAR_NAME : 'Pam visits'}`,
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];
  for (const visit of feed.visits) {
    if (isLink) {
      if (!Number.isNaN(new Date(visit.starts_at).getTime())) lines.push(...linkEventLines(visit, now));
      continue;
    }
    const start = new Date(visit.starts_at);
    if (Number.isNaN(start.getTime())) continue;
    const parsedEnd = visit.ends_at ? new Date(visit.ends_at) : null;
    const end = parsedEnd && !Number.isNaN(parsedEnd.getTime()) && parsedEnd > start ? parsedEnd : new Date(start.getTime() + 3_600_000);
    const showsPlace = feed.show_details && visit.name;
    lines.push(
      'BEGIN:VEVENT',
      `UID:${visit.id}@joinpam.org`,
      `DTSTAMP:${stamp(now)}`,
      `DTSTART:${stamp(start)}`,
      `DTEND:${stamp(end)}`,
      `SUMMARY:${escapeText(showsPlace ? `Pam visit: ${visit.name}` : 'Pam visit')}`,
    );
    if (feed.show_details && visit.address) lines.push(`LOCATION:${escapeText(visit.address)}`);
    lines.push(
      feed.show_details && visit.place_id
        ? `URL:${APP}/place/?id=${encodeURIComponent(visit.place_id)}&from=trips&trip=${encodeURIComponent(visit.id)}`
        : `URL:${APP}/trips/`,
      'TRANSP:OPAQUE',
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.map(fold).join('\r\n') + '\r\n';
}
