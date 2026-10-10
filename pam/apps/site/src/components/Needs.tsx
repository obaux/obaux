import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

const styles = stylex.create({
  // A gray banner: the colour for "what you need", apart from the tinted picture cards.
  banner: {
    alignItems: 'flex-start',
    padding: '16px',
    borderRadius: '12px',
    backgroundColor: colorVars['--color-background-gray'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border-gray'],
    maxWidth: '760px',
    boxSizing: 'border-box',
  },
  icon: { flexShrink: 0, width: '24px', height: '24px', color: colorVars['--color-icon-gray'], marginBlockStart: '1px' },
  body: { flex: 1, minWidth: 0 },
  title: { fontWeight: 700 },
});

/**
 * What a person needs, or does not need, before they start: a gray banner with an
 * info icon, so a requirement is the first thing they see and is not buried in a
 * paragraph. The title is the requirement in a short sentence; the optional text
 * under it says more. A note, not an alert: nothing here has gone wrong.
 */
export function Needs({ title, children }: { readonly title: string; readonly children?: ReactNode }) {
  return (
    <HStack as="aside" gap={3} xstyle={styles.banner} role="note">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        {...stylex.props(styles.icon)}
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5.5" />
        <path d="M12 7.6v.4" />
      </svg>
      <VStack gap={1} xstyle={styles.body}>
        <Text as="p" xstyle={styles.title}>
          {title}
        </Text>
        {children ? <Text as="p">{children}</Text> : null}
      </VStack>
    </HStack>
  );
}
