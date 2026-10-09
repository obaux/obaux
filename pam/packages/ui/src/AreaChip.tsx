import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { splitIsolated } from '@pam/config';
import { EditIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * Where a screen is measured from, and the way to change it — in the header.
 *
 * It sat in the page body, as a wide button reading "Showing places near City
 * Hall" with a "Change" button beside it: two controls and a sentence, using a
 * row of a phone screen to say something that is true of every row below it.
 * In the header it costs nothing (Will, 13 September) and the list starts at
 * the top of the page where it belongs.
 *
 * **One control, not two** (Will, 16 September: "the edit button and location
 * button should be one, not two separate buttons"). It used to be two
 * side-by-side targets doing the same thing — the area's own name as a
 * button, and a second, pencil-only button beside it — on the reasoning that
 * somebody reading the area as a label rather than a control still needed a
 * way to find "change" by picture alone. That reasoning did not need two
 * targets, only the pencil visible on the one target both people tap. The
 * pencil now sits at the *end* of the label rather than the front, which is
 * what actually frees the row width Will asked for — a leading icon pushes
 * every character of the area name over by its own width, where a trailing
 * one only costs space the label wasn't using.
 *
 * The visible text is the area name; the accessible name is the fuller
 * sentence ("Change the area: Near City Hall"), so a screen reader hears what
 * the button does, not just where it currently reads from.
 *
 * **In Arabic the address is a box of its own** (D-435). `t` lays a value out
 * as a piece by wrapping it in isolates, so "بالقرب من 1231 N Broad St" reads
 * in order — but a line that is too long is cut at its edge, which in a
 * right-to-left line is the left, and the left of an English address is its
 * street number. So when the label has a value in it, the words keep their
 * width and the value gets the rest and ends in its own ellipsis: what is lost
 * is the end of the address, as in English. A label with no isolates in it
 * (every other language) is drawn as it always was.
 */
export interface AreaChipProps {
  /** The area, already localised and short, e.g. "Near 19122". */
  readonly label: string;
  /** The button's accessible name, e.g. "Change the area: Near City Hall". */
  readonly changeLabel: string;
  readonly onChange: () => void;
}

const styles = stylex.create({
  area: {
    minHeight: pam['--pam-touch-target-min'],
    fontSize: '15px',
    // A long address ends in an ellipsis rather than pushing the pencil off
    // the screen. The row it sits in wraps (D-422), so the link goes under its
    // heading before it is ever squeezed; the whole width is its to use then.
    maxWidth: '100%',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    // A link, not a pill (Will, 5 October, D-274): narrower, so it fits
    // beside the heading in Spanish too — no background on hover or press,
    // the colour changes and an underline appears, as `TextLink` does.
    paddingInline: '0px',
    gap: '6px',
    backgroundImage: { default: 'none', ':hover': 'none', ':active': 'none' },
    color: { default: colorVars['--color-text-primary'], ':hover': colorVars['--color-text-accent'] },
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    textUnderlineOffset: '4px',
  },
  // The words and the value, side by side in the reading direction.
  sentence: { display: 'flex', alignItems: 'baseline', minWidth: 0 },
  words: { flexShrink: 0, whiteSpace: 'pre' },
  value: { minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
});

/** The label, with each value in it laid out as a box of its own; as it is when it holds none. */
function Sentence({ label }: { readonly label: string }) {
  const pieces = splitIsolated(label);
  if (!pieces.some((piece) => piece.isValue)) return <>{label}</>;
  return (
    <span {...stylex.props(styles.sentence)}>
      {pieces.map((piece, index) =>
        piece.isValue ? (
          // `auto`: it runs the way its own first letter reads, so an English address is cut at its end.
          <span key={index} dir="auto" {...stylex.props(styles.value)}>
            {piece.text}
          </span>
        ) : (
          <span key={index} {...stylex.props(styles.words)}>
            {piece.text}
          </span>
        ),
      )}
    </span>
  );
}

export function AreaChip({ label, changeLabel, onChange }: AreaChipProps) {
  return (
    <Button
      label={changeLabel}
      variant="ghost"
      onClick={onChange}
      endContent={<EditIcon />}
      xstyle={styles.area}
    >
      <Sentence label={label} />
    </Button>
  );
}
