'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import {
  AllPlacesIcon,
  BookmarkIcon,
  EducationIcon,
  FamilyServicesIcon,
  Notice,
  OfflineIcon,
  Page,
  StarIcon,
  WorkforceIcon,
} from '@pam/ui';
import { SegmentedControl, SegmentedControlItem } from '@astryxdesign/core/SegmentedControl';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { DUMMY_MEMBERS } from '@pam/config/dummy-people';
import { whenLastActive } from '@/lib/caseloadLabels';
import { useStarredPeople } from '@/lib/useStarredPeople';
import { useCaseload } from '@/lib/useCaseload';
import { PersonRow } from '../app/PersonRow';
import { StarToggle } from './PeopleHomeView';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { SavedGrid } from '@pam/ui/SavedGrid';
import { PlaceCardSkeletonList } from '@pam/ui/Skeletons';
import { categoryLabelKey, NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { useSavedPlaces, type SavedPlacesState } from '@/lib/useSavedPlaces';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { HeaderActions } from './HeaderActions';

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
  /** Under the title — a case manager's People / Programs switch (D-218). */
  readonly switcher?: ReactNode;
  /** Drawn instead of the saved places — a case manager's starred people. */
  readonly replace?: ReactNode;
  /** Where "show me places" goes from the empty state: Explore, or All programs for staff. */
  readonly browseHref?: string;
}

const ART = { width: 52, height: 52, 'aria-hidden': true } as const;

const styles = stylex.create({
  edit: {
    minHeight: '48px',
    borderRadius: '999px',
    paddingInline: '20px',
    fontSize: '17px',
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  state: { paddingBlock: '48px' },
  stateIcon: { width: '64px', height: '64px' },
  count: { fontSize: '16px' },
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
}: SavedViewProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const places = state.status === 'ready' && !replace ? state.places : [];
  const editing = isEditing && places.length > 0;

  return (
    <Page gap={4}>
      <LargeTitleHeader
        title={t('saved.tab.title')}
        actions={
          <>
            {places.length > 0 ? (
              <Button
                label={t(editing ? 'saved.done' : 'saved.edit')}
                variant="ghost"
                onClick={() => setIsEditing((on) => !on)}
                xstyle={styles.edit}
              />
            ) : null}
            {editing ? null : headerActions}
          </>
        }
      />

      {switcher}

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
          icon={<OfflineIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
        />
      ) : null}

      {!replace && state.status === 'ready' && places.length === 0 ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<BookmarkIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
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
          removeLabel={(name) => t('saved.unsave', { name })}
          tiles={places.map((place) => ({
            id: place.id,
            name: place.name,
            subtitle: t(categoryLabelKey(place.category)),
            href: `/place/?id=${encodeURIComponent(place.id)}&from=saved`,
            art: <BigCategoryIcon category={place.category} />,
          }))}
        />
      ) : null}
    </Page>
  );
}

/** The chips' icon for a category, drawn large for the placeholder picture. */
export function BigCategoryIcon({
  category,
  size = ART,
}: {
  readonly category: string;
  readonly size?: { readonly width: number; readonly height: number; readonly 'aria-hidden': true };
}) {
  switch (category) {
    case 'education':
      return <EducationIcon {...size} />;
    case 'workforce':
      return <WorkforceIcon {...size} />;
    case 'family_services':
      return <FamilyServicesIcon {...size} />;
    default:
      return <AllPlacesIcon {...size} />;
  }
}

/** Saved, wired: the account's saved places (D-102), Edit to unsave. */
export function SavedScreen() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, viewedRole } = useRoleView(trueRole);
  const { state, unsave, failed } = useSavedPlaces(session.status === 'signed-in', demoRole);
  const supportPhone = useSupportPhone();
  const [pane, setPane] = useState<'people' | 'programs'>('people');
  // A case manager keeps people as well as programs (D-218): starred people
  // first, since people are their work; the programs they saved beside them.
  const isCaseManager = viewedRole === 'admin';
  return (
    <SavedView
      state={state}
      onUnsave={(id) => void unsave(id)}
      // A member's Saved has Edit alone at the top (Will, 2 October, D-224);
      // a case manager's keeps the bell, beside the People / Programs switch.
      headerActions={
        isCaseManager ? <HeaderActions role={viewedRole} enabled={session.status === 'signed-in'} /> : undefined
      }
      failed={failed}
      supportPhone={supportPhone}
      browseHref={isCaseManager ? '/programs/' : '/'}
      switcher={
        isCaseManager ? (
          <SegmentedControl
            label={t('saved.tab.title')}
            value={pane}
            onChange={(next) => setPane(next as 'people' | 'programs')}
            layout="fill"
            size="lg"
          >
            <SegmentedControlItem value="people" label={t('saved.pane.people')} />
            <SegmentedControlItem value="programs" label={t('saved.pane.programs')} />
          </SegmentedControl>
        ) : undefined
      }
      replace={isCaseManager && pane === 'people' ? <StarredPeople /> : undefined}
    />
  );
}

/** A case manager's starred people (D-218): from their caseload, and the example people. */
function StarredPeople() {
  const { t, locale } = useI18n();
  const { ids, toggle } = useStarredPeople();
  const { state: caseload } = useCaseload(true);
  const everyone = [
    ...(caseload.status === 'ready'
      ? caseload.members.map((m) => ({
          id: m.id,
          firstName: m.firstName ?? '—',
          points: m.points ?? undefined,
          lastActiveAt: m.lastActiveAt,
          href: undefined as string | undefined,
        }))
      : []),
    ...DUMMY_MEMBERS.map((m) => ({
      id: m.id,
      firstName: m.firstName,
      points: m.points,
      lastActiveAt: m.lastActiveAt,
      href: `/person/?id=${m.id}` as string | undefined,
    })),
  ];
  const people = everyone.filter((person) => ids.has(person.id));

  if (people.length === 0) {
    return (
      <EmptyState
        headingLevel={2}
        xstyle={styles.state}
        icon={<StarIcon isFilled={false} {...stylex.props(styles.stateIcon)} aria-hidden />}
        title={t('saved.people.empty.title')}
        description={t('saved.people.empty.body')}
        actions={<Button label={t('tab.home')} variant="primary" href="/" />}
      />
    );
  }
  return (
    <VStack gap={3}>
      <Text type="supporting" xstyle={styles.count}>
        {t('saved.people.count', { count: people.length })}
      </Text>
      {people.map((member) => {
        const when = whenLastActive(member.lastActiveAt, locale);
        return (
          <PersonRow
            key={member.id}
            firstName={member.firstName}
            {...(member.href ? { href: member.href } : {})}
            meta={[
              ...(member.points !== undefined ? [t('admin.points', { count: member.points })] : []),
              when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
            ]}
            trailing={
              <StarToggle
                isOn
                label={t('people.unstar', { name: member.firstName })}
                onToggle={() => toggle(member.id)}
              />
            }
          />
        );
      })}
    </VStack>
  );
}
