import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The Profile screen's cards (D-210): who you are, the two doors beside each
 * other, and a single offer. Modelled on the reference Will gave on 1 October —
 * white page, generous rounded cards lifted by the theme's card shadow, very
 * little text on each — and kept to PAM's floors: 48px targets, 18px body.
 */

// ---------------------------------------------------------------------------
// Who you are

export interface ProfileStat {
  readonly value: string;
  readonly label: string;
}

export interface ProfileSummaryProps {
  readonly name: string;
  /** "Member", "Case manager" — who PAM knows this account as. */
  readonly roleLabel: string;
  /** A photo, when there is one; otherwise the avatar shows initials. */
  readonly photoUrl?: string | null;
  /** Up to three, shown down the right-hand side. */
  readonly stats: readonly ProfileStat[];
  /**
   * One control in the card's top-right corner — the case manager's star on
   * a member's page (D-227, D-231).
   */
  readonly corner?: ReactNode;
}

const summary = stylex.create({
  card: { width: '100%', position: 'relative' },
  corner: { position: 'absolute', top: '12px', insetInlineEnd: '12px' },
  person: { flexBasis: '55%', flexShrink: 0, minWidth: 0 },
  // No numbers to show (a staff account, D-217): the person has the card.
  personAlone: { flexBasis: '100%' },
  name: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  role: { fontSize: '15px', textAlign: 'center' },
  stats: { flexGrow: 1, minWidth: 0 },
  // Clear of the corner control, which sits over the column's top.
  statsUnderCorner: { paddingBlockStart: '28px' },
  value: { fontSize: '20px', lineHeight: 1.2, fontWeight: 700 },
  label: { fontSize: '13px', lineHeight: 1.3 },
});

export function ProfileSummary({ name, roleLabel, photoUrl, stats, corner }: ProfileSummaryProps) {
  return (
    <Card padding={6} xstyle={summary.card}>
      {corner ? <HStack xstyle={summary.corner}>{corner}</HStack> : null}
      <HStack gap={4} align="center" wrap="nowrap">
        <VStack gap={2} align="center" xstyle={[summary.person, stats.length === 0 && summary.personAlone]}>
          <Avatar size="xl" name={name} src={photoUrl ?? undefined} tooltip={false} />
          <VStack gap={0.5} align="center">
            <Heading level={2} xstyle={summary.name} maxLines={2}>
              {name}
            </Heading>
            <Text type="supporting" xstyle={summary.role}>
              {roleLabel}
            </Text>
          </VStack>
        </VStack>
        {stats.length > 0 ? (
          <VStack gap={3} xstyle={[summary.stats, corner ? summary.statsUnderCorner : null]}>
            {stats.slice(0, 3).map((stat, index) => (
              <VStack key={stat.label} gap={2}>
                {index > 0 ? <Divider /> : null}
                <VStack gap={0}>
                  <Text xstyle={summary.value}>{stat.value}</Text>
                  <Text type="supporting" xstyle={summary.label}>
                    {stat.label}
                  </Text>
                </VStack>
              </VStack>
            ))}
          </VStack>
        ) : null}
      </HStack>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Two doors side by side

export interface FeatureTileProps {
  readonly label: string;
  readonly href: string;
  /** Drawn large above the label — a PAM icon or an avatar stack. */
  readonly art: ReactNode;
}

const tile = stylex.create({
  card: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  art: {
    width: '88px',
    height: '88px',
    borderRadius: '24px',
    fontSize: '44px',
    color: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-accent-muted'],
  },
  label: { fontSize: '18px', fontWeight: 600, textAlign: 'center' },
});

export function FeatureTile({ label, href, art }: FeatureTileProps) {
  return (
    <ClickableCard label={label} href={href} padding={4} xstyle={tile.card}>
      <VStack gap={3} align="center">
        <HStack align="center" justify="center" xstyle={tile.art}>
          {art}
        </HStack>
        <Text xstyle={tile.label}>{label}</Text>
      </VStack>
    </ClickableCard>
  );
}

/** Two `FeatureTile`s, side by side, sharing the row equally. */
export function FeatureTileRow({ children }: { readonly children: ReactNode }) {
  return (
    <HStack gap={3} align="stretch" wrap="nowrap">
      {children}
    </HStack>
  );
}

// ---------------------------------------------------------------------------
// One offer

export interface PromoCardProps {
  readonly title: string;
  readonly body: string;
  readonly href: string;
  readonly art: ReactNode;
}

const promo = stylex.create({
  card: { width: '100%' },
  art: {
    width: '72px',
    height: '72px',
    flexShrink: 0,
    borderRadius: '16px',
    fontSize: '36px',
    color: colorVars['--color-icon-accent'],
    backgroundColor: colorVars['--color-accent-muted'],
  },
  title: { fontSize: '18px', fontWeight: 700 },
  body: { fontSize: '16px', lineHeight: 1.4 },
});

export function PromoCard({ title, body, href, art }: PromoCardProps) {
  return (
    <ClickableCard label={title} href={href} padding={6} xstyle={promo.card}>
      <HStack gap={4} align="center" wrap="nowrap">
        <HStack align="center" justify="center" xstyle={promo.art}>
          {art}
        </HStack>
        <VStack gap={1}>
          <Text xstyle={promo.title}>{title}</Text>
          <Text type="supporting" xstyle={promo.body}>
            {body}
          </Text>
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
