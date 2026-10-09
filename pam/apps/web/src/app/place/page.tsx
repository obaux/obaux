'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  BigButton,
  BookIcon,
  GlobeIcon,
  MessagesIcon,
  Notice,
  Page,
  PhoneIcon,
  PlaceDetail,
  PlacesIcon,
  SignedIcon,
  directionsHref,
  googlePlaceHref,
} from '@pam/ui';
import { PlaceBarActions, leadMessageFor, messageHrefFor, newMessageFrom } from '../../screens/PlaceBarActions';
import { PlaceDetailSkeleton } from '@pam/ui/Skeletons';
import { SubPageHeader } from '@pam/ui/SubPage';
import { HelpButton } from '../../screens/HelpButton';
import { categoryLabelKey, displayPhone, distanceLabel, NOTICES, POINTS_RULES, type Category, intlLocale } from '@pam/config';
import { DUMMY_PLACES_BY_ID, isDummyPlaceId } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { usePlaceStatus, weekLines } from '@/lib/usePlaceStatus';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { sharePlace } from '@/lib/sharePlace';
import { usePolicies } from '@/lib/usePolicies';
import { useMySignatures } from '@/lib/useMySignatures';
import { PolicyStatusCard } from '@pam/ui/PolicyStatusCard';
import { countdown } from '@/lib/when';
import { VisitCard } from '@pam/ui/VisitCard';
import { VStack } from '@astryxdesign/core/VStack';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { readAddedTrips, TRIPS_CHANGED, withMoves } from '@/lib/addedTrips';
import { placeAsksForPolicies } from '@pam/config/dummy-policies';
import { policiesHref } from '../../screens/MemberPoliciesView';
import { StaffBadge } from '@pam/ui/StaffBadge';
import { programStaffFor } from '@pam/config/dummy-connections';
import { siteName } from '@/lib/siteName';
import { useServices } from '@/lib/useServices';
import { ServiceCards } from '../../screens/ServiceCards';
import { DropInCard } from '../../screens/DropInCard';
import { bookingFor } from '@pam/config/dummy-booking';
import { policiesForService } from '@pam/config/dummy-services';

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
const QUICK = { width: 26, height: 26, 'aria-hidden': true } as const;

const BACK_TARGETS = {
  home: { href: '/', labelKey: 'nav.back.home' },
  // The redesign's Explore, which is the home screen there (D-212).
  explore: { href: '/', labelKey: 'nav.back.explore' },
  trips: { href: '/trips/', labelKey: 'nav.back.trips' },
  places: { href: '/places/', labelKey: 'nav.back.places' },
  saved: { href: '/saved/', labelKey: 'nav.back.saved' },
  // All programs, a staff member's secondary path (D-218).
  programs: { href: '/programs/', labelKey: 'nav.back.programs' },
  // A program's name on a Connections card (D-272).
  connections: { href: '/connections/', labelKey: 'nav.back.connections' },
  // "View program details" in a conversation's options (D-272).
  messages: { href: '/messages/', labelKey: 'nav.back.messages' },
} as const;

