import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { ColourToken } from './colourTokens';
import { COLOUR_TOKENS } from './colourTokens.generated';

/**
 * Every colour token the theme defines, light and dark, listed from the theme's own CSS (D-504). The hand-written
 * palette above it says what each family is for; this is the complete list, so nothing is undocumented.
 */
const styles = stylex.create({
  group: { width: '100%', marginBlockStart: '24px' },
  groupTitle: { fontSize: '17px', fontWeight: 700, textTransform: 'capitalize' },
  row: {
    width: '100%',
    paddingBlock: '6px',
    borderBlockEndWidth: '1px',
    borderBlockEndStyle: 'solid',
    borderBlockEndColor: colorVars['--color-border'],
  },
  name: { fontSize: '13px', fontFamily: 'ui-monospace, monospace', flexGrow: 1, minWidth: 0, overflowWrap: 'anywhere' },
  value: { fontSize: '12px', fontFamily: 'ui-monospace, monospace', width: '150px', flexShrink: 0, overflowWrap: 'anywhere' },
  swatchBase: {
    width: '28px',
    height: '28px',
    flexShrink: 0,
    borderRadius: '8px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
});
const swatchStyle = stylex.create({
  of: (colour: string) => ({ backgroundColor: colour }),
});

const SWATCHABLE = /^(#[0-9a-f]{3,8}|oklch\(|rgb|hsl)/i;

function Swatch({ colour }: { readonly colour: string }) {
  return SWATCHABLE.test(colour) ? <VStack aria-hidden xstyle={[styles.swatchBase, swatchStyle.of(colour)]} /> : <VStack aria-hidden xstyle={styles.swatchBase} />;
}

export function ColourTokens() {
  const tokens = COLOUR_TOKENS;
  const groups = new Map<string, ColourToken[]>();
  for (const token of tokens) groups.set(token.group, [...(groups.get(token.group) ?? []), token]);
  return (
    <VStack gap={0}>
      <Text type="supporting">
        {tokens.length} tokens in {groups.size} families, read from the theme (@pam/ui/theme/pam.css) by pnpm --filter @pam/web tokens:colours. Left column light, right column dark.
      </Text>
      {[...groups.entries()].map(([group, items]) => (
        <VStack key={group} gap={0} xstyle={styles.group}>
          <Text xstyle={styles.groupTitle}>{group}</Text>
          {items.map((token) => (
            <HStack key={token.name} gap={3} align="center" wrap="nowrap" xstyle={styles.row}>
              <Text xstyle={styles.name}>{token.name}</Text>
              <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.value}>
                <Swatch colour={token.light} />
                <Text xstyle={styles.value}>{token.light}</Text>
              </HStack>
              <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.value}>
                <Swatch colour={token.dark} />
                <Text xstyle={styles.value}>{token.dark}</Text>
              </HStack>
            </HStack>
          ))}
        </VStack>
      ))}
    </VStack>
  );
}
