/**
 * What the database "says" in a journey story — the same people, places and
 * conversation `scripts/journeys.mjs` photographs, so the contact sheet and
 * Storybook show one product. Example content only: nothing here is a real
 * person, place or phone number.
 */
import type { Role } from '@pam/config';

export const ME_ID = 'de3b9c2e-ec2f-403b-93e5-86e6ee75349b';
export const OTHER_ID = '7c1f8c1e-1c7e-4a5c-9d6e-0f3a2b4c5d6e';
export const CONVO_ID = '2a9d5e1c-3b7f-4d8e-9a1b-6c5d4e3f2a1b';
export const REGION_ID = '0195b1c0-0000-4000-8000-000000000001';

export type JourneyRole = 'signed-out' | 'member' | 'provider' | 'case-manager' | 'super-admin';

export const ROLES: Record<JourneyRole, { title: string; profile: { role: Role; first_name: string } | null }> = {
  'signed-out': { title: 'Not signed in', profile: null },
  member: { title: 'Member', profile: { role: 'member', first_name: 'Marcus' } },
  provider: { title: 'Program lead', profile: { role: 'provider', first_name: 'Alice' } },
  'case-manager': { title: 'Case manager', profile: { role: 'admin', first_name: 'Dana' } },
  'super-admin': { title: 'Super admin', profile: { role: 'super_admin', first_name: 'Will' } },
};

const hoursAgo = (h: number) => new Date(Date.now() - h * 3_600_000).toISOString();

export const PLACES = [
  {
    id: 's1',
    name: 'Example Learning Center',
    lookup_name: 'Example Learning Center',
    category: 'education',
    subcategory: null,
    address: '123 Main St',
    phone: '+12155550100',
    place_id: null,
    lat: 39.9526,
    lon: -75.1652,
    description_plain:
      'Free classes, a computer room and help getting a GED. Walk in and ask at the front desk.',
    website: 'https://example.org/learning',
    audience: null,
    hours: null,
  },
  {
    id: 's2',
    name: 'Example Workforce Center',
    lookup_name: 'Example Workforce Center',
    category: 'workforce',
    subcategory: null,
    address: '456 Market St',
    phone: null,
    place_id: null,
    lat: 39.9515,
    lon: -75.1605,
    description_plain:
      'Job training, help with a resume and openings posted every week. Free for people who live in the city.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 's3',
    name: 'Example Food Pantry',
    lookup_name: 'Example Food Pantry',
    category: 'family_services',
    subcategory: null,
    address: '789 Broad St',
    phone: '+12155550111',
    place_id: null,
    lat: 39.9612,
    lon: -75.1583,
    description_plain: 'Groceries to take home, no appointment. Bring a bag if you have one.',
    website: null,
    audience: null,
    hours: null,
  },
];

export const NOTIFICATIONS = [
  {
    id: 'n1',
    kind: 'service_flagged',
    body_key: 'notify.service_flagged',
    body_vars: { reason: 'closed', place: 'Example Learning Center' },
    subject_type: 'service',
    subject_id: 's1',
    created_at: hoursAgo(0),
    read_at: null,
  },
  {
    id: 'n2',
    kind: 'message_reported',
    body_key: 'notify.message_reported',
    body_vars: { name: 'Marcus' },
    subject_type: 'report',
    subject_id: 'r1',
    created_at: hoursAgo(24),
    read_at: null,
  },
];

export const CASELOAD = [
  { id: 'm1', first_name: 'Marcus', access_status: 'active', last_active_at: hoursAgo(0) },
  { id: 'm2', first_name: 'Tanya', access_status: 'active', last_active_at: null },
];

export const DIRECTORY_PEOPLE = [
  { id: 'd1', first_name: 'Marcus', role: 'member', region_name: 'Philadelphia', access_status: 'active', last_active_at: hoursAgo(0), is_demo: false },
  { id: 'd2', first_name: 'Alice', role: 'provider', region_name: 'Philadelphia', access_status: 'active', last_active_at: null, is_demo: false },
  { id: 'd3', first_name: 'Dana', role: 'admin', region_name: 'Philadelphia', access_status: 'limited', last_active_at: hoursAgo(24), is_demo: false },
];

/** Two people waiting for a super admin's decision on /requests/. */
export const STAFF_REQUESTS = [
  { user_id: 'r-1', wants_role: 'admin', first_name: 'Priya', last_name: 'Nair', city: 'Philadelphia', created_at: hoursAgo(5) },
  { user_id: 'r-2', wants_role: 'provider', first_name: 'Andre', last_name: 'Wells', city: 'Philadelphia', created_at: hoursAgo(30) },
];

const THREAD = [
  'Hi, it is Teresa. I put you down for the GED class. It starts Monday at 10.',
  'Thank you. Which bus goes there?',
  'The 47 stops right outside. It runs every 15 minutes in the morning.',
  'Got it. I will be there.',
  'How did Monday go?',
  'Good. The room was easy to find and the teacher is patient.',
  'Your ID appointment is Thursday at 2. Bring the letter I gave you.',
  'Thursday at 2. I have the letter.',
  'One more thing: the class moved to room 12 this week. Same time.',
];

/** The conversation, from whichever side the story is signed in as. */
export function threadFor(role: Role | null) {
  const staffSpeaks = role === 'member' ? OTHER_ID : ME_ID;
  const memberSpeaks = role === 'member' ? ME_ID : OTHER_ID;
  return THREAD.map((body, i) => ({
    id: `m-${i}`,
    conversation_id: CONVO_ID,
    sender_id: i % 2 === 0 ? staffSpeaks : memberSpeaks,
    body,
    created_at: hoursAgo((THREAD.length - i) * 6),
  }));
}

export function partnerFor(role: Role | null) {
  return {
    conversation_id: CONVO_ID,
    profile_id: OTHER_ID,
    first_name: role === 'member' ? 'Teresa' : 'Marcus',
    role: role === 'member' ? 'admin' : 'member',
    program_name: null,
  };
}
