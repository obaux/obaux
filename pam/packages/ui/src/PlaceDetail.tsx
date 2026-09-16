'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { Button } from '@astryxdesign/core/Button';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, FlagIcon, PhoneIcon, PlacesIcon, ShareIcon } from './icons.js';
import { BigButton } from './BigButton.js';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';
import { pam } from './tokens.stylex.js';

/**
 * One place, on its own screen.
 *
 * The card in the list answers "is this worth my time". This answers the
 * question that follows — *how do I actually get there and get in* — which is
 * the one PAM exists for, and which was previously squeezed into three
 * equal-width buttons and a corner menu.
 *
 * The order is the order somebody needs it in:
 *
 *   1. What it is, and who it is for. A badge saying "In a school" belongs
 *      above the phone number, not below it: it decides whether the rest of
 *      the screen is relevant at all.
 *   2. **Getting there** — the primary action, and the only primary one (§2.5).
 *      Directions, because the distance is why they opened this.
 *   3. Calling, the hours, the website: the things you check before setting off.
 *   4. Share and report, as full-width rows with words on them rather than
 *      icons behind a menu (Will, 16 September). Reporting a place that has
 *      closed is how the catalogue stays true, and hiding it behind a "⋯"
 *      guaranteed nobody would.
 *
 * The component takes rendered strings and callbacks, no data layer: it is the
 * same shape whether the row came from the places search or a saved list.
 */
export interface PlaceDetailProps {
  /**
   * Only rendered when the screen has no title of its own. The place page puts
   * the name in `PageTitle`, beside the way back — two headings saying the same
   * thing is two headings a screen reader reads out.
   */
  readonly name?: string;
  readonly category: Category;
  readonly categoryLabel: string;
  readonly description?: string | null;
  readonly address?: string | null;
  readonly distanceLabel?: string | null;
  /** Already worded: "Open until 5:00pm", "Closed · opens 9:00am". */
  readonly status?: { readonly isOpen: boolean; readonly label: string } | null;
  /**
   * The week, already formatted per line ("Monday  9:00am – 5:00pm"). Empty or
   * omitted and the section does not render.
   */
  readonly weekLines?: readonly { readonly day: string; readonly hours: string }[];
  /**
   * True when the hours above are a stand-in rather than the place's own. The
   * screen says so, plainly, rather than letting a demo look like a promise.
   */
  readonly hoursArePlaceholder?: boolean;
  readonly placeholderNote?: string;
  readonly audienceLabel?: string | null;
  readonly phone?: string | null;
  readonly website?: string | null;
  readonly directionsHref?: string | null;
  readonly hoursHref?: string | null;
  readonly isSaved?: boolean;
  readonly onSave?: () => void;
  readonly onCall?: () => void;
  readonly onShare?: () => void;
  readonly flagHref?: string;
  readonly labels: {
    readonly directions: string;
    readonly call: string;
    readonly website: string;
    readonly hours: string;
    readonly hoursOnGoogle: string;
    readonly about: string;
    readonly address: string;
    readonly save: string;
    readonly saved: string;
    readonly share: string;
    readonly flag: string;
  };
}

function categoryBadgeVariant(category: Category): BadgeVariant {
  return CATEGORY_DEFINITIONS[category].colorToken as BadgeVariant;
}

