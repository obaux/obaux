'use client';

import { useMemo, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Calendar } from '@astryxdesign/core/Calendar';
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
import { NoResultsIcon, Page, TripsIcon } from '@pam/ui';
import { SearchPill, type SearchPillItem } from '@pam/ui/SearchPill';
import type { SearchSource } from '@astryxdesign/core/Typeahead';
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
 * The search bar finds people *or* times: a first name, a weekday, a date
 * ("Oct 6") or a time ("10:30") — across the whole schedule, not just the
 * page shown — and drops down the matches as you type.
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

interface Suggestion extends SearchPillItem {
  readonly auxiliaryData: Appointment;
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
  heading: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700 },
  nav: { width: '100%' },
  navLabel: { fontSize: '18px', fontWeight: 600, textAlign: 'center', flexGrow: 1 },
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
  count: { fontSize: '16px' },
  dayHeading: { fontSize: '18px', lineHeight: 1.3 },
  time: { width: '76px', flexShrink: 0 },
  timeText: { fontSize: '17px', fontWeight: 700 },
  length: { fontSize: '14px' },
  row: { minHeight: '72px' },
  label: { fontSize: '18px', lineHeight: 1.35 },
  description: { fontSize: '15px', lineHeight: 1.4 },
  quiet: { fontSize: '16px' },
  state: { paddingBlock: '32px' },
  stateIcon: { width: '64px', height: '64px', color: colorVars['--color-icon-accent'] },
  calendar: { alignSelf: 'center' },
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
  const [clearSignal, setClearSignal] = useState(0);

  const fmt = useMemo(
    () => ({
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }),
      weekdayLong: new Intl.DateTimeFormat(locale, { weekday: 'long' }),
      day: new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' }),
      dayLong: new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' }),
      monthDay: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }),
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

  const searchSource = useMemo<SearchSource<Suggestion>>(
    () => ({
      search: (text) => {
        const needle = text.trim().toLowerCase();
        if (!needle) return [];
        return sorted
          .filter((a) => haystack(a).includes(needle))
          .slice(0, 8)
          .map((a) => ({
            id: a.id,
            label: a.firstName,
            description: `${fmt.day.format(new Date(a.startsAt))} · ${fmt.time.format(new Date(a.startsAt))}`,
            auxiliaryData: a,
          }));
      },
      bootstrap: () => [],
    }),
    [sorted, fmt],
  );

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
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.top}>
          <VStack xstyle={styles.search}>
            <SearchPill<Suggestion>
              label={t('schedule.search.label')}
              placeholder={t('schedule.search.placeholder')}
              searchSource={searchSource}
              onPick={(item) => {
                const d = startOfDay(new Date(item.auxiliaryData.startsAt));
                setAnchor(d);
                setView('day');
                setClearSignal((n) => n + 1);
              }}
              onQuery={setQuery}
              emptyText={t('schedule.search.none')}
              clearLabel={t('explore.search.clear')}
              itemIcon={(item) => <Avatar size="sm" name={item.label} tooltip={false} alt="" />}
              clearSignal={clearSignal}
            />
          </VStack>
          {actions}
        </HStack>

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
                actions={
                  <Button
                    label={t('explore.search.clear')}
                    variant="primary"
                    onClick={() => setClearSignal((n) => n + 1)}
                  />
                }
              />
            )}
          </VStack>
        ) : (
          <>
            <VStack gap={3}>
              <Heading level={1} xstyle={styles.heading}>
                {t('schedule.title')}
              </Heading>
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
              {/* Month has the calendar's own arrows; a second pair would be the same control twice. */}
              {view === 'month' ? null : (
                <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.nav}>
                  <IconButton
                    label={t(`schedule.prev.${view}`)}
                    variant="ghost"
                    onClick={() => step(-1)}
                    icon={<Icon icon="chevronLeft" size="md" />}
                    xstyle={styles.navButton}
                  />
                  <Text xstyle={styles.navLabel} aria-live="polite">
                    {navLabel}
                  </Text>
                  <IconButton
                    label={t(`schedule.next.${view}`)}
                    variant="ghost"
                    onClick={() => step(1)}
                    icon={<Icon icon="chevronRight" size="md" />}
                    xstyle={styles.navButton}
                  />
                </HStack>
              )}
            </VStack>

            {view === 'day' ? (
              dayList.length > 0 ? (
                <VStack gap={1}>
                  <Text type="supporting" xstyle={styles.count}>
                    {t('schedule.count', { count: dayList.length })}
                  </Text>
                  <List aria-label={navLabel}>{dayList.map((a) => row(a))}</List>
                </VStack>
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
              <VStack gap={4}>
                <VStack xstyle={styles.calendar}>
                  <Calendar
                    value={iso(anchor) as never}
                    focusDate={iso(new Date(anchor.getFullYear(), anchor.getMonth(), 1)) as never}
                    onFocusDateChange={(next: string) => {
                      const [y, m] = next.split('-').map(Number);
                      setAnchor(new Date(y!, (m ?? 1) - 1, 1));
                    }}
                    onChange={(next: unknown) => {
                      if (typeof next !== 'string') return;
                      const [y, m, d] = next.split('-').map(Number);
                      setAnchor(new Date(y!, (m ?? 1) - 1, d ?? 1));
                      setView('day');
                    }}
                    weekStartsOn="mon"
                    hasVariableRowCount
                  />
                </VStack>
                <VStack gap={1}>
                  <Heading level={2} xstyle={styles.dayHeading}>
                    {t('schedule.month.days')}
                  </Heading>
                  <List aria-label={t('schedule.month.days')}>
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
                        xstyle={styles.row}
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
