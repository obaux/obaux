'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { SetupArt, type SetupArtKind } from './SetupArt.js';

/**
 * One thing to set up, on a program lead's Home (D-352, Will, 7 October:
 * "a few cards to show what the app can do … similar layout to Place card,
 * except we're using new illustrations for each theme").
 *
 * The place card's frame — picture at the top left, a bold name, a sentence
 * — with the whole card the link, the same way (`PlaceCard`: the heading
 * carries the one `<a>`, stretched over the card). A chevron says it goes
 * somewhere; there is no other control.
 */
export interface SetupCardProps {
  readonly kind: SetupArtKind;
  readonly title: string;
  readonly body: string;
  /** Where the card goes — Add a program, Profile, the calendar preview. */
  readonly href: string;
}

const styles = stylex.create({
  card: { width: '100%', position: 'relative' },
  art: { flexShrink: 0, borderRadius: '16px', overflow: 'hidden' },
  words: { flexGrow: 1, minWidth: 0 },
  title: { fontSize: '18px', fontWeight: 700, lineHeight: 1.3 },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0, zIndex: 0 },
  },
  // 14px under the title (Will, 7 October): the place card's meta size.
  body: { fontSize: '14px', lineHeight: 1.4 },
  chevron: { flexShrink: 0, color: colorVars['--color-text-secondary'] },
});

export function SetupCard({ kind, title, body, href }: SetupCardProps) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <HStack gap={3} align="center" wrap="nowrap">
        <HStack xstyle={styles.art}>
          <SetupArt kind={kind} size={64} />
        </HStack>
        <VStack gap={0.5} xstyle={styles.words}>
          <Heading level={3} xstyle={styles.title}>
            <a href={href} {...stylex.props(styles.link)}>
              {title}
            </a>
          </Heading>
          <Text type="supporting" xstyle={styles.body}>
            {body}
          </Text>
        </VStack>
        <HStack aria-hidden xstyle={styles.chevron}>
          <Icon icon="chevronRight" size="md" />
        </HStack>
      </HStack>
    </Card>
  );
}
