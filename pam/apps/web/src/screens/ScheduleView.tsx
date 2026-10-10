'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@pam/ui/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CheckIcon, NoResultsIcon, Page, TextLink, TripsIcon, textLinkLook } from '@pam/ui';
import { emptyState } from '@pam/ui/emptyState';
import { SignedMark } from './VerifiedBadge';
import { SearchField } from '@pam/ui/SearchPill';
import { DashedRule } from '@pam/ui/DashedRule';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { useI18n } from '@/lib/i18n';
import { isVerified, usePolicies } from '@/lib/usePolicies';
import { checkIn, undoCheckIn, useCheckIns } from '@/lib/checkIns';
import { intlLocale } from '@pam/config';
import { ConfirmDialog } from './ConfirmDialog';

/**
 * A program lead's Home (D-218, Will, 2 October): "a daily calendar view,
 * showing who is showing up at what time, ability to switch to weekly and
 * monthly view, like a scheduling summary for people coming in."
 *
 * - **Day** (the default, today): each person in time order — the time and
 *   how long, their name, what the visit is — one tap from their page.
 * - **Week**: the same rows under each weekday, Monday first, with a count;
 *   a day with nobody says so rather than disappearing.
 * - **Month**: the month as a calendar to pick a day from, and under it the
 *   days that have people coming, with how many — the summary at a glance.
 *   Picking a day opens it in Day.
 *
 * Search (the round button, D-221) finds people *or* times: a first name, a
 * weekday, a date ("Oct 6") or a time ("10:30") — across the whole schedule,
 * not just the page shown — and lists the matches as you type. It appears
 * once there is enough to search: more than ten visits (D-352).
 *
 * Home is modular now (Will, 7 October, D-352): the title centred with the
 * range under it; and while the lead still has getting-started cards to do,
 * the calendar opens **folded** — its top part, fading out, and a button to
 * unfold it — so the cards under it (`below`) are on screen too. The month's
 * list of days is a two-row strip that scrolls sideways, to save the room.
 *
 * `isEmbedded` draws only the calendar, for a page that brings its own
 * frame: the preview a new lead opens from Home.
 */
export interface Appointment {
  readonly id: string;
  readonly personId: string;
  readonly firstName: string;
  readonly startsAt: string;
  readonly minutes: number;
  /** Already in words — "First visit", "Class". */
  readonly kindLabel: string;
  readonly href: string;
}

export type View = 'day' | 'week' | 'month';

export interface ScheduleViewProps {
  readonly appointments: readonly Appointment[];
  /**
   * The bell and the +. A function is handed `openSearch` (or null when there
   * is too little to search), so the + menu can carry Search (D-358).
   */
  readonly actions?: ReactNode | ((openSearch: (() => void) | null) => ReactNode);
  /** Floats above the bottom bar — Invite someone. */
  readonly floating?: ReactNode;
  /** The day the schedule opens on — today, unless a story says otherwise. */
  readonly today?: Date;
  readonly note?: string | null;
  /** Which view it opens on — Day, unless a story says otherwise. */
  readonly initialView?: View;
  /** A circle to check each person in, in place of their avatar (D-316). Programs only, for now. */
  readonly canCheckIn?: boolean;
  /** Open folded, with a button to unfold it (D-352). */
  readonly isCollapsed?: boolean;
  /** Under the header, above the calendar: Home's row of people with something new (D-198). */
  readonly above?: ReactNode;
  /** Under the calendar, on the same page: Home's remaining cards. */
  readonly below?: ReactNode;
  /** The calendar alone, no page or header — for the preview page. */
  readonly isEmbedded?: boolean;
}

/** Search appears past this many visits (D-352): below it, the list is the search. */
export const SEARCH_FROM = 10;

/*
 * The check-in's moment (Will, 6 October, D-316: "a special micro
 * interaction that delights … little confetti bursting out … the button
 * distort shape so it resembles real physics, something fun, but
 * sophisticated"). The circle squashes and springs back like something
 * pressed, and eight bits fly out from behind it and fade. Both are stilled
 * by reduced motion; neither is read out — the row's words say "Checked in".
 */
