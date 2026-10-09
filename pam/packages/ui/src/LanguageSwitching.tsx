import * as stylex from '@stylexjs/stylex';
import { Spinner } from '@astryxdesign/core/Spinner';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The screen between two languages (Will, 9 October, D-422): when the words of
 * the language somebody just chose have to be downloaded first, the screen is
 * covered by a spinner and one line saying what is happening, in the language
 * being switched to — "Cambiando a español…" — so the wait is explained to the
 * person in words they can read, not left as a ring.
 *
 * `Loading` stays wordless on purpose (its file says why: a ring needs no
 * language). This is the one place Pam says something while it waits, because
 * the person caused this wait by choosing, and the answer to "what is it
 * doing?" is in the language they chose.
 *
 * The line is drawn with that language's own `lang` and `dir`, so Arabic
 * reads right to left and Chinese picks the right glyphs while the rest of
 * the page is still in the old language.
 *
 * It covers the whole window, above everything, and is announced as a status:
 * a screen reader hears the same line the eye sees, once.
 */
export interface LanguageSwitchingProps {
  /** "Switching to X…", already in X. */
  readonly label: string;
  /** X's language tag, for the line's `lang`. */
  readonly lang: string;
  /** Which way X reads. */
  readonly dir: 'ltr' | 'rtl';
}

const styles = stylex.create({
  screen: {
    position: 'fixed',
    inset: 0,
    zIndex: 100,
    backgroundColor: colorVars['--color-background-body'],
    paddingInline: '24px',
  },
  line: { textAlign: 'center', fontSize: '18px', lineHeight: 1.4, maxWidth: '320px' },
});

export function LanguageSwitching({ label, lang, dir }: LanguageSwitchingProps) {
  return (
    <VStack align="center" justify="center" gap={4} xstyle={styles.screen} role="status" aria-live="polite">
      <Spinner size="xl" aria-hidden />
      <Text type="supporting" xstyle={styles.line}>
        {/* Language markup on the run of text, not layout: Astryx's components take no `lang` or `dir`. */}
        <span lang={lang} dir={dir}>
          {label}
        </span>
      </Text>
    </VStack>
  );
}