const styles = stylex.create({
  card: { width: '100%' },
  name: { fontSize: '26px', lineHeight: 1.2 },
  section: { fontSize: '17px' },
  body: { fontSize: '17px', lineHeight: 1.5 },
  meta: { fontSize: '16px' },
  open: { fontSize: '17px', fontWeight: 600, color: colorVars['--color-text-accent'] },
  shut: { fontSize: '17px', fontWeight: 600 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  /** A row of the week. Tabular so the times line up down the column. */
  dayRow: { fontSize: '16px', fontVariantNumeric: 'tabular-nums' },
  today: { fontWeight: 700 },
  /*
   * The quieter actions. Full width and labelled, in a column — not a row of
   * three, which is what made them shrink until only an icon fitted.
   */
  row: {
    width: '100%',
    minHeight: pam.touchTargetMin,
    justifyContent: 'flex-start',
    fontSize: '17px',
  },
  rows: { rowGap: spacingVars['--spacing-2'] },
});

/** One labelled row in the "more" column, so the four of them cannot drift. */
function ActionRow({
  label,
  icon,
  href,
  onClick,
  target,
}: {
  label: string;
  icon: ReactNode;
  href?: string;
  onClick?: () => void;
  target?: string;
}) {
  return (
    <Button
      label={label}
      icon={icon}
      variant="secondary"
      href={href}
      clickAction={onClick}
      onClick={href ? undefined : onClick}
      target={target}
      rel={target === '_blank' ? 'noreferrer' : undefined}
      xstyle={styles.row}
    />
  );
}

export function PlaceDetail({
  name,
  category,
  categoryLabel,
  description,
  address,
  distanceLabel,
  status,
  weekLines,
  hoursArePlaceholder = false,
  placeholderNote,
  audienceLabel,
  phone,
  website,
  directionsHref,
  hoursHref,
  isSaved = false,
  onSave,
  onCall,
  onShare,
  flagHref,
  labels,
}: PlaceDetailProps) {
  return (
    <VStack gap={4}>
      <VStack gap={2}>
        {name ? (
          <Heading level={1} xstyle={styles.name}>
            {name}
          </Heading>
        ) : null}
        {/*
          Who it is for comes before anything else on the screen. A member who
          cannot use this place should learn that here, not after they have
          read the phone number and worked out the bus.
        */}
        <HStack gap={2} align="center" wrap="wrap">
          <Badge variant={categoryBadgeVariant(category)} label={categoryLabel} />
          {audienceLabel ? <Badge variant="warning" label={audienceLabel} /> : null}
        </HStack>
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
        </HStack>
      </VStack>

      {description ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.section}>
              {labels.about}
            </Heading>
            <Text xstyle={styles.body}>{description}</Text>
          </VStack>
        </Card>
      ) : null}

      {/*
        The one primary action on the screen (§2.5). Getting there is why
        somebody opened a place rather than reading the card.
      */}
      {directionsHref ? <BigButton label={labels.directions} href={directionsHref} /> : null}

      {address ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={1}>
            <Heading level={2} xstyle={styles.section}>
              {labels.address}
            </Heading>
            <Text type="supporting" xstyle={styles.body}>
              {address}
            </Text>
          </VStack>
        </Card>
      ) : null}

      {weekLines && weekLines.length > 0 ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.section}>
              {labels.hours}
            </Heading>
            <VStack gap={1}>
              {weekLines.map((line) => (
                <HStack key={line.day} gap={3} justify="between" wrap="nowrap">
                  <Text xstyle={styles.dayRow}>{line.day}</Text>
                  <Text type="supporting" xstyle={styles.dayRow}>
                    {line.hours}
                  </Text>
                </HStack>
              ))}
            </VStack>
            {/*
              Said out loud, on the screen, whenever the hours are a stand-in.
              A demo that looks exactly like the real thing is how a partner
              ends up reading their own opening times off a screen that made
              them up.
            */}
            {hoursArePlaceholder && placeholderNote ? (
              <Text type="supporting" xstyle={styles.note}>
                {placeholderNote}
              </Text>
            ) : null}
          </VStack>
        </Card>
      ) : null}

      <VStack gap={2} xstyle={styles.rows}>
        {phone ? (
          <ActionRow label={labels.call} icon={<PhoneIcon />} href={`tel:${phone}`} onClick={onCall} />
        ) : null}
        {hoursHref ? (
          <ActionRow
            label={labels.hoursOnGoogle}
            icon={<PlacesIcon />}
            href={hoursHref}
            target="_blank"
          />
        ) : null}
        {website ? (
          <ActionRow label={labels.website} icon={<PlacesIcon />} href={website} target="_blank" />
        ) : null}
        {onSave ? (
          <ActionRow
            label={isSaved ? labels.saved : labels.save}
            icon={<BookmarkIcon isFilled={isSaved} />}
            onClick={onSave}
          />
        ) : null}
        {onShare ? (
          <ActionRow label={labels.share} icon={<ShareIcon />} onClick={onShare} />
        ) : null}
        {/*
          Reporting a place is how the catalogue stays true — a place that has
          closed or moved is the single most expensive error PAM can make, and
          the member standing outside it is the only one who knows. Behind a
          "⋯" it was never going to be used.
        */}
        {flagHref ? <ActionRow label={labels.flag} icon={<FlagIcon />} href={flagHref} /> : null}
      </VStack>
    </VStack>
  );
}
