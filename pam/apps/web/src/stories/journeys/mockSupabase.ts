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
import { isFreshAccount } from '../../lib/programSetup';
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
  INVITES_LOG,
  partnerFor,
  threadFor,
  type JourneyRole,
} from './fixtures';

type Answer = { status?: number; body: unknown };
type Route = (url: string, method: string, body: unknown) => Answer | null;

const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

function routesFor(journeyRole: JourneyRole): Route[] {
  const profile = ROLES[journeyRole].profile;
  const role = profile?.role ?? null;
  const has = (part: string) => (url: string) => url.includes(part);
  const on = (part: string, answer: (url: string, method: string, body: unknown) => Answer): Route => (url, method, body) =>
    has(part)(url) ? answer(url, method, body) : null;

  return [
    profile
      ? on('/auth/v1/user', () => ({ body: { id: ME_ID, phone: '12155550199' } }))
      : on('/auth/v1/', () => ({ status: 401, body: {} })),
    on('/auth/v1/', () => ({ body: {} })),
    // A staff photo upload (D-345): accepted, never stored.
    on('/storage/v1/object/', () => ({ body: { Key: 'staff-photos/example.webp' } })),
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
    // A brand-new account has had nothing happen to it yet (D-361).
    on('/rest/v1/notifications', () => ({ body: isFreshAccount() ? [] : NOTIFICATIONS })),
    on('/rest/v1/notification_preferences', () => ({ body: null })),
    on('/rest/v1/access_controls', () => ({ body: [] })),
    on('/rpc/member_points', () => ({ body: 400 })),
    // The area drawer's suggestions (D-275): a few real Philadelphia ZIPs,
    // neighbourhoods and landmarks, filtered like the real `search_areas`.
    on('/rpc/search_areas', (_url, _method, body) => {
      const q = (((body ?? {}) as { p_query?: string }).p_query ?? '').trim().toLowerCase();
      const areas = [
        { id: 'zip:19107', kind: 'zip', label: '19107', lat: 39.9516, lon: -75.1587 },
        { id: 'zip:19122', kind: 'zip', label: '19122', lat: 39.9777, lon: -75.143 },
        { id: 'zip:19104', kind: 'zip', label: '19104', lat: 39.9638, lon: -75.2029 },
        { id: 'zip:19143', kind: 'zip', label: '19143', lat: 39.9434, lon: -75.2275 },
        { id: 'hood:kensington', kind: 'neighborhood', label: 'Kensington', lat: 39.9946, lon: -75.1214 },
        { id: 'hood:north-philadelphia', kind: 'neighborhood', label: 'North Philadelphia', lat: 39.991, lon: -75.1557 },
        { id: 'landmark:temple', kind: 'landmark', label: 'Temple University', lat: 39.9812, lon: -75.1554 },
      ];
      return { body: areas.filter((a) => !q || a.label.toLowerCase().includes(q)).slice(0, 8) };
    }),
    on('/rpc/services_near', (_url, _method, body) => {
      const category = ((body ?? {}) as { p_category?: string | null }).p_category;
      return {
        body: PLACES.map((place, i) => ({ ...place, meters: 400 + i * 450, has_hours: false })).filter(
          (place) => !category || place.category === category,
        ),
      };
    }),
    // Like the real one (0066): words against the name and the address, and
    // the category chip still applies — so search and its empty state can be
    // tried here.
    on('/rpc/services_search', (_url, _method, body) => {
      const args = (body ?? {}) as { p_query?: string; p_category?: string | null };
      const words = (args.p_query ?? '').toLowerCase().split(/\s+/).filter(Boolean);
      return {
        body: PLACES.map((place, i) => ({ ...place, meters: 400 + i * 450, has_hours: false })).filter(
          (place) =>
            (!args.p_category || place.category === args.p_category) &&
            words.every((word) => `${place.name} ${place.address ?? ''}`.toLowerCase().includes(word)),
        ),
      };
    }),
    on('/rpc/service_detail', (_url, _method, body) => {
      const id = ((body ?? {}) as { p_id?: string }).p_id;
      return { body: [PLACES.find((place) => place.id === id) ?? PLACES[0]] };
    }),
    on('/rpc/directory_people', () => ({ body: DIRECTORY_PEOPLE })),
    // The member's three (D-304): the rest of Explore is not saved.
    on('/rpc/saved_places_mine', () => ({ body: PLACES.slice(0, 3) })),
    on('/rest/v1/saved_places', () => ({ body: [] })),
    on('/rpc/flag_service', () => ({ body: { id: 'flag-1' } })),
    // An example code (D-218's Invite someone); the real one is made by the database.
    on('/rpc/create_invite', (_url, _method, body) => ({
      body: {
        code: 'PAM-7Q4K',
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        role: (body as { p_role?: string } | null)?.p_role ?? 'member',
      },
    })),
    // Nobody is waiting on an invite in a story (0077); sign-in goes on as usual.
    on('/rpc/pending_invite_for_me', () => ({ body: [] })),
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
      // The one example conversation is a member's with their case manager;
      // the super admin is never in one with a member (D-262), so their list
      // falls to the example set, where Teresa is.
      // ... and a member's list falls to the example set too (D-276), where
      // both Teresa and Sandra are; the one real thread (CONVO_ID) is still
      // reachable by its own address, as the conversation stories use it.
      if (role === 'super_admin' || role === 'member') return { body: [] };
      // A brand-new account is in no conversation yet (D-361).
      if (isFreshAccount()) return { body: [] };
      return { body: [{ conversation_id: CONVO_ID, last_read_at: null }] };
    }),
    // Message {name} on a caseload member's page (D-231, D-234) opens the one
    // example conversation, so the tap lands in a thread instead of the list.
    on('/rpc/open_direct_conversation', () => ({ body: CONVO_ID })),
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
    // Invite links (0071, D-258): PAM-OLD1 is the example expired link; any
    // other code is still good. The super admin's log has every state (D-263).
    on('/rpc/invite_preview', (_url, _method, body) => {
      const code = String((body as { p_code?: string } | null)?.p_code ?? '').toUpperCase();
      return {
        body: [
          {
            inviter_first_name: 'Dana',
            invited_role: 'provider',
            state: code === 'PAM-OLD1' ? 'expired' : 'valid',
          },
        ],
      };
    }),
    on('/rpc/request_invite_link', () => ({ body: true })),
    on('/rpc/invites_log', () => ({ body: INVITES_LOG })),
    // A fictional 555 number: a requester's phone, read on "Text Andre" (D-262).
    on('/rpc/staff_request_phone', () => ({ body: '+12155550177' })),
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
    let body: unknown = null;
    try {
      body = typeof init?.body === 'string' ? JSON.parse(init.body) : null;
    } catch {
      body = null;
    }
    let answer: Answer | null = null;
    for (const route of routes) {
      answer = route(url, method, body);
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
