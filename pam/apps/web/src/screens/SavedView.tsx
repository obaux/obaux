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
  WorkforceIcon,
} from '@pam/ui';
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
});

export function SavedView({ state, onUnsave, headerActions, failed, supportPhone }: SavedViewProps) {
  const { t } = useI18n();
  const [isEditing, setIsEditing] = useState(false);
  const places = state.status === 'ready' ? state.places : [];
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

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('saved.failed.title')}
          body={t('saved.failed.body')}
          supportPhone={supportPhone ?? null}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'loading' ? <PlaceCardSkeletonList label={t('common.loading')} count={2} /> : null}

      {state.status === 'error' ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<OfflineIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
        />
      ) : null}

      {state.status === 'ready' && places.length === 0 ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<BookmarkIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t('saved.empty.title')}
          description={t('saved.empty.body')}
          actions={<Button label={t('explore.empty.showAll')} variant="primary" href="/" />}
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
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole } = useRoleView(trueRole);
  const { state, unsave, failed } = useSavedPlaces(session.status === 'signed-in', demoRole);
  const supportPhone = useSupportPhone();
  return (
    <SavedView
      state={state}
      onUnsave={(id) => void unsave(id)}
      headerActions={<HeaderActions role={demoRole ?? trueRole} enabled={session.status === 'signed-in'} />}
      failed={failed}
      supportPhone={supportPhone}
    />
  );
}
