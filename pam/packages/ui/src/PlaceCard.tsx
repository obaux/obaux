import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * A place, as much of it as belongs in a list (§2.4, §5.1).
 *
 * The card used to carry three buttons and a menu: Call, Go, Save, plus share
 * and report behind a corner. That is five decisions per card, twenty in a
 * screenful, before a member has decided whether they want to go anywhere —
 * and Call and Go are both answers to "how do I get there", which is a question
 * nobody asks until they have chosen the place.
 *
 * So the card answers one question — *is this worth my time* — with the four
 * facts that settle it (Will, 16 September): what it is called, how far it is,
 * whether it is open, and one sentence about what it does. Plus Save, because
 * that is the answer to the question the card asks.
 *
 * Everything else lives one tap inside, on the place's own screen, where there
 * is room for it to be obvious rather than hidden in a corner menu.
 *
 * ## Why the whole card is the link
 *
 * A "More" link in the corner is a 48px target on a card that is 300px wide,
 * and the member most likely to miss it is the one this app is for. The card is
 * the target: the heading carries the real `<a>`, and a pseudo-element on it
 * covers the card, so there is exactly one link in the accessibility tree with
 * the place's name as its text. Save sits above that layer with its own target.
 * One link, one button, no nesting — which is what keeps a screen reader's list
 * of links readable.
 */
export interface PlaceCardProps {
  readonly name: string;
  /** Where the place's own screen is. The whole card goes here. */
  readonly href: string;
  /** One sentence, from the catalogue. Clipped to two lines. */
  readonly description?: string | null;
  /**
   * Pre-formatted for the member's locale, e.g. "1.2 miles". Build it with
   * `distanceLabel()` from @pam/config; do not interpolate a raw number.
   */
  readonly distanceLabel?: string;
  /**
   * Open or shut, already worded. Pass it only when PAM has hours it is willing
   * to stand behind — `hoursFor()` decides that, and returns nothing when the
   * answer would be a guess.
   */
  readonly status?: { readonly isOpen: boolean; readonly label: string } | null;
  /**
   * "In a school" or "Ages 10 to 17" — who may actually walk in, when that is
   * narrower than anybody. A badge rather than a sentence, because somebody
   * scanning a list does not read sentences (Will, 16 September).
   */
  readonly audienceLabel?: string | null;
  readonly isSaved?: boolean;
  readonly onSave?: () => void;
  readonly labels: {
    readonly save: string;
    readonly saved: string;
  };
}

const styles = stylex.create({
  card: {
    width: '100%',
    // The stretched link is positioned against this.
    position: 'relative',
  },
  name: {
    fontSize: '20px',
    lineHeight: 1.3,
    minWidth: 0,
    // Two lines, then an ellipsis. Two, not one: a place is often "Mt. Airy
    // Learning Tree — Germantown Avenue", and the first half of that is
    // several different places.
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    // The card, made clickable, without wrapping anything in an anchor.
    '::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      // Under the bookmark, over the card.
      zIndex: 0,
    },
  },
  meta: { fontSize: '16px' },
  open: { fontSize: '16px', fontWeight: 600, color: colorVars['--color-text-accent'] },
  shut: { fontSize: '16px', fontWeight: 600 },
  description: {
    fontSize: '16px',
    lineHeight: 1.45,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  /*
   * Above the stretched link, or it is not clickable — and given its own
   * stacking context so the shadow of a pressed card does not cover it.
   */
  save: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    minHeight: pam.touchTargetMin,
    minWidth: pam.touchTargetMin,
    fontSize: '22px',
    color: colorVars['--color-icon-accent'],
  },
});

export function PlaceCard({
  name,
  href,
  description,
  distanceLabel,
  status,
  audienceLabel,
  isSaved = false,
  onSave,
  labels,
}: PlaceCardProps) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={2}>
        <HStack gap={2} align="start" justify="between" wrap="nowrap">
          <Heading level={3} xstyle={styles.name}>
            <a href={href} {...stylex.props(styles.link)}>
              {name}
            </a>
          </Heading>
          {/*
            Save is the only control on the card, because it is the only
            answer to the question the card asks. Once saved it is the filled
            mark alone — the state, the way it is on every other phone app —
            and the word moves to the accessible name, which `aria-pressed`
            then qualifies. An icon-only control with no name is the classic
            way to make a button invisible to somebody who cannot see it.
          */}
          {onSave ? (
            <IconButton
              label={isSaved ? labels.saved : labels.save}
              icon={<BookmarkIcon isFilled={isSaved} />}
              variant="ghost"
              onClick={onSave}
              aria-pressed={isSaved}
              xstyle={styles.save}
            />
          ) : null}
        </HStack>

        {/*
          How far, and whether it is open — the two facts that decide whether
          somebody sets off. Open is in the brand colour; shut is not coloured
          at all, because a red chip on two thirds of a list at eight in the
          evening reads as a screen full of errors.
        */}
        <HStack gap={2} align="center" wrap="wrap">
          {distanceLabel ? (
            <Text type="supporting" xstyle={styles.meta}>
              {distanceLabel}
            </Text>
          ) : null}
          {status ? (
            <Text
              type={status.isOpen ? 'body' : 'supporting'}
              xstyle={status.isOpen ? styles.open : styles.shut}
            >
              {status.label}
            </Text>
          ) : null}
          {audienceLabel ? <Badge variant="warning" label={audienceLabel} /> : null}
        </HStack>

        {description ? (
          <Text type="supporting" xstyle={styles.description}>
            {description}
          </Text>
        ) : null}
      </VStack>
    </Card>
  );
}

/**
 * Walking directions (§5.1). Many members do not have a car, and a driving
 * route to a place four blocks away is the wrong answer given confidently.
 *
 * Coordinates beat the address when PAM has them: the city's feeds keep
 * geometry current and let address text rot, and a stale address routes
 * somebody to the wrong building. Returns null when there is nothing to route
 * to, so the caller can leave the control out rather than draw a dead one.
 */
export function directionsHref(
  address?: string | null,
  lat?: number | null,
  lon?: number | null,
): string | undefined {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon);
  const destination = hasPoint ? `${lat},${lon}` : (address ?? null);
  if (!destination) return undefined;
  const q = encodeURIComponent(destination);
  return `https://www.google.com/maps/dir/?api=1&destination=${q}&travelmode=walking`;
}

/**
 * The place's own Google listing, where its opening hours and phone number are.
 *
 * `place_id` is null on every imported row until `enrich-places` runs, so this
 * is a search by name and address — which lands on the listing often enough to
 * be worth offering, and on a search page when it does not.
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
