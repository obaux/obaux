'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@pam/ui/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, Notice, OfflineIcon, Page, StarIcon } from '@pam/ui';
import { SegmentedControl } from '@astryxdesign/core/SegmentedControl';
import { Segment } from '@pam/ui/Segment';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { whenLastActive } from '@/lib/caseloadLabels';
import { useStarredPeople } from '@/lib/useStarredPeople';
import { useCaseload } from '@/lib/useCaseload';
import { PersonRow } from '../app/PersonRow';
import { StarToggle } from './PeopleHomeView';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { emptyState } from '@pam/ui/emptyState';
import { SavedGrid } from '@pam/ui/SavedGrid';
import { PlaceCardSkeletonList } from '@pam/ui/Skeletons';
import { categoryLabelKey, NOTICES, intlLocale } from '@pam/config';
import { BigCategoryIcon, CategoryPicture } from './CategoryPicture';

export { BigCategoryIcon, CategoryPicture };
import { useNextVisits, visitTagLabel, type NextVisit } from '@/lib/useNextVisits';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useSavedPlaces, type SavedPlacesState } from '@/lib/useSavedPlaces';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { ConfirmDialog } from './ConfirmDialog';
import { useLeaveGuard } from '@/lib/useLeaveGuard';
import { navigate } from '@/lib/navigate';

/**
 * Saved, on the tab-screen frame (D-213, from Will's references of 1
 * October): the large title that shrinks as the grid scrolls, places two to
 * a row — a square picture (a placeholder: the category, until places have
 * photos), the name under it. **Edit** at the top right puts a × on each
 * picture to unsave it; **Done** ends that.
 */
export interface SavedViewProps {
  readonly state: SavedPlacesState;
  readonly onUnsave: (id: string) => void;
  readonly headerActions?: ReactNode;
  readonly failed?: boolean;
  readonly supportPhone?: string | null;
  /** On the title's line — a case manager's People / Programs switch (D-218, D-233). */
  readonly switcher?: ReactNode;
  /** Drawn instead of the saved places — a case manager's starred people. */
  readonly replace?: ReactNode;
  /** Where "show me places" goes from the empty state: Explore, or All programs for staff. */
  readonly browseHref?: string;
  /**
   * Edit, run by the screen (D-255): on or off, whether anything has been
   * removed yet (Done turns primary), and whether there is anything to edit.
   */
  readonly edit: {
    readonly isOn: boolean;
    readonly isDirty: boolean;
    readonly isAvailable: boolean;
    readonly onEdit: () => void;
    readonly onDone: () => void;
  };
  /** Removed in Edit and not yet confirmed: hidden until Done, or put back. */
  readonly hidden?: ReadonlySet<string>;
  /** A member's next visit at each place, by place id (D-292). */
  readonly visits?: Readonly<Record<string, NextVisit>>;
}


const styles = stylex.create({
  // The People / Programs switch as one round pill, like the search bar and
  // the chips (Will, 3 October, D-233); its two segments are rounded in
  // globals.css, which Astryx's segment has no prop for.
  pills: { borderRadius: '999px', flexShrink: 0 },
  edit: {
    minHeight: '48px',
    borderRadius: '999px',
    paddingInline: '20px',
    fontSize: '17px',
  },
  // Edit, and Done with nothing removed: white with a grey edge, like the
  // round header buttons. Done with something removed is the primary fill.
  editQuiet: {
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  state: { paddingBlock: '48px' },
  count: { fontSize: '16px' },
  // A star tapped off in Edit, waiting for Done (D-255).
  waiting: { opacity: 0.5 },
});

export function SavedView({
  state,
  onUnsave,
  headerActions,
  failed,
  supportPhone,
  switcher,
  replace,
  browseHref = '/',
  edit,
  hidden,
  visits = {},
}: SavedViewProps) {
  const { t, tPlain, locale } = useI18n();
  // "Wed, Oct 7 · 10:00 AM", the trip card's own form.
  const all = state.status === 'ready' && !replace ? state.places : [];
  const places = hidden ? all.filter((place) => !hidden.has(place.id)) : all;
  const editing = edit.isOn;

  return (
    <Page gap={4}>
      <LargeTitleHeader
        title={t('saved.tab.title')}
        titleAccessory={switcher}
        actions={
          <>
            {edit.isAvailable || editing ? (
              <Button
                label={t(editing ? 'saved.done' : 'saved.edit')}
                // Done is the way out once something is removed (D-255), so
                // it says so: primary until pressed.
                variant={editing && edit.isDirty ? 'primary' : 'ghost'}
                onClick={editing ? edit.onDone : edit.onEdit}
                xstyle={[styles.edit, !(editing && edit.isDirty) && styles.editQuiet]}
              />
            ) : null}
            {editing ? null : headerActions}
          </>
        }
      />

      {replace}

      {!replace && failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('saved.failed.title')}
          body={t('saved.failed.body')}
          supportPhone={supportPhone ?? null}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {!replace && state.status === 'loading' ? <PlaceCardSkeletonList label={t('common.loading')} count={2} /> : null}

      {!replace && state.status === 'error' ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<OfflineIcon {...stylex.props(emptyState.icon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
        />
      ) : null}

      {!replace && state.status === 'ready' && all.length === 0 ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<BookmarkIcon {...stylex.props(emptyState.icon)} aria-hidden />}
          title={t('saved.empty.title')}
          description={t('saved.empty.body')}
          actions={<Button label={t('explore.empty.showAll')} variant="primary" href={browseHref} />}
        />
      ) : null}

      {places.length > 0 ? (
        <SavedGrid
          label={t('saved.title')}
          isEditing={editing}
          onRemove={onUnsave}
          removeLabel={(name) => tPlain('saved.unsave', { name })}
          tiles={places.map((place) => {
            // A visit booked here (Will, 5 October, D-292): its day and time
            // on the picture, and the place opens about that visit — Back
            // still comes to Saved.
            const visit = visits[place.id];
            const tag = visit ? visitTagLabel(visit.startsAt, locale) : null;
            return {
              id: place.id,
              name: place.name,
              subtitle: t(categoryLabelKey(place.category)),
              href: `/place/?${new URLSearchParams({
                id: place.id,
                from: 'saved',
                ...(visit ? { trip: visit.id } : {}),
              }).toString()}`,
              // The category's illustration fills the picture (D-337).
              art: <CategoryPicture category={place.category} seed={place.id} />,
              tag,
              ...(tag ? { label: tPlain('saved.visitLabel', { name: place.name, when: tag }) } : {}),
            };
          })}
        />
      ) : null}
    </Page>
  );
}

