'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge, type BadgeVariant } from './Badge.js';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { sheet } from './sheet.js';
import { Button } from './Button.js';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ClockIcon, PlacesIcon } from './icons.js';
import { CATEGORY_DEFINITIONS, type Category } from '@pam/config';
import { pam } from './tokens.stylex.js';
import { textLinkLook } from './TextLink.js';
import { CopyButton } from './CopyButton.js';
import { AppleMapsAppIcon, GoogleMapsAppIcon } from './MapAppIcons.js';
import { MenuList, type MenuItem } from './MenuList.js';
import { devicePlatform, mapsLaunchFor, openAppOrStore, type DevicePlatform } from './mapsLaunch.js';
import { AutoHeight, TextSwap } from './Swap.js';
import { landFocus, landFocusStyle } from './landFocus.js';

/**
 * One place, on its own screen: the place profile.
 *
 * The card in the list answers "is this worth my time". This answers the
 * question that follows — *how do I actually get there and get in* — which is
 * the one Pam exists for.
 *
 * The order is the order somebody needs it in:
 *
 *   1. What it is, and who it is for, and whether it is open. A badge saying "In
 *      a school" belongs before the phone number: it decides whether the rest of
 *      the screen is relevant at all.
 *   2. The list of ways to reach it (`quickActions`): directions, the hours,
 *      a message, a call, the website.
 *   3. The address, with a small copy button and "Open in…" (D-439), and the hours.
 *
 * **The one primary action is not drawn here: it is the page's sticky footer**
 * ("Schedule a visit" for a member, "How to get there" for everybody else), so it
 * stays under the thumb however far the page is read. Save, share and report are
 * in the screen's bar (D-224). The older column of labelled action rows that sat
 * under the hours, and the in-page "How to get there" button, are gone (Will, 10
 * October 2026: "retire the rows layout, only use place profiles with sticky
 * footer buttons", D-440).
 *
 * The component takes rendered strings and callbacks, no data layer: it is the
 * same shape whether the row came from the places search or a saved list.
 */
