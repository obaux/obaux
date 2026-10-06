'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { AlertDialog } from '@astryxdesign/core/AlertDialog';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { DropdownMenu, DropdownMenuRadioGroup, DropdownMenuRadioItem } from '@astryxdesign/core/DropdownMenu';
import { Text } from '@astryxdesign/core/Text';
import { Tooltip } from '@astryxdesign/core/Tooltip';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CheckIcon, ExploreIcon, NoResultsIcon, Page, SignIcon, TripsIcon, textLinkLook } from '@pam/ui';
import { SearchField } from '@pam/ui/SearchPill';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { useI18n } from '@/lib/i18n';
import { isVerified, usePolicies } from '@/lib/usePolicies';
import { checkIn, undoCheckIn, useCheckIns } from '@/lib/checkIns';

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
 * not just the page shown — and lists the matches as you type.
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
  /** The bell and Help. */
  readonly actions?: ReactNode;
  /** Floats above the bottom bar — Invite someone. */
  readonly floating?: ReactNode;
  /** The day the schedule opens on — today, unless a story says otherwise. */
  readonly today?: Date;
  readonly note?: string | null;
  /** Which view it opens on — Day, unless a story says otherwise. */
  readonly initialView?: View;
  /** A circle to check each person in, in place of their avatar (D-316). Programs only, for now. */
  readonly canCheckIn?: boolean;
}

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
  // White with a thin grey edge, like the bell (D-216).
  round: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  heading: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700 },
  // "Coming in  this week ▾" (Will, 6 October, D-320): the range is a word
  // beside the title, underlined, with a chevron — a dropdown, not a bar
  // of three tabs taking a row of its own.
  range: {
    minHeight: '48px',
    paddingInline: '4px',
    fontSize: '22px',
    lineHeight: 1.2,
    fontWeight: 500,
    color: colorVars['--color-text-primary'],
    // The underline is painted just under the words (a border would sit at
    // the foot of the 48px target): Astryx's button resets text-decoration
    // on the words inside it.
    backgroundImage: `linear-gradient(${colorVars['--color-border']}, ${colorVars['--color-border']})`,
    backgroundRepeat: 'no-repeat',
    backgroundSize: 'calc(100% - 8px) 2px',
    backgroundPosition: '4px calc(50% + 16px)',
  },
  rangeOption: { minHeight: '48px', fontSize: '17px', paddingInlineEnd: '24px' },
  nav: { width: '100%' },
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
  stateIcon: { width: '64px', height: '64px', color: colorVars['--color-icon-accent'] },
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
  // A light-green signature: every policy signed (D-316, was a tick, D-261).
  signed: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-success-muted'],
    color: colorVars['--color-success'],
  },
  signedIcon: { width: '14px', height: '14px' },
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
}: {
  id: string;
  name: string;
  isChecked: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
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
          label={t(isChecked ? 'schedule.checkin.undo' : 'schedule.checkin.do', { name })}
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
      <AlertDialog
        isOpen={isAsking}
        onOpenChange={setAsking}
        title={t('schedule.checkin.undo.title', { name })}
        description={t('schedule.checkin.undo.body')}
        cancelLabel={t('schedule.checkin.undo.keep')}
        actionLabel={t('schedule.checkin.undo.confirm')}
        onAction={() => {
          undoCheckIn(id);
          setAsking(false);
        }}
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
}: ScheduleViewProps) {
  const checkIns = useCheckIns();
  const { t, locale } = useI18n();
  const [view, setView] = useState<View>(initialView);
  const [anchor, setAnchor] = useState(() => startOfDay(today));
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      day: new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      dayLong: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
      monthDay: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
      weekdayNarrow: new Intl.DateTimeFormat(locale, { weekday: 'short' }),
      month: new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }),
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
              <HStack align="center" justify="center" xstyle={styles.signed} role="img" aria-label={t('verified.short')}>
                <SignIcon {...stylex.props(styles.signedIcon)} aria-hidden />
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
            <CheckInButton id={a.id} name={a.firstName} isChecked={isChecked} t={t} />
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
  const monthDays = (() => {
    const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    const days: { date: Date; count: number }[] = [];
    for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) {
      const count = onDay(d).length;
      if (count > 0) days.push({ date: d, count });
    }
    return days;
  })();

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
              <DropdownMenu
                button={{
                  label: t(`schedule.range.${view}`),
                  'aria-label': `${t('schedule.view.label')}: ${t(`schedule.range.${view}`)}`,
                  variant: 'ghost',
                  size: 'sm',
                  xstyle: styles.range,
                }}
                placement="below"
                alignment="start"
              >
                <DropdownMenuRadioGroup label={t('schedule.view.label')} value={view} onChange={(next) => setView(next as View)}>
                  <DropdownMenuRadioItem value="day" label={t('schedule.range.day')} xstyle={styles.rangeOption} />
                  <DropdownMenuRadioItem value="week" label={t('schedule.range.week')} xstyle={styles.rangeOption} />
                  <DropdownMenuRadioItem value="month" label={t('schedule.range.month')} xstyle={styles.rangeOption} />
                </DropdownMenuRadioGroup>
              </DropdownMenu>
            }
            isAccessoryInline
            actions={
              <>
                {/* Search only where there is a week or a month to search (D-323). */}
                {view === 'day' ? null : (
                  <IconButton
                    label={t('schedule.search.label')}
                    variant="ghost"
                    icon={
                      <HStack>
                        <ExploreIcon width={22} height={22} aria-hidden />
                      </HStack>
                    }
                    onClick={() => setIsSearching(true)}
                    xstyle={styles.round}
                  />
                )}
                {actions}
              </>
            }
          />
        )}

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
                icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
                title={t('schedule.search.none')}
                description={t('schedule.search.empty.body')}
                actions={<Button label={t('explore.search.clear')} variant="primary" onClick={() => setQuery('')} />}
              />
            )}
          </VStack>
        ) : (
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
            </VStack>

            {view === 'day' ? (
              dayList.length > 0 ? (
                <List aria-label={navLabel}>{dayList.map((a) => row(a))}</List>
              ) : (
                <EmptyState
                  headingLevel={2}
                  xstyle={styles.state}
                  icon={<TripsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
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
                {Array.from({ length: 7 }, (_, i) => addDays(weekFrom, i)).map((d) => {
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
                <VStack gap={1}>
                  <Heading level={2} xstyle={styles.dayHeading}>
                    {t('schedule.month.days')}
                  </Heading>
                  <List aria-label={t('schedule.month.days')} density="compact">
                    {monthDays.map(({ date, count }) => (
                      <ListItem
                        key={iso(date)}
                        label={<Text xstyle={styles.label}>{fmt.day.format(date)}</Text>}
                        onClick={() => {
                          setAnchor(date);
                          setView('day');
                        }}
                        endContent={
                          <HStack gap={2} align="center" wrap="nowrap">
                            <Text type="supporting" xstyle={styles.quiet}>
                              {t('schedule.count', { count })}
                            </Text>
                            <Icon icon="chevronRight" size="md" />
                          </HStack>
                        }
                        xstyle={styles.monthRow}
                      />
                    ))}
                  </List>
                </VStack>
              </VStack>
            ) : null}
          </>
        )}

        {note ? (
          <Text type="supporting" xstyle={styles.note}>
            {note}
          </Text>
        ) : null}
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