/**
 * Saved, wired: the account's saved places (D-102), Edit to unsave; for a
 * case manager, their starred people too (D-218).
 *
 * **Edit holds its removals until Done** (Will, 3 October, D-255). A × on a
 * program, or a star tapped off in People, hides it at once and turns Done
 * primary; nothing is removed until Done. Leaving with removals waiting —
 * the People / Programs switch, the tab bar, any link — stops and asks:
 * Remove, or Put them back (or keep editing). Taking a star off always asks
 * (D-255), so Done in People asks too; Done in Programs is the confirmation.
 * Edit with nothing removed leaves quietly.
 */
type Pane = 'people' | 'programs';

export function SavedScreen() {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, viewedRole } = useRoleView(trueRole);
  const { state, unsave, failed } = useSavedPlaces(session.status === 'signed-in', demoRole);
  // A member's next visits, for the tags on Saved (D-292).
  const visits = useNextVisits(viewedRole === 'member');
  const supportPhone = useSupportPhone();
  const starred = useStarredPeople();
  const [pane, setPane] = useState<Pane>('people');
  const [isEditing, setIsEditing] = useState(false);
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set());
  /** What to do once the question is answered: switch panes, or go somewhere. */
  const [asking, setAsking] = useState<null | { readonly then: () => void }>(null);
  // A case manager keeps people as well as programs (D-218): starred people
  // first, since people are their work; the programs they saved beside them.
  const isCaseManager = viewedRole === 'admin';
  const onPeople = isCaseManager && pane === 'people';

  const people = useStarredRows(starred.ids);
  const places = state.status === 'ready' ? state.places : [];
  const names = (onPeople ? people.map((p) => ({ id: p.id, name: p.firstName })) : places)
    .filter((item) => pending.has(item.id))
    .map((item) => item.name);
  const listed = new Intl.ListFormat(intlLocale(locale), { type: 'conjunction' }).format(names);
  const isDirty = isEditing && pending.size > 0;

  const stage = (id: string) =>
    setPending((now) => {
      const next = new Set(now);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const finish = (commit: boolean) => {
    if (commit) {
      for (const id of pending) {
        if (onPeople) starred.toggle(id);
        else void unsave(id);
      }
    }
    setPending(new Set());
    setIsEditing(false);
  };
  /** Run `then` now if nothing is waiting; otherwise ask first. */
  const guard = (then: () => void) => {
    if (isDirty) setAsking({ then });
    else {
      setIsEditing(false);
      then();
    }
  };

  useLeaveGuard(isDirty, (href) => setAsking({ then: () => navigate(href) }));

  const editAvailable = onPeople ? people.length > 0 : places.length > 0;

  return (
    <>
      <SavedView
        state={state}
        onUnsave={stage}
        hidden={onPeople ? undefined : pending}
        visits={visits}
        // Edit alone at the top: a member's Saved since D-224, and a case
        // manager's too now (Will, 3 October, D-255) — no bell, no Help.
        headerActions={undefined}
        failed={failed}
        supportPhone={supportPhone}
        browseHref={isCaseManager ? '/programs/' : '/'}
        edit={{
          isOn: isEditing,
          isDirty,
          isAvailable: editAvailable,
          onEdit: () => setIsEditing(true),
          // Programs: Done is the confirmation. People: a star coming off
          // always asks (D-255), so Done asks too.
          onDone: () => (isDirty && onPeople ? setAsking({ then: () => undefined }) : finish(true)),
        }}
        switcher={
          isCaseManager ? (
            <SegmentedControl
              label={t('saved.tab.title')}
              value={pane}
              onChange={(next) => guard(() => setPane(next as Pane))}
              size="md"
              xstyle={styles.pills}
            >
              <Segment value="people" label={t('saved.pane.people')} />
              <Segment value="programs" label={t('saved.pane.programs')} />
            </SegmentedControl>
          ) : undefined
        }
        replace={
          onPeople ? (
            <StarredPeople
              people={people}
              isEditing={isEditing}
              pending={pending}
              onStage={stage}
              onUnstar={(id) => starred.toggle(id)}
            />
          ) : undefined
        }
      />
      <ConfirmDialog
        isOpen={asking !== null}
        title={t(onPeople ? 'saved.leave.people.title' : 'saved.leave.programs.title', { names: listed })}
        body={t('saved.leave.body')}
        confirmLabel={t('saved.leave.remove')}
        onConfirm={() => {
          const then = asking?.then;
          setAsking(null);
          finish(true);
          then?.();
        }}
        secondary={{
          label: t('saved.leave.putBack'),
          onPress: () => {
            const then = asking?.then;
            setAsking(null);
            finish(false);
            then?.();
          },
        }}
        cancelLabel={t('saved.leave.stay')}
        onCancel={() => setAsking(null)}
      />
    </>
  );
}

interface StarredRow {
  readonly id: string;
  readonly firstName: string;
  readonly points: number | undefined;
  readonly lastActiveAt: string | null;
  readonly href: string | undefined;
}

/** The starred people, from the caseload and the example people (D-218). */
function useStarredRows(ids: ReadonlySet<string>): readonly StarredRow[] {
  const { state: caseload } = useCaseload(true);
  const everyone: StarredRow[] = [
    ...(caseload.status === 'ready'
      ? caseload.members.map((m) => ({
          id: m.id,
          firstName: m.firstName ?? '—',
          points: m.points ?? undefined,
          lastActiveAt: m.lastActiveAt,
          href: undefined,
        }))
      : []),
    ...DUMMY_MEMBERS.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      points: m.points,
      lastActiveAt: m.lastActiveAt,
      href: `/person/?id=${m.id}`,
    })),
  ];
  return everyone.filter((person) => ids.has(person.id));
}