export interface PlaceDetailProps {
  readonly category: Category;
  readonly categoryLabel: string;
  readonly description?: string | null;
  readonly address?: string | null;
  /**
   * Ways to take the address somewhere (Will, 9 October 2026: "easily copied
   * into Google Maps or Apple Maps to help them navigate"): a small copy button
   * beside the heading, and "Open in…", which opens a drawer to choose Google
   * Maps or Apple Maps. Left out, the card is only the words.
   */
  readonly addressActions?: {
    /** Google Maps and Apple Maps, behind "Open in…". Either may be absent; with neither, no link. */
    readonly googleMapsHref?: string | null;
    readonly appleMapsHref?: string | null;
    readonly labels: {
      /** "Copy address", the button's name. */
      readonly copy: string;
      /** "Address copied". */
      readonly copied: string;
      /** "Could not copy. Press and hold the address to copy it." */
      readonly copyFailed: string;
      /** "Open in…": said after the address, which is the link, so a screen reader hears what it does. */
      readonly openIn: string;
      /** "Open in", the drawer's title. */
      readonly openInTitle: string;
      /** "Google Maps" and "Apple Maps": the apps' names in the person's language. */
      readonly googleMaps: string;
      readonly appleMaps: string;
      /** "Opens in app", the small line under each app's name. */
      readonly opensInApp: string;
    };
  };
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
  readonly hoursHref?: string | null;
  /**
   * The list under the name (D-224, Will, 2 October): Get directions, the hours,
   * Message, Call, Website — an icon, a word and a note, each one a link. Save,
   * share and report are in the screen's bar. Left out (a decorative preview),
   * there is no list.
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
    readonly hours: string;
    /** "Today", beside today's line in the week (D-309). */
    readonly today?: string;
    readonly hoursOnGoogle: string;
    readonly about: string;
    readonly address: string;
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
  section: { fontSize: '17px' },
  body: { fontSize: '17px', lineHeight: 1.5 },
  addressText: { unicodeBidi: 'plaintext', userSelect: 'text', overflowWrap: 'anywhere' },
  // The address as a link that opens the "Open in" drawer (Will, 10 October
  // 2026: "make the address a hyperlink"). Underlined and in the accent colour
  // always — a touch screen has no hover to say it can be tapped — and set
  // like the plain address it replaces: left, wrapping, in its own direction.
  addressLink: {
    width: '100%',
    justifyContent: 'flex-start',
    textAlign: 'start',
    fontSize: '17px',
    lineHeight: 1.5,
    fontWeight: 400,
    minHeight: pam['--pam-touch-target-min'],
    paddingInline: '0px',
    unicodeBidi: 'plaintext',
    color: colorVars['--color-text-accent'],
    textDecorationLine: 'underline',
  },
  meta: { fontSize: '16px' },
  open: { fontSize: '17px', fontWeight: 600, color: colorVars['--color-text-accent'] },
  shut: { fontSize: '17px', fontWeight: 600 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  /** A row of the week. Tabular so the times line up down the column. */
  dayRow: { fontSize: '16px', fontVariantNumeric: 'tabular-nums' },
  today: { fontWeight: 700 },
  hoursLink: { alignSelf: 'flex-start', minHeight: pam['--pam-touch-target-min'], fontSize: '16px', paddingInline: '0px' },
  // The "Open in…" drawer: a 48px app symbol, then the app's name, the whole row a link.
  appIcon: { width: '48px', height: '48px', fontSize: '48px', flexShrink: 0 },
  // The week drawer (D-309).
  // Clear of the sheet's handle above the title.
  sheet: { paddingInline: '24px', paddingBlock: '20px 24px' },
  // "Open in": a quiet label above the apps, not a heading to read first
  // (Will, 10 October 2026: "much smaller").
  sheetTitle: { fontSize: '15px', lineHeight: 1.3, fontWeight: 600, color: colorVars['--color-text-secondary'] },
  dayLine: { minHeight: '44px', paddingInline: '12px', borderRadius: '12px' },
  todayLine: { backgroundColor: colorVars['--color-background-muted'] },
  todayTag: { fontSize: '13px', fontWeight: 600, color: colorVars['--color-text-accent'] },
});