function resolveBack(from: string | null, thread: string | null = null): { href: string; labelKey: string } {
  // From the visit card at the top of a conversation (D-276): back to that
  // conversation, by its id — the one target that is not a fixed screen.
  if (from === 'thread' && thread) {
    return { href: `/messages/thread/?id=${encodeURIComponent(thread)}`, labelKey: 'messages.options.back' };
  }
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
  const back = resolveBack(params.get('from'), params.get('thread'));

  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const { isSaved, save, unsave } = useSavedPlaces(signedIn, demoRole);

  const place = state.status === 'ready' ? state.place : null;
  const { policies } = usePolicies();
  const { progress } = useMySignatures();
  const { forPlace } = useServices();
  // A visit booked here — from Trips, or anywhere — brings the policies up
  // to the top of the page (D-271). Opened from a trip card, the page is
  // about that visit (D-273): its day and time instead of "Plan a trip".
  const [hasTrip, setHasTrip] = useState(false);
  const [visit, setVisit] = useState<{ id: string; startsAt: string; serviceId: string | null } | null>(null);
  // The service a member has picked from the cards (D-313): what Plan a
  // trip is for, and what the rows say. With a visit booked, the visit's.
  const [pickedService, setPickedService] = useState<string | null>(null);
  // A visit card on Trips or in a conversation opens the place about that
  // visit (D-273, D-276).
  const tripId = params.get('trip');
  // Or any link that names the trip — Saved's visit tag (D-292) — while Back
  // still follows `from`.
  const fromTrips = params.get('from') === 'trips' || params.get('from') === 'thread' || tripId !== null;
  useEffect(() => {
    if (!place) return;
    const read = () => {
      const here = withMoves([...DUMMY_TRIPS, ...readAddedTrips()])
        .filter((trip) => trip.placeId === place.id)
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
      setHasTrip(here.length > 0);
      const found = here.find((trip) => trip.id === tripId) ?? (fromTrips ? here[0] : undefined);
      setVisit(fromTrips && found ? { id: found.id, startsAt: found.startsAt, serviceId: found.serviceId ?? null } : null);
    };
    read();
    // A visit moved from here (D-281) shows its new time on the way back.
    window.addEventListener(TRIPS_CHANGED, read);
    return () => window.removeEventListener(TRIPS_CHANGED, read);
  }, [place, tripId, fromTrips]);
  // A service with its own hours (D-313): the open/closed line and the
  // hours row are its, once picked or booked.
  const hoursService =
    forPlace(place?.id ?? '').find((s) => s.id === (visit ? visit.serviceId : pickedService)) ?? null;
  const status = usePlaceStatus(
    hoursService?.hours ? `${place?.id ?? ''}:${hoursService.id}` : (place?.id ?? ''),
    hoursService?.hours ?? place?.hours ?? null,
    t,
    locale,
  );

  /*
   * The nested-page template (D-213): a place is something you tap into, so
   * it opens like every other screen you tap into — round back, then its
   * name, large. The role switch a super admin had in the app header rides
   * in the bar instead (it was put here on 16 September so this screen would
   * not show less than its neighbours; that still holds).
   */
  const header = (title: string, bar?: React.ReactNode) => (
    <SubPageHeader
      title={title}
      backHref={back.href}
      backLabel={t(back.labelKey)}
      actions={
        <>
          {trueRole === 'super_admin' ? (
            <RoleSwitchControl trueRole={trueRole} viewedRole={demoRole ?? trueRole} onChange={setViewAs} />
          ) : null}
          {/*
            A place's own bar once it has loaded (D-224): Save and the ⋯ menu.
            Before that, Help (D-217).
          */}
          {bar ?? <HelpButton />}
        </>
      }
    />
  );

  if (state.status === 'loading') {
    return (
      <Page gap={4}>
        {header(t('common.loading'))}
        <PlaceDetailSkeleton label={t('common.loading')} />
      </Page>
    );
  }

  if (state.status === 'missing' || state.status === 'error') {
    const key = state.status === 'error' && state.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        {header(t('places.title'))}
        <Notice
          notice={state.status === 'missing' ? 'service_not_available' : key}
          title={state.status === 'missing' ? t('place.notFound.title') : t(NOTICES[key].titleKey)}
          body={state.status === 'missing' ? t('place.notFound.body') : t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('help.place.action')} href="/" />
      </Page>
    );
  }

  const saved = isSaved(place!.id);
  const toggleSave = () => {
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
  };
  // The program's policies, for a member (D-270, D-271).
  const asksMember =
    (demoRole ?? trueRole) === 'member' && placeAsksForPolicies(place!.id) && policies.length > 0;
  // Counted for the visit's or picked service once there is one (D-313).
  const servicesHere = forPlace(place!.id);
  const activeForPolicies = servicesHere.find((s) => s.id === (visit ? visit.serviceId : pickedService)) ?? null;
  const signedSoFar = progress(place!.id, activeForPolicies ? policiesForService(activeForPolicies, policies, servicesHere) : policies);
  const allSigned = signedSoFar.signed === signedSoFar.total;
  // With a visit booked here (or arriving from Trips), the policies come up
  // under the name — orange to sign, green once signed — instead of at the foot.
  // Not before booking on a program with services (Will, D-313): the
  // policies are the service's, and come with the visit.
  const policiesOnTop = asksMember && (hasTrip || fromTrips) && !(forPlace(place!.id).length > 0 && !fromTrips);
  // A member's one primary action is booking a visit (D-235), straight into
  // the New trip steps with this place already chosen — the page's footer,
  // always in reach (D-309, D-326). With a visit booked, nothing asks to
  // plan one (D-273).
  const plansVisit = (demoRole ?? trueRole) === 'member' && !visit;
  const services = forPlace(place!.id);
  const staff = programStaffFor(place!.id);
  // How the program takes people (D-313): a visit to plan, or a schedule
  // to just turn up to.
  const booking = bookingFor(place!.id);
  const isDropIn = booking.kind === 'dropin';
  const activeServiceId = visit ? visit.serviceId : pickedService;
  const service = services.find((s) => s.id === activeServiceId) ?? null;
  // What the page says to call, open and find: the chosen service's, where
  // it has its own, else the program's (Will: "services might be offered
  // at different addresses also").
  const phone = service?.phone ?? place!.phone;
  const website = service?.website ?? place!.website;
  const address = service?.address ?? place!.address;
  // The booked visit (D-273, D-281): "Your next visit", the day large, the
  // time under it, and a way to move it.
  const visitDay = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'long', day: 'numeric' });
  const visitTime = new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' });
  const visitWhen = visit ? visitDay.format(new Date(visit.startsAt)) : null;
  const visitHour = visit ? visitTime.format(new Date(visit.startsAt)) : '';
  const visitAhead = visit ? new Date(visit.startsAt).getTime() > Date.now() : false;
  // Change appointment (D-281): the Plan a visit steps, at When, for this
  // trip — saving moves it rather than adding a second one.
  const changeHref = visit
    ? `/trips/new/?${new URLSearchParams({
        place: place!.id,
        name: place!.name,
        category: place!.category,
        ...(place!.address ? { address: place!.address } : {}),
        change: visit.id,
      }).toString()}`
    : null;
  // With the place's Google ID when Pam has one (D-291): Maps opens on the place itself.
  // Only a member is written to by a program here (D-305).
  const unread = (demoRole ?? trueRole) === 'member' ? newMessageFrom(place!.name) : null;
  const leadMessage = leadMessageFor(place!.name, place!.id);
  const directions =
    (service?.address
      ? directionsHref(service.address, null, null, null)
      : directionsHref(place!.address, place!.lat, place!.lon, place!.placeId)) ?? null;
  const googleHref = service?.address
    ? googlePlaceHref(place!.name, service.address, null)
    : googlePlaceHref(place!.lookupName || place!.name, place!.address, place!.placeId);
  const lines = status ? weekLines(status.hours, locale, t('place.hours.closed')) : undefined;

  return (
    <Page
      gap={4}
      footer={
        // Walk-ins plan a trip too (Will, D-333): a day it meets, so staff
        // see who is coming, then the same booked screen.
        plansVisit ? (
          <BigButton
            label={t('place.schedule')}
            // Pick a service first, like a size before checkout (Will,
            // D-313): the button waits until one is chosen.
            isDisabled={services.length > 0 && !service}
            href={`/trips/new/?${new URLSearchParams({
              place: place!.id,
              name: place!.name,
              category: place!.category,
              ...(place!.address ? { address: place!.address } : {}),
              // The card they picked rides along (D-313): no "Which service?"
              ...(service ? { service: service.id } : {}),
            }).toString()}`}
          />
        ) : null
      }
    >
      {header(
        place!.name,
        <PlaceBarActions
          isSaved={saved}
          // No Save for a program lead, who has no Saved (D-237).
          onSave={signedIn && (demoRole ?? trueRole) !== 'provider' ? toggleSave : undefined}
          onShare={() => void sharePlace(place!.name, place!.address)}
          flagHref={`/flag/?place=${encodeURIComponent(place!.id)}`}
          messageHref={messageHrefFor(place!.name, place!.id)}
        />,
      )}

      <PlaceDetail
        category={place!.category}
        categoryLabel={t(categoryLabelKey(place!.category))}
        // The picked service's words and place (Will, D-313): About program
        // becomes About service, and the address card says whose it is.
        description={service?.description || place!.description}
        address={address}
        status={status ? { isOpen: status.isOpen, label: status.label } : null}
        // Who you'll meet (Will, 7 October, D-335): once a visit is booked,
        // the program's staff at the right of the open/closed row.
        statusAside={
          visit && staff ? (
            <StaffBadge
              name={staff.firstName}
              title={t('staff.title.provider')}
              photoUrl={staff.photoUrl}
              label={t('staff.label', { name: staff.firstName, title: t('staff.title.provider') })}
            />
          ) : null
        }
        weekLines={lines}
        todayIndex={status ? status.today : null}
        hoursRowLabel={status && lines ? t('place.hours.row', { day: lines[status.today]!.day }) : null}
        hoursArePlaceholder={status ? !status.isReal : false}
        placeholderNote={t('place.hours.sample')}
        audienceLabel={place!.audience ? t(`place.audience.${place!.audience}`) : null}
        phone={phone}
        website={website}
        // Nothing asks for directions as a button when the one action is
        // planning a visit, or a visit is booked (D-273); the row has them.
        directionsHref={visitWhen || plansVisit ? null : directions}
        addressFirst={visitWhen !== null}
        hoursHref={googleHref}
        isSaved={saved}
        notice={
          visitWhen || policiesOnTop ? (
            <VStack gap={3}>
              {visitWhen ? (
                // The visit, confirmed (D-273), as a small hero (D-281): only
                // "Change appointment" is a link, the card itself is not.
                <VisitCard
                  eyebrow={t(visitAhead ? 'place.visit.next' : 'place.visit.last')}
                  day={visitWhen}
                  time={visitHour}
                  // The service rides with the time (Will, 6 October, D-332):
                  // the picker is gone once the visit is booked.
                  service={visit && service ? service.name : null}
                  // How soon (D-337), like the booked screen's card.
                  countdown={visitAhead && visit ? countdown(new Date(visit.startsAt), t) : null}
                  changeLabel={visitAhead ? t('place.visit.change') : undefined}
                  changeHref={visitAhead ? changeHref : null}
                />
              ) : null}
              {policiesOnTop ? (
                <PolicyStatusCard
                  isDone={allSigned}
                  title={t(allSigned ? 'place.policies.done.title' : 'place.policies.toSign.title')}
                  body={t(allSigned ? 'place.policies.done.body' : 'place.policies.toSign.body')}
                  label={`${t(allSigned ? 'place.policies.done.title' : 'place.policies.toSign.title')}. ${t(
                    allSigned ? 'place.policies.done.body' : 'place.policies.toSign.body',
                  )}`}
                  href={policiesHref(place!.id, place!.name, service?.id ?? null)}
                />
              ) : null}
            </VStack>
          ) : null
        }
        // What the program offers, as services (D-313): each a row that
        // opens the service — its own number, site and what to sign.
        // Before a visit: what the program offers comes first (D-313) — the
        // services to pick from, or, for a drop-in program, when it meets.
        layout={visit ? 'default' : 'chooseFirst'}
        extra={
          <>
            {isDropIn && !visit ? <DropInCard schedule={booking.schedule} /> : null}
            {/* Booked: the service is in the visit card, not a picker (D-332). */}
            {visit ? null : (
              <ServiceCards services={services} selectedId={service?.id ?? null} onSelect={setPickedService} />
            )}
          </>
        }
        quickActionsLabel={t('place.quick.label')}
        // Rows, most important first (Will, 5 October, D-291): getting
        // there, then asking a question, then calling, then the website.
        quickActions={[
          ...(directions || googleHref
            ? [
                {
                  id: 'directions',
                  label: t('place.quick.directions'),
                  description: service?.address ?? t('place.quick.directions.body'),
                  icon: <PlacesIcon {...QUICK} />,
                  href: (directions ?? googleHref)!,
                  isExternal: true,
                },
              ]
            : []),
          // The super admin writes to the program's lead, not as a member
          // would (D-349): "Message Sandra", to coordinate how they use Pam.
          // No lead known, no row.
          ...((demoRole ?? trueRole) === 'super_admin'
            ? leadMessage
              ? [
                  {
                    id: 'message',
                    label: t('place.quick.messageLead', { name: leadMessage.firstName }),
                    description: t('place.quick.messageLead.body'),
                    icon: <MessagesIcon {...QUICK} />,
                    href: leadMessage.href,
                  },
                ]
              : []
            : [
                // A message from the program waiting (D-305): the row says so,
                // with a pink dot and their newest words, and opens that
                // conversation.
                unread
                  ? {
                      id: 'message',
                      label: t('place.quick.newMessage'),
                      description: unread.preview,
                      icon: <MessagesIcon {...QUICK} />,
                      href: `${unread.href}${unread.href.includes('?') ? '&' : '?'}from=place&place=${encodeURIComponent(place!.id)}`,
                      hasDot: true,
                      // One line, then "…" (Will, D-306): the row says there is a
                      // message, the conversation says the rest.
                      isDescriptionOneLine: true,
                    }
                  : {
                      id: 'message',
                      label: t('place.quick.message'),
                      description: t('place.quick.message.body'),
                      icon: <MessagesIcon {...QUICK} />,
                      href: messageHrefFor(place!.name, place!.id),
                    },
              ]),
          ...(phone
            ? [
                {
                  id: 'call',
                  label: t('place.quick.call'),
                  // The number itself (Will, D-306: "no need to hide info").
                  description: displayPhone(phone),
                  icon: <PhoneIcon {...QUICK} />,
                  href: `tel:${phone}`,
                },
              ]
            : []),
          ...(website
            ? [
                {
                  id: 'website',
                  label: t('place.quick.website'),
                  description: siteName(website),
                  icon: <GlobeIcon {...QUICK} />,
                  href: website,
                  isExternal: true,
                },
              ]
            : []),
          // The program's policies, with the other rows (Will, 6 October,
          // D-326; was the foot of the page, D-270): a member can read them
          // before booking, and see how many are signed. Members only —
          // staff do not sign a program's policies.
          // Not before booking on a program with services (Will, D-313): the
          // policies are the service's, and come with the visit.
          ...(asksMember && !policiesOnTop && !(services.length > 0 && !visit)
            ? [
                {
                  id: 'policies',
                  label: t('place.policies'),
                  description: allSigned
                    ? t('place.policies.allSigned', { total: signedSoFar.total })
                    : t('place.policies.hint', { signed: signedSoFar.signed, total: signedSoFar.total }),
                  href: policiesHref(place!.id, place!.name, service?.id ?? null),
                  icon: allSigned ? <SignedIcon {...QUICK} /> : <BookIcon {...QUICK} />,
                },
              ]
            : []),
        ]}
        labels={{
          directions: t('place.directions'),
          call: t('place.call'),
          website: t('place.website'),
          hours: t('place.hours'),
          today: t('place.hours.today'),
          hoursOnGoogle: t('place.hoursOnGoogle'),
          about: service?.description ? t('place.aboutService') : t('place.about'),
          // Services at more than one address (Will, D-313): the card says
          // which — the program's "Main address", or the picked "Service
          // address" — and the words mask in anew when it changes.
          address: service?.address
            ? t('place.address.service')
            : services.some((s) => s.address)
              ? t('place.address.main')
              : t('place.address'),
          save: t('place.save'),
          saved: t('places.saved'),
          share: t('place.share'),
          flag: t('place.flag'),
        }}
      />

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
          <PlaceDetailSkeleton label="Loading" />
        </Page>
      }
    >
      <PlaceScreen />
    </Suspense>
  );
}
