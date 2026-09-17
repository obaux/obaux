'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@astryxdesign/core/Button';
import { AppHeader, Loading, Notice, Page, PageTitle, PlaceCard, ScrollReveal } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useDemoView } from '@/lib/useDemoView';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { placeStatus, useNow } from '@/lib/usePlaceStatus';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';

/**
 * Everything a member kept.
 *
 * The home strip is for a glance — three squares and a swipe. This is the list
 * you open when you actually need the address, so it uses the same full place
 * card as the Places screen: the same three actions, in the same order, in the
 * same place (§5.1). A saved place that behaves differently from the place you
 * saved is a different place as far as anybody's hands are concerned.
 *
 * Removing here is the Save button on the card itself, already filled. There is
 * no separate delete: the control that put a place in the list is the control
 * that takes it out, which is one fewer thing to learn and one fewer thing to
 * hit by accident.
 *
 * No help bar (Will, 14 September). This is a list of things the member chose,
 * with the way back beside the title and a phone number on every card that has
 * one. A support button at the foot of it answers a question nobody reading
 * their own saved places is asking.
 *
 * **The empty state carries no call button either** (Will, 16 September):
 * saving nothing yet is not a problem support can solve, so the notice loses
 * its "Call PAM" action (`supportPhone` withheld from this one `Notice`), and
 * the way to Places below it is a plain secondary button — the size Help
 * itself is drawn at elsewhere — rather than the screen's one primary action,
 * because reading an empty list is not the thing this screen exists to do.
 */

const styles = stylex.create({
  // Sized like the Help control elsewhere, not like BigButton's 64px: this is
  // the way out of an empty state, not the screen's one primary action.
  return: { minHeight: '48px', fontSize: '17px' },
});

export default function SavedPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const isDemo = useDemoView(session);
  // An account granted the demo view has no real saved places of its own to
  // show; it gets the same example set a role preview does (see
  // useSavedPlaces's own comment), keyed by its real role rather than a
  // previewed one.
  const { state, unsave, failed } = useSavedPlaces(signedIn, demoRole ?? (isDemo ? trueRole : null));
  const now = useNow();

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('saved.title')} backHref="/" backLabel={t('nav.back.home')} />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('reminders.signedOut')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('saved.title')} backHref="/" backLabel={t('nav.back.home')} />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${demoRole ?? session.session.role}`)}
        roleControl={
          trueRole === 'super_admin' ? (
            <RoleSwitchControl trueRole={trueRole} viewedRole={demoRole ?? trueRole} onChange={setViewAs} />
          ) : undefined
        }
        trailing={<HeaderBell enabled={signedIn} role={demoRole ?? trueRole} />}
      />

      <PageTitle
        title={t('saved.title')}
        subtitle={
          state.status === 'ready' && state.places.length > 0
            ? t('saved.count', { count: state.places.length })
            : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('saved.failed.title')}
          body={t('saved.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {/*
        Empty is a real state here, not an error: most members will open this
        screen once before they have saved anything, and it should teach them
        what the button does rather than apologise.
      */}
      {state.status === 'ready' && state.places.length === 0 ? (
        <>
          <Notice notice="no_places_found" title={t('saved.empty.title')} body={t('saved.empty.body')} />
          <Button label={t('action.return')} variant="secondary" href="/places/" xstyle={styles.return} />
        </>
      ) : null}

      {state.status === 'ready' && state.places.length > 0 ? (
        <VStack gap={3}>
          {state.places.map((place, index) => (
            <ScrollReveal key={place.id} index={index}>
              <PlaceCard
                name={place.name}
                href={`/place/?id=${encodeURIComponent(place.id)}&from=saved`}
                description={place.description}
                status={placeStatus(place.id, place.hours, now, t, locale)}
                audienceLabel={place.audience ? t(`place.audience.${place.audience}`) : null}
                isSaved
                onSave={() => void unsave(place.id)}
                labels={{ save: t('action.save'), saved: t('places.saved') }}
              />
            </ScrollReveal>
          ))}
        </VStack>
      ) : null}

    </Page>
  );
}