const squash = stylex.keyframes({
  '0%': { transform: 'scale(1)' },
  '30%': { transform: 'scale(1.22, 0.78)' },
  '55%': { transform: 'scale(0.86, 1.14)' },
  '75%': { transform: 'scale(1.06, 0.96)' },
  '100%': { transform: 'scale(1)' },
});
const fly = stylex.keyframes({
  '0%': { transform: 'translate(0, 0) scale(1)', opacity: 1 },
  '70%': { opacity: 1 },
  '100%': { transform: 'translate(var(--dx), var(--dy)) scale(0.2)', opacity: 0 },
});
const BURST: readonly { readonly dx: number; readonly dy: number; readonly tone: string; readonly size: number }[] = [
  { dx: 30, dy: -26, tone: 'var(--color-data-shamrock-3)', size: 7 },
  { dx: -28, dy: -30, tone: 'var(--color-data-yellow-3)', size: 6 },
  { dx: 36, dy: 6, tone: 'var(--color-data-orange-3)', size: 5 },
  { dx: -36, dy: 4, tone: 'var(--color-data-blue-3)', size: 6 },
  { dx: 22, dy: 32, tone: 'var(--color-data-purple-3)', size: 5 },
  { dx: -20, dy: 34, tone: 'var(--color-data-shamrock-4)', size: 7 },
  { dx: 6, dy: -40, tone: 'var(--color-data-red-3)', size: 5 },
  { dx: -6, dy: 40, tone: 'var(--color-data-yellow-4)', size: 6 },
];

