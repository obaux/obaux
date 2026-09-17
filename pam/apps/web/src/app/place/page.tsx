'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  AppHeader,
  BigButton,
  HelpBar,
  Notice,
  Page,
  PageTitle,
  PlaceDetail,
  directionsHref,
  googlePlaceHref,
} from '@pam/ui';
import { PlaceDetailSkeleton } from '@pam/ui/Skeletons';
import { categoryLabelKey, distanceLabel, NOTICES, type Category } from '@pam/config';
import { DUMMY_PLACES_BY_ID, isDummyPlaceId } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useDemoView } from '@/lib/useDemoView';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { usePlaceStatus, weekLines } from '@/lib/usePlaceStatus';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
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

/**
 * Where "back" goes — wherever the card that opened this screen actually
 * sat, not always `/places/` (Will, 16 September: "if I'm in Places and I
 * open a place, going back should take me to places, not home"). Every
 * link into `/place/` now carries `?from=`; a short token from a small
 * fixed set rather than a raw path, so this never has to trust or validate
 * an arbitrary URL. A bare `/place/?id=…` — a shared link, or an old one —
 * still falls back to Places, which was this screen's only behaviour before.
 */
const BACK_TARGETS = {
  home: { href: '/', labelKey: 'nav.back.home' },
  places: { href: '/places/', labelKey: 'nav.back.places' },
  saved: { href: '/saved/', labelKey: 'nav.back.saved' },
} as const;

function resolveBack(from: string | null): { href: string; labelKey: string } {
  return BACK_TARGETS[from as keyof typeof BACK_TARGETS] ?? BACK_TARGETS.places;
}

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

    // A dummy saved place never lived in `services` — see
    // `DUMMY_PLACES_BY_ID`'s own comment for what asking the network for it
    // used to do instead.
    if (isDummyPlaceId(id)) {
      const dummy = DUMMY_PLACES_BY_ID[id];
      setState(
        dummy
          ? {
              status: 'ready',
              place: {
                id: dummy.id,
                name: dummy.name,
                lookupName: dummy.name,
                category: dummy.category,
                address: dummy.address,
                phone: dummy.phone,
                website: null,
                placeId: null,
                lat: dummy.lat,
                lon: dummy.lon,
                description: dummy.description,
                audience: null,
                hours: null,
              },
            }
          : { status: 'missing' },
      );
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
  const back = resolveBack(params.get('from'));

  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const isDemo = useDemoView(session);
  const { isSaved, save, unsave } = useSavedPlaces(signedIn, demoRole ?? (isDemo ? trueRole : null));

  const place = state.status === 'ready' ? state.place : null;
  const status = usePlaceStatus(place?.id ?? '', place?.hours ?? null, t, locale);

  /*
   * The header is not bare here (Will, 16 September: "the top bar in Places
   * profile should be consistent") — the session is already resolved by the
   * time this screen is deciding whether the *place* loaded, so there is no
   * reason for it to show less than every other screen does at this point:
   * the role chip, the switcher for a super admin, and the bell.
   */
  const header = (
    <AppHeader
      roleLabel={signedIn ? t(`role.${demoRole ?? session.session.role}`) : undefined}
      roleControl={
        trueRole === 'super_admin' ? (
          <RoleSwitchControl trueRole={trueRole} viewedRole={demoRole ?? trueRole} onChange={setViewAs} />
        ) : undefined
      }
      trailing={<HeaderBell enabled={signedIn} role={demoRole ?? trueRole} />}
    />
  );

  if (state.status === 'loading') {
    return (
      <Page gap={4}>
        {header}
        <PlaceDetailSkeleton label={t('common.loading')} />
      </Page>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    const key =
      state.status === 'error' && state.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        {header}
        <PageTitle
          title={t('places.title')}
          backHref={back.href}
          backLabel={t(back.labelKey)}
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
      {header}
      <PageTitle title={place!.name} backHref={back.href} backLabel={t(back.labelKey)} />

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
 * `useSearchParams` needs a Suspense boundary in an exported app. The fallback
 * is the same skeleton the screen itself shows once it is past this and
 * waiting on `service_detail` — there is no moment on this route the shape of
 * a place is not already known.
 */
export default function PlacePage() {
  return (
    <Suspense
      fallback={
        <Page gap={4}>
          <AppHeader />
          <PlaceDetailSkeleton label="Loading" />
        </Page>
      }
    >
      <PlaceScreen />
    </Suspense>
  );
}
