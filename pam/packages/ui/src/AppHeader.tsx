import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';

/**
 * The wordmark, and who you are signed in as.
 *
 * PAM is one codebase serving three very different people — somebody who just
 * came home, the staff running a programme, the officer watching a caseload —
 * and the screens are deliberately similar, because they are built from the
 * same components. That similarity is a liability the moment somebody has two
 * of them open, so the role chip is not decoration: it is the answer to "whose
 * screen am I looking at".
 *
 * The chip is grey on purpose. It is orientation, not news: a coloured chip in
 * the corner of every screen competes with the things that genuinely need
 * attention — an account paused, a feature switched off — and those are the
 * only badges on these screens that should catch an eye.
 *
 * The mark is type, not an image. There is no brand yet (that is Phase 6), and
 * a logo file would be a request on a 3G connection to say three letters that
 * the font already draws.
 */
export interface AppHeaderProps {
  /** Plain-language role name, already translated. Omitted for signed-out. */
  roleLabel?: string | null;
  /**
   * Where the mark sits. Left inside the app, where it shares a row with the
   * role chip and screens are scanned from the left; centred on the way in,
   * where it is the only thing on its line and is there to say which app this
   * is rather than to be navigated past.
   */
  align?: 'start' | 'center';
}

const styles = stylex.create({
  header: {
    width: '100%',
    paddingBlock: '4px',
  },
  mark: {
    fontSize: '22px',
    fontWeight: 700,
    // The three letters are read as a name, not an acronym being spelled out.
    letterSpacing: '0.06em',
  },
});

export function AppHeader({ roleLabel, align = 'start' }: AppHeaderProps) {
  return (
    <header {...stylex.props(styles.header)}>
      <HStack gap={2} align="center" justify={align} wrap="wrap">
        <Text xstyle={styles.mark}>PAM</Text>
        {roleLabel ? <Badge variant="neutral" label={roleLabel} /> : null}
      </HStack>
    </header>
  );
}
