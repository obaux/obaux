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
  /** Google's id for this place, when the importer has resolved one. */
  placeId?: string | null;
  isSaved?: boolean;
  onSave?: () => void;
  onCall?: () => void;
  labels: { call: string; go: string; save: string; saved: string; hours: string };
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

/**
 * The place's own Google listing, where its opening hours and phone number are.
 *
 * PAM's imported city data mostly has neither: the DBHIDS feed, for instance,
 * gives 525 addresses with no hours and no phone at all. Google has both for
 * most of these places, kept current by the businesses themselves, so pointing
 * at the listing is worth more to a member than an empty "Hours" row in PAM.
 *
 * Needs no API key. `place_id` makes the match exact and is filled in by the
 * importer once a Places key exists; without one, name plus address resolves
 * correctly for a named organisation at a street address.
 */
export function googlePlaceHref(
  name: string,
  address?: string | null,
  placeId?: string | null,
): string {
  const query = encodeURIComponent(address ? `${name}, ${address}` : name);
  const base = `https://www.google.com/maps/search/?api=1&query=${query}`;
  return placeId ? `${base}&query_place_id=${encodeURIComponent(placeId)}` : base;
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
  placeId,
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
          {/*
            Three actions, always, in the same order (§5.1) — but the first slot
            adapts to what is actually known about the place.

            With a phone number it is Call, a real tel: link that works before
            hydration. Without one it becomes Hours, opening the place's Google
            listing where the hours and usually the phone number live. Most
            imported city records have no phone, and a permanently greyed-out
            Call button teaches a member that the app does not work.
          */}
          {phone ? (
            <Button
              label={labels.call}
              variant="primary"
              href={`tel:${phone}`}
              clickAction={onCall}
              xstyle={styles.action}
            />
          ) : (
            <Button
              label={labels.hours}
              variant="primary"
              href={googlePlaceHref(name, address, placeId)}
              target="_blank"
              rel="noreferrer"
              xstyle={styles.action}
            />
          )}
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
