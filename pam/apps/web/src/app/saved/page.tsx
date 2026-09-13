'use client';

import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import * as stylex from '@stylexjs/stylex';
import {
  AppHeader,
  BigButton,
  HelpBar,
  Notice,
  Page,
  PageTitle,
  PlaceCard,
  ScrollReveal,
} from '@pam/ui';
import { categoryLabelKey, NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { sharePlace } from '@/lib/sharePlace';

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
 */

const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export default function SavedPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const { state, unsave, failed } = useSavedPlaces(signedIn);

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Text type="supporting" xstyle={styles.note}>
          {t('places.loading')}
        </Text>
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('saved.title')} backHref="/" backLabel={t('nav.back.home')} />
        <Notice
          notice="service_not_available"
          title={t('directory.signedOut.title')}
          body={t('reminders.signedOut')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('signin.title')} href="/signin/" />
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
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader roleLabel={t(`role.${session.session.role}`)} />

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
        <Text type="supporting" xstyle={styles.note}>
          {t('places.loading')}
        </Text>
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
          <Notice
            notice="no_places_found"
            title={t('saved.empty.title')}
            body={t('saved.empty.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
          <BigButton label={t('places.title')} href="/places/" />
        </>
      ) : null}

      {state.status === 'ready' && state.places.length > 0 ? (
        <VStack gap={3}>
          {state.places.map((place, index) => (
            <ScrollReveal key={place.id} index={index}>
              <PlaceCard
                name={place.name}
                lookupName={place.lookupName ?? undefined}
                category={place.category}
                categoryLabel={t(categoryLabelKey(place.category))}
                phone={place.phone ?? undefined}
                address={place.address ?? undefined}
                lat={place.lat ?? undefined}
                lon={place.lon ?? undefined}
                placeId={place.placeId ?? undefined}
                isSaved
                onSave={() => void unsave(place.id)}
                onShare={() => void sharePlace(place.name, place.address)}
                flagHref={`/flag/?place=${encodeURIComponent(place.id)}`}
                labels={{
                  call: t('action.call'),
                  go: t('action.go'),
                  save: t('action.save'),
                  saved: t('places.saved'),
                  hours: t('action.hours'),
                  more: t('place.more'),
                  share: t('place.share'),
                  flag: t('place.flag'),
                }}
              />
            </ScrollReveal>
          ))}
        </VStack>
      ) : null}

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
