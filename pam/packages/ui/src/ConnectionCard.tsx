import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * A person on a member's side, as a card (D-213, from the reference Will gave
 * on 1 October): a large photo, their name, where they work, a short line on
 * how they can help, and three facts across the bottom. The whole card opens
 * their profile.
 *
 * People first: the program is the line under the name, not the headline.
 */
export interface ConnectionStat {
  readonly value: string;
  readonly label: string;
}

export interface ConnectionCardProps {
  readonly name: string;
  /** "Case manager", or the program's name. */
  readonly subtitle: string;
  readonly photoUrl?: string | null;
  readonly help: string;
  /** Three, shown in a row under a rule. */
  readonly stats: readonly ConnectionStat[];
  readonly href: string;
  /** The card's accessible name — "Teresa, Case manager". */
  readonly label: string;
}

const styles = stylex.create({
  card: { width: '100%' },
  name: { fontSize: '24px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  subtitle: { fontSize: '16px', textAlign: 'center' },
  help: {
    fontSize: '17px',
    lineHeight: 1.45,
    textAlign: 'center',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  stat: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  value: { fontSize: '20px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  label: { fontSize: '14px', lineHeight: 1.3, textAlign: 'center' },
});

/** Three facts in a row — shared by the card and the profile. */
export function ConnectionStats({ stats }: { readonly stats: readonly ConnectionStat[] }) {
  return (
    <HStack gap={2} align="start" wrap="nowrap">
      {stats.slice(0, 3).map((stat) => (
        <VStack key={stat.label} gap={0.5} align="center" xstyle={styles.stat}>
          <Text xstyle={styles.value}>{stat.value}</Text>
          <Text type="supporting" xstyle={styles.label}>
            {stat.label}
          </Text>
        </VStack>
      ))}
    </HStack>
  );
}

export function ConnectionCard({ name, subtitle, photoUrl, help, stats, href, label }: ConnectionCardProps) {
  return (
    <ClickableCard label={label} href={href} padding={6} xstyle={styles.card}>
      <VStack gap={4}>
        <VStack gap={2} align="center">
          <Avatar size="xl" name={name} src={photoUrl ?? undefined} tooltip={false} alt="" />
          <VStack gap={0.5} align="center">
            <Heading level={2} xstyle={styles.name}>
              {name}
            </Heading>
            <Text type="supporting" xstyle={styles.subtitle}>
              {subtitle}
            </Text>
          </VStack>
          <Text xstyle={styles.help}>{help}</Text>
        </VStack>
        <Divider />
        <ConnectionStats stats={stats} />
      </VStack>
    </ClickableCard>
  );
}
