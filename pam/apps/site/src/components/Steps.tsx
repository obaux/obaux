import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

const styles = stylex.create({
  list: { listStyleType: 'none', margin: 0, padding: 0, maxWidth: '720px' },
  item: { alignItems: 'flex-start' },
  // The number: a ring the size of a finger's width, so the steps read as a sequence
  // and the text beside it can wrap as many lines as it needs.
  number: {
    flexShrink: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '32px',
    height: '32px',
    borderRadius: '999px',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    fontWeight: 700,
  },
  text: { flex: 1, minWidth: 0 },
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
    <VStack as="ol" role="list" gap={4} xstyle={styles.list}>
      {items.map((item, i) => (
        <HStack as="li" key={i} gap={3} xstyle={styles.item}>
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