const styles = stylex.create({
  top: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    marginTop: '-12px',
    paddingBlock: '12px 4px',
    backgroundColor: colorVars['--color-background-body'],
  },
  search: { flexGrow: 1, minWidth: 0 },
  cancel: { flexShrink: 0, fontSize: '17px', fontWeight: 600 },
  heading: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700 },
  // Folded (D-352): the calendar's top, fading into the page, so what is
  // under it shows on the same screen. Unfolding grows it smoothly.
  fold: {
    position: 'relative',
    overflow: 'hidden',
    maxHeight: '2400px',
    transitionProperty: 'max-height',
    transitionDuration: '520ms',
    transitionTimingFunction: 'cubic-bezier(0.3, 0.7, 0.2, 1)',
    '@media (prefers-reduced-motion: reduce)': { transitionDuration: '0ms' },
  },
  folded: { maxHeight: '300px' },
  fade: {
    position: 'absolute',
    insetInline: 0,
    bottom: 0,
    height: '96px',
    pointerEvents: 'none',
    backgroundImage: `linear-gradient(to bottom, transparent, ${colorVars['--color-background-body']})`,
  },
  unfold: { width: '100%' },
  // The month's days, two rows scrolling sideways (D-352), the page's edge
  // to edge so a third column peeks in and says there is more.
  strip: {
    display: 'grid',
    gridAutoFlow: 'column',
    gridTemplateRows: 'repeat(2, auto)',
    // A third column shows more of itself (D-355): it reads as more to see.
    gridAutoColumns: '38%',
    columnGap: '16px',
    rowGap: '4px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollPaddingInline: '16px',
    marginInline: '-16px',
    paddingInline: '16px',
    paddingBlockEnd: '4px',
    scrollbarWidth: 'none',
  },
  // Flush under the heading (Will, 7 October): no tint, no box, no inset —
  // the date and its count, left-aligned with the words above. No hover
  // fill, a small radius for the focus ring (D-355).
  tile: {
    width: '100%',
    minHeight: '48px',
    justifyContent: 'flex-start',
    textAlign: 'start',
    paddingInline: '0px',
    paddingBlock: '4px',
    borderRadius: '6px',
    scrollSnapAlign: 'start',
    backgroundColor: { default: 'transparent', ':hover': 'transparent', ':active': 'transparent' },
  },
  // Softer than the section heading above it (D-355).
  tileDay: { fontSize: '15px', fontWeight: 500, lineHeight: 1.3, color: 'inherit' },
  tileCount: { fontSize: '13px', lineHeight: 1.3 },
  dots: { width: '100%', paddingBlockStart: '8px' },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-border'],
    transitionProperty: 'background-color',
    transitionDuration: '160ms',
  },
  dotOn: { backgroundColor: colorVars['--color-text-primary'] },
  // 38px tabs (Will, 7 October, D-355: "small tabs, 38px touch target") —
  // below the 48px floor on his word; see D-355. The theme sizes a small
  // segment from --size-element-sm, so this control alone gets a smaller one.
  // The site-wide floor (globals.css, D-008) is lowered for this control
  // only: 30px segments in a 38px track.
  tabs: { '--size-element-sm': '38px', '--pam-touch-target-min': '30px', height: '38px', fontSize: '14px' },
  // Pulled up under the range (Will, 7 October: "the gap … is too wide").
  nav: { width: '100%', marginBlockStart: '-12px' },
  navMiddle: { flexGrow: 1, minWidth: 0 },
  navLabel: { fontSize: '18px', fontWeight: 600, textAlign: 'center' },
  // Plain arrows, no discs (Will, 6 October, D-323): the title row already
  // has three round buttons; two more under it were the clutter.
  navButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
  },
  dayHeading: { fontSize: '18px', lineHeight: 1.3 },
  centred: { textAlign: 'center' },
  time: { width: '76px', flexShrink: 0 },
  timeText: { fontSize: '17px', fontWeight: 700 },
  length: { fontSize: '14px' },
  row: { minHeight: '72px' },
  // The month's day list, 20% tighter than a person row (72 → 56, on the
  // 4px grid and above the 48px floor) — Will, 3 October (D-244).
  monthRow: { minHeight: '56px' },
  label: { fontSize: '18px', lineHeight: 1.35 },
  description: { fontSize: '15px', lineHeight: 1.4 },
  quiet: { fontSize: '16px' },
  state: { paddingBlock: '32px' },
  // The month grid: seven equal columns across the full width (Will,
  // 2 October: "takes up more space on screen").
  grid: { width: '100%' },
  week: { width: '100%' },
  cell: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  weekday: { fontSize: '14px', textAlign: 'center', paddingBlock: '4px' },
  day: {
    width: '100%',
    minHeight: '56px',
    paddingInline: '0px',
    paddingBlock: '6px',
    borderRadius: '14px',
  },
  dayToday: {
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-icon-accent'],
  },
  dayNumber: { fontSize: '18px', fontWeight: 600, lineHeight: 1.1, color: 'inherit' },
  dayCount: { fontSize: '12px', lineHeight: 1.2, minHeight: '15px', color: 'inherit' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // The name is the link now (a button cannot sit inside one), the rest of
  // the row plain; it reads the same (D-316).
  nameLink: { color: 'inherit', textDecorationLine: 'none' },
  checkWrap: { position: 'relative', flexShrink: 0 },
  check: {
    width: '48px',
    height: '48px',
    minHeight: '48px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    backgroundColor: colorVars['--color-background-body'],
    color: colorVars['--color-text-secondary'],
    transitionProperty: 'background-color, border-color, color',
    transitionDuration: '160ms',
  },
  checkOn: {
    borderColor: colorVars['--color-accent'],
    backgroundColor: colorVars['--color-accent'],
    color: colorVars['--color-on-accent'],
  },
  checkSquash: {
    animationName: squash,
    animationDuration: '520ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0.9, 0.3, 1.2)',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  burst: { position: 'absolute', inset: 0, pointerEvents: 'none', overflow: 'visible' },
  bit: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    borderRadius: '2px',
    marginTop: '-3px',
    marginLeft: '-3px',
    animationName: fly,
    animationDuration: '640ms',
    animationTimingFunction: 'cubic-bezier(0.15, 0.7, 0.3, 1)',
    animationFillMode: 'both',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none', opacity: 0 },
  },
  bitPlace: (dx: number, dy: number, tone: string, size: number) => ({
    '--dx': `${dx}px`,
    '--dy': `${dy}px`,
    width: `${size}px`,
    height: `${size}px`,
    backgroundColor: tone,
  }),
});

