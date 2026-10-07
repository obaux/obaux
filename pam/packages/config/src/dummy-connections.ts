/**
 * Example connections (D-213) — the people on a member's side, as the
 * redesigned Connections screen shows them: a photo, who they are, which
 * program, a line on how they help, and three facts.
 *
 * Programs first, people first (Will, 1 October): each card is a person at
 * a program, not the program itself. The same cast as the rest of the
 * example set (`dummy-people.ts`) and the same ids, so "Message" on a
 * profile opens the example conversation that already exists between
 * Jordan and that person (`dummy-conversations.ts`).
 *
 * **Photos are placeholders**, hotlinked from Unsplash (its licence allows
 * this) for staff only — never a member. Nothing real is behind them; when
 * real profiles exist, a photo is the person's own upload or nothing (the
 * avatar's initials). Where an image cannot load, the avatar shows initials.
 */
export interface DummyConnection {
  readonly id: string;
  readonly firstName: string;
  readonly role: 'admin' | 'provider';
  /** The program a provider runs; null for a case manager. */
  readonly programName: string | null;
  /** That program's place, for the link on the card (D-272); null for a case manager. */
  readonly placeId: string | null;
  /**
   * Who connected the member to this person (D-272) — a connection id,
   * the case manager. Null for the case manager themself.
   */
  readonly connectedById: string | null;
  readonly photoUrl: string;
  /** How they can help — a sentence, in both languages. */
  readonly help: { readonly en: string; readonly es: string };
  readonly yearsHelping: number;
  readonly peopleHelped: number;
  /** Languages they speak, written in themselves: "EN · ES". */
  readonly languages: string;
}

const photo = (id: string) => `https://images.unsplash.com/photo-${id}?w=320&h=320&fit=crop&crop=faces&q=70`;

export const DUMMY_CONNECTIONS: readonly DummyConnection[] = [
  {
    id: 'dummy-a1',
    firstName: 'Teresa',
    role: 'admin',
    programName: null,
    placeId: null,
    connectedById: null,
    photoUrl: photo('1531123897727-8f129e1688ce'),
    help: {
      en: 'Your case manager. Teresa helps you find programs, sort out ID and benefits, and plan your week.',
      es: 'Tu administradora de casos. Teresa te ayuda a encontrar programas, arreglar tu identificación y beneficios, y planear tu semana.',
    },
    yearsHelping: 9,
    peopleHelped: 140,
    languages: 'EN · ES',
  },
  {
    id: 'dummy-p1',
    firstName: 'Sandra',
    role: 'provider',
    programName: 'Example Learning Center',
    placeId: 'dummy-place-learning',
    connectedById: 'dummy-a1',
    photoUrl: photo('1494790108377-be9c29b29330'),
    help: {
      en: 'Runs the GED class. Ask Sandra about class times, getting caught up, or the computer room.',
      es: 'Dirige la clase de GED. Pregúntale a Sandra por los horarios, cómo ponerte al día o la sala de computadoras.',
    },
    yearsHelping: 6,
    peopleHelped: 85,
    languages: 'EN',
  },
  {
    id: 'dummy-p2',
    firstName: 'Marcus',
    role: 'provider',
    programName: 'Example Workforce Center',
    placeId: 'dummy-place-workforce',
    connectedById: 'dummy-a1',
    photoUrl: photo('1507003211169-0a1dd7228f2d'),
    help: {
      en: 'Helps with résumés, interviews and job openings posted each week. Walk-ins welcome.',
      es: 'Ayuda con currículums, entrevistas y ofertas de trabajo que se publican cada semana. Sin cita.',
    },
    yearsHelping: 4,
    peopleHelped: 60,
    languages: 'EN · ES',
  },
];

export function dummyConnection(id: string): DummyConnection | null {
  return DUMMY_CONNECTIONS.find((c) => c.id === id) ?? null;
}

/**
 * A program's staff member, with their photo (D-335): for the booked place
 * page's staff badge. The example program leads only; a real program has
 * no photo here until staff can add one.
 */
export function programStaffFor(placeId: string): DummyConnection | null {
  return DUMMY_CONNECTIONS.find((c) => c.role === 'provider' && c.placeId === placeId) ?? null;
}

/**
 * The photo for a member's staff contact, if Pam has one (D-335): the same
 * person by first name and program — or, for a case manager, no program.
 * Anyone else keeps their initials.
 */
export function staffPhotoFor(firstName: string | null | undefined, programName: string | null | undefined): string | null {
  if (!firstName) return null;
  return DUMMY_CONNECTIONS.find((c) => c.firstName === firstName && c.programName === (programName ?? null))?.photoUrl ?? null;
}
