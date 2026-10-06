/**
 * Example services a program offers (D-313, Will, 6 October: "We need to
 * allow programs to offer different kinds of services … members can view
 * these services from place profiles, and select service during booking a
 * trip. Different services may require different policies" — and, later,
 * "multi service program detail with unique phone, website, and policies
 * for each").
 *
 * A service is one thing a program does — GED classes, the computer room,
 * a job-readiness workshop — with, where it differs from the program's,
 * its own phone, website and the policies people sign for it. A program
 * with no services listed is one service, and reads as it always has.
 *
 * Which policies apply: a service names the policies that are **only for
 * it** (`policyIds`); a policy no service names is the program's, asked of
 * everyone. So a newly added policy applies to every service until a lead
 * picks the services it is for.
 *
 * Example only: there is no table for services yet. Storing them is a
 * schema change for Will to approve (`services` in 0003 is the listing
 * itself; this would be a child of it).
 */
import type { WeekHours } from './hours.js';

export interface DummyService {
  readonly id: string;
  /** A `dummy-places.ts` id. */
  readonly placeId: string;
  readonly name: string;
  /** A sentence or two, in the program's own words. */
  readonly description: string;
  /** Its own number — or null to use the program's. */
  readonly phone: string | null;
  /** Its own page — or null to use the program's. */
  readonly website: string | null;
  /** Where it happens, when not at the program's address (Will: "services might be offered at different addresses"). */
  readonly address: string | null;
  /**
   * When it runs, when not the program's hours (Will, 6 October: "we can
   * accommodate more info per service, including hours"). Same shape as a
   * place's week (`hours.ts`): index 0 is Sunday.
   */
  readonly hours?: WeekHours | null;
  /** `dummy-policies.ts` ids that are only for this service. */
  readonly policyIds: readonly string[];
}

export const DUMMY_SERVICES: readonly DummyService[] = [
  {
    id: 'service-ged',
    placeId: 'dummy-place-learning',
    name: 'GED classes',
    description: 'Reading, writing and math toward the GED test, four mornings a week. Start any Monday.',
    phone: '+12155550101',
    website: 'https://example.org/ged',
    address: null,
    policyIds: ['policy-conduct'],
  },
  {
    id: 'service-computers',
    placeId: 'dummy-place-learning',
    name: 'Computer room',
    description: 'Open computers, printing and help with email, forms and job sites. Walk in.',
    phone: null,
    website: null,
    address: null,
    policyIds: [],
  },
  {
    id: 'service-job-ready',
    placeId: 'dummy-place-learning',
    name: 'Job readiness workshop',
    description: 'Two weeks on resumes, interviews and showing up ready. A certificate at the end.',
    phone: '+12155550102',
    website: 'https://example.org/job-ready',
    address: '1420 Chestnut St, 2nd floor, Philadelphia, PA 19102',
    policyIds: ['policy-media'],
  },
  {
    id: 'service-lab-classes',
    placeId: 'dummy-place-library',
    name: 'Computer classes',
    description: 'Six weeks from the mouse to email, forms and job sites. Tuesday and Thursday afternoons.',
    phone: null,
    website: 'https://example.org/lab-classes',
    address: '1500 Spring Garden St, Philadelphia, PA 19130',
    // Tuesday and Thursday afternoons, as the card says.
    hours: [[], [], [{ open: '13:00', close: '16:00' }], [], [{ open: '13:00', close: '16:00' }], [], []],
    policyIds: [],
  },
  {
    id: 'service-lab-dropin',
    placeId: 'dummy-place-library',
    name: 'Drop-in help',
    description: 'Bring your phone or a form and somebody sits with you. No sign-up.',
    phone: '+12155550121',
    website: null,
    address: null,
    policyIds: [],
  },
  {
    id: 'service-apprentice',
    placeId: 'dummy-place-workforce',
    name: 'Paid apprenticeships',
    description: 'Placements with local employers, paid from the first day, with a coach who checks in weekly.',
    phone: '+12155550150',
    website: 'https://example.org/apprentice',
    address: '3200 N Broad St, Philadelphia, PA 19140',
    policyIds: [],
  },
  {
    id: 'service-resume',
    placeId: 'dummy-place-workforce',
    name: 'Resume help',
    description: 'Sit with somebody for an hour and leave with a resume you can send. No appointment.',
    phone: null,
    website: null,
    address: null,
    policyIds: [],
  },
];

/** The services this place lists, in the order the program put them. */
export function servicesFor(placeId: string, services: readonly DummyService[] = DUMMY_SERVICES): readonly DummyService[] {
  return services.filter((s) => s.placeId === placeId);
}

/**
 * The policies somebody signs for one service: the program's own (named by
 * no service) and the ones only for this service, in the program's order.
 */
export function policiesForService<P extends { readonly id: string }>(
  service: DummyService,
  policies: readonly P[],
  siblings: readonly DummyService[],
): readonly P[] {
  const claimed = new Set(siblings.flatMap((s) => s.policyIds));
  return policies.filter((p) => !claimed.has(p.id) || service.policyIds.includes(p.id));
}

/** Which services a policy is for: none means every service. */
export function servicesForPolicy(policyId: string, services: readonly DummyService[]): readonly DummyService[] {
  return services.filter((s) => s.policyIds.includes(policyId));
}
