'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppHeader,
  BigButton,
  HelpBar,
  Loading,
  Notice,
  Page,
  PageTitle,
  PlaceDetail,
  directionsHref,
  googlePlaceHref,
} from '@pam/ui';
import { categoryLabelKey, distanceLabel, NOTICES, type Category } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { usePlaceStatus, weekLines } from '@/lib/usePlaceStatus';
import { sharePlace } from '@/lib/sharePlace';

/**
 * One place, on its own screen.
 *
 * The card in the list answers "is this worth my time" in four facts. This
 * answers what comes next — how to get there, what to ask, when it is open —
 * and it is where the actions that used to crowd the card now live, as labelled
 * rows rather than three shrinking buttons and a corner menu (Will, 16
 * September).
 *
 * Reached by tapping the card, and by its own address: `/place/?id=…` is a
 * shareable link, which is the point of it having a screen at all. A member can
 * text a place to somebody, and a case manager can send one to a member.
 *
 * The detail comes from `service_detail`, which runs `security invoker` — so a
 * place that is inactive or still awaiting review answers nothing here, exactly
 * as it does in the list. The screen shows the plain "we could not find it"
 * notice for all three cases, because a member does not need to know which.
 */

interface Detail {
  id: string;
  name: string;
  lookupName: string | null;
  category: Category;
  address: string | null;
  phone: string | null;
  website: string | null;
  placeId: string | null;
  lat: number | null;
  lon: number | null;
  description: string | null;
  audience: string | null;
  hours: unknown;
}

type State =
  | { status: 'loading' }
  | { status: 'ready'; place: Detail }
  | { status: 'missing' }
  | { status: 'error'; offline: boolean };

function useServiceDetail(id: string | null): State {
  const [state, setState] = useState<State>({ status: 'loading' });

  useEffect(() => {
    if (!id) {
      setState({ status: 'missing' });
      return;
    }
    let cancelled = false;

    void (async () => {
      try {
        const { createClient } = await import('@/lib/supabase');
        const { data, error } = await createClient().rpc('service_detail', { p_id: id });
        if (cancelled) return;
        if (error) {
          setState({ status: 'error', offline: !navigator.onLine });
          return;
        }
        const row = (Array.isArray(data) ? data[0] : data) as Record<string, unknown> | undefined;
        if (!row) {
          setState({ status: 'missing' });
          return;
        }
        setState({
          status: 'ready',
          place: {
            id: row['id'] as string,
            name: row['name'] as string,
            lookupName: (row['lookup_name'] as string | null) ?? null,
            category: row['category'] as Category,
            address: (row['address'] as string | null) ?? null,
            phone: (row['phone'] as string | null) ?? null,
            website: (row['website'] as string | null) ?? null,
            placeId: (row['place_id'] as string | null) ?? null,
            lat: (row['lat'] as number | null) ?? null,
            lon: (row['lon'] as number | null) ?? null,
            description: (row['description_plain'] as string | null) ?? null,
            audience: (row['audience'] as string | null) ?? null,
            hours: row['hours'] ?? null,
          },
        });
      } catch {
        if (!cancelled) setState({ status: 'error', offline: !navigator.onLine });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [id]);

  return state;
}

function PlaceScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const id = params.get('id');
  const state = useServiceDetail(id);

  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const { isSaved, save, unsave } = useSavedPlaces(signedIn);

  const place = state.status === 'ready' ? state.place : null;
  const status = usePlaceStatus(place?.id ?? '', place?.hours ?? null, t, locale);

  if (state.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    const key =
      state.status === 'error' && state.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle
          title={t('places.title')}
          backHref="/places/"
          backLabel={t('nav.back.places')}
        />
        <Notice
          notice={state.status === 'missing' ? 'service_not_available' : key}
          title={state.status === 'missing' ? t('place.notFound.title') : t(NOTICES[key].titleKey)}
          body={state.status === 'missing' ? t('place.notFound.body') : t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('places.title')} href="/places/" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  const saved = isSaved(place!.id);
  const lines = status ? weekLines(status.hours, locale, t('place.hours.closed')) : undefined;

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={signedIn ? t(`role.${session.session.role}`) : undefined}
      />
      <PageTitle title={place!.name} backHref="/places/" backLabel={t('nav.back.places')} />

      <PlaceDetail
        category={place!.category}
        categoryLabel={t(categoryLabelKey(place!.category))}
        description={place!.description}
        address={place!.address}
        status={status ? { isOpen: status.isOpen, label: status.label } : null}
        weekLines={lines}
        hoursArePlaceholder={status ? !status.isReal : false}
        placeholderNote={t('place.hours.sample')}
        audienceLabel={
          place!.audience ? t(`place.audience.${place!.audience}`) : null
        }
        phone={place!.phone}
        website={place!.website}
        directionsHref={directionsHref(place!.address, place!.lat, place!.lon) ?? null}
        hoursHref={googlePlaceHref(
          place!.lookupName || place!.name,
          place!.address,
          place!.placeId,
        )}
        isSaved={saved}
        onSave={
          signedIn
            ? () => {
                if (saved) {
                  void unsave(place!.id);
                  return;
                }
                void save({
                  id: place!.id,
                  name: place!.name,
                  lookupName: place!.lookupName,
                  category: place!.category,
                  address: place!.address,
                  phone: place!.phone,
                  placeId: place!.placeId,
                  lat: place!.lat,
                  lon: place!.lon,
                });
              }
            : undefined
        }
        onShare={() => void sharePlace(place!.name, place!.address)}
        flagHref={`/flag/?place=${encodeURIComponent(place!.id)}`}
        labels={{
          directions: t('place.directions'),
          call: t('place.call'),
          website: t('place.website'),
          hours: t('place.hours'),
          hoursOnGoogle: t('place.hoursOnGoogle'),
          about: t('place.about'),
          address: t('place.address'),
          save: t('place.save'),
          saved: t('places.saved'),
          share: t('place.share'),
          flag: t('place.flag'),
        }}
      />

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary in an exported app, and the
 * fallback is the same spinner every other screen shows while it waits.
 */
export default function PlacePage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <AppHeader />
          <Loading label="Loading" variant="screen" />
        </Page>
      }
    >
      <PlaceScreen />
    </Suspense>
  );
}
