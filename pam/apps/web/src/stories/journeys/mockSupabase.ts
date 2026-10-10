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
  linkPreviewsFor,
  type JourneyRole,
} from './fixtures';

/**
 * `file`: answer with a file Storybook itself serves, not JSON (a photo,
 * D-394). `raw`: answer with these bytes as `contentType` (a document, D-399).
 */
type Answer = { status?: number; body: unknown; file?: string; raw?: string; contentType?: string };

/** Which picture Storybook serves for each example photo in a conversation. */
const PHOTO_FILES: readonly (readonly [string, string])[] = [
  ['example-stop', '/onboarding/hero-city.webp'],
  ['example-room', '/friend/bring-a-friend-800.webp'],
  ['example-door', '/onboarding/hero-sneakers.webp'],
];

/** A one-page PDF, made here so a story never fetches one (D-399). */
const EXAMPLE_PDF = [
  '%PDF-1.4',
  '1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj',
  '2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj',
  '3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj',
  '4 0 obj<</Length 52>>stream',
  'BT /F1 24 Tf 72 700 Td (An example letter) Tj ET',
  'endstream endobj',
  '5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj',
  'trailer<</Root 1 0 R>>',
  '%%EOF',
].join('\n');
type Route = (url: string, method: string, body: unknown) => Answer | null;

const PROJECT_REF = new URL(SUPABASE_URL).hostname.split('.')[0];

/** What a story can change about the pretend account. */
export interface MockOptions {
  /** A limited account (0031): reads, but the database refuses a send (D-427). */
  readonly limited?: boolean;
  /** The person replied STOP: stored, and nothing in the app can undo it (D-453). */
  readonly textsStopped?: boolean;
  /** Somebody blocked in the example conversation (0076, D-463): the reader did, or the other person did. */
  readonly blocked?: 'mine' | 'theirs';
  /**
   * A program lead who already has a program on file (D-447): waiting for
   * review, or approved and live. Without it the lead has none — and a send
   * from Add a program puts one on file, waiting, as the real database does.
   */
  readonly ownProgram?: 'review' | 'live';
  /** With `ownProgram: 'live'`: a change to its name or address already waiting for Pam (D-462). */
  readonly pendingChange?: boolean;
  /** The program of `SAVED_PLACE` offers services (D-462), for a member's view of it. */
  readonly placeServices?: boolean;
  /**
   * A member who already has a trip saved (D-454). Without it they have none —
   * and a trip planned to a real place in the story is saved from then on, as
   * the real database does (example places stay in the tab).
   */
  readonly savedTrip?: boolean;
  /** Also a saved trip whose day has passed, so Trips shows its Past visits section. */
  readonly pastTrip?: boolean;
}

/** A real place of the catalogue, to plan a trip to in a story (the examples' ids are not real). */
export const SAVED_PLACE = {
  id: '4c0f6b64-3a0e-4b8e-9d6c-7a1f0f3c2b11',
  name: 'Riverside Job Center',
  category: 'workforce',
  address: '1234 Market St, Philadelphia, PA 19107',
} as const;

interface ProgramServiceRow {
  id: string;
  service_id: string;
  name: string;
  description: string | null;
  phone: string | null;
  website: string | null;
  address: string | null;
  hours: unknown;
  sort_order: number;
}

let serviceCounter = 0;
function programServiceRow(
  programId: string,
  name: string,
  description: string | null,
  extra: Partial<ProgramServiceRow> = {},
): ProgramServiceRow {
  serviceCounter += 1;
  return {
    id: `5e5e5e5e-0000-4000-8000-${String(serviceCounter).padStart(12, '0')}`,
    service_id: programId,
    name,
    description,
    phone: null,
    website: null,
    address: null,
    hours: null,
    sort_order: serviceCounter,
    ...extra,
  };
}

interface SavedTripRow {
  id: string;
  service_id: string;
  place_name: string;
  category: string;
  address: string;
  lat: number;
  lon: number;
  starts_at: string;
  note: string | null;
  status: 'scheduled';
}

/**
 * A time `days` from today on the hour, like the example trips (`dummy-trips.ts`):
 * the fit audit keeps the date the stories believe it is but not the minute, so
 * a story that shows `now + 4 days` reads "12:04" one run and "12:00" the next,
 * and its accepted entry (keyed by the text) stops matching.
 */
