import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { BigButton } from './BigButton.js';

/**
 * A mentor or buddy, summarised (§2.4, §6.1).
 *
 * First name only, never a surname — a member should be able to look for help
 * without handing over a searchable identity, in either direction.
 */
export interface PersonCardProps {
  firstName: string;
  photoUrl?: string | null;
  /** "How I can help" — one line, written by the mentor. */
  roleLine?: string | null;
  /** Tags shared with the viewer, already localised. Chips, never free text. */
  sharedTags?: readonly string[];
  /** Set when the person is verified provider staff (§6.4). */
  orgBadgeLabel?: string | null;
  messageLabel: string;
  onMessage?: () => void;
}

const styles = stylex.create({
  card: { width: '100%' },
  name: { fontSize: '20px' },
  roleLine: { fontSize: '17px', lineHeight: 1.4 },
});

export function PersonCard({
  firstName,
  photoUrl,
  roleLine,
  sharedTags = [],
  orgBadgeLabel,
  messageLabel,
  onMessage,
}: PersonCardProps) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={3}>
        <HStack gap={3} align="center">
          <Avatar size="lg" src={photoUrl ?? undefined} name={firstName} />
          <VStack gap={1}>
            <Heading level={3} xstyle={styles.name}>
              {firstName}
            </Heading>
            {orgBadgeLabel ? <Badge variant="success" label={orgBadgeLabel} /> : null}
          </VStack>
        </HStack>

        {roleLine ? <Text xstyle={styles.roleLine}>{roleLine}</Text> : null}

        {sharedTags.length > 0 ? (
          <HStack gap={1.5} wrap="wrap">
            {sharedTags.map((tag) => (
              <Badge key={tag} variant="neutral" label={tag} />
            ))}
          </HStack>
        ) : null}

        {/* §6.1: the full profile offers exactly one action. */}
        <BigButton label={messageLabel} onPress={onMessage} />
      </VStack>
    </Card>
  );
}
