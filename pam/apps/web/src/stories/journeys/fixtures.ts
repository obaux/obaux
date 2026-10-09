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

/**
 * The example places (D-304: three of each kind). The first three are the
 * member's saved ones and carry their example visits; the rest are plain.
 */
export const PLACES = [
  {
    id: 'dummy-place-learning',
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
    id: 'dummy-place-workforce',
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
    id: 'dummy-place-food',
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
  {
    id: 'dummy-place-library',
    name: 'Example Library Tech Lab',
    lookup_name: 'Example Library Tech Lab',
    category: 'education',
    subcategory: null,
    address: '1901 Vine St',
    phone: '+12155550120',
    place_id: null,
    lat: 39.9596,
    lon: -75.1711,
    description_plain: 'Free computer classes and help with email, phones and job sites. Drop in any afternoon.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 'dummy-place-trades',
    name: 'Example Trade Skills Workshop',
    lookup_name: 'Example Trade Skills Workshop',
    category: 'workforce',
    subcategory: null,
    address: '2101 N Front St',
    phone: null,
    place_id: null,
    lat: 39.9819,
    lon: -75.1353,
    description_plain: 'Hands-on training in carpentry, electrical and heating work, with paid apprenticeships after.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 'dummy-place-family',
    name: 'Example Family Resource Center',
    lookup_name: 'Example Family Resource Center',
    category: 'family_services',
    subcategory: null,
    address: '1500 S 5th St',
    phone: '+12155550133',
    place_id: null,
    lat: 39.9301,
    lon: -75.1531,
    description_plain: 'Help with childcare, school sign-up and benefits for the whole family.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 'dummy-place-adult-ed',
    name: 'Example Adult Learning Program',
    lookup_name: 'Example Adult Learning Program',
    category: 'education',
    subcategory: null,
    address: '4000 Lancaster Ave',
    phone: '+12155550144',
    place_id: null,
    lat: 39.9632,
    lon: -75.2041,
    description_plain: 'Reading, math and GED classes in small evening groups. Sign up at the front desk.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 'dummy-place-money',
    name: 'Example Money Help Desk',
    lookup_name: 'Example Money Help Desk',
    category: 'workforce',
    subcategory: null,
    address: '30 S 15th St',
    phone: null,
    place_id: null,
    lat: 39.9512,
    lon: -75.1655,
    description_plain: 'Free help opening a bank account, fixing credit and filing taxes.',
    website: null,
    audience: null,
    hours: null,
  },
  {
    id: 'dummy-place-housing',
    name: 'Example Housing Help Office',
    lookup_name: 'Example Housing Help Office',
    category: 'family_services',
    subcategory: null,
    address: '1234 Market St',
    phone: '+12155550155',
    place_id: null,
    lat: 39.9516,
    lon: -75.1612,
    description_plain: 'Help finding a place to live, paying rent and talking with a landlord.',
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
    subject_id: 'dummy-place-learning',
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

/** Two people waiting for a super admin's decision on /requests/; Andre described his program. */
export const STAFF_REQUESTS = [
  { user_id: 'r-1', wants_role: 'admin', first_name: 'Priya', last_name: 'Nair', city: 'Philadelphia', created_at: hoursAgo(5) },
  {
    user_id: 'r-2',
    wants_role: 'provider',
    first_name: 'Andre',
    last_name: 'Wells',
    city: 'Philadelphia',
    created_at: hoursAgo(30),
    // What he typed about his program at sign-up (0056), for "View program" (D-262).
    program_name: 'Example Reentry Kitchen',
    program_category: 'workforce',
    program_subcategory: null,
    program_description: 'Paid kitchen training, twelve weeks, with a job fair at the end.',
    program_address: '1200 Example Street, Philadelphia, PA',
    program_phone: '+12155550123',
    program_website: 'https://example.org',
  },
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
  const rows: {
    id: string;
    conversation_id: string;
    sender_id: string;
    body: string | null;
    attachment_url?: string;
    attachment_kind?: 'photo' | 'file';
    attachment_name?: string;
    attachment_bytes?: number;
    created_at: string;
  }[] = THREAD.map((body, i) => ({
    id: `m-${i}`,
    conversation_id: CONVO_ID,
    sender_id: i % 2 === 0 ? staffSpeaks : memberSpeaks,
    body,
    created_at: hoursAgo((THREAD.length - i) * 6),
  }));
  // A photo (D-394): the member checks the stop, with a picture and a few
  // words, between "The 47 stops right outside" and "Got it".
  rows.splice(3, 0, {
    id: 'm-photo',
    conversation_id: CONVO_ID,
    sender_id: memberSpeaks,
    body: 'Is this the one?',
    attachment_url: `${CONVO_ID}/example-stop.jpg`,
    attachment_kind: 'photo',
    created_at: hoursAgo((THREAD.length - 2) * 6 - 3),
  });
  // Two more (D-404), so the Photos and documents page has a row to swipe:
  // the member sends the classroom on its own, no words, and the case
  // worker shows the way in to the ID office.
  rows.splice(7, 0, {
    id: 'm-photo-room',
    conversation_id: CONVO_ID,
    sender_id: memberSpeaks,
    body: null,
    attachment_url: `${CONVO_ID}/example-room.jpg`,
    attachment_kind: 'photo',
    created_at: hoursAgo((THREAD.length - 5) * 6 - 1),
  });
  rows.splice(9, 0, {
    id: 'm-photo-door',
    conversation_id: CONVO_ID,
    sender_id: staffSpeaks,
    body: 'The way in is round the side.',
    attachment_url: `${CONVO_ID}/example-door.jpg`,
    attachment_kind: 'photo',
    created_at: hoursAgo((THREAD.length - 6) * 6 - 1),
  });
  // A document and a Google Doc (D-399): the case worker sends the letter
  // for the ID office, then the class schedule as a Google Docs link.
  rows.push(
    {
      id: 'm-file',
      conversation_id: CONVO_ID,
      sender_id: staffSpeaks,
      body: 'Here is the letter for the ID office.',
      attachment_url: `${CONVO_ID}/id-office-letter.pdf`,
      attachment_kind: 'file',
      attachment_name: 'ID office letter.pdf',
      attachment_bytes: 184_320,
      created_at: hoursAgo(2),
    },
    {
      id: 'm-google',
      conversation_id: CONVO_ID,
      sender_id: staffSpeaks,
      body: 'And the class schedule: https://docs.google.com/document/d/example-class-schedule/edit',
      created_at: hoursAgo(1),
    },
  );
  return rows;
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

/** The super admin's log of invites (0071, D-263): newest first, every state. */
export const INVITES_LOG = [
  { id: 'inv-1', created_at: hoursAgo(2), expires_at: hoursAgo(-718), invited_role: 'provider', inviter_first: 'Dana', inviter_last: 'Reyes', inviter_role: 'admin', state: 'open', joined_first: null, emailed_to: 'andre@example.org', reissued: true },
  { id: 'inv-2', created_at: hoursAgo(5), expires_at: hoursAgo(-715), invited_role: 'member', inviter_first: 'Dana', inviter_last: 'Reyes', inviter_role: 'admin', state: 'joined', joined_first: 'Marcus', emailed_to: null, reissued: false },
  { id: 'inv-3', created_at: hoursAgo(28), expires_at: hoursAgo(-692), invited_role: 'member', inviter_first: 'Alice', inviter_last: 'Moreno', inviter_role: 'provider', state: 'open', joined_first: null, emailed_to: null, reissued: false },
  { id: 'inv-4', created_at: hoursAgo(30), expires_at: hoursAgo(-690), invited_role: 'admin', inviter_first: 'Will', inviter_last: null, inviter_role: 'super_admin', state: 'joined', joined_first: 'Priya', emailed_to: null, reissued: false },
  { id: 'inv-5', created_at: hoursAgo(24 * 33), expires_at: hoursAgo(24 * 3), invited_role: 'provider', inviter_first: 'Dana', inviter_last: 'Reyes', inviter_role: 'admin', state: 'expired', joined_first: null, emailed_to: null, reissued: false },
  { id: 'inv-6', created_at: hoursAgo(24 * 40), expires_at: hoursAgo(24 * 10), invited_role: 'member', inviter_first: 'Dana', inviter_last: 'Reyes', inviter_role: 'admin', state: 'expired', joined_first: null, emailed_to: null, reissued: false },
];