/**
 * A case manager's starred people (D-218). In Edit the stars are ringed —
 * the thing to tap — and a star tapped off waits, outlined, until Done; tap
 * it again to keep it. Out of Edit, taking a star off asks first (D-255).
 */
function StarredPeople({
  people,
  isEditing,
  pending,
  onStage,
  onUnstar,
}: {
  readonly people: readonly StarredRow[];
  readonly isEditing: boolean;
  readonly pending: ReadonlySet<string>;
  readonly onStage: (id: string) => void;
  readonly onUnstar: (id: string) => void;
}) {
  const { t, tPlain, locale } = useI18n();

  if (people.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        xstyle={styles.state}
        icon={<StarIcon isFilled={false} {...stylex.props(emptyState.icon)} aria-hidden />}
        title={t('saved.people.empty.title')}
        description={t('saved.people.empty.body')}
        actions={<Button label={t('tab.home')} variant="primary" href="/" />}
      />
    );
  }
  const kept = people.filter((person) => !pending.has(person.id)).length;
  return (
    <VStack gap={3}>
      <Text type="supporting" xstyle={styles.count}>
        {t('saved.people.count', { count: kept })}
      </Text>
      {people.map((member) => {
        const when = whenLastActive(member.lastActiveAt, locale);
        const isOff = pending.has(member.id);
        return (
          <VStack key={member.id} xstyle={isOff && styles.waiting}>
            <PersonRow
              firstName={member.firstName}
              // No way into a profile mid-edit: the stars are the job.
              {...(member.href && !isEditing ? { href: member.href } : {})}
              meta={[
                ...(member.points !== undefined ? [t('admin.points', { count: member.points })] : []),
                when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
              ]}
              trailing={
                isEditing ? (
                  <StarToggle
                    isOn={!isOff}
                    isRinged
                    label={tPlain(isOff ? 'people.star' : 'people.unstar', { name: member.firstName })}
                    onToggle={() => onStage(member.id)}
                  />
                ) : (
                  <StarToggle
                    isOn
                    name={member.firstName}
                    label={tPlain('people.unstar', { name: member.firstName })}
                    onToggle={() => onUnstar(member.id)}
                  />
                )
              }
            />
          </VStack>
        );
      })}
    </VStack>
  );
}
