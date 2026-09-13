import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
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
 * Two targets for one job, deliberately. The area itself is a button because a
 * person has to be able to tell it is changeable without reading anything, and
 * the pencil beside it is the same action for anybody who reads the area as a
 * label rather than a control. Both clear 48px.
 *
 * The pencil is a picture with no word beside it, so its accessible name has to
 * carry the whole meaning — "Change the area", not "Edit".
 */
export interface AreaChipProps {
  /** The area, already localised and short, e.g. "Near 19122". */
  readonly label: string;
  /** What the pencil does, for a screen reader: "Change the area". */
  readonly changeLabel: string;
  readonly onChange: () => void;
}

const styles = stylex.create({
  area: {
    minHeight: pam.touchTargetMin,
    fontSize: '15px',
    // The header is a tight row. The area gives way before the mark does, and
    // a long address ends in an ellipsis rather than pushing the pencil off
    // the screen.
    maxWidth: '46vw',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  pencil: { minHeight: pam.touchTargetMin, minWidth: pam.touchTargetMin, fontSize: '20px' },
});

export function AreaChip({ label, changeLabel, onChange }: AreaChipProps) {
  return (
    <HStack gap={0.5} align="center" wrap="nowrap">
      <Button label={label} variant="ghost" onClick={onChange} xstyle={styles.area} />
      <IconButton
        label={changeLabel}
        icon={<EditIcon />}
        variant="ghost"
        onClick={onChange}
        xstyle={styles.pencil}
      />
    </HStack>
  );
}
