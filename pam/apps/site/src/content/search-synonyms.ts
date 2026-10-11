/**
 * Everyday words that mean the same thing to a person, for Support's search
 * (`lib/search.ts`). Sage owns this list: she knows what people say; Wren's search
 * reads it. A word in a group finds posts that say any other word in the group, a
 * little less strongly than the word itself, so "sms" finds Texts from Pam and "case
 * worker" finds Who is my guide.
 *
 * - A group is a few words or short phrases that are the same thing to the person
 *   typing. Add a group when people use two words for one thing; don't add words
 *   that are only related ("message" is not "text": Pam has a post for each).
 * - Lower case, no accents needed (the search ignores them). Spanish basics are here
 *   so someone who types "ayuda" or "codigo" still finds the English post; the posts
 *   themselves are English for now.
 * - Tested in `test/search.test.ts`: every word in a group must find the same post
 *   as the first word of the group.
 */
export const SYNONYMS: readonly (readonly string[])[] = [
  ['text', 'sms', 'texto', 'txt'],
  ['code', 'pin', 'codigo', 'passcode'],
  ['guide', 'case manager', 'caseworker', 'case worker', 'counselor', 'social worker'],
  ['place', 'program', 'service', 'location', 'agency', 'organization'],
  ['sign in', 'log in', 'login', 'signin', 'sign on', 'log on', 'iniciar sesion'],
  ['phone number', 'cell number', 'mobile number', 'telefono'],
  ['phone', 'cell', 'mobile', 'cellphone'],
  ['call', 'ring', 'llamar'],
  ['help', 'support', 'assist', 'ayuda'],
  ['visit', 'appointment', 'trip', 'cita'],
  ['delete', 'remove', 'erase', 'close account'],
  ['account', 'profile', 'cuenta'],
  ['language', 'idioma', 'translate', 'translation'],
  ['spanish', 'espanol'],
  ['unsafe', 'scared', 'threat', 'threatening', 'harass', 'harassing'],
  ['private', 'privacy', 'confidential'],
  ['expired', 'too old', 'no longer works'],
  ['broken', 'not working', 'doesnt work', 'wont work', 'stopped working'],
];
