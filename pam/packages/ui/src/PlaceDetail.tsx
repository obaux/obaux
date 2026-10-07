'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge, type BadgeVariant } from '@astryxdesign/core/Badge';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Button } from '@astryxdesign/core/Button';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, ClockIcon, FlagIcon, PhoneIcon, PlacesIcon, ShareIcon } from './icons.js';
import { BigButton } from './BigButton.js';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';
import { pam } from './tokens.stylex.js';
import { textLinkLook } from './TextLink.js';
import { MenuList, type MenuItem } from './MenuList.js';
import { AutoHeight, TextSwap } from './Swap.js';

/**
 * One place, on its own screen.
 *
 * The card in the list answers "is this worth my time". This answers the
 * question that follows — *how do I actually get there and get in* — which is
 * the one Pam exists for, and which was previously squeezed into three
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
   * Today, as an index into `weekLines` (0 is Sunday, as `Date.getDay()`).
   * From the browser's clock, so null until it has run (D-309): the hours
   * row then says only "Opening hours", never a day guessed at build time.
   */
  readonly todayIndex?: number | null;
  /** The hours row's label, "Hours: Monday" (D-309, Will, 6 October). */
  readonly hoursRowLabel?: string | null;
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
  /**
   * Round buttons under the name (D-224, Will, 2 October): Website, Message,
   * Call, Open in Google — each an icon in a circle with a word under it.
   * Given, they replace the long column of action rows; save, share and
   * report move to the screen's bar.
   */
  readonly quickActions?: readonly QuickAction[];
  /** Shown at the foot of the hours card — "Check hours on Google" (D-224). */
  readonly quickActionsLabel?: string;
  /**
   * Under the name and the open/closed line, above the round buttons: what
   * a member still has to do before a visit (D-271, `PolicyStatusCard`).
   */
  readonly notice?: ReactNode;
  /**
   * After the rows, before About: what the program offers as services
   * (D-313) — the page's own card, drawn here so it sits in the order a
   * member reads the place.
   */
  readonly extra?: ReactNode;
  /**
   * `chooseFirst` (D-313): before a visit is booked, what the program
   * offers comes first — `extra` (the services to pick from, or when a
   * drop-in program meets), then About, then the address, then the rows. The default keeps
   * the rows first, for a place with a visit booked and for staff.
   */
  readonly layout?: 'default' | 'chooseFirst';
  /**
   * At the right end of the open/closed row (D-335): who you'll meet there,
   * a `StaffBadge`, once a visit is booked.
   */
  readonly statusAside?: ReactNode;
  /**
   * The address before "What this place is" (D-273): with a visit booked,
   * where it is matters more than what it is — the member already decided.
   */
  readonly addressFirst?: boolean;
  readonly labels: {
    readonly directions: string;
    readonly call: string;
    readonly website: string;
    readonly hours: string;
    /** "Today", beside today's line in the week (D-309). */
    readonly today?: string;
    readonly hoursOnGoogle: string;
    readonly about: string;
    readonly address: string;
    readonly save: string;
    readonly saved: string;
    readonly share: string;
    readonly flag: string;
  };
}

export interface QuickAction {
  readonly id: string;
  readonly label: string;
  readonly icon: ReactNode;
  readonly href: string;
  /** Opens in a new tab — a website, Google. */
  readonly isExternal?: boolean;
  /** A line under the label — what the row does (D-291). */
  readonly description?: string;
  /** Something new behind it — "New message" (D-305). */
  readonly hasDot?: boolean;
  /** Its second line kept to one line — a message preview (D-306). */
  readonly isDescriptionOneLine?: boolean;
}

function categoryBadgeVariant(category: Category): BadgeVariant {
  return CATEGORY_DEFINITIONS[category].colorToken as BadgeVariant;
}