/**
 * The circle beside a visit (D-316): tap when the person arrives. Checked, it
 * fills green, bursts, and says "Checked in" in a small tip; tapped again it
 * asks before taking it back — an arrival is a fact, undone on purpose.
 */
function CheckInButton({
  id,
  name,
  isChecked,
  t,
  tPlain,
}: {
  id: string;
  name: string;
  isChecked: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
  /** For the button's accessible name, which a screen reader speaks: no isolates (D-435). */
  tPlain: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [burst, setBurst] = useState(0);
  const [isTipOpen, setTipOpen] = useState(false);
  const [isAsking, setAsking] = useState(false);
  useEffect(() => {
    if (!isTipOpen) return;
    const timer = setTimeout(() => setTipOpen(false), 1600);
    return () => clearTimeout(timer);
  }, [isTipOpen]);
  return (
    <HStack xstyle={styles.checkWrap}>
      <Tooltip content={t('schedule.checkedIn')} isOpen={isTipOpen} placement="above">
        <IconButton
          label={tPlain(isChecked ? 'schedule.checkin.undo' : 'schedule.checkin.do', { name })}
          variant="ghost"
          aria-pressed={isChecked}
          icon={<CheckIcon width={24} height={24} aria-hidden />}
          onClick={() => {
            if (isChecked) {
              setAsking(true);
              return;
            }
            checkIn(id);
            setBurst((n) => n + 1);
            setTipOpen(true);
          }}
          xstyle={[styles.check, isChecked && styles.checkOn, burst > 0 && styles.checkSquash]}
        />
      </Tooltip>
      {burst > 0 ? (
        <HStack key={burst} aria-hidden xstyle={styles.burst}>
          {BURST.map((b, i) => (
            <HStack key={i} xstyle={[styles.bit, styles.bitPlace(b.dx, b.dy, b.tone, b.size)]} />
          ))}
        </HStack>
      ) : null}
      {/*
        Pam's own "are you sure" (D-234), not Astryx's AlertDialog, which
        always opens with Keep it chosen (D-411: nothing chosen until the
        person chooses).
      */}
      <ConfirmDialog
        isOpen={isAsking}
        title={t('schedule.checkin.undo.title', { name })}
        body={t('schedule.checkin.undo.body')}
        confirmLabel={t('schedule.checkin.undo.confirm')}
        onConfirm={() => {
          undoCheckIn(id);
          setAsking(false);
        }}
        cancelLabel={t('schedule.checkin.undo.keep')}
        onCancel={() => setAsking(false)}
      />
    </HStack>
  );
}

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
/** Monday of the week `d` is in. */
const weekStart = (d: Date) => addDays(startOfDay(d), -((d.getDay() + 6) % 7));
const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function ScheduleView({
  appointments,
  actions,
  floating,
  today = new Date(),
  note,
  // A program lead opens on the week (Will, 5 October, D-267).
  initialView = 'week',
  canCheckIn = false,
  isCollapsed = false,
  above,
  below,
  isEmbedded = false,
}: ScheduleViewProps) {
  const [isFolded, setFolded] = useState(isCollapsed);
  const [stripPage, setStripPage] = useState(0);
  const checkIns = useCheckIns();
  const { t, tPlain, locale } = useI18n();
  const [view, setView] = useState<View>(initialView);
  const [anchor, setAnchor] = useState(() => startOfDay(today));
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' }),
      weekdayLong: new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long' }),
      day: new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' }),
      dayLong: new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'long', day: 'numeric' }),
      monthDay: new Intl.DateTimeFormat(intlLocale(locale), { month: 'short', day: 'numeric' }),
      // The month grid's seven columns are about 40px each at 320px. Arabic's
      // short weekday is the whole word ("الخميس"), which overlaps its
      // neighbour, so it is the single letter every Arabic calendar uses
      // there (D-422); the day's full name is on its button for a screen reader.
      weekdayNarrow: new Intl.DateTimeFormat(intlLocale(locale), { weekday: locale === 'ar' ? 'narrow' : 'short' }),
      month: new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', year: 'numeric' }),
    }),
    [locale],
  );

  const { policies } = usePolicies();
  const sorted = useMemo(() => [...appointments].sort((a, b) => a.startsAt.localeCompare(b.startsAt)), [appointments]);

  /** Everything a person might type to find this visit. */
  const haystack = (a: Appointment) => {
    const d = new Date(a.startsAt);
    const time = fmt.time.format(d);
    return [
      a.firstName,
      a.kindLabel,
      fmt.weekdayLong.format(d),
      fmt.day.format(d),
      fmt.monthDay.format(d),
      time,
      time.replace(/\s?[AP]M$/i, ''),
    ]
      .join(' ')
      .toLowerCase();
  };
  const q = query.trim().toLowerCase();
  const found = q ? sorted.filter((a) => haystack(a).includes(q)) : [];

  const onDay = (d: Date) => sorted.filter((a) => sameDay(new Date(a.startsAt), d));

  const row = (a: Appointment, withDay = false) => {
    const d = new Date(a.startsAt);
    const isChecked = Boolean(checkIns[a.id]);
    const kind = withDay ? `${fmt.day.format(d)} · ${a.kindLabel}` : a.kindLabel;
    return (
      <ListItem
        key={a.id}
        // With a check-in circle, the name carries the link (a button cannot
        // sit inside one); otherwise the whole row does.
        {...(canCheckIn ? {} : { href: a.href })}
        label={
          // A light-green signature for someone who has signed every policy
          // (D-316, D-261); which ones is on their page.
          <HStack gap={2} align="center" wrap="nowrap">
            {canCheckIn ? (
              <a href={a.href} {...stylex.props(styles.label, styles.nameLink)}>
                {a.firstName}
              </a>
            ) : (
              <Text xstyle={styles.label}>{a.firstName}</Text>
            )}
            {isVerified(a.personId, policies) ? (
              <HStack role="img" aria-label={t('verified.short')}>
                <SignedMark />
              </HStack>
            ) : null}
          </HStack>
        }
        description={
          <Text type="supporting" xstyle={styles.description}>
            {/* Said plainly either way (Will, D-316): "Not checked in" / "Checked in". */}
            {canCheckIn ? `${kind} · ${t(isChecked ? 'schedule.checkedIn' : 'schedule.notCheckedIn')}` : kind}
          </Text>
        }
        startContent={
          <VStack gap={0} xstyle={styles.time}>
            <Text xstyle={styles.timeText}>{fmt.time.format(d)}</Text>
            <Text type="supporting" xstyle={styles.length}>
              {t('schedule.minutes', { minutes: a.minutes })}
            </Text>
          </VStack>
        }
        endContent={
          canCheckIn ? (
            <CheckInButton id={a.id} name={a.firstName} isChecked={isChecked} t={t} tPlain={tPlain} />
          ) : (
            <Avatar size="md" name={a.firstName} tooltip={false} alt="" />
          )
        }
        xstyle={styles.row}
      />
    );
  };

  const step = (direction: 1 | -1) => {
    if (view === 'day') setAnchor((d) => addDays(d, direction));
    else if (view === 'week') setAnchor((d) => addDays(d, 7 * direction));
    else setAnchor((d) => new Date(d.getFullYear(), d.getMonth() + direction, 1));
  };

  const weekFrom = weekStart(anchor);
  const navLabel =
    view === 'day'
      ? sameDay(anchor, today)
        ? `${t('schedule.today')} · ${fmt.dayLong.format(anchor)}`
        : fmt.dayLong.format(anchor)
      : view === 'week'
        ? `${fmt.monthDay.format(weekFrom)} – ${fmt.monthDay.format(addDays(weekFrom, 6))}`
        : fmt.month.format(anchor);

  const dayList = onDay(anchor);
  // Folded, the week shows only its days with people (D-352), so the part
  // above the fold is visits, not "Nobody booked"; unfolded, all seven.
  const allWeek = Array.from({ length: 7 }, (_, i) => addDays(weekFrom, i));
  const busyWeek = allWeek.filter((d) => onDay(d).length > 0);
  const weekDays = isFolded && busyWeek.length > 0 ? busyWeek : allWeek;
  const monthDays = (() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const days: { date: Date; count: number }[] = [];
    for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) {
      const count = onDay(d).length;
      if (count > 0) days.push({ date: d, count });
    }
    return days;
  })();
  // Two rows, so a column holds two days; about two columns show at once.
  const stripPages = Math.max(1, Math.ceil(Math.ceil(monthDays.length / 2) / 2));

  const calendar = (
    <>
    <VStack gap={3}>
      {/* The range is picked beside the title (D-320); one header for
          Day, Week and Month alike (Will, 2 October). */}
      <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.nav}>
        <IconButton
          label={t(`schedule.prev.${view}`)}
          variant="ghost"
          onClick={() => step(-1)}
          icon={<Icon icon="chevronLeft" size="md" />}
          xstyle={styles.navButton}
        />
        {/*
          The date, and under it how many are coming in, small (Will,
          3 October, D-236). The second line keeps its height in every
          view, so the date and the arrows never move when Day, Week
          and Month change places.
        */}
        {/* The date alone (D-323): each day's heading already counts who is coming. */}
        <VStack gap={0} align="center" xstyle={styles.navMiddle}>
          <Text xstyle={styles.navLabel} aria-live="polite">
            {navLabel}
          </Text>
        </VStack>
        <IconButton
          label={t(`schedule.next.${view}`)}
          variant="ghost"
          onClick={() => step(1)}
          icon={<Icon icon="chevronRight" size="md" />}
          xstyle={styles.navButton}
        />
      </HStack>
      {/* A dashed rule between the arrows and what they page through (D-356). */}
      <DashedRule />
    </VStack>

    {view === 'day' ? (
      dayList.length > 0 ? (
        <List aria-label={navLabel}>{dayList.map((a) => row(a))}</List>
      ) : (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<TripsIcon {...stylex.props(emptyState.icon)} aria-hidden />}
          title={t('schedule.none.title')}
          description={t('schedule.none.body')}
          {...(sameDay(anchor, today)
            ? {}
            : {
                actions: (
                  <Button
                    label={t('schedule.today')}
                    variant="secondary"
                    onClick={() => setAnchor(startOfDay(today))}
                  />
                ),
              })}
        />
      )
    ) : null}

    {view === 'week' ? (
      <VStack gap={4}>
        {weekDays.map((d) => {
          const list = onDay(d);
          return (
            <VStack key={iso(d)} gap={1}>
              <HStack gap={2} align="center" justify="between">
                <Heading level={2} xstyle={styles.dayHeading}>
                  {sameDay(d, today) ? `${t('schedule.today')} · ${fmt.day.format(d)}` : fmt.day.format(d)}
                </Heading>
                <Text type="supporting" xstyle={styles.quiet}>
                  {list.length > 0 ? t('schedule.count', { count: list.length }) : t('schedule.week.none')}
                </Text>
              </HStack>
              {list.length > 0 ? <List aria-label={fmt.day.format(d)}>{list.map((a) => row(a))}</List> : null}
            </VStack>
          );
        })}
      </VStack>
    ) : null}

    {view === 'month' ? (
      // More room between the calendar and the list under it (D-244).
      <VStack gap={8}>
        <MonthGrid
          month={anchor}
          today={today}
          selected={anchor}
          countOn={(d) => onDay(d).length}
          weekdayLabel={(d) => fmt.weekdayNarrow.format(d)}
          dayLabel={(d, count) =>
            count > 0 ? `${fmt.dayLong.format(d)}, ${t('schedule.count', { count })}` : fmt.dayLong.format(d)
          }
          onPick={(d) => {
            setAnchor(d);
            setView('day');
          }}
        />
        {/* A dashed rule between the calendar and its list, the heading
            centred, more room under it (Will, 7 October, D-356). */}
        <VStack gap={5}>
          <DashedRule />
          <Heading level={2} xstyle={[styles.dayHeading, styles.centred]}>
            {t('schedule.month.days')}
          </Heading>
          {/* Two rows scrolling sideways (D-352): a month's busy days in the room of four. */}
          <VStack
            role="list"
            aria-label={t('schedule.month.days')}
            xstyle={styles.strip}
            onScroll={(e: React.UIEvent<HTMLElement>) => {
              const el = e.currentTarget;
              const room = el.scrollWidth - el.clientWidth;
              setStripPage(room > 0 ? Math.round((Math.abs(el.scrollLeft) / room) * (stripPages - 1)) : 0);
            }}
          >
            {monthDays.map(({ date, count }) => (
              <VStack key={iso(date)} role="listitem">
                <Button
                  label={`${fmt.day.format(date)}, ${t('schedule.count', { count })}`}
                  variant="ghost"
                  onClick={() => {
                    setAnchor(date);
                    setView('day');
                  }}
                  xstyle={styles.tile}
                >
                  <VStack gap={0} align="start">
                    <Text xstyle={styles.tileDay}>{fmt.day.format(date)}</Text>
                    <Text type="supporting" xstyle={styles.tileCount}>
                      {t('schedule.count', { count })}
                    </Text>
                  </VStack>
                </Button>
              </VStack>
            ))}
          </VStack>
          {/* Where you are in the strip (D-355): one dot a screenful. */}
          {stripPages > 1 ? (
            <HStack gap={1.5} justify="center" aria-hidden xstyle={styles.dots}>
              {Array.from({ length: stripPages }, (_, i) => (
                <HStack key={i} xstyle={[styles.dot, i === stripPage && styles.dotOn]} />
              ))}
            </HStack>
          ) : null}
        </VStack>
      </VStack>
    ) : null}
    </>
  );

  /*
   * Folded (D-352): the calendar's top, fading out, and a button under it to
   * see all of it — so a lead with cards still to do sees both on one screen.
   */
  const folded = isCollapsed ? (
    <VStack gap={2}>
      <VStack gap={4} xstyle={[styles.fold, isFolded && styles.folded]}>
        {calendar}
        {isFolded ? <HStack aria-hidden xstyle={styles.fade} /> : null}
      </VStack>
      {/* A link, not a filled button (Will, 7 October): it shows more of
          this screen rather than doing something. */}
      <HStack justify="center" xstyle={styles.unfold}>
        <TextLink label={t(isFolded ? 'schedule.unfold' : 'schedule.fold')} onClick={() => setFolded(!isFolded)} />
      </HStack>
    </VStack>
  ) : (
    calendar
  );

  if (isEmbedded) return calendar;

  return (
    <>
      <Page gap={4}>
        {/*
          The bar (D-221, Will, 2 October): the title large, and three round
          buttons — search, the bell, and + (Invite someone, Add a program).
          Search opens a field across the top with Cancel, as on Messages,
          instead of a search bar always taking the room.
        */}
        {isSearching ? (
          <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.top}>
            <VStack xstyle={styles.search}>
              <SearchField
                label={t('schedule.search.label')}
                placeholder={t('schedule.search.placeholder')}
                value={query}
                onChange={setQuery}
                hasAutoFocus
              />
            </VStack>
            <Button
              label={t('messages.search.cancel')}
              variant="ghost"
              onClick={() => {
                setIsSearching(false);
                setQuery('');
              }}
              xstyle={[styles.cancel, textLinkLook.link]}
            />
          </HStack>
        ) : (
          <LargeTitleHeader
            title={t('schedule.title')}
            titleAccessory={
              // Day, Week, Month as small tabs (Will, 7 October, D-355): the
              // title is read out but not drawn — the tabs say what this is.
              <SegmentedControl
                label={t('schedule.view.label')}
                value={view}
                onChange={(next) => setView(next as View)}
                size="sm"
                xstyle={styles.tabs}
              >
                <SegmentedControlItem value="day" label={t('schedule.tab.day')} />
                <SegmentedControlItem value="week" label={t('schedule.tab.week')} />
                <SegmentedControlItem value="month" label={t('schedule.tab.month')} />
              </SegmentedControl>
            }
            isTitleHidden
            isCentered
            actions={
              <>
                {/* Search lives in the + menu now (D-358); past ten visits. */}
                {typeof actions === 'function'
                  ? actions(appointments.length > SEARCH_FROM ? () => setIsSearching(true) : null)
                  : actions}
              </>
            }
          />
        )}

        {!isSearching && !q ? above : null}

        {q ? (
          <VStack gap={2}>
            <Heading level={1} xstyle={styles.heading}>
              {t('schedule.search.results', { query: query.trim() })}
            </Heading>
            {found.length > 0 ? (
              <List aria-label={t('schedule.title')}>{found.map((a) => row(a, true))}</List>
            ) : (
              <EmptyState
                headingLevel={2}
                xstyle={styles.state}
                icon={<NoResultsIcon {...stylex.props(emptyState.icon)} aria-hidden />}
                title={t('schedule.search.none')}
                description={t('schedule.search.empty.body')}
                actions={<Button label={t('explore.search.clear')} variant="primary" onClick={() => setQuery('')} />}
              />
            )}
          </VStack>
        ) : (
          folded
        )}

        {note ? (
          <Text type="supporting" xstyle={styles.note}>
            {note}
          </Text>
        ) : null}
        {below}
      </Page>
      {/* Outside the page: its motion wrapper would pin a fixed child to itself. */}
      {floating}
    </>
  );
}

