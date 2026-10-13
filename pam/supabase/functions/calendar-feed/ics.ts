// The calendar file for a member's Pam visits (D-538): iCalendar, read-only, UTC times.
//
// Two shapes. DISCREET (the default): every event says only "Pam visit", with its time and a
// link to the visits screen. Nothing else: no program, no address, and the link carries no id,
// because anyone who sees the calendar could open an id. DETAILS (the member's own switch): the
// program's name, its address, and a link to its page. Never in either: a note, the member's
// name, the service a program sees, attendance, points.

export interface FeedVisit {
  readonly id: string;
  readonly starts_at: string;
  readonly ends_at: string | null;
  readonly place_id: string | null;
  readonly name: string | null;
  readonly address: string | null;
}

export interface Feed {
  readonly show_details: boolean;
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

export function buildCalendar(feed: Feed, now: Date = new Date()): string {
  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Pam//Visits//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'X-WR-CALNAME:Pam visits',
    'REFRESH-INTERVAL;VALUE=DURATION:PT12H',
    'X-PUBLISHED-TTL:PT12H',
  ];
  for (const visit of feed.visits) {
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
