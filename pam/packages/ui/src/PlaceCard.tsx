import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { BookmarkIcon } from './icons.js';
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
  /**
   * Pre-formatted for the member's locale, e.g. "1.2 miles". Build it with
   * `distanceLabel()` from @pam/config; do not interpolate a raw number.
   */
  distanceLabel?: string;
  /**
   * Only ever pass this when it is derived from real opening hours for this
   * place. The card sits next to a Google link, so a wrong "Open now" sends
   * someone across town to a locked door — leave it undefined and the chip
   * does not render.
   */
  isOpenNow?: boolean;
  openNowLabel?: string;
  phone?: string | null;
  /**
   * Street address. Shown to Google as part of the listing search; NOT used for
   * directions when coordinates are available — see `directionsHref`.
   */
  address?: string | null;
  /**
   * The place's own coordinates. Preferred over the address for directions: the
   * city's feeds keep geometry current and let address text rot, and a stale
   * address routes somebody to the wrong building.
   */
  lat?: number | null;
  lon?: number | null;
  /** Google's id for this place, when the importer has resolved one. */
  placeId?: string | null;
  /**
   * The organisation's own spelling, for the Google lookup only. Imported names
   * are normalised for reading — which turns the acronym "APM" into "Apm" — and
   * that is a worse search term than what is on the sign. Defaults to `name`.
   */
  lookupName?: string | null;
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
  // Saved is a mark, not a word: it keeps the 48px target and stops growing,
  // so Call and Go take the width the label gave back.
  savedAction: { minHeight: '48px', minWidth: '48px', flexGrow: 0, fontSize: '20px' },
  openNow: { fontWeight: 600 },
});

/**
 * Walking directions by default (§5.1). Many members do not have a car, and a
 * driving route to a place two blocks away is worse than useless.
 *
 * Coordinates win over the address whenever we have them. `The Rosenbach Museum
 * & Library` arrived from the city's facilities layer with correct geometry and
 * an address five miles away — the feeds maintain the point and let the text
 * rot. Routing to a point also means the directions and the map pin cannot
 * disagree, since both come from the same column.
 *
 * The address remains the fallback, because a place with no geometry and a good
 * address is still worth a link.
 */
export function directionsHref(
  address?: string | null,
  lat?: number | null,
  lon?: number | null,
): string | undefined {
  const destination =
    typeof lat === 'number' && typeof lon === 'number' && Number.isFinite(lat) && Number.isFinite(lon)
      ? `${lat},${lon}`
      : address;
  if (!destination) return undefined;

  const q = encodeURIComponent(destination);
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
  lat,
  lon,
  distanceLabel,
  isOpenNow,
  openNowLabel,
  phone,
  address,
  placeId,
  lookupName,
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

            All three are secondary (Will, 13 September). A card in a list of
            cards has no single most important action: which of Call, Go and
            Save matters depends entirely on why somebody is looking, and a
            filled first button was answering that question for them. It also
            put a primary button in every row of a long list, which is a screen
            shouting in three places at once rather than one (§2.5).

            With a phone number it is Call, a real tel: link that works before
            hydration. Without one it becomes Hours, opening the place's Google
            listing where the hours and usually the phone number live. Most
            imported city records have no phone, and a permanently greyed-out
            Call button teaches a member that the app does not work.
          */}
          {phone ? (
            <Button
              label={labels.call}
              variant="secondary"
              href={`tel:${phone}`}
              clickAction={onCall}
              xstyle={styles.action}
            />
          ) : (
            <Button
              label={labels.hours}
              variant="secondary"
              href={googlePlaceHref(lookupName || name, address, placeId)}
              target="_blank"
              rel="noreferrer"
              xstyle={styles.action}
            />
          )}
          <Button
            label={labels.go}
            variant="secondary"
            href={directionsHref(address, lat, lon)}
            isDisabled={!directionsHref(address, lat, lon)}
            target="_blank"
            rel="noreferrer"
            xstyle={styles.action}
          />
          {/*
            Once it is saved the button becomes the bookmark alone, with no word
            beside it (Will, 13 September) — the filled mark is the state, the
            way it is everywhere else on a phone, and the row stops spending a
            third of its width saying so.

            The word does not disappear, it moves: `label` is the accessible
            name either way, so a screen reader still hears "Saved", and
            `aria-pressed` says which state the control is in. An icon-only
            button with no name is the classic way to make a control invisible
            to somebody who cannot see it.
          */}
          <Button
            label={isSaved ? labels.saved : labels.save}
            isIconOnly={isSaved}
            icon={isSaved ? <BookmarkIcon isFilled /> : undefined}
            variant="secondary"
            clickAction={onSave}
            aria-pressed={isSaved}
            xstyle={isSaved ? styles.savedAction : styles.action}
          />
        </HStack>
      </VStack>
    </Card>
  );
}
