/**
 * The closed lists behind the app error log (D-616; Lena's Privacy read, Mira 21:23): what the app may tell the team went wrong, and nothing
 * else. A failure is reported as an ACTION key from this list and a CODE from the shapes below. There is no free text: an error's own
 * message carries the value that broke it ("Key (phone)=(2155550100) already exists"), so it is never sent, and a key that is not on the
 * list is never reported (the client drops it; the database also refuses anything that is not shaped like a stable key).
 *
 * Add a key here when a screen gains an action that can fail. Its shape is checked by `app-errors.test.ts`, which holds it to the same
 * pattern as the database's `app_errors.action` check, so a key that the database would refuse cannot be added.
 */
export const APP_ERROR_ACTIONS = [
  // Messaging
  'messages.send',
  'messages.photo',
  'messages.retry',
  'messages.load',
  'messages.pam.open',
  'messages.block',
  'messages.unblock',
  'messages.report',
  // Texts
  'alerts.switch.closed',
  'alerts.switch.message',
  'alerts.switch.booked',
  'alerts.switch.changed',
  'alerts.switch.trip',
  'alerts.switch.visit',
  'alerts.agree',
  'reminders.agree',
  'reminders.decline',
  'function.dispatch-sms',
  'pam.hours.save',
  'pam.thread.status',
  'directory.demo-view',
  'requests.review',
  'invite.create',
  'places.save',
  'places.unsave',
  'checkin.here',
  'checkin.went',
  'trips.cancel',
  'schedule.checkin',
  'schedule.undo',
  'flag.send',
  'program.save',
  'service.save',
  'service.remove',
  'request.withdraw',
  'policies.upload',
  'policies.remove',
  'program.add',
  'places.review',
  'programs.review',
] as const;

export type AppErrorAction = (typeof APP_ERROR_ACTIONS)[number];

/** The same shape the database holds `app_errors.action` to (migration 20261018211942). */
export const APP_ERROR_ACTION_SHAPE = /^[a-z][a-z0-9-]{0,29}(\.[a-z0-9][a-z0-9-]{0,29}){1,3}$/;

export function isAppErrorAction(value: unknown): value is AppErrorAction {
  return typeof value === 'string' && (APP_ERROR_ACTIONS as readonly string[]).includes(value);
}

/** The words a code may be besides an HTTP status (three digits) and a Postgres SQLSTATE (five of 0-9 and A-Z). */
export const APP_ERROR_WORD_CODES = ['offline', 'timeout', 'unknown'] as const;

/** A code the log accepts: an HTTP status, a SQLSTATE, or one of the three words. Anything else, such as an error's own words, is "unknown". */
export function appErrorCode(value: unknown): string {
  const text = typeof value === 'number' ? String(value) : typeof value === 'string' ? value : '';
  if (/^[0-9]{3}$/.test(text) || /^[0-9A-Z]{5}$/.test(text) || (APP_ERROR_WORD_CODES as readonly string[]).includes(text)) return text;
  return 'unknown';
}

/**
 * The screens the log may name (D-616, Iris D1): every route the app has, as its address with a closing slash. The database holds the same
 * list (`app_error_routes`) and stores any other address as `/unknown`, so a name or a word typed into an address can never reach the log.
 * A test holds this list to the app's folders; a new screen is added here and in a migration.
 */
export const APP_ERROR_ROUTES = [
  '/',
  '/about/',
  '/account/',
  '/admin/',
  '/alerts/',
  '/calendar/',
  '/cities/waiting/',
  '/connections/',
  '/directory/',
  '/flag/',
  '/gallery/',
  '/help/',
  '/help/report-place/',
  '/help/safety/',
  '/help/topics/',
  '/home/calendar/',
  '/interested/',
  '/invite/',
  '/invite/add/',
  '/invite/expired/',
  '/invite/in-use/',
  '/invite/new/',
  '/invites/',
  '/join/',
  '/language/',
  '/legal/',
  '/legal/privacy/',
  '/legal/privacy/copy/',
  '/legal/privacy/delete/',
  '/messages/',
  '/messages/pam/',
  '/messages/thread/',
  '/messages/thread/files/',
  '/messages/thread/options/',
  '/messages/thread/report/',
  '/notifications/',
  '/pam/hours/',
  '/pam/messages/',
  '/pam/start/',
  '/pam/thread/options/',
  '/person/',
  '/person/connect/',
  '/person/past/',
  '/person/policies/',
  '/place/',
  '/place/policies/',
  '/place/policies/view/',
  '/places/',
  '/places/reported/',
  '/points/',
  '/privacy/',
  '/problems/',
  '/profile/',
  '/profile/add-program/',
  '/program/',
  '/program/book/',
  '/program/book/new/',
  '/program/policies/',
  '/program/policies/view/',
  '/program/sent/',
  '/program/service/',
  '/program/switch/',
  '/programs/',
  '/programs/new/',
  '/programs/review/',
  '/programs/review/item/',
  '/reminders/',
  '/reply/',
  '/requests/',
  '/requests/program/',
  '/requests/review/',
  '/saved/',
  '/signin/',
  '/terms/',
  '/trips/',
  '/trips/new/',
  '/use-as/',
] as const;

export type AppErrorRoute = (typeof APP_ERROR_ROUTES)[number];

/** Where a report from this address is filed: the screen if the app has it, else `/unknown`. Mirrors the database. */
export function appErrorRoute(pathname: unknown): string {
  const text = typeof pathname === 'string' ? pathname.split('?')[0]!.split('#')[0]! : '';
  const withSlash = text.length > 1 && !text.endsWith('/') ? `${text}/` : text;
  return (APP_ERROR_ROUTES as readonly string[]).includes(withSlash) ? withSlash : '/unknown';
}
