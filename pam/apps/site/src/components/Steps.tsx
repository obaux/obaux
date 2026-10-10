import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

const PHONE = '@media (max-width: 600px)';

const styles = stylex.create({
  list: {
    listStyleType: 'none',
    margin: 0,
    padding: 0,
    // Less air between steps on a phone, where the list is already long.
    rowGap: { default: '16px', [PHONE]: '10px' },
  },
  item: { alignItems: 'flex-start', columnGap: { default: '12px', [PHONE]: '10px' } },
  // The number: a ring the size of a finger's width on a desktop, smaller on a phone, so
  // the steps read as a sequence and the text beside it can wrap as many lines as it needs.
  number: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: { default: '32px', [PHONE]: '24px' },
    height: { default: '32px', [PHONE]: '24px' },
    fontSize: { default: '16px', [PHONE]: '13px' },
    borderRadius: '999px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    fontWeight: 700,
  },
  // The text sits in a box as tall as the ring and is centred in it, so a one-line step
  // is level with its number (a ring beside top-aligned text looked off). A longer step
  // starts at the ring's top and grows downward.
  text: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    alignItems: 'center',
    minHeight: { default: '32px', [PHONE]: '24px' },
  },
});

/**
 * Numbered steps a person follows with the phone in their hand. One action each, in the
 * words the screen uses (quoted in “curly quotes”), starting from where they are. A real
 * ordered list, so a screen reader says "list, 5 items" and the step's position. The
 * text wraps: Astryx's own list item trims its label to one line, which cut the steps
 * off with "…" on a phone, so steps are built here instead.
 */
export function Steps({ items }: { readonly items: readonly string[] }) {
  return (
    <VStack as="ol" role="list" xstyle={styles.list}>
      {items.map((item, i) => (
        <HStack as="li" key={i} xstyle={styles.item}>
          <Text aria-hidden xstyle={styles.number}>
            {i + 1}
          </Text>
          <Text as="p" xstyle={styles.text}>
            {item}
          </Text>
        </HStack>
      ))}
    </VStack>
  );
}