/**
 * The month as seven equal columns, Monday first, filling the width (D-218).
 * Each day is one button: its number, and under it how many are coming in.
 * The day being looked at is filled; today has a ring — two separate marks
 * that never overlap, unlike the stock calendar's (Will: "wonky").
 */
function MonthGrid({
  month,
  today,
  selected,
  countOn,
  weekdayLabel,
  dayLabel,
  onPick,
}: {
  readonly month: Date;
  readonly today: Date;
  readonly selected: Date;
  readonly countOn: (d: Date) => number;
  readonly weekdayLabel: (d: Date) => string;
  readonly dayLabel: (d: Date, count: number) => string;
  readonly onPick: (d: Date) => void;
}) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1);
  const start = weekStart(first);
  const weeks: Date[][] = [];
  for (let w = start; w.getMonth() === first.getMonth() || w < first; w = addDays(w, 7)) {
    weeks.push(Array.from({ length: 7 }, (_, i) => addDays(w, i)));
  }
  return (
    <VStack gap={1} xstyle={styles.grid} role="grid">
      <HStack gap={1} wrap="nowrap" xstyle={styles.week} role="row">
        {weeks[0]!.map((d) => (
          <VStack key={iso(d)} xstyle={styles.cell} role="columnheader">
            <Text type="supporting" xstyle={styles.weekday}>
              {weekdayLabel(d)}
            </Text>
          </VStack>
        ))}
      </HStack>
      {weeks.map((week) => (
        <HStack key={iso(week[0]!)} gap={1} wrap="nowrap" xstyle={styles.week} role="row">
          {week.map((d) => {
            const inMonth = d.getMonth() === first.getMonth();
            const count = inMonth ? countOn(d) : 0;
            const isSelected = sameDay(d, selected);
            return (
              <VStack key={iso(d)} xstyle={styles.cell} role="gridcell">
                {inMonth ? (
                  <Button
                    label={dayLabel(d, count)}
                    variant={isSelected ? 'primary' : 'ghost'}
                    aria-current={sameDay(d, today) ? 'date' : undefined}
                    aria-pressed={isSelected}
                    onClick={() => onPick(d)}
                    xstyle={[styles.day, sameDay(d, today) && !isSelected && styles.dayToday]}
                  >
                    <VStack gap={0.5} align="center">
                      <Text xstyle={styles.dayNumber}>{d.getDate()}</Text>
                      <Text xstyle={styles.dayCount}>{count > 0 ? String(count) : ''}</Text>
                    </VStack>
                  </Button>
                ) : null}
              </VStack>
            );
          })}
        </HStack>
      ))}
    </VStack>
  );
}
