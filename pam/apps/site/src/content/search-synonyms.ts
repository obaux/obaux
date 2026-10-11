import { EVERYDAY_WORDS } from './everyday-words';

/**
 * The groups Support's search reads (`lib/search.ts`): words that are one thing to a person. The
 * everyday words are Sage's (`everyday-words.ts`: 34 groups, Pam's own word first); a word finds posts
 * that say any word in its group, at 0.6 of the weight of the word itself, so exact words always win.
 * The Spanish basics below are Wren's seed for someone who types "ayuda" or "codigo" and still wants the
 * English post (the posts are English for now); Sage can fold them into her list.
 *
 * A test (`test/search.test.ts`) checks every word in every group finds what the group's first word finds.
 */
const SPANISH_BASICS: readonly (readonly string[])[] = [
  ['text', 'texto'],
  ['code', 'codigo'],
  ['help', 'ayuda'],
  ['visit', 'cita'],
  ['account', 'cuenta'],
  ['phone', 'telefono'],
  ['call', 'llamar'],
  ['sign in', 'iniciar sesion'],
];

export const SYNONYMS: readonly (readonly string[])[] = [...EVERYDAY_WORDS.map((g) => g.words), ...SPANISH_BASICS];
