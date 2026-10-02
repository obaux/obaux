'use client';

import { useMemo, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { NoResultsIcon, OfflineIcon, Page, StarIcon } from '@pam/ui';
import { IconButton } from '@astryxdesign/core/IconButton';
import { PersonRowSkeletonList } from '@pam/ui/Skeletons';
import { SearchPill, type SearchPillItem } from '@pam/ui/SearchPill';
import type { SearchSource } from '@astryxdesign/core/Typeahead';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { PersonRow } from '../app/PersonRow';

/**
 * A staff member's home since the redesign (D-212): their people, under the
 * same search bar a member's Explore has.
 *
 * Will, 1 October: "The case manager view features the list of members on
 * their caseload … the program view features the list of members interested
 * in program", and the bottom bar's first tab reads Home for both. One view
 * serves both — what differs is whose list, and the words — so a case
 * manager and a program admin learn the same screen.
 *
 * The search filters this list as you type and drops down the matching
 * names; picking one opens that person. Nothing leaves the phone for it —
 * the list is already here.
 */
export interface HomePerson {
  readonly id: string;
  readonly firstName: string | null;
  /** Opens the person; omitted for a row with nowhere to go yet. */
  readonly href?: string;
  readonly meta: readonly string[];
  readonly chip?: { readonly label: string; readonly tone: 'error' | 'warning' } | null;
  readonly programBadge?: { readonly name: string; readonly serviceId: string } | null;
}

export type PeopleState =
  | { readonly status: 'loading' }
  | { readonly status: 'ready'; readonly people: readonly HomePerson[] }
  | { readonly status: 'error'; readonly offline: boolean };

export interface PeopleHomeViewProps {
  readonly title: string;
  /** "12 people on your list" — said once the list is in. */
  readonly countLabel: (count: number) => string;
  readonly search: { readonly label: string; readonly placeholder: string; readonly none: string };
  readonly state: PeopleState;
  /** What to say when there is nobody at all, with a way forward. */
  readonly empty: ReactNode;
  /** Under the list — "These are example people". */
  readonly note?: string | null;
  readonly actions?: ReactNode;
  readonly onRetry: () => void;
  readonly onPick: (person: HomePerson) => void;
  readonly supportPhone?: string | null;
  /**
   * A star on each row that opens a person (D-218): a case manager keeps the
   * people they are working with closely under Saved.
   */
  readonly starred?: {
    readonly ids: ReadonlySet<string>;
    readonly onToggle: (person: HomePerson) => void;
  };
  /** Floats above the bottom bar — "Invite someone" (D-218). */
  readonly floating?: ReactNode;
}

interface PersonSuggestion extends SearchPillItem {
  readonly auxiliaryData: HomePerson;
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
  count: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  state: { paddingBlock: '32px' },
  stateIcon: { width: '72px', height: '72px', color: colorVars['--color-icon-accent'] },
  star: { width: '48px', height: '48px', color: colorVars['--color-text-secondary'] },
  starOn: { color: colorVars['--color-icon-accent'] },
});

const matches = (person: HomePerson, text: string) => {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  return [person.firstName ?? '', ...person.meta].some((part) => part.toLowerCase().includes(q));
};

export function PeopleHomeView({
  title,
  countLabel,
  search,
  state,
  empty,
  note,
  actions,
  onRetry,
  onPick,
  supportPhone,
  starred,
  floating,
}: PeopleHomeViewProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState('');
  const [clearSignal, setClearSignal] = useState(0);
  const people = state.status === 'ready' ? state.people : [];
  const shown = people.filter((person) => matches(person, query));

  const searchSource = useMemo<SearchSource<PersonSuggestion>>(
    () => ({
      search: (text) =>
        people
          .filter((person) => matches(person, text))
          .map((person) => ({
            id: person.id,
            label: person.firstName ?? '—',
            ...(person.meta[0] ? { description: person.meta[0] } : {}),
            auxiliaryData: person,
          })),
      bootstrap: () => [],
    }),
    [people],
  );

  return (
    <>
      <Page gap={4}>
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.top}>
          <VStack xstyle={styles.search}>
            <SearchPill<PersonSuggestion>
              label={search.label}
              placeholder={search.placeholder}
              searchSource={searchSource}
              onPick={(item) => onPick(item.auxiliaryData)}
              onQuery={setQuery}
              emptyText={search.none}
              clearLabel={t('explore.search.clear')}
              itemIcon={(item) => <Avatar size="sm" name={item.label} tooltip={false} alt="" />}
              clearSignal={clearSignal}
            />
          </VStack>
          {actions}
        </HStack>

        <VStack gap={1}>
          <Heading level={1} xstyle={styles.heading}>
            {query.trim() ? t('explore.results', { query: query.trim() }) : title}
          </Heading>
          {state.status === 'ready' && people.length > 0 && !query.trim() ? (
            <Text type="supporting" xstyle={styles.count}>
              {countLabel(people.length)}
            </Text>
          ) : null}
        </VStack>

        {state.status === 'loading' ? <PersonRowSkeletonList label={t('common.loading')} /> : null}

        {state.status === 'error' ? (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<OfflineIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
            description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
            // Try again only (Will, 1 October): Help is in the header on every
            // screen; an error state does not need a second way to call.
            actions={<Button label={t('explore.error.retry')} variant="primary" onClick={onRetry} />}
          />
        ) : null}

        {state.status === 'ready' && people.length === 0 ? empty : null}

        {state.status === 'ready' && people.length > 0 && shown.length === 0 ? (
          <EmptyState
            headingLevel={2}
            xstyle={styles.state}
            icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
            title={t('explore.empty.search.title', { query: query.trim() })}
            description={t('home.people.empty.search.body')}
            actions={
              <Button
                label={t('explore.search.clear')}
                variant="primary"
                onClick={() => setClearSignal((n) => n + 1)}
              />
            }
          />
        ) : null}

        {shown.length > 0 ? (
          <VStack gap={3}>
            {shown.map((person) => (
              <PersonRow
                key={person.id}
                firstName={person.firstName}
                {...(person.href ? { href: person.href } : {})}
                chip={person.chip ?? null}
                programBadge={person.programBadge ?? null}
                meta={person.meta}
                trailing={
                  starred ? (
                    <StarToggle
                      isOn={starred.ids.has(person.id)}
                      label={t(starred.ids.has(person.id) ? 'people.unstar' : 'people.star', {
                        name: person.firstName ?? '',
                      })}
                      onToggle={() => starred.onToggle(person)}
                    />
                  ) : undefined
                }
              />
            ))}
            {note ? (
              <Text type="supporting" xstyle={styles.note}>
                {note}
              </Text>
            ) : null}
          </VStack>
        ) : null}
      </Page>
      {/* Outside the page: its motion wrapper would pin a fixed child to itself. */}
      {floating}
    </>
  );
}

/** A star that is a button, said as one (`aria-pressed`). */
export function StarToggle({
  isOn,
  label,
  onToggle,
}: {
  readonly isOn: boolean;
  readonly label: string;
  readonly onToggle: () => void;
}) {
  return (
    <IconButton
      label={label}
      variant="ghost"
      aria-pressed={isOn}
      onClick={onToggle}
      icon={
        <HStack>
          <StarIcon width={26} height={26} isFilled={isOn} aria-hidden />
        </HStack>
      }
      xstyle={[styles.star, isOn && styles.starOn]}
    />
  );
}
