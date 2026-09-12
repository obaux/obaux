import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';

/**
 * A service or facility, summarised (§2.4, §5.1).
 *
 * Exactly three actions, always the same three, always in the same order:
 * **Call**, **Go**, **Save**. A member learns the pattern once and it never
 * moves. Call and Go are real links (`tel:` and a maps deep link) so they work
 * from the OS even when the app is struggling on a bad connection.
 */
export interface PlaceCardProps {
  name: string;
  category: Category;
  categoryLabel: string;
  /** Pre-formatted for the member's locale, e.g. "1.2 miles". */
  distanceLabel?: string;
  isOpenNow?: boolean;
  openNowLabel?: string;
  phone?: string | null;
  /** Street address, used to build the directions link. */
  address?: string | null;
  isSaved?: boolean;
  onSave?: () => void;
  onCall?: () => void;
  labels: { call: string; go: string; save: string; saved: string };
}

/**
 * The chip colour comes from the category definition in @pam/config, which is
 * also what colours the map pin (§5.1). One source of truth: a member learns
 * "blue means school" once, and the pin and the chip never disagree.
 *
 * Astryx's Badge happens to accept these palette names directly. `categoryBadgeVariant`
 * is typed against BadgeVariant so a future token rename fails the build here
 * rather than silently falling back to grey.
 */
function categoryBadgeVariant(category: Category): BadgeVariant {
  return CATEGORY_DEFINITIONS[category].colorToken as BadgeVariant;
}

const styles = stylex.create({
  card: { width: '100%' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  // §0 / §2.5 — every action here clears the 48px minimum target.
  action: { minHeight: '48px', flexGrow: 1, fontSize: '17px' },
  openNow: { fontWeight: 600 },
});

/**
 * Walking directions by default (§5.1). Many members do not have a car, and a
 * driving route to a place two blocks away is worse than useless.
 */
function directionsHref(address: string): string {
  const q = encodeURIComponent(address);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking`;
}

export function PlaceCard({
  name,
  category,
  categoryLabel,
  distanceLabel,
  isOpenNow,
  openNowLabel,
  phone,
  address,
  isSaved = false,
  onSave,
  onCall,
  labels,
}: PlaceCardProps) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={2}>
        <Heading level={3} xstyle={styles.name}>
          {name}
        </Heading>

        <HStack gap={2} align="center" wrap="wrap">
          <Badge variant={categoryBadgeVariant(category)} label={categoryLabel} />
          {distanceLabel ? (
            <Text type="supporting" xstyle={styles.meta}>
              {distanceLabel}
            </Text>
          ) : null}
          {isOpenNow && openNowLabel ? (
            <Text type="supporting" color="accent" xstyle={styles.openNow}>
              {openNowLabel}
            </Text>
          ) : null}
        </HStack>

        <HStack gap={2}>
          {/* A tel: link, not a handler: it still works if JS has not hydrated. */}
          <Button
            label={labels.call}
            variant="primary"
            href={phone ? `tel:${phone}` : undefined}
            isDisabled={!phone}
            clickAction={onCall}
            xstyle={styles.action}
          />
          <Button
            label={labels.go}
            variant="secondary"
            href={address ? directionsHref(address) : undefined}
            isDisabled={!address}
            target="_blank"
            rel="noreferrer"
            xstyle={styles.action}
          />
          <Button
            label={isSaved ? labels.saved : labels.save}
            variant={isSaved ? 'primary' : 'secondary'}
            clickAction={onSave}
            aria-pressed={isSaved}
            xstyle={styles.action}
          />
        </HStack>
      </VStack>
    </Card>
  );
}
