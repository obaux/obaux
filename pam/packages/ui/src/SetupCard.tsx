'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Skeleton } from '@astryxdesign/core/Skeleton';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
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
 *
 * Two ways to say "not ready yet" (Will, 7 October, D-384):
 * - `loading="skeleton"` — the card's shape, animated, while what goes in it
 *   loads. Nothing to tap yet.
 * - `loading="processing"` — the card is all there and works, but what it is
 *   about is being worked on (a program Pam is checking): only the picture
 *   gets a soft diagonal shimmer sweeping across it. Under reduced motion
 *   the sweep stops.
 */
export interface SetupCardProps {
  readonly kind: SetupArtKind;
  readonly title: string;
  readonly body: string;
  /** Where the card goes — Add a program, Profile, the calendar preview. */
  readonly href: string;
  /** Not ready yet: a placeholder while loading, or a shimmer while it is being worked on. */
  readonly loading?: 'skeleton' | 'processing';
}

// A soft light band crossing the picture, then a pause, again (D-384).
const sweep = stylex.keyframes({
  '0%': { transform: 'translateX(-130%) skewX(-20deg)' },
  '55%': { transform: 'translateX(230%) skewX(-20deg)' },
  '100%': { transform: 'translateX(230%) skewX(-20deg)' },
});

const styles = stylex.create({
  card: { width: '100%', position: 'relative' },
  art: { flexShrink: 0, borderRadius: '16px', overflow: 'hidden', position: 'relative' },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '60%',
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(90deg, transparent, color-mix(in srgb, ${colorVars['--color-background-body']} 55%, transparent), transparent)`,
    animationName: sweep,
    animationDuration: '2.6s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none', opacity: 0 },
  },
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

export function SetupCard({ kind, title, body, href, loading }: SetupCardProps) {
  if (loading === 'skeleton') {
    return (
      <Card padding={4} xstyle={styles.card} aria-busy>
        <VisuallyHidden>{title}</VisuallyHidden>
        <HStack gap={3} align="center" wrap="nowrap">
          <Skeleton width={64} height={64} radius="rounded" index={0} />
          <VStack gap={2} xstyle={styles.words}>
            <Skeleton width="70%" height={20} index={1} />
            <Skeleton width="100%" height={14} index={2} />
            <Skeleton width="55%" height={14} index={3} />
          </VStack>
        </HStack>
      </Card>
    );
  }
  return (
    <Card padding={4} xstyle={styles.card}>
      <HStack gap={3} align="center" wrap="nowrap">
        <HStack xstyle={styles.art}>
          <SetupArt kind={kind} size={64} />
          {loading === 'processing' ? <HStack aria-hidden xstyle={styles.shimmer} /> : null}
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