export function PlaceDetail({
  category,
  categoryLabel,
  description,
  address,
  addressActions,
  status,
  statusAside,
  weekLines,
  todayIndex = null,
  hoursRowLabel = null,
  hoursArePlaceholder = false,
  placeholderNote,
  audienceLabel,
  hoursHref,
  quickActions,
  quickActionsLabel,
  notice,
  extra,
  layout = 'default',
  addressFirst = false,
  labels,
}: PlaceDetailProps) {
  const [isWeekOpen, setWeekOpen] = useState(false);
  const [isMapsOpen, setMapsOpen] = useState(false);
  // Which phone this is decides how an app is opened, and whether there is one
  // (D-439). Known only in the browser, so the first paint is the computer's.
  const [platform, setPlatform] = useState<DevicePlatform>('other');
  useEffect(() => {
    setPlatform(devicePlatform(navigator.userAgent, navigator.maxTouchPoints));
  }, []);
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
            <HStack align="center" justify="between" wrap="nowrap" gap={2}>
              <Heading level={2} xstyle={styles.section}>
                {labels.address}
              </Heading>
              {addressActions ? (
                <CopyButton
                  placement="inCard"
                  text={address}
                  label={addressActions.labels.copy}
                  copiedLabel={addressActions.labels.copied}
                  failedLabel={addressActions.labels.copyFailed}
                />
              ) : null}
            </HStack>
            {/* The address reads in its own direction, not the screen's: in
                Arabic an English street address was reordered, its number
                jumping to the far end. */}
            {addressActions && (addressActions.googleMapsHref || addressActions.appleMapsHref) ? (
              // The address is itself the way to a maps app: it opens the
              // "Open in" drawer. Its spoken name says so after the address.
              <Button
                variant="ghost"
                label={address}
                aria-label={`${address}. ${addressActions.labels.openIn}`}
                aria-haspopup="dialog"
                // Its own direction, from its own first letter: `unicode-bidi` on
                // the button does not reach the label inside it, `dir` does.
                dir="auto"
                onClick={() => setMapsOpen(true)}
                xstyle={[textLinkLook.link, styles.addressLink]}
              />
            ) : (
              // Plain text, so it can be selected and copied by hand.
              <Text type="supporting" xstyle={[styles.body, styles.addressText]}>
                {address}
              </Text>
            )}
          </VStack>
        </TextSwap>
      </AutoHeight>
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
    <BottomSheet isOpen={isWeekOpen} onOpenChange={setWeekOpen} label={labels.hours} height="hug" xstyle={sheet.panel}>
      {isWeekOpen ? (
        <VStack gap={3} {...landFocus} xstyle={[styles.sheet, landFocusStyle.quiet]}>
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

  // "Open in…" (Will, 9 October 2026): the two maps apps as app symbols in
  // square frames, each a plain link that hands the address to that app.
  // An app a phone has no version of (Apple Maps on Android) is not offered.
  const mapApps = addressActions
    ? [
        { id: 'google' as const, href: addressActions.googleMapsHref, name: addressActions.labels.googleMaps, icon: <GoogleMapsAppIcon /> },
        { id: 'apple' as const, href: addressActions.appleMapsHref, name: addressActions.labels.appleMaps, icon: <AppleMapsAppIcon /> },
      ].flatMap((app) => {
        const launch = app.href ? mapsLaunchFor(app.id, app.href, platform) : null;
        return launch ? [{ ...app, launch }] : [];
      })
    : [];
  const mapsSheet =
    addressActions && mapApps.length > 0 ? (
      <BottomSheet
        isOpen={isMapsOpen}
        onOpenChange={setMapsOpen}
        label={addressActions.labels.openInTitle}
        height="hug"
        xstyle={sheet.panel}
      >
        {isMapsOpen ? (
          <VStack gap={2} {...landFocus} xstyle={[styles.sheet, landFocusStyle.quiet]}>
            <Heading level={2} xstyle={styles.sheetTitle}>
              {addressActions.labels.openInTitle}
            </Heading>
            <MenuList
              label={addressActions.labels.openInTitle}
              items={mapApps.map((app) => {
                const { launch } = app;
                const row = {
                  id: app.id,
                  label: app.name,
                  description: addressActions.labels.opensInApp,
                  icon: <HStack xstyle={styles.appIcon}>{app.icon}</HStack>,
                };
                // A phone that may not have the app tries it and, failing that,
                // opens the store (mapsLaunch.ts): a button, because only script
                // can tell. Every other row is a plain link.
                return launch.tryApp
                  ? {
                      ...row,
                      onSelect: () => {
                        openAppOrStore(launch.tryApp!.appUrl, launch.tryApp!.storeUrl);
                        setMapsOpen(false);
                      },
                    }
                  : { ...row, href: launch.href, isExternal: launch.isExternal };
              })}
            />
          </VStack>
        ) : null}
      </BottomSheet>
    ) : null;

  return (
    <VStack gap={4}>
      <VStack gap={2}>
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
              <MenuList label={quickActionsLabel ?? ''} hasDividers isInset items={quickItems} />
            </Card>
          ) : null}
          {weekSheet}
        </>
      ) : (
        <>
          {quickActions && quickActions.length > 0 ? (
            <Card padding={1} xstyle={styles.card}>
              <MenuList label={quickActionsLabel ?? ''} hasDividers isInset items={quickItems} />
            </Card>
          ) : null}
          {weekSheet}
          {extra ?? null}

          {/* With a visit booked, where and when come before what it is (D-273, D-281). */}
          {addressFirst ? addressCard : null}
          {aboutCard}
        </>
      )}

      {addressFirst || layout === 'chooseFirst' ? null : addressCard}

      {mapsSheet}
    </VStack>
  );
}
