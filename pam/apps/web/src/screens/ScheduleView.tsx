'use client';

import { useMemo, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List, ListItem } from '@astryxdesign/core/List';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ExploreIcon, NoResultsIcon, Page, TripsIcon } from '@pam/ui';
import { SearchField } from '@pam/ui/SearchPill';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { useI18n } from '@/lib/i18n';

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
}

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
  nav: { width: '100%' },
  navMiddle: { flexGrow: 1, minWidth: 0 },
  navLabel: { fontSize: '18px', fontWeight: 600, textAlign: 'center' },
  navCount: { fontSize: '14px', lineHeight: '20px', minHeight: '20px', textAlign: 'center' },
  navButton: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    backgroundColor: colorVars['--color-background-body'],
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
});

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
  initialView = 'day',
}: ScheduleViewProps) {
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
    return (
      <ListItem
        key={a.id}
        href={a.href}
        label={<Text xstyle={styles.label}>{a.firstName}</Text>}
        description={
          <Text type="supporting" xstyle={styles.description}>
            {withDay ? `${fmt.day.format(d)} · ${a.kindLabel}` : a.kindLabel}
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
        endContent={<Avatar size="md" name={a.firstName} tooltip={false} alt="" />}
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
  const rangeTotal =
    view === 'week'
      ? Array.from({ length: 7 }, (_, i) => onDay(addDays(weekFrom, i)).length).reduce((a, b) => a + b, 0)
      : view === 'month'
        ? (() => {
            let n = 0;
            const first = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
            for (let d = first; d.getMonth() === first.getMonth(); d = addDays(d, 1)) n += onDay(d).length;
            return n;
          })()
        : 0;
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
              xstyle={styles.cancel}
            />
          </HStack>
        ) : (
          <LargeTitleHeader
            title={t('schedule.title')}
            actions={
              <>
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
              <SegmentedControl
                label={t('schedule.view.label')}
                value={view}
                onChange={(next) => setView(next as View)}
                layout="fill"
                size="lg"
              >
                <SegmentedControlItem value="day" label={t('schedule.view.day')} />
                <SegmentedControlItem value="week" label={t('schedule.view.week')} />
                <SegmentedControlItem value="month" label={t('schedule.view.month')} />
              </SegmentedControl>
              {/* One header for Day, Week and Month alike (Will, 2 October). */}
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
                <VStack gap={0} align="center" xstyle={styles.navMiddle}>
                  <Text xstyle={styles.navLabel} aria-live="polite">
                    {navLabel}
                  </Text>
                  <Text type="supporting" xstyle={styles.navCount}>
                    {/* Day: who is coming; Week and Month: the total, "0 visits" included (D-244). */}
                    {view === 'day'
                      ? dayList.length > 0
                        ? t('schedule.count', { count: dayList.length })
                        : ' '
                      : t('schedule.total', { count: rangeTotal })}
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
