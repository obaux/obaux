import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A booked visit's day and time, "Oct 7 · 10:00 AM" — one chip wherever a
 * place is shown with a visit (Will, 5 October, D-305: "unify what is inside
 * chips and how that tags all of the saved places and places from Explore…
 * consistent across the entire app"). Small, white, one line, a soft shadow
 * (D-296). On Saved it sits in the picture's corner; on a place card, under
 * the open line. The words are the same in both, and so is the look.
 */
export interface VisitTagProps {
  /** "Oct 7 · 10:00 AM". */
  readonly label: string;
  /** Pinned in a picture's corner (Saved) rather than in a line of text. */
  readonly isOverlay?: boolean;
}

const styles = stylex.create({
  tag: {
    alignSelf: 'flex-start',
    maxWidth: '100%',
    paddingInline: '8px',
    paddingBlock: '4px',
    borderRadius: '999px',
    backgroundColor: colorVars['--color-background-card'],
    boxShadow: '0 1px 4px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 50%))',
  },
  // In from the corner by half a 24px tile radius (D-303).
  overlay: { position: 'absolute', top: '12px', insetInlineStart: '12px', maxWidth: 'calc(100% - 24px)' },
  text: {
    fontSize: '12px',
    lineHeight: 1.3,
    fontWeight: 600,
    color: colorVars['--color-text-primary'],
    // Wraps, never trimmed (D-422): the day and time are the whole point of
    // the tag, and "10月11日 · 上午1…" says neither. A longer language gives it
    // a second line.
    overflowWrap: 'anywhere',
    minWidth: 0,
  },
});

export function VisitTag({ label, isOverlay = false }: VisitTagProps) {
  return (
    <HStack xstyle={[styles.tag, isOverlay && styles.overlay]}>
      <Text xstyle={styles.text}>{label}</Text>
    </HStack>
  );
}
