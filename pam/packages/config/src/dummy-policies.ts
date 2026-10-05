/**
 * Example policies a program asks its participants to sign (D-261, Will, 4
 * October: "use fake social program policies like disclosure or disclaimer
 * policies to simulate this").
 *
 * A policy is the program's own document — its title and words are theirs,
 * like a program's name, so they are not translated. Who signed is by member
 * id: Jordan and Miguel have signed everything (verified), Keisha two,
 * Aaliyah one, Devon and Priya none yet.
 *
 * Example only: there is no table for policies or signatures yet. Storing
 * them is a schema change (and a line in `transparency.ts`: a member should
 * know a program keeps a record of what they signed) for Will to approve.
 */
export interface DummyPolicySignature {
  readonly personId: string;
  readonly firstName: string;
  readonly signedAt: string;
}

export interface DummyPolicy {
  readonly id: string;
  readonly title: string;
  readonly fileName: string;
  readonly uploadedAt: string;
  readonly body: readonly string[];
  readonly signedBy: readonly DummyPolicySignature[];
}

const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();

const JORDAN = { personId: 'dummy-m1', firstName: 'Jordan' };
const KEISHA = { personId: 'dummy-m2', firstName: 'Keisha' };
const MIGUEL = { personId: 'dummy-m3', firstName: 'Miguel' };
const AALIYAH = { personId: 'dummy-m4', firstName: 'Aaliyah' };

export const DUMMY_POLICIES: readonly DummyPolicy[] = [
  {
    id: 'policy-confidentiality',
    title: 'Confidentiality and disclosure',
    fileName: 'confidentiality-and-disclosure.pdf',
    uploadedAt: daysAgo(40),
    body: [
      'What you share with our staff stays with our staff. We do not share your information with anyone outside this program without your written permission.',
      'There are two exceptions the law requires: if someone is in danger of serious harm, and if a court orders us to share a record.',
      'You can ask to see what we keep about you at any time.',
    ],
    signedBy: [
      { ...JORDAN, signedAt: daysAgo(30) },
      { ...MIGUEL, signedAt: daysAgo(21) },
      { ...KEISHA, signedAt: daysAgo(12) },
      { ...AALIYAH, signedAt: daysAgo(3) },
    ],
  },
  {
    id: 'policy-liability',
    title: 'Liability disclaimer',
    fileName: 'liability-disclaimer.pdf',
    uploadedAt: daysAgo(40),
    body: [
      'Taking part in our classes and activities is your choice. We take care to keep our space safe, and we ask you to follow staff directions.',
      'We are not responsible for personal belongings left in the building.',
    ],
    signedBy: [
      { ...JORDAN, signedAt: daysAgo(30) },
      { ...MIGUEL, signedAt: daysAgo(21) },
      { ...KEISHA, signedAt: daysAgo(12) },
    ],
  },
  {
    id: 'policy-media',
    title: 'Photo and media release',
    fileName: 'photo-and-media-release.pdf',
    uploadedAt: daysAgo(25),
    body: [
      'Sometimes we take photos at events. We will only use a photo of you if you say yes here.',
      'Saying no does not change anything about your place in the program.',
    ],
    signedBy: [
      { ...JORDAN, signedAt: daysAgo(24) },
      { ...MIGUEL, signedAt: daysAgo(21) },
    ],
  },
  {
    id: 'policy-conduct',
    title: 'Code of conduct',
    fileName: 'code-of-conduct.pdf',
    uploadedAt: daysAgo(10),
    body: [
      'Treat everyone here with respect. No weapons, drugs or alcohol on site.',
      'If something feels wrong, tell any member of staff. You will not get in trouble for speaking up.',
    ],
    signedBy: [
      { ...JORDAN, signedAt: daysAgo(9) },
      { ...MIGUEL, signedAt: daysAgo(8) },
    ],
  },
];

/**
 * Whether a place asks a member to sign its policies before a visit (D-270).
 *
 * Example data has one program's set (`DUMMY_POLICIES`), so every place
 * borrows it — except the example food pantry, which asks for nothing, so
 * the screens can show a place with no policies too. The real rule is
 * simply "the program has added some", once policies are stored per program.
 */
export function placeAsksForPolicies(placeId: string): boolean {
  return placeId !== 'dummy-place-food';
}