function onTheHour(days: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function savedTripRow(n: number, startsAt: string, note: string | null = null): SavedTripRow {
  return {
    id: `7a1f0f3c-2b11-4c0f-8b64-${String(n).padStart(12, '0')}`,
    service_id: SAVED_PLACE.id,
    place_name: SAVED_PLACE.name,
    category: SAVED_PLACE.category,
    address: SAVED_PLACE.address,
    lat: 39.9526,
    lon: -75.1652,
    starts_at: startsAt,
    note,
    status: 'scheduled',
  };
}

/** The lead's program (a listing in the catalogue, so its id is a real one). */
const OWN_PROGRAM_ID = '4c0f6b64-3a0e-4b8e-9d6c-0a0a0a0a0a0a';

/** The lead's organisation in the pretend database, once they have a program. */
const OWN_ORG_ID = '22222222-0000-0000-0000-0000000000aa';

/** The lead's program as the pretend database holds it (D-447). */
function ownProgramRow(state: 'review' | 'live') {
  return {
    id: OWN_PROGRAM_ID,
    name: 'Fresh Start Kitchen',
    category: 'workforce',
    subcategory: 'job_training',
    description_plain: 'Hands-on cooking classes and a job-readiness workshop, Monday to Thursday.',
    address: '1234 Market St, Philadelphia, PA 19107',
    phone: '+12155550143',
    website: 'https://example.org/fresh-start',
    needs_review: state === 'review',
    is_active: true,
    created_at: new Date(Date.now() - 2 * 86_400_000).toISOString(),
  };
}

function routesFor(journeyRole: JourneyRole, options: MockOptions = {}): Route[] {
  const profile = ROLES[journeyRole].profile;
  const role = profile?.role ?? null;
  // A program sent from Add a program in this story is on file from then on.
  let ownProgram: 'review' | 'live' | undefined = options.ownProgram;
  // What is waiting for Pam on it (D-462): a first send, or a live program's change.
  let submissions: Array<Record<string, unknown>> = [];
  if (ownProgram === 'review') {
    submissions = [
      { id: 'sub-new', kind: 'new', status: 'in_review', details: {}, sent_at: ownProgramRow('review').created_at, changes_note: null },
    ];
  } else if (ownProgram === 'live' && options.pendingChange) {
    submissions = [
      {
        id: 'sub-change',
        kind: 'change',
        status: 'in_review',
        details: { name: 'Fresh Start Community Kitchen', address: '2 Market St, Philadelphia, PA 19107' },
        sent_at: new Date().toISOString(),
        changes_note: null,
      },
    ];
  }
  // The services programs offer (D-462): a lead's own program once it is on file,
  // and the catalogue program a member plans a trip to.
  const programServices: ProgramServiceRow[] = [
    ...(options.ownProgram
      ? [
          programServiceRow(OWN_PROGRAM_ID, 'Knife skills', 'Two evenings a week.', { phone: '+12155550177' }),
          programServiceRow(OWN_PROGRAM_ID, 'Job-readiness workshop', 'Resumes, interviews and showing up ready.'),
        ]
      : []),
    ...(options.placeServices
      ? [
          programServiceRow(SAVED_PLACE.id, 'Resume help', 'One-to-one help with a resume.', { phone: '+12155550188' }),
          programServiceRow(SAVED_PLACE.id, 'Computer lab', 'Open computers and printing.', {
            address: '300 Chestnut St, Philadelphia, PA 19106',
          }),
        ]
      : []),
  ];
  // The member's saved trips (D-454): planning one adds it, moving one changes it, and reading answers with them.
  const savedTrips: SavedTripRow[] = options.savedTrip
    ? [savedTripRow(1, onTheHour(4, 12), 'Bring my ID'), ...(options.pastTrip ? [savedTripRow(2, onTheHour(-3, 10))] : [])]
    : [];
  const has = (part: string) => (url: string) => url.includes(part);
  const on = (part: string, answer: (url: string, method: string, body: unknown) => Answer): Route => (url, method, body) =>
    has(part)(url) ? answer(url, method, body) : null;

  return [
    profile
      ? on('/auth/v1/user', () => ({ body: { id: ME_ID, phone: '12155550199' } }))
      : on('/auth/v1/', () => ({ status: 401, body: {} })),
    on('/auth/v1/', () => ({ body: {} })),
    // A photo in a conversation (D-394): a download answers with a picture
    // Storybook already serves; an upload is accepted and never stored. No
    // request reaches the live project.
    (url, method) =>
      url.includes('/storage/v1/object/') && url.includes('/message-photos/')
        ? method === 'GET'
          ? { body: null, file: PHOTO_FILES.find(([name]) => url.includes(name))?.[1] ?? '/onboarding/hero-city.webp' }
          : { body: { Key: 'message-photos/example.jpg' } }
        : null,
    // A document in a conversation (D-399): a download answers with a
    // one-page PDF made here; an upload is accepted and never stored.
    (url, method) =>
      url.includes('/storage/v1/object/') && url.includes('/message-files/')
        ? method === 'GET'
          ? { body: null, raw: EXAMPLE_PDF, contentType: 'application/pdf' }
          : { body: { Key: 'message-files/example.pdf' } }
        : null,
    // A link preview's picture (D-407): a picture Storybook already serves.
    (url, method) =>
      url.includes('/storage/v1/object/') && url.includes('/link-previews/') && method === 'GET'
        ? { body: null, file: '/friend/bring-a-friend-800.webp' }
        : null,
    // A staff photo upload (D-345): accepted, never stored.
    on('/storage/v1/object/', () => ({ body: { Key: 'staff-photos/example.webp' } })),
    // Link previews (D-407): the example conversation's kept preview, and
    // Pam's server, which is never asked for real from a story.
    on('/rest/v1/message_link_previews', () => ({ body: linkPreviewsFor(role) })),
    on('/functions/v1/link-preview', () => ({ body: { made: 0 } })),
    on('/rpc/report_photos_for_review', () => ({ body: [] })),
    on('/rpc/report_files_for_review', () => ({ body: [] })),
    on('/rpc/log_call', () => ({ body: true })),
    on('/rpc/my_trips', () => ({ body: savedTrips })),
    on('/rpc/my_trip_services', () => ({ body: [] })),
    on('/rpc/book_trip_at_service', (_url, _method, body) => {
      const args = (body ?? {}) as { p_starts_at: string; p_note?: string | null };
      const row = savedTripRow(savedTrips.length + 1, args.p_starts_at, args.p_note ?? null);
      savedTrips.push(row);
      return { body: row };
    }),
    on('/rpc/book_trip', (_url, _method, body) => {
      const args = (body ?? {}) as { p_starts_at: string; p_note?: string | null };
      const row = savedTripRow(savedTrips.length + 1, args.p_starts_at, args.p_note ?? null);
      savedTrips.push(row);
      return { body: row };
    }),
    on('/rpc/move_trip', (_url, _method, body) => {
      const args = (body ?? {}) as { p_id: string; p_starts_at: string };
      const row = savedTrips.find((trip) => trip.id === args.p_id);
      if (row) row.starts_at = args.p_starts_at;
      return { body: row ?? null };
    }),
    // The lead's own program (D-447): sending one puts it on file; reading it
    // answers the one row, by the organisation the profile names.
    on('/rpc/submit_program', () => {
      ownProgram = ownProgram ?? 'review';
      submissions = [
        { id: 'sub-new', kind: 'new', status: 'in_review', details: {}, sent_at: new Date().toISOString(), changes_note: null },
      ];
      return { body: ownProgramRow(ownProgram) };
    }),
    on('/rpc/request_program_change', (_url, _method, body) => {
      const args = (body ?? {}) as { p_name?: string; p_address?: string | null };
      const change = {
        id: 'sub-change',
        kind: 'change',
        status: 'in_review',
        details: { name: args.p_name ?? null, address: args.p_address ?? null },
        sent_at: new Date().toISOString(),
        changes_note: null,
      };
      submissions = [change];
      return { body: change };
    }),
    on('/rpc/withdraw_program_submission', (_url, _method, body) => {
      const id = ((body ?? {}) as { p_id?: string }).p_id;
      const gone = submissions.find((sub) => sub['id'] === id);
      submissions = submissions.filter((sub) => sub['id'] !== id);
      // Starting over takes a first listing off the list; a change leaves the live one.
      if (gone?.['kind'] === 'new') ownProgram = undefined;
      return { body: gone ?? null };
    }),
    on('/rest/v1/program_submissions', () => ({ body: submissions })),
    // A program's services (D-462): read by program, added, changed and removed by id.
    (url, method, body) => {
      if (!url.includes('/rest/v1/program_services')) return null;
      const idIn = (name: string) => new RegExp(`${name}=eq\\.([^&]+)`).exec(url)?.[1];
      if (method === 'POST') {
        const args = (body ?? {}) as Partial<ProgramServiceRow> & { service_id: string; name: string };
        programServices.push(programServiceRow(args.service_id, args.name, args.description ?? null, args));
        return { body: [] };
      }
      const id = idIn('id');
      if (method === 'PATCH') {
        const row = programServices.find((r) => r.id === id);
        if (row) Object.assign(row, body as object);
        return { body: [] };
      }
      if (method === 'DELETE') {
        const at = programServices.findIndex((r) => r.id === id);
        if (at >= 0) programServices.splice(at, 1);
        return { body: [] };
      }
      const program = idIn('service_id');
      return { body: programServices.filter((r) => !program || r.service_id === program) };
    },
    // A lead's edit of their own listing (D-447): accepted, answered with nothing.
    (url, method) =>
      url.includes('/rest/v1/services') && url.includes('id=eq.') && method === 'PATCH' ? { body: [] } : null,
    (url, method) =>
      url.includes('/rest/v1/services') && url.includes('org_id=eq.') && method === 'GET'
        ? { body: ownProgram ? [ownProgramRow(ownProgram)] : [] }
        : null,
    on('/rest/v1/profiles', (url) =>
      url.includes('role=eq.member')
        ? { body: CASELOAD }
        : profile
          ? {
              body: {
                id: ME_ID,
                ...profile,
                org_id: ownProgram ? OWN_ORG_ID : null,
                region_id: REGION_ID,
                access_status: options.limited ? 'limited' : 'active',
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
    on('/rest/v1/notification_preferences', () => ({
      body: options.textsStopped ? { sms_enabled: true, sms_stopped_at: '2026-10-08T15:00:00Z' } : null,
    })),
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
      // A real place of the catalogue, to plan a trip to or read the services of (D-454, D-462).
      if (id === SAVED_PLACE.id) {
        return {
          body: [
            {
              id: SAVED_PLACE.id,
              name: SAVED_PLACE.name,
              lookup_name: SAVED_PLACE.name,
              category: SAVED_PLACE.category,
              address: SAVED_PLACE.address,
              phone: '+12155550143',
              website: null,
              place_id: null,
              lat: 39.9526,
              lon: -75.1652,
              description_plain: 'Help finding work, training and a way in.',
              audience: null,
              hours: null,
            },
          ],
        };
      }
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
    // A case manager or a program lead is invited with an email (0086, D-441).
    on('/rpc/create_staff_invite', (_url, _method, body) => ({
      body: {
        code: 'PAM-7Q4K',
        expires_at: new Date(Date.now() + 7 * 86_400_000).toISOString(),
        role: (body as { p_role?: string } | null)?.p_role ?? 'provider',
      },
    })),
    // Nobody is waiting on an invite in a story (0077); sign-in goes on as usual.
    on('/rpc/pending_invite_for_me', () => ({ body: [] })),
    // One account, two roles (0078): a story never really switches.
    on('/rpc/switch_role', () => ({ body: {} })),
    on('/rpc/add_role_from_invite', () => ({ body: {} })),
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
    on('/rpc/conversation_block_state', () => ({
      body: [{ i_blocked: options.blocked === 'mine', blocked_me: options.blocked === 'theirs' }],
    })),
    // Blocking and unblocking answer yes and change nothing: a story never writes (D-463).
    on('/rpc/block_in_conversation', () => ({ body: null })),
    on('/rpc/unblock_in_conversation', () => ({ body: null })),
    on('/rest/v1/messages', (_url, method) => {
      if (method !== 'POST') return { body: threadFor(role) };
      // What `messages_insert_sender` answers a limited account (0031).
      if (options.limited) {
        return {
          status: 403,
          body: { code: '42501', message: 'new row violates row-level security policy for table "messages"' },
        };
      }
      return { body: { id: 'new', sender_id: ME_ID, body: 'Sent from Storybook', created_at: new Date().toISOString() } };
    }),
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
    // The people a case manager or a program lead may message are the caseload the list shows, so the row of
    // rings above it (D-198) agrees with it (a member's and a super admin's own list is empty).
    on('/rpc/messageable_people', () => ({
      body:
        role === 'admin' || role === 'provider'
          ? CASELOAD.map((m) => ({ profile_id: m.id, first_name: m.first_name, role: 'member' }))
          : [],
    })),
    on('/rpc/reports_for_review', () => ({ body: [] })),
    // Tanya saved a place a moment from now: always newer than the last time a story was opened, so the
    // ring is on whenever the story is (D-198's "since you last looked" is kept per browser).
    on('/rpc/people_activity', () => ({
      body:
        role === 'admin' || role === 'provider'
          ? [{ profile_id: 'm2', last_saved_at: new Date(Date.now() + 60_000).toISOString() }]
          : [],
    })),
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

export function installSupabaseMock(journeyRole: JourneyRole, options: MockOptions = {}): void {
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
  const routes = routesFor(journeyRole, options);

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
    if (answer.file) return real(answer.file);
    if (answer.raw !== undefined) {
      return new Response(answer.raw, { status: answer.status ?? 200, headers: { 'content-type': answer.contentType ?? 'application/octet-stream' } });
    }
    return new Response(JSON.stringify(answer.body), {
      status: answer.status ?? 200,
      headers: { 'content-type': 'application/json' },
    });
  };
}
