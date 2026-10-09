/**
 * A pseudo-language for checking that text fits before there is a translation
 * (D-424).
 *
 * Russian runs 30–50% longer than English and Arabic's longest forms are wider;
 * a screen tuned on English strings crops them quietly (D-422). Waiting for a
 * translation to find that out is waiting too long, and a new English string
 * has no translation yet to check. So the English is *stretched*: every letter
 * becomes an accented look-alike (so it is plainly not real copy, and any
 * string that never went through `t()` stands out as unaccented), most words
 * grow by repeated vowels, and the whole string is wrapped in ⟦ ⟧ — if the
 * closing bracket is not on screen, the string was cut off.
 *
 * `{placeholders}` are left exactly as they are. Used by Storybook's language
 * switch ("Pseudo-language") and by the fit audit (`--locales en,pseudo`), never
 * by the app: nobody reads Pam in it.
 */

const LOOKALIKES: Readonly<Record<string, string>> = {
  a: 'á', b: 'ƀ', c: 'ç', d: 'ð', e: 'é', f: 'ƒ', g: 'ĝ', h: 'ĥ', i: 'í', j: 'ĵ', k: 'ķ', l: 'ļ', m: 'ɱ',
  n: 'ñ', o: 'ó', p: 'þ', q: 'ǫ', r: 'ŕ', s: 'š', t: 'ţ', u: 'ú', v: 'ṽ', w: 'ŵ', x: 'ẋ', y: 'ý', z: 'ž',
  A: 'Á', B: 'Ɓ', C: 'Ç', D: 'Ð', E: 'É', F: 'Ƒ', G: 'Ĝ', H: 'Ĥ', I: 'Í', J: 'Ĵ', K: 'Ķ', L: 'Ļ', M: 'Ṁ',
  N: 'Ñ', O: 'Ó', P: 'Þ', Q: 'Ǫ', R: 'Ŕ', S: 'Š', T: 'Ţ', U: 'Ú', V: 'Ṽ', W: 'Ŵ', X: 'Ẋ', Y: 'Ý', Z: 'Ž',
};

const VOWEL = /[aeiouAEIOU]/;

/**
 * Half as many extra letters as the word has, spread over its vowels (the
 * middle of a word is where a longer translation grows), or its middle letter
 * if it has none.
 */
function stretchWord(word: string): string {
  const letters = [...word];
  if (letters.length < 3) return word;
  const extra = Math.round(letters.length * 0.5);
  const spots = letters.flatMap((ch, i) => (i > 0 && VOWEL.test(ch) ? [i] : []));
  if (spots.length === 0) spots.push(Math.floor(letters.length / 2));
  const repeats = new Map<number, number>();
  for (let n = 0; n < extra; n += 1) {
    const at = spots[n % spots.length]!;
    repeats.set(at, (repeats.get(at) ?? 0) + 1);
  }
  return letters.map((ch, i) => ch.repeat(1 + (repeats.get(i) ?? 0))).join('');
}

export function pseudoText(text: string): string {
  const pieces = text.split(/(\{\w+\})/);
  const body = pieces
    .map((piece) => {
      if (/^\{\w+\}$/.test(piece)) return piece;
      return piece
        .split(/(\s+)/)
        .map((token) => {
          if (/^\s*$/.test(token)) return token;
          return [...stretchWord(token)].map((ch) => LOOKALIKES[ch] ?? ch).join('');
        })
        .join('');
    })
    .join('');
  return `⟦${body}⟧`;
}

/** A whole bundle in the pseudo-language. Keys are unchanged. */
export function pseudoBundle(bundle: Readonly<Record<string, string>>): Record<string, string> {
  return Object.fromEntries(Object.entries(bundle).map(([key, text]) => [key, pseudoText(text)]));
}
