/**
 * The street search's rules and calls (D-552), apart from React so they can be tested.
 *
 * Pam's own list (ZIP codes, neighborhoods, City Hall) answers first. Google, through Pam's `places-search` function, is asked only when
 * the text looks like something that list cannot know: an address ("1500 Market"), a corner ("Broad and Erie", "Broad & Erie",
 * "Broad/Erie", "Broad at Erie"), or anything Pam's list has no match for ("Temple Hospital"). Never for fewer than three characters, never
 * for a bare number (a ZIP code), and never on every keystroke: the hook waits for a pause.
 */
export interface Suggestion {
  readonly placeId: string;
  readonly label: string;
}

export const MIN_CHARS = 3;
export const PAUSE_MS = 400;

const ADDRESS = /^\d+\s+\S/;
const CORNER = /(\s(and|at)\s)|&|\//i;

export function wantsGoogle(query: string, pamMatches: number): boolean {
  const text = query.trim();
  if (text.length < MIN_CHARS) return false;
  if (/^\d+$/.test(text)) return false;
  return ADDRESS.test(text) || CORNER.test(text) || pamMatches === 0;
}

/** Text that reads as an address or a corner: a house number and a word, or two streets joined. Nothing more is guessed. */
export function looksLikeAddress(text: string): boolean {
  const t = text.trim();
  if (t.length < MIN_CHARS) return false;
  if (/^\d+$/.test(t)) return false;
  return ADDRESS.test(t) || CORNER.test(t);
}

/** What the programs search said about the typed words: how many programs matched, and whether it could be told. */
export interface ProgramsAnswer {
  readonly matches: number;
  /** The answer is for these very words (not left over from the letters before). */
  readonly settled: boolean;
  /** The search itself worked. A failed search is not "no program matches". */
  readonly ok: boolean;
}

/**
 * The one search box on Explore (D-573): Google is asked ONLY when the words read as an address or a corner AND no program matches them,
 * or when the person taps "Search addresses". Program words never go: a program called "12 Steps Recovery" or "Arts and Crafts Center"
 * matches a program, so it is not sent. An unsettled or failed programs search counts as "a program might match": nothing is sent.
 * (The area drawer keeps `wantsGoogle`, which also asks when Pam's list of areas has nothing.)
 */
export function wantsGoogleFromBox(text: string, programs: ProgramsAnswer): boolean {
  if (!looksLikeAddress(text)) return false;
  return programs.settled && programs.ok && programs.matches === 0;
}

/** A random token for one search (the phone makes it up; it is not tied to anyone). */
export function newToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

type Invoke = (name: string, options: { body: Record<string, unknown> }) => Promise<{ data: unknown; error: unknown }>;

export type Asked<T> = { readonly kind: 'off' } | { readonly kind: 'ok'; readonly value: T } | { readonly kind: 'none' };

/** "Off" means the function says it has no key; the app then stops asking for the rest of the session. */
export async function askSuggest(invoke: Invoke, q: string, token: string): Promise<Asked<Suggestion[]>> {
  const { data, error } = await invoke('places-search', { body: { action: 'suggest', q, token } });
  if (error) return { kind: 'none' };
  const answer = data as { enabled?: boolean; suggestions?: Suggestion[] } | null;
  if (answer?.enabled === false) return { kind: 'off' };
  return { kind: 'ok', value: Array.isArray(answer?.suggestions) ? answer.suggestions : [] };
}

export interface Chosen {
  readonly label: string;
  readonly lat: number;
  readonly lon: number;
}

export async function askChoose(invoke: Invoke, placeId: string, token: string): Promise<Chosen | null> {
  const { data, error } = await invoke('places-search', { body: { action: 'choose', placeId, token } });
  if (error) return null;
  const place = (data as { place?: Chosen | null } | null)?.place;
  return place && typeof place.lat === 'number' && typeof place.lon === 'number' ? place : null;
}

/** Whether the function has a key, without asking Google anything: `null` when it could not be told (signed out, offline). */
export async function askStatus(invoke: Invoke): Promise<boolean | null> {
  const { data, error } = await invoke('places-search', { body: { action: 'status' } });
  if (error) return null;
  const enabled = (data as { enabled?: boolean } | null)?.enabled;
  return typeof enabled === 'boolean' ? enabled : null;
}

/**
 * What the area chip says for a picked Google address: only its 5-digit ZIP, to save room on the main screen (Will, 13 October), or
 * "Philadelphia" when the address has none. Read from the address Google already returned, so nothing new is asked of or sent to Google.
 */
export function zipOf(address: string): string {
  const afterState = /\b[A-Z]{2}\s+(\d{5})(?:-\d{4})?\b/.exec(address);
  const atEnd = /(\d{5})(?:-\d{4})?\s*$/.exec(address.trim());
  return afterState?.[1] ?? atEnd?.[1] ?? 'Philadelphia';
}
