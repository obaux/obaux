/**
 * The privacy notice and the terms, as structure rather than as a slab of text.
 *
 * The copy itself lives in the locale bundles like every other string, so these
 * pages are translated the same way the rest of PAM is and cannot quietly become
 * English-only. What lives here is the shape: which sections exist, in what
 * order, and how many paragraphs each one has — which is what the page needs to
 * build a table of contents, and what a test needs to prove nothing is missing
 * in either language.
 *
 * Two rules these pages are held to, both checked by tests:
 *
 *  1. **The privacy page cannot promise less than the transparency screen.**
 *     `ADMIN_CAN_SEE` / `ADMIN_CANNOT_SEE` in transparency.ts is the contract;
 *     the privacy page restates it for someone who has not signed in yet. The
 *     two must agree, so `visibility` names the section that carries it.
 *  2. **Plain language.** These are read by people deciding whether to trust
 *     PAM with a phone number, not by lawyers. Short sentences, no defined
 *     terms, no "hereby".
 */

export interface LegalSection {
  /** Anchor in the URL and the id the table of contents scrolls to. */
  readonly id: string;
  /** i18n key for the heading. */
  readonly titleKey: string;
  /** i18n keys for the paragraphs, in order. */
  readonly bodyKeys: readonly string[];
}

export interface LegalDocument {
  readonly id: 'privacy' | 'terms';
  readonly titleKey: string;
  readonly introKey: string;
  readonly updatedKey: string;
  readonly sections: readonly LegalSection[];
}

const section = (doc: string, id: string, paragraphs: number): LegalSection => ({
  id,
  titleKey: `${doc}.s.${id}.title`,
  bodyKeys: Array.from({ length: paragraphs }, (_, i) => `${doc}.s.${id}.p${i + 1}`),
});

export const PRIVACY: LegalDocument = {
  id: 'privacy',
  titleKey: 'privacy.title',
  introKey: 'privacy.intro',
  updatedKey: 'privacy.updated',
  sections: [
    section('privacy', 'what-we-keep', 3),
    // The section that restates the transparency contract. Named in a test.
    section('privacy', 'who-can-see', 4),
    section('privacy', 'texts', 3),
    section('privacy', 'never-say', 2),
    section('privacy', 'sharing', 3),
    section('privacy', 'how-long', 2),
    section('privacy', 'your-choices', 3),
    section('privacy', 'contact', 2),
  ],
};

/** The privacy section that has to agree with the transparency contract. */
export const PRIVACY_VISIBILITY_SECTION = 'who-can-see';

export const TERMS: LegalDocument = {
  id: 'terms',
  titleKey: 'terms.title',
  introKey: 'terms.intro',
  updatedKey: 'terms.updated',
  sections: [
    section('terms', 'what-pam-is', 3),
    section('terms', 'emergencies', 2),
    section('terms', 'your-account', 3),
    section('terms', 'being-decent', 3),
    section('terms', 'programs', 3),
    section('terms', 'points', 2),
    section('terms', 'limits', 3),
    section('terms', 'changes', 2),
  ],
};

export const LEGAL_DOCUMENTS = [PRIVACY, TERMS] as const;

/** Every i18n key either document needs. Used by the parity test. */
export function legalKeys(doc: LegalDocument): string[] {
  return [
    doc.titleKey,
    doc.introKey,
    doc.updatedKey,
    ...doc.sections.flatMap((s) => [s.titleKey, ...s.bodyKeys]),
  ];
}
