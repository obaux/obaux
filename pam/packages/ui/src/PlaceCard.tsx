import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from './Badge.js';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { Category } from '@pam/config';
import { BookmarkIcon } from './icons.js';
import { CategoryArt } from './CategoryArt.js';
import { VisitTag } from './VisitTag.js';
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
  /**
   * Its kind, drawn as a small illustration at the top left (D-287). Left
   * out, the card is text only — the layout still holds.
   */
  readonly category?: Category | null;
  /** The place's id, so its picture is chosen the same way every time (D-301). */
  readonly artSeed?: string;
  /** A booked visit, "Oct 7 · 10:00 AM" — the same chip as Saved's (D-305). */
  readonly visitTag?: string | null;
  /** One sentence, from the catalogue. Clipped to two lines. */
  readonly description?: string | null;
  /**
   * Pre-formatted for the member's locale, e.g. "1.2 miles". Build it with
   * `distanceLabel()` from @pam/config; do not interpolate a raw number.
   */
  readonly distanceLabel?: string;
  /**
   * Open or shut, already worded. Pass it only when Pam has hours it is willing
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
  /**
   * Why this place was reported, already worded ("It is closed · 2 reports")
   * — shown to reviewers on the Reported filter only (D-189). A badge in the
   * error tone: this card is a place somebody said is wrong, not one to go to.
   */
  readonly flagLabel?: string | null;
  /**
   * The reviewer's decision controls, rendered under the card body, above
   * the stretched link so they take the tap. Only a super admin gets these.
   */
  readonly flagActions?: ReactNode;
  /**
   * A control in Save's place, top right — a case manager's round check on
   * Connect (D-236). Sits above the card's stretched link, like Save.
   */
  readonly action?: ReactNode;
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
  // Smaller type and more room around it (D-213, Will, 1 October): the
  // redesign's cards read calmer with 24px inside and text a step down.
  name: {
    fontSize: '18px',
    fontWeight: 700,
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
  // Quieter and smaller (Will, 5 October, D-287): open first, in the brand
  // colour with a small dot; the distance after it, grey. The name leads.
  meta: { fontSize: '14px', lineHeight: 1.35, color: colorVars['--color-text-secondary'] },
  open: { fontSize: '14px', lineHeight: 1.35, fontWeight: 500, color: colorVars['--color-text-accent'] },
  shut: { fontSize: '14px', lineHeight: 1.35, fontWeight: 500 },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-text-accent'],
  },
  words: { flexGrow: 1, minWidth: 0 },
  visitRow: { paddingBlockStart: '6px' },
  // The tile sits at the very top left, so the space above it and beside
  // it are the card's one padding (Will, D-287).
  art: { flexShrink: 0, borderRadius: '16px', overflow: 'hidden' },
  description: {
    fontSize: '15px',
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
  actions: { position: 'relative', zIndex: 1, width: '100%' },
  action: { position: 'relative', zIndex: 1, flexShrink: 0 },
  save: {
    position: 'relative',
    zIndex: 1,
    flexShrink: 0,
    minHeight: pam['--pam-touch-target-min'],
    minWidth: pam['--pam-touch-target-min'],
    fontSize: '22px',
    color: colorVars['--color-icon-accent'],
    // The whole 48px stays tappable, but it no longer sets the row's height
    // or pushes the mark below the name (Will, D-287): pulled up and out so
    // the bookmark's middle sits on the name's first line, and its right
    // edge is about as far in as the art's left.
    marginBlock: '-12px',
    marginInlineEnd: '-12px',
  },
});

export function PlaceCard({
  name,
  href,
  category = null,
  artSeed,
  visitTag = null,
  description,
  distanceLabel,
  status,
  audienceLabel,
  isSaved = false,
  onSave,
  flagLabel,
  flagActions,
  action,
  labels,
}: PlaceCardProps) {
  return (
    <Card padding={4} xstyle={styles.card}>
      <VStack gap={3}>
        <HStack gap={3} align="start" wrap="nowrap">
          {category ? (
            <HStack xstyle={styles.art}>
              <CategoryArt category={category} {...(artSeed ? { seed: artSeed } : {})} />
            </HStack>
          ) : null}
          <VStack gap={0.5} xstyle={styles.words}>
            <HStack gap={2} align="start" justify="between" wrap="nowrap">
              <Heading level={3} xstyle={styles.name}>
                <a href={href} {...stylex.props(styles.link)}>
                  {name}
                </a>
              </Heading>
              {/*
                Save is the only control on the card, because it is the only
                answer to the question the card asks. Once saved it is the
                filled mark alone, and the word moves to the accessible name,
                which `aria-pressed` then qualifies.
              */}
              {action ? (
                <HStack xstyle={styles.action}>{action}</HStack>
              ) : onSave ? (
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
              Whether it is open, then how far — the two facts that decide
              whether somebody sets off. Open is in the brand colour; shut is
              not coloured at all, because a red chip on two thirds of a list
              at eight in the evening reads as a screen full of errors.
            */}
            <HStack gap={1.5} align="center" wrap="wrap">
              {status?.isOpen ? <HStack aria-hidden xstyle={styles.dot} /> : null}
              {status ? (
                <Text type={status.isOpen ? 'body' : 'supporting'} xstyle={status.isOpen ? styles.open : styles.shut}>
                  {status.label}
                </Text>
              ) : null}
              {/* The dot is drawn, not read: "Open until 9 PM, 0.2 miles". */}
              {status && distanceLabel ? (
                <Text type="supporting" aria-hidden xstyle={styles.meta}>
                  ·
                </Text>
              ) : null}
              {distanceLabel ? (
                <Text type="supporting" xstyle={styles.meta}>
                  {distanceLabel}
                </Text>
              ) : null}
              {audienceLabel ? <Badge variant="warning" label={audienceLabel} /> : null}
              {flagLabel ? <Badge variant="error" label={flagLabel} /> : null}
            </HStack>
            {visitTag ? (
              <HStack xstyle={styles.visitRow}>
                <VisitTag label={visitTag} />
              </HStack>
            ) : null}
          </VStack>
        </HStack>

        {description ? (
          <Text type="supporting" xstyle={styles.description}>
            {description}
          </Text>
        ) : null}

        {flagActions ? (
          <HStack gap={2} wrap="wrap" xstyle={styles.actions}>
            {flagActions}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}

/**
 * Directions to a place, in Google Maps.
 *
 * No travel mode (Will, 5 October, D-294; it was walking, per §5.1): Maps
 * picks the mode the member last used — the bus, a ride, on foot — instead
 * of Pam deciding for them.
 *
 * Coordinates beat the address when Pam has them: the city's feeds keep
 * geometry current and let address text rot, and a stale address routes
 * somebody to the wrong building. Returns null when there is nothing to route
 * to, so the caller can leave the control out rather than draw a dead one.
 */
export function directionsHref(
  address?: string | null,
  lat?: number | null,
  lon?: number | null,
  placeId?: string | null,
): string | undefined {
  const hasPoint = Number.isFinite(lat) && Number.isFinite(lon);
  const destination = hasPoint ? `${lat},${lon}` : (address ?? null);
  if (!destination) return undefined;
  const q = encodeURIComponent(destination);
  const base = `https://www.google.com/maps/dir/?api=1&destination=${q}`;
  // With Google's place ID too (Will, 5 October, D-291), Maps opens on the
  // place itself — its name, its door — rather than a dropped pin.
  // Google still requires `destination` beside it.
  return placeId ? `${base}&destination_place_id=${encodeURIComponent(placeId)}` : base;
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
