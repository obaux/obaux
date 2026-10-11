// Pam's whole conversation with Google (D-539), with the fetch passed in so a test can stand in for Google.
// ONE scope: calendar.app.created, which lets Pam see, create, change and delete only the secondary calendars it
// made itself. It cannot read the member's own calendars. If Google ever grants more than that, Pam refuses it.

export const SCOPE = 'https://www.googleapis.com/auth/calendar.app.created';
const AUTH = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN = 'https://oauth2.googleapis.com/token';
const REVOKE = 'https://oauth2.googleapis.com/revoke';
const API = 'https://www.googleapis.com/calendar/v3';

export interface Credentials {
  readonly clientId: string;
  readonly clientSecret: string;
  readonly redirectUri: string;
}

/** Google refused the token (revoked, expired, or the member took Pam's access away): the connection is broken until they reconnect. */
export class Refused extends Error {}
/** Google said slow down or is unwell: stop this run, count it, try next time (never in a loop). */
export class Unwell extends Error {}

export function authUrl(creds: Credentials, state: string): string {
  const params = new URLSearchParams({
    client_id: creds.clientId,
    redirect_uri: creds.redirectUri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    // Offline access gives a refresh token only the first time, unless the member is asked again.
    prompt: 'consent',
    include_granted_scopes: 'false',
    state,
  });
  return `${AUTH}?${params.toString()}`;
}

const form = (values: Record<string, string>) => ({
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams(values).toString(),
});

export async function exchangeCode(fetcher: typeof fetch, creds: Credentials, code: string): Promise<{ refreshToken: string; accessToken: string; scope: string }> {
  const response = await fetcher(TOKEN, form({ code, client_id: creds.clientId, client_secret: creds.clientSecret, redirect_uri: creds.redirectUri, grant_type: 'authorization_code' }));
  if (!response.ok) throw new Refused(`token: ${response.status}`);
  const body = (await response.json()) as { refresh_token?: string; access_token?: string; scope?: string };
  if (!body.refresh_token || !body.access_token) throw new Refused('token: no refresh token');
  return { refreshToken: body.refresh_token, accessToken: body.access_token, scope: body.scope ?? '' };
}

/** True only if Google granted exactly the one scope Pam asked for: not nothing, and not one word more. */
export const grantedOnlyOurScope = (scope: string): boolean => {
  const granted = scope.split(/\s+/).filter(Boolean);
  return granted.length === 1 && granted[0] === SCOPE;
};

export async function accessToken(fetcher: typeof fetch, creds: Credentials, refreshToken: string): Promise<string> {
  const response = await fetcher(TOKEN, form({ client_id: creds.clientId, client_secret: creds.clientSecret, refresh_token: refreshToken, grant_type: 'refresh_token' }));
  if (response.status === 400 || response.status === 401) throw new Refused(`refresh: ${response.status}`);
  if (!response.ok) throw new Unwell(`refresh: ${response.status}`);
  const body = (await response.json()) as { access_token?: string };
  if (!body.access_token) throw new Unwell('refresh: no access token');
  return body.access_token;
}

export async function revoke(fetcher: typeof fetch, token: string): Promise<boolean> {
  try {
    return (await fetcher(REVOKE, form({ token }))).ok;
  } catch {
    return false;
  }
}

const authed = (token: string, init: RequestInit = {}): RequestInit => ({
  ...init,
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(init.headers ?? {}) },
});

/** Turns Google's answer into the kinds of trouble Pam handles: 401 and 403-forbidden mean refused; 429 and 5xx mean unwell. */
function check(response: Response, what: string): Response {
  if (response.ok) return response;
  if (response.status === 401) throw new Refused(`${what}: 401`);
  if (response.status === 429 || response.status >= 500) throw new Unwell(`${what}: ${response.status}`);
  return response;
}

export async function createCalendar(fetcher: typeof fetch, token: string): Promise<string> {
  const response = check(
    await fetcher(`${API}/calendars`, authed(token, { method: 'POST', body: JSON.stringify({ summary: 'Pam visits', description: 'Made by Pam. Pam keeps your visits here.' }) })),
    'calendars.insert',
  );
  if (!response.ok) throw new Refused(`calendars.insert: ${response.status}`);
  const body = (await response.json()) as { id?: string };
  if (!body.id) throw new Unwell('calendars.insert: no id');
  return body.id;
}

/** Deleting what is already gone (404, 410) is done. Returns whether the calendar is gone from Google. */
export async function deleteCalendar(fetcher: typeof fetch, token: string, calendarId: string): Promise<boolean> {
  try {
    const response = await fetcher(`${API}/calendars/${encodeURIComponent(calendarId)}`, authed(token, { method: 'DELETE' }));
    return response.ok || response.status === 404 || response.status === 410;
  } catch {
    return false;
  }
}

export type Written = 'created' | 'changed' | 'gone';

/** Writes one event: insert with Pam's own id; if that id exists already, change it. A calendar the member deleted is a refused connection. */
export async function writeEvent(fetcher: typeof fetch, token: string, calendarId: string, event: { id: string }, exists: boolean): Promise<Written> {
  const base = `${API}/calendars/${encodeURIComponent(calendarId)}/events`;
  const put = () => fetcher(`${base}/${event.id}`, authed(token, { method: 'PUT', body: JSON.stringify(event) }));
  if (exists) {
    const changed = check(await put(), 'events.update');
    if (changed.ok) return 'changed';
    // Not found: the member took the event out of the calendar. Put it back below (and if the whole calendar is gone, that says so).
  }
  const inserted = check(await fetcher(base, authed(token, { method: 'POST', body: JSON.stringify(event) })), 'events.insert');
  if (inserted.ok) return 'created';
  if (inserted.status === 409) {
    // The id exists already (Pam's note of it was lost): change it instead.
    const again = check(await put(), 'events.update');
    if (again.ok) return 'changed';
  }
  if (inserted.status === 404) throw new Refused('events.insert: calendar gone');
  throw new Unwell(`events.insert: ${inserted.status}`);
}

export async function deleteEvent(fetcher: typeof fetch, token: string, calendarId: string, eventId: string): Promise<Written> {
  const response = check(await fetcher(`${API}/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`, authed(token, { method: 'DELETE' })), 'events.delete');
  if (response.ok || response.status === 404 || response.status === 410) return 'gone';
  throw new Unwell(`events.delete: ${response.status}`);
}
