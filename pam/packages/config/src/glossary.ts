/**
 * PAM's own words, defined once (Will, 4 October, D-260: "this tooltip info
 * should be stored somewhere since we're using unique terms which may need to
 * be defined across various places in app").
 *
 * A term is a word PAM uses in a sense of its own — a "trip" is not a
 * holiday. Each has a short name and one plain definition, both through i18n
 * so English and Spanish stay key-for-key. Any screen that uses the word and
 * wants to explain it shows `TermInfo` (apps/web) with the term's id; the
 * words live here and in the locales, nowhere else.
 *
 * Used so far: "trip" on Text alerts. Add a term here before writing its
 * definition anywhere else.
 */
export const GLOSSARY = {
  trip: { termKey: 'glossary.trip.term', definitionKey: 'glossary.trip.definition' },
} as const;

export type GlossaryTerm = keyof typeof GLOSSARY;
