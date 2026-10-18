/**
 * When Pam is here, as a line a person reads (D-605). One function, so the out-of-hours reply (`pam.away`), the thread's status and
 * the super admin's hours editor cannot say it two ways. The setting is `app_settings.pam_hours` (a time zone, ISO weekdays, an
 * opening and a closing time); the words are Sage's: `pam.hours` is "{days}, {open} to {close} {zone} time", with
 * `pam.hours.days.range` "{first} to {last}", `pam.hours.days.every` "Every day", and the language's own list for days that do not
 * run on in a row ("Monday, Wednesday and Friday"). Times and day names are the reader's own (`Intl`), in their language.
 */
export interface PamHours {
  /** An IANA zone, e.g. America/New_York. */
  readonly tz: string;
  /** ISO weekdays, 1 is Monday, sorted, no repeats. */
  readonly days: readonly number[];
  /** 'HH:MM' or 'HH:MM:SS', 24-hour, local to `tz`. */
  readonly open: string;
  readonly close: string;
}

/** Will's default until he says otherwise (D-605): Monday to Friday, 9:00 to 17:00, Eastern. */
export const DEFAULT_PAM_HOURS: PamHours = { tz: 'America/New_York', days: [1, 2, 3, 4, 5], open: '09:00', close: '17:00' };

/** The setting as stored (JSON text) or as `pam_status()` gives it (columns); anything missing or wrong falls back to the default. */
export function parsePamHours(raw: unknown): PamHours {
  let value: unknown = raw;
  if (typeof raw === 'string') {
    try {
      value = JSON.parse(raw);
    } catch {
      return DEFAULT_PAM_HOURS;
    }
  }
  if (!value || typeof value !== 'object') return DEFAULT_PAM_HOURS;
  const v = value as Record<string, unknown>;
  const days = Array.isArray(v.days)
    ? [...new Set(v.days.map(Number).filter((d) => Number.isInteger(d) && d >= 1 && d <= 7))].sort((a, b) => a - b)
    : [];
  return {
    tz: typeof v.tz === 'string' && v.tz ? v.tz : DEFAULT_PAM_HOURS.tz,
    days: days.length > 0 ? days : DEFAULT_PAM_HOURS.days,
    open: typeof v.open === 'string' && /^\d{2}:\d{2}/.test(v.open) ? v.open : DEFAULT_PAM_HOURS.open,
    close: typeof v.close === 'string' && /^\d{2}:\d{2}/.test(v.close) ? v.close : DEFAULT_PAM_HOURS.close,
  };
}

type Translate = (key: string, vars?: Record<string, string>) => string;

/** A weekday's name in the reader's language: 1 is Monday. (2024-01-01 was a Monday.) */
const dayName = (day: number, locale: string) =>
  new Intl.DateTimeFormat(locale, { weekday: 'long', timeZone: 'UTC' }).format(new Date(Date.UTC(2024, 0, day)));

/** A time of day in the reader's own format, without minutes when there are none: "9 AM", "5:30 PM", "09:00". */
function timeOfDay(hhmm: string, locale: string): string {
  const [h = '0', m = '0'] = hhmm.split(':');
  const hours = Number(h);
  const minutes = Number(m);
  return new Intl.DateTimeFormat(locale, {
    hour: 'numeric',
    ...(minutes !== 0 ? { minute: '2-digit' as const } : {}),
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(2024, 0, 1, hours, minutes)));
}

/** The zone as a person says it: "Eastern" for New York (Sage), otherwise the city. */
function zoneName(tz: string, t: Translate): string {
  if (tz === 'America/New_York') return t('pam.hours.zone.eastern');
  const city = tz.split('/').pop() ?? tz;
  return city.replace(/_/g, ' ');
}

/** "Monday to Friday", "Every day", "Saturday", or "Monday, Wednesday and Friday". */
export function pamDaysLine(days: readonly number[], locale: string, t: Translate): string {
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  if (sorted.length === 7) return t('pam.hours.days.every');
  if (sorted.length === 1) return dayName(sorted[0]!, locale);
  const run = sorted.every((d, i) => i === 0 || d === sorted[i - 1]! + 1);
  if (run) return t('pam.hours.days.range', { first: dayName(sorted[0]!, locale), last: dayName(sorted[sorted.length - 1]!, locale) });
  return new Intl.ListFormat(locale, { style: 'long', type: 'conjunction' }).format(sorted.map((d) => dayName(d, locale)));
}

/** "Monday to Friday, 9 AM to 5 PM Eastern time". */
export function pamHoursLine(hours: PamHours, locale: string, t: Translate): string {
  return t('pam.hours', {
    days: pamDaysLine(hours.days, locale, t),
    open: timeOfDay(hours.open, locale),
    close: timeOfDay(hours.close, locale),
    zone: zoneName(hours.tz, t),
  });
}
