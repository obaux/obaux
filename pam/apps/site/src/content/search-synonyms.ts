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
  // Signing in
  ['text', 'sms', 'texto', 'txt'],
  ['code', 'pin', 'codigo', 'passcode', 'verification code', 'one time code', 'otp', 'password', 'pasword'],
  ['sign in', 'log in', 'login', 'signin', 'sign on', 'log on', 'logon', 'iniciar sesion'],
  ['join', 'sign up', 'signup', 'register', 'enroll', 'enrol', 'create account', 'new account'],
  ['invite', 'invitation', 'invite link'],
  ['expired', 'too old', 'no longer works', 'timed out'],
  // People
  ['guide', 'case manager', 'caseworker', 'case worker', 'cm', 'counselor', 'counsellor', 'social worker',
    'advocate', 'navigator', 'po'],
  ['real person', 'human', 'operator'],
  // Places and visits
  ['place', 'program', 'service', 'location', 'agency', 'organization', 'organisation', 'center', 'centre'],
  ['visit', 'appointment', 'trip', 'cita', 'appt', 'appoinment', 'booking'],
  ['closed', 'shut down', 'out of business'],
  ['policy', 'rules', 'agreement', 'waiver', 'paperwork'],
  ['points', 'rewards', 'score'],
  // Phone and account
  ['phone number', 'cell number', 'mobile number', 'telefono', 'new number'],
  ['phone', 'cell', 'mobile', 'cellphone'],
  ['account', 'profile', 'cuenta', 'my details'],
  ['delete', 'remove', 'erase', 'close account', 'deactivate', 'leave pam'],
  ['paused', 'suspended', 'locked'],
  ['limited', 'restricted', 'turned off'],
  // Language
  ['language', 'idioma', 'translate', 'translation'],
  ['spanish', 'espanol'],
  // Help and safety
  ['call', 'ring', 'llamar'],
  ['help', 'support', 'assist', 'ayuda', 'assistance'],
  ['unsafe', 'scared', 'threat', 'threatening', 'harass', 'harassing', 'harassment', 'danger', 'bothering', 'creepy'],
  ['block', 'mute'],
  ['private', 'privacy', 'confidential', 'who can see', 'tracking'],
  // Something is wrong
  ['broken', 'not working', 'doesnt work', 'wont work', 'stopped working', 'error', 'glitch', 'bug', 'stuck', 'frozen',
    'blank', 'wont load', 'crash'],
];
