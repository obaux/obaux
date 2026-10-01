/**
 * A pretend Supabase for journey stories: a signed-in session for the chosen
 * role, and every request to Supabase answered from `fixtures.ts`.
 *
 * Installed by `journeyLoader` before each story renders, and re-installed for
 * the next one, so switching stories switches who is signed in. **Nothing
 * reaches the real project**: a request no fixture answers gets an empty
 * answer (and a console note naming it), never the network — the app's
 * client is pointed at the live project by default (src/lib/project.ts).
 */
import { SUPABASE_URL } from '../../lib/project';
import {
  CASELOAD,
  CONVO_ID,
  DIRECTORY_PEOPLE,
  ME_ID,
  NOTIFICATIONS,
  OTHER_ID,
  PLACES,
  REGION_ID,
  ROLES,
  STAFF_REQUESTS,
  partnerFor,
  threadFor,
  type JourneyRole,
} from './fixtures';

type Answer = { status?: number; body: unknown };
type Route = (url: string, method: string) => Answer | null;

const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

function routesFor(journeyRole: JourneyRole): Route[] {
  const profile = ROLES[journeyRole].profile;
  const role = profile?.role ?? null;
  const has = (part: string) => (url: string) => url.includes(part);
  const on = (part: string, answer: (url: string, method: string) => Answer): Route => (url, method) =>
    has(part)(url) ? answer(url, method) : null;

  return [
    profile
      ? on('/auth/v1/user', () => ({ body: { id: ME_ID, phone: '12155550199' } }))
      : on('/auth/v1/', () => ({ status: 401, body: {} })),
    on('/auth/v1/', () => ({ body: {} })),
    on('/rest/v1/profiles', (url) =>
      url.includes('role=eq.member')
        ? { body: CASELOAD }
        : profile
          ? {
              body: {
                id: ME_ID,
                ...profile,
                region_id: REGION_ID,
                access_status: 'active',
                onboarded_at: new Date().toISOString(),
                preferred_language: 'en',
                is_demo: false,
                regions: { name: 'Philadelphia' },
              },
            }
          : { body: null },
    ),
    on('/rest/v1/notifications', () => ({ body: NOTIFICATIONS })),
    on('/rest/v1/notification_preferences', () => ({ body: null })),
    on('/rest/v1/access_controls', () => ({ body: [] })),
    on('/rpc/member_points', () => ({ body: 400 })),
    on('/rpc/services_near', () => ({ body: PLACES.map((place, i) => ({ ...place, meters: 400 + i * 900, has_hours: false })) })),
    on('/rpc/services_search', () => ({ body: PLACES.map((place, i) => ({ ...place, meters: 400 + i * 900, has_hours: false })) })),
    on('/rpc/service_detail', () => ({ body: [PLACES[0]] })),
    on('/rpc/directory_people', () => ({ body: DIRECTORY_PEOPLE })),
    on('/rpc/saved_places_mine', () => ({ body: PLACES })),
    on('/rest/v1/saved_places', () => ({ body: [] })),
    on('/rpc/flag_service', () => ({ body: { id: 'flag-1' } })),
    on('/rpc/flagged_services', () => ({ body: [] })),
    on('/rpc/served_cities', () => ({ body: [{ city: 'Philadelphia' }] })),
    on('/rest/v1/conversation_members', (url, method) => {
      if (method === 'PATCH') return { body: [] };
      if (url.includes('conversation_id=eq.')) {
        return {
          body: [
            { profile_id: ME_ID, conversations: { kind: 'direct' } },
            { profile_id: OTHER_ID, conversations: { kind: 'direct' } },
          ],
        };
      }
      return { body: [{ conversation_id: CONVO_ID, last_read_at: null }] };
    }),
    on('/rpc/conversation_partners', () => ({ body: [partnerFor(role)] })),
    on('/rpc/conversation_block_state', () => ({ body: [{ i_blocked: false, blocked_me: false }] })),
    on('/rest/v1/messages', (_url, method) =>
      method === 'POST'
        ? { body: { id: 'new', sender_id: ME_ID, body: 'Sent from Storybook', created_at: new Date().toISOString() } }
        : { body: threadFor(role) },
    ),
    on('/rest/v1/app_settings', () => ({ body: { value: '+12673095265' } })),
    on('/rest/v1/regions', () => ({ body: [{ id: REGION_ID, name: 'Philadelphia' }] })),
    on('/rest/v1/staff_requests', () => ({ body: STAFF_REQUESTS })),
    on('/rest/v1/enrollments', () => ({ body: [] })),
    on('/rpc/messageable_people', () => ({ body: [] })),
    on('/rpc/reports_for_review', () => ({ body: [] })),
    on('/rpc/people_activity', () => ({ body: [] })),
  ];
}

declare global {
  interface Window {
    __pamRealFetch?: typeof fetch;
  }
}

function urlOf(input: RequestInfo | URL): string {
  if (typeof input === 'string') return input;
  if (input instanceof URL) return input.href;
  return input.url;
}

export function installSupabaseMock(journeyRole: JourneyRole): void {
  const profile = ROLES[journeyRole].profile;

  // A fresh browser for every story: no previous story's preview role,
  // language choice or saved session carried over.
  for (const store of [window.localStorage, window.sessionStorage]) {
    for (const key of Object.keys(store)) {
      if (key.startsWith('pam.') || key.startsWith('sb-')) store.removeItem(key);
    }
  }
  if (profile) {
    const session = {
      access_token: 'storybook',
      refresh_token: 'storybook',
      token_type: 'bearer',
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600,
      user: { id: ME_ID, aud: 'authenticated', role: 'authenticated' },
    };
    window.localStorage.setItem(`sb-${PROJECT_REF}-auth-token`, JSON.stringify(session));
  }

  const real = (window.__pamRealFetch ??= window.fetch.bind(window));
  const routes = routesFor(journeyRole);

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = urlOf(input);
    if (!url.includes('.supabase.co')) return real(input, init);
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase();
    let answer: Answer | null = null;
    for (const route of routes) {
      answer = route(url, method);
      if (answer) break;
    }
    if (!answer) {
      // eslint-disable-next-line no-console
      console.info('[journey] no fixture for', method, url);
      answer = { body: [] };
    }
    return new Response(JSON.stringify(answer.body), {
      status: answer.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}