const styles = stylex.create({
  card: { width: '100%' },
  // A line under the open/closed line (Will, D-313): the place's head
  // ends, and what it offers begins.
  statusWords: { flexGrow: 1, minWidth: 0 },
  rule: { width: '100%', height: '1px', backgroundColor: colorVars['--color-border'], flexShrink: 0 },
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
    minHeight: pam['--pam-touch-target-min'],
    justifyContent: 'flex-start',
    fontSize: '17px',
  },
  rows: { rowGap: spacingVars['--spacing-2'] },
  hoursLink: { alignSelf: 'flex-start', minHeight: pam['--pam-touch-target-min'], fontSize: '16px', paddingInline: '0px' },
  // The week drawer (D-309).
  // Clear of the sheet's handle above the title.
  sheet: { paddingInline: '24px', paddingBlock: '20px 24px' },
  sheetTitle: { fontSize: '22px', lineHeight: 1.25 },
  dayLine: { minHeight: '44px', paddingInline: '12px', borderRadius: '12px' },
  todayLine: { backgroundColor: colorVars['--color-background-muted'] },
  todayTag: { fontSize: '13px', fontWeight: 600, color: colorVars['--color-text-accent'] },
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
  statusAside,
  weekLines,
  todayIndex = null,
  hoursRowLabel = null,
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
  quickActions,
  quickActionsLabel,
  notice,
  extra,
  layout = 'default',
  addressFirst = false,
  labels,
}: PlaceDetailProps) {
  const [isWeekOpen, setWeekOpen] = useState(false);
  const aboutCard = description ? (
    <Card padding={4} xstyle={styles.card}>
      <AutoHeight>
        <TextSwap token={`${labels.about}|${description}`}>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.section}>
              {labels.about}
            </Heading>
            <Text xstyle={styles.body}>{description}</Text>
          </VStack>
        </TextSwap>
      </AutoHeight>
    </Card>
  ) : null;
  // The words may change under the reader's eyes when a service is
  // picked (D-313): revealed anew, and the card eases to its new height.
  const addressCard = address ? (
    <Card padding={4} xstyle={styles.card}>
      <AutoHeight>
        <TextSwap token={`${labels.address}|${address}`}>
          <VStack gap={1}>
            <Heading level={2} xstyle={styles.section}>
              {labels.address}
            </Heading>
            <Text type="supporting" xstyle={styles.body}>
              {address}
            </Text>
          </VStack>
        </TextSwap>
      </AutoHeight>
    </Card>
  ) : null;

  const hoursCard =
    weekLines && weekLines.length > 0 ? (
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
        {/* Where to check them, under the hours themselves (D-224). */}
        {quickActions && hoursHref ? (
          <Button
            label={labels.hoursOnGoogle}
            variant="ghost"
            href={hoursHref}
            target="_blank"
            rel="noreferrer"
            icon={<PlacesIcon />}
            // A link, not a pill (Will, 5 October, D-280).
            xstyle={[styles.hoursLink, textLinkLook.link]}
          />
        ) : null}
      </VStack>
    </Card>
  ) : null;

  /*
   * Hours as a row among the quick actions (Will, 6 October, D-309):
   * "Hours: Monday" with today's times under it — not whether it is open,
   * which the line under the name already says — and the whole week one
   * tap away in a drawer. Today comes from the browser's clock, the same
   * one that says open or closed, and moves on at midnight.
   */
  const today = todayIndex !== null && weekLines ? (weekLines[todayIndex] ?? null) : null;
  const hasWeek = Boolean(quickActions && weekLines && weekLines.length > 0);
  const hoursRow: MenuItem | null = hasWeek
    ? {
        id: 'hours',
        label: today && hoursRowLabel ? hoursRowLabel : labels.hours,
        icon: <ClockIcon width={26} height={26} aria-hidden />,
        onSelect: () => setWeekOpen(true),
        ...(today ? { description: today.hours } : {}),
      }
    : null;
  const quickItems: MenuItem[] = (quickActions ?? []).map((action) => ({
    id: action.id,
    label: action.label,
    icon: action.icon,
    href: action.href,
    ...(action.description ? { description: action.description } : {}),
    ...(action.isExternal ? { isExternal: true } : {}),
    ...(action.hasDot ? { hasDot: true } : {}),
    ...(action.isDescriptionOneLine ? { isDescriptionOneLine: true } : {}),
  }));
  // Right after directions: where it is, then when it is open.
  if (hoursRow) quickItems.splice(quickItems[0]?.id === 'directions' ? 1 : 0, 0, hoursRow);

  const weekSheet = hasWeek ? (
    <BottomSheet isOpen={isWeekOpen} onOpenChange={setWeekOpen} label={labels.hours} height="hug">
      {isWeekOpen ? (
        <VStack gap={3} xstyle={styles.sheet}>
          {/* The sheet draws its own Close; a second one would be two. */}
          <Heading level={2} xstyle={styles.sheetTitle}>
            {labels.hours}
          </Heading>
          <VStack gap={0.5}>
            {weekLines!.map((line, index) => {
              const isToday = index === todayIndex;
              return (
                <HStack
                  key={line.day}
                  gap={3}
                  align="center"
                  justify="between"
                  wrap="nowrap"
                  xstyle={[styles.dayLine, isToday && styles.todayLine]}
                >
                  <VStack gap={0}>
                    <Text xstyle={[styles.dayRow, isToday && styles.today]}>{line.day}</Text>
                    {isToday && labels.today ? <Text xstyle={styles.todayTag}>{labels.today}</Text> : null}
                  </VStack>
                  <Text type={isToday ? 'body' : 'supporting'} xstyle={[styles.dayRow, isToday && styles.today]}>
                    {line.hours}
                  </Text>
                </HStack>
              );
            })}
          </VStack>
          {/* Said whenever the hours are a stand-in (see the hours card below). */}
          {hoursArePlaceholder && placeholderNote ? (
            <Text type="supporting" xstyle={styles.note}>
              {placeholderNote}
            </Text>
          ) : null}
          {hoursHref ? (
            <Button
              label={labels.hoursOnGoogle}
              variant="ghost"
              href={hoursHref}
              target="_blank"
              rel="noreferrer"
              icon={<PlacesIcon />}
              xstyle={[styles.hoursLink, textLinkLook.link]}
            />
          ) : null}
        </VStack>
      ) : null}
    </BottomSheet>
  ) : null;

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
        <HStack gap={2} align="center" wrap="nowrap">
          <HStack gap={2} align="center" wrap="wrap" xstyle={styles.statusWords}>
          {distanceLabel ? (
            <Text type="supporting" xstyle={styles.meta}>
              {distanceLabel}
            </Text>
          ) : null}
          {status ? (
            <Text type={status.isOpen ? 'body' : 'supporting'} xstyle={status.isOpen ? styles.open : styles.shut}>
              {status.label}
            </Text>
          ) : null}
          </HStack>
          {statusAside ?? null}
        </HStack>
      </VStack>

      {status ? <VStack aria-hidden xstyle={styles.rule} /> : null}

      {notice ?? null}

      {/*
        What to do about this place, as rows (Will, 5 October, D-291): "Get
        directions" first, then message — the same row as "My connections"
        on Messages, icon, words, a line under them, a chevron. A row says
        what it does; a circle with a word under it only names it.
      */}
      {layout === 'chooseFirst' ? (
        <>
          {extra ?? null}
          {aboutCard}
          {addressCard}
          {quickActions && quickActions.length > 0 ? (
            <Card padding={1} xstyle={styles.card}>
              <MenuList label={quickActionsLabel ?? ''} hasDividers items={quickItems} />
            </Card>
          ) : null}
          {weekSheet}
        </>
      ) : (
        <>
          {quickActions && quickActions.length > 0 ? (
            <Card padding={1} xstyle={styles.card}>
              <MenuList label={quickActionsLabel ?? ''} hasDividers items={quickItems} />
            </Card>
          ) : null}
          {weekSheet}
          {extra ?? null}

          {/* With a visit booked, where and when come before what it is (D-273, D-281). */}
          {addressFirst ? addressCard : null}
          {addressFirst && !hasWeek ? hoursCard : null}
          {aboutCard}
        </>
      )}

      {/*
        How to get there, the one primary action on a screen whose reader is
        not a member (§2.5). A member's "Plan a trip" is the page's footer
        now (D-326), not drawn here, and directions sit among the rows.
      */}
      {directionsHref ? <BigButton label={labels.directions} href={directionsHref} /> : null}

      {addressFirst || layout === 'chooseFirst' ? null : addressCard}

      {addressFirst || hasWeek ? null : hoursCard}

      {quickActions ? null : (
        <VStack gap={2} xstyle={styles.rows}>
          {phone ? <ActionRow label={labels.call} icon={<PhoneIcon />} href={`tel:${phone}`} onClick={onCall} /> : null}
          {hoursHref ? (
            <ActionRow label={labels.hoursOnGoogle} icon={<PlacesIcon />} href={hoursHref} target="_blank" />
          ) : null}
          {website ? <ActionRow label={labels.website} icon={<PlacesIcon />} href={website} target="_blank" /> : null}
          {onSave ? (
            <ActionRow
              label={isSaved ? labels.saved : labels.save}
              icon={<BookmarkIcon isFilled={isSaved} />}
              onClick={onSave}
            />
          ) : null}
          {onShare ? <ActionRow label={labels.share} icon={<ShareIcon />} onClick={onShare} /> : null}
          {/*
          Reporting a place is how the catalogue stays true — a place that has
          closed or moved is the single most expensive error Pam can make, and
          the member standing outside it is the only one who knows. Behind a
          "⋯" it was never going to be used.
        */}
          {flagHref ? <ActionRow label={labels.flag} icon={<FlagIcon />} href={flagHref} /> : null}
        </VStack>
      )}
    </VStack>
  );
}
