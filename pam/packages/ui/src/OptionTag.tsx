import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SUPPORTED_LOCALES, directionOf, type Locale } from '@pam/config';

/**
 * A short tag before a row's or a chip's words — "EN", "PT-BR", "AR" before a
 * language's own name (Will, 10 October 2026: "add Language abbreviation in
 * english at front so we know what language before it says the language in
 * their language. Always keep these abbreviations in english").
 *
 * Four things hold whatever the tag says:
 *
 * - **A fixed-width cell**, so the names in one list start at the same place
 *   (D-451). It is sized in `em`, so it follows the text size, for the widest
 *   tag Pam has: PT-BR, ZH-CN and ZH-HK.
 * - **Quieter than the words**: small, in the supporting text colour.
 * - **Left to right, and a box of its own** (a `<bdi dir="ltr">`, which
 *   isolates it), so "PT-BR" never turns into "BR-PT" inside an Arabic row. The
 *   cell round it keeps the row's direction, so the tag sits at the start of
 *   the cell the row reads from: the left in English, the right in Arabic.
 *   (Not `text-align: match-parent`, which Chromium does not support: it was
 *   ignored, and the tags sat at the wrong end of their cell in Arabic.)
 * - **`aria-hidden`**: the row's accessible name stays the language's own name
 *   (Lena, Languages). The tag is for the eyes.
 */
const styles = stylex.create({
  tag: {
    display: 'inline-block',
    flexShrink: 0,
    boxSizing: 'border-box',
    width: '3.6em',
    fontSize: '12px',
    fontWeight: 600,
    lineHeight: 1.35,
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    textAlign: 'start',
    color: colorVars['--color-text-secondary'],
  },
  // Beside a row's value text the tag is not one of a column, so it takes the
  // room its letters need and no more.
  autoWidth: { width: 'auto' },
  // A tag and the words, side by side, in the reading direction. The words
  // may wrap; the tag keeps its width.
  tagged: { display: 'flex', alignItems: 'baseline', gap: '8px', minWidth: 0 },
  words: { minWidth: 0 },
});

export function OptionTag({ tag, isFixedWidth = true }: { readonly tag: string; readonly isFixedWidth?: boolean }) {
  return (
    <span aria-hidden="true" {...stylex.props(styles.tag, !isFixedWidth && styles.autoWidth)}>
      <bdi dir="ltr">{tag}</bdi>
    </span>
  );
}

/** Which way a language reads. Anything Pam does not offer is read as its own `dir` says, so it is left to the page. */
function directionFor(lang: string): 'ltr' | 'rtl' | undefined {
  return (SUPPORTED_LOCALES as readonly string[]).includes(lang) ? directionOf(lang as Locale) : undefined;
}

/**
 * The attributes that say which language a run of text is in. Astryx's
 * components take no `lang` or `dir` (as `LanguageSwitching` notes), so they
 * go on a plain element round the words.
 */
export function langAttributes(lang: string | undefined): { lang?: string; dir?: 'ltr' | 'rtl' } {
  if (!lang) return {};
  const dir = directionFor(lang);
  return dir ? { lang, dir } : { lang };
}

/**
 * Row or chip words with an optional tag in front and an optional language.
 * With neither it is the words as they are, so a row without them is drawn as
 * it always was.
 */
export function TaggedWords({
  tag,
  lang,
  children,
}: {
  readonly tag?: string;
  readonly lang?: string;
  readonly children: ReactNode;
}) {
  const words = lang ? <span {...langAttributes(lang)}>{children}</span> : children;
  if (!tag) return <>{words}</>;
  return (
    <span {...stylex.props(styles.tagged)}>
      <OptionTag tag={tag} />
      <span {...stylex.props(styles.words)}>{words}</span>
    </span>
  );
}
