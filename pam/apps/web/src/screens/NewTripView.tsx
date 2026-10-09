'use client';

import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { Banner } from '@astryxdesign/core/Banner';
import { Button } from '@pam/ui/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CATEGORY_DEFINITIONS, categoryLabelKey, type Category, intlLocale } from '@pam/config';
import { DUMMY_PLACES_BY_ID, type DummySavedPlace } from '@pam/config/dummy-places';
import { BigButton, BookIcon, ExploreIcon, SignedIcon, UserPlusIcon } from '@pam/ui';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { SuccessScreen } from '@pam/ui/SuccessScreen';
import { useI18n } from '@/lib/i18n';
import { addTrip, moveTrip, readAddedTrips, withMoves } from '@/lib/addedTrips';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { friendLink, inviteLink } from '@/lib/appUrl';
import { navigate } from '@/lib/navigate';
import { countdown } from '@/lib/when';
import { FRIEND_BANNER, FRIEND_BANNER_SRCSET } from '@/lib/friendBanner';
import { useServices } from '@/lib/useServices';
import { HelpButton } from './HelpButton';
import { BigCategoryIcon, CategoryPicture } from './SavedView';
import { ProgramVisitCard } from '@pam/ui/ProgramVisitCard';
import { VisitCard } from '@pam/ui/VisitCard';
import { BringFriend, copyLink } from '@pam/ui/BringFriend';
import { placeAsksForPolicies } from '@pam/config/dummy-policies';
import { policiesForService } from '@pam/config/dummy-services';
import { usePolicies } from '@/lib/usePolicies';
import { useMySignatures } from '@/lib/useMySignatures';
import { policiesHref } from './MemberPoliciesView';
import { bookingFor, nextDropIns } from '@pam/config/dummy-booking';

/**
 * New trip — planning a visit (D-225, Will, 2 October: the + on Trips "opens
 * up the appointment setting journey"). Three short steps on the nested
 * template, one decision each, so nobody has to hold more than one thing:
 *
 *   1. **Where** — a program, the saved ones first, one tap each. A
 *      program with services opens its page instead, where the service is
 *      picked (D-313); there is no service step here.
 *   2. **When** — a day (the next two weeks of weekdays) and a time, as big
 *      buttons; Next once both are picked.
 *   3. **Check** — the place, the day and time (each with Change), an
 *      optional note, and Add this trip — the step's one primary action.
 *
 * Then **booked** (D-333): the program card with the day and time, and Bring
 * a friend, folded, with the link to the booked slot; Done goes to Trips.
 * A walk-in plans the same way, from the days it meets at its set time, so
 * staff see who is coming.
 *
 * **Example only, for now**: nothing books an appointment with a program yet.
 * The trip is kept for the visit (`addedTrips`) so it appears on the map and
 * in the drawer as the real one will; the screen says so under the button.
 */
type Step = 'where' | 'when' | 'check';

const WALK_IN_DAYS = 4;

const TIMES: readonly (readonly [number, number])[] = [
  [9, 0],
  [10, 30],
  [13, 0],
  [15, 30],
];

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

/** How long the "Visit moved" celebration stays before going home (D-282). */
const MOVED_HOLD_MS = 5000;

const styles = stylex.create({
  home: { minHeight: '56px', fontSize: '17px', paddingInline: '28px', borderRadius: '999px' },
  hint: { fontSize: '18px', lineHeight: 1.5 },
  // The chosen place on When, in the trip card's name style (Will, D-235).
  placeName: { fontSize: '17px', lineHeight: 1.3, fontWeight: 700 },
  label: { fontSize: '18px', fontWeight: 600 },
  choices: { width: '100%' },
  // Day and time choices (Will, 3 October, D-235): smaller, white pills
  // with a grey outline like the round header buttons; the chosen one fills
  // green. Still the 48px touch floor (§2.5).
  choice: {
    minHeight: '48px',
    paddingInline: '16px',
    fontSize: '15px',
    borderRadius: '999px',
  },
  choiceOff: {
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  choiceOn: { fontWeight: 600 },
  round: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

/** The next `count` weekdays, from tomorrow. */
function nextWeekdays(count: number): Date[] {
  const out: Date[] = [];
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  while (out.length < count) {
    d.setDate(d.getDate() + 1);
    if (d.getDay() !== 0 && d.getDay() !== 6) out.push(new Date(d));
  }
  return out;
}

/**
 * A place handed over by "Schedule a visit" on a place's page (D-235): the
 * steps start at When, with this place already chosen. An example place is
 * looked up by id; any other arrives with its name and kind in the link.
 */
export interface TripPlaceSeed {
  readonly id: string;
  readonly name?: string | null;
  readonly category?: string | null;
  readonly address?: string | null;
}

function seedToPlace(seed: TripPlaceSeed | null | undefined): DummySavedPlace | null {
  if (!seed) return null;
  const known = DUMMY_PLACES_BY_ID[seed.id];
  if (known) return known;
  if (!seed.name || !seed.category || !(seed.category in CATEGORY_DEFINITIONS)) return null;
  return {
    id: seed.id,
    name: seed.name,
    category: seed.category as Category,
    address: seed.address ?? '',
    phone: null,
    lat: 0,
    lon: 0,
    description: '',
  };
}

export function NewTripView({
  initialPlace = null,
  initialService = null,
  changing = null,
  forMember = null,
  booked = null,
}: {
  /** A trip already booked (D-333): open on its booked screen. */
  readonly booked?: string | null;
  readonly initialPlace?: TripPlaceSeed | null;
  /** A service already chosen, from its own page (D-313). */
  readonly initialService?: string | null;
  /**
   * A program booking for somebody who wrote to it (D-316): the trip is
   * theirs — it lands on their Trips — and the program is told so.
   */
  readonly forMember?: { readonly id: string; readonly name: string; readonly phone?: string } | null;
  /**
   * The trip being moved, from a place's "Change appointment" (D-281): the
   * same When and Check, then saving moves that trip instead of adding one
   * and celebrates the new time before going home (D-282).
   */
  readonly changing?: string | null;
}) {
  const { t, tPlain, locale } = useI18n();
  const router = useRouter();
  const places = useMemo(() => Object.values(DUMMY_PLACES_BY_ID), []);
  const { forPlace } = useServices();
  const { policies } = usePolicies();
  const { progress } = useMySignatures();
  const initial = useMemo(() => seedToPlace(initialPlace), [initialPlace]);
  // Opened on a booked trip (D-333): its place and slot, read once.
  const [bookedTrip] = useState(() => {
    if (!booked) return null;
    const trip = withMoves([...DUMMY_TRIPS, ...readAddedTrips()]).find((x) => x.id === booked);
    const at = trip ? DUMMY_PLACES_BY_ID[trip.placeId] : undefined;
    return trip && at ? { trip, place: at } : null;
  });
  const [place, setPlace] = useState<DummySavedPlace | null>(bookedTrip?.place ?? initial);
  // The service picked on the place's page (D-313), carried in the link.
  const offered = place ? forPlace(place.id) : [];
  const serviceId = initialService ?? bookedTrip?.trip.serviceId ?? null;
  const chosenService = serviceId ? (offered.find((s) => s.id === serviceId) ?? null) : null;
  // Started from a place's page: two steps, and Back returns to that page
  // (Will, D-313: "when going back from booking flow it should return to
  // the profile page, not all trips page").
  const fromPlace = initial !== null && !changing;
  const placeHref = initial ? `/place/?id=${encodeURIComponent(initial.id)}` : '/trips/';
  const [step, setStep] = useState<Step>(initial ? 'when' : 'where');
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<readonly [number, number] | null>(null);
  const [note, setNote] = useState('');
  // Next pressed with something missing (Will, 7 October, D-334): say what.
  const [triedNext, setTriedNext] = useState(false);
  // The booked screen's Bring a friend drawer (D-336).
  const [friendOpen, setFriendOpen] = useState(false);
  const [friendCopiedAt, setFriendCopiedAt] = useState<number | null>(null);
  // The visit's new time, once saved (D-282): the celebration shows it.
  const [movedTo, setMovedTo] = useState<Date | null>(null);
  // Booked for a member (D-316): the moment, then the program's Home.
  const [bookedAt, setBookedAt] = useState<Date | null>(null);
  const [bookedTripId, setBookedTripId] = useState<string | null>(null);
  // The member's own booking, confirmed (D-333): the booked screen.
  const [confirmed, setConfirmed] = useState<{ readonly id: string; readonly at: Date } | null>(
    bookedTrip ? { id: bookedTrip.trip.id, at: new Date(bookedTrip.trip.startsAt) } : null,
  );
  useEffect(() => {
    if (!bookedAt) return;
    const timer = setTimeout(() => navigate('/'), MOVED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [bookedAt]);
  // A moment, not a stop (Will, 5 October): home on its own after a few
  // seconds, or straight away with the button.
  useEffect(() => {
    if (!movedTo) return;
    const timer = setTimeout(() => navigate('/'), MOVED_HOLD_MS);
    return () => clearTimeout(timer);
  }, [movedTo]);

  // A walk-in (D-333): the days it meets, at its set time; otherwise any
  // weekday in the next two weeks, at one of four times.
  const booking = place ? bookingFor(place.id) : null;
  const walkIn = booking?.kind === 'dropin' ? booking.schedule : null;
  const days = useMemo(
    () => (walkIn ? nextDropIns(walkIn, WALK_IN_DAYS) : nextWeekdays(10)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the schedule is a lookup by place.
    [place?.id],
  );
  const times: readonly (readonly [number, number])[] = walkIn ? [[walkIn.hour, walkIn.minute]] : TIMES;
  // Its one time, already picked.
  useEffect(() => {
    if (walkIn) setTime([walkIn.hour, walkIn.minute]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [place?.id]);
  const dayFmt = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' });
  const dayLong = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'long', day: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' });
  const at = (d: Date, [h, m]: readonly [number, number]) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x;
  };

  if (movedTo && place) {
    return (
      <SuccessScreen
        title={t('trips.moved.title')}
        body={t('trips.moved.body', { place: place.name, day: dayLong.format(movedTo), time: timeFmt.format(movedTo) })}
        action={<Button label={t('trips.moved.home')} variant="secondary" href="/" xstyle={styles.home} />}
        note={t('trips.moved.note')}
      />
    );
  }

  if (bookedAt && place && forMember) {
    const vars = { place: place.name, day: dayLong.format(bookedAt), time: timeFmt.format(bookedAt) };
    // Somebody new to Pam (D-322): they are texted a link that opens on this
    // visit. The text itself is shown, so the program knows what they got.
    const texted = Boolean(forMember.phone);
    return (
      <SuccessScreen
        title={t('trips.booked.title', { name: forMember.name })}
        body={texted ? t('trips.booked.texted', { ...vars, name: forMember.name }) : t('trips.booked.body', vars)}
        action={<Button label={t('trips.moved.home')} variant="secondary" href="/" xstyle={styles.home} />}
        {...(texted
          ? { note: t('trips.booked.sms', { ...vars, link: inviteLink('PAM-7Q4K', 'member', bookedTripId) }) }
          : {})}
      />
    );
  }

  if (confirmed && place && !forMember) {
    // Trips, where the new trip animates in (D-241).
    const done = `/trips/?added=${encodeURIComponent(confirmed.id)}`;
    // What is still to sign for this visit (D-334): the service's policies,
    // or the program's.
    const forVisit = chosenService ? policiesForService(chosenService, policies, offered) : policies;
    const toSign = placeAsksForPolicies(place.id) && forVisit.length > 0 ? progress(place.id, forVisit) : null;
    return (
      <SubPage
        title={t('trips.confirm.title')}
        // The end of the flow (Will, D-334): an × that closes to Trips, not
        // a way back into booking.
        backIcon="close"
        backHref={done}
        backLabel={t('trips.confirm.close')}
        footer={<BigButton label={t('trips.confirm.done')} href={done} />}
      >
        {/*
          The confirmed visit is the green card a booked place shows (Will,
          7 October, D-337), named for the program, with how soon and a way
          to move it right here.
        */}
        <VisitCard
          eyebrow={place.name}
          day={dayLong.format(confirmed.at)}
          time={timeFmt.format(confirmed.at)}
          service={chosenService?.name ?? null}
          countdown={countdown(confirmed.at, t)}
          changeLabel={t('place.visit.change')}
          changeHref={`/trips/new/?${new URLSearchParams({
            place: place.id,
            name: place.name,
            category: place.category,
            ...(place.address ? { address: place.address } : {}),
            change: confirmed.id,
          }).toString()}`}
        />
        {/* Plain rows on the page, like a place's (D-337): no card around them. */}
        <MenuList
          label={t('trips.confirm.next')}
          hasDividers
          items={[
            ...(toSign
              ? [
                  {
                    id: 'policies',
                    label: t('place.policies'),
                    description:
                      toSign.signed === toSign.total
                        ? t('place.policies.allSigned', { total: toSign.total })
                        : t('place.policies.hint', { signed: toSign.signed, total: toSign.total }),
                    icon: toSign.signed === toSign.total ? <SignedIcon {...ICON} /> : <BookIcon {...ICON} />,
                    // Carries the trip, so the last policy closes to Trips (D-336).
                    href: `${policiesHref(place.id, place.name, chosenService?.id ?? null)}&trip=${encodeURIComponent(confirmed.id)}`,
                  },
                ]
              : []),
            {
              id: 'friend',
              label: t('friend.label'),
              description: t('friend.row'),
              icon: <UserPlusIcon {...ICON} />,
              // Copies the link in this tap (Safari allows it only here),
              // then opens the drawer saying so (D-337).
              onSelect: () => {
                void copyLink(friendLink(place.id, confirmed.at.toISOString())).then((ok) => {
                  if (ok) setFriendCopiedAt(Date.now());
                });
                setFriendOpen(true);
              },
            },
          ]}
        />
        <BringFriend
          isOpen={friendOpen}
          onOpenChange={setFriendOpen}
          label={t('friend.label')}
          body={t('friend.body')}
          link={friendLink(place.id, confirmed.at.toISOString())}
          linkLabel={t('friend.link')}
          copyLabel={t('friend.copy')}
          copiedLabel={t('friend.copied')}
          closeLabel={t('friend.close')}
          shareLabel={t('friend.share')}
          shareText={tPlain('friend.share.message', {
            place: place.name,
            when: `${dayLong.format(confirmed.at)}, ${timeFmt.format(confirmed.at)}`,
            link: friendLink(place.id, confirmed.at.toISOString()),
          })}
          copiedAt={friendCopiedAt}
          heroSrc={FRIEND_BANNER}
          heroSrcSet={FRIEND_BANNER_SRCSET}
        />
      </SubPage>
    );
  }

  const totalSteps = fromPlace ? 2 : 3;
  const stepNumber = step === 'where' ? 1 : step === 'when' ? totalSteps - 1 : totalSteps;
  const title =
    changing && step === 'when'
      ? t('trips.new.changeTitle')
      : step === 'where'
        ? t('trips.new.where')
        : step === 'when'
          ? t('trips.new.when')
          : t('trips.new.check');

  return (
    <SubPage
      title={title}
      // For a member (D-316), the subtitle says who, since the steps are
      // the same ones the member would see.
      subtitle={
        forMember ? t('trips.new.for', { name: forMember.name }) : changing ? undefined : t('trips.new.step', { current: stepNumber, total: totalSteps })
      }
      backHref={forMember ? '/program/book/' : initial ? placeHref : '/trips/'}
      backLabel={
        step === 'where' ? t('nav.back.trips') : step === 'when' && initial && !forMember ? t('nav.back.place') : t('trips.new.back')
      }
      // Back is a step (Will, 3 October, D-235): Check → When → Where →
      // Trips. That is the way to change an answer, so no "Change" links.
      // Moving a visit has no Where: back from When is back to the place.
      // From a place's page, When has no step behind it: Back is the page.
      {...(step === 'when' && !initial
        ? { onBack: () => setStep('where') }
        : step === 'check'
          ? { onBack: () => setStep('when') }
          : {})}
      // Plan a trip (D-235): search where Help was on the first step; no
      // Help on When either (Will). Check and Done keep Help.
      // The step's one button at the foot of the screen (D-326), like a
      // place's Plan a trip: Next on When, Add this trip on Check.
      footer={
        step === 'when' && place ? (
          // Always tappable at the foot (D-334): with a day or time missing it
          // says which, above Day, rather than sitting greyed out.
          <BigButton
            label={t('trips.new.next')}
            onPress={() => {
              if (day && time) setStep('check');
              else setTriedNext(true);
            }}
          />
        ) : step === 'check' && place && day && time ? (
          <BigButton
            label={
              forMember ? t('trips.new.addFor', { name: forMember.name }) : t(changing ? 'trips.new.saveChange' : 'trips.new.add')
            }
            onPress={() => {
              if (changing) {
                const when = at(day, time);
                moveTrip(changing, when.toISOString());
                setMovedTo(when);
                return;
              }
              const id = `added-${Date.now()}`;
              addTrip({
                id,
                placeId: place.id,
                placeName: place.name,
                category: place.category,
                lat: place.lat,
                lon: place.lon,
                startsAt: at(day, time).toISOString(),
                note: note.trim(),
                ...(forMember ? { forMemberId: forMember.id, forName: forMember.name } : {}),
                ...(chosenService ? { serviceId: chosenService.id, serviceName: chosenService.name } : {}),
              });
              if (forMember) {
                // The program's moment (D-316), then its Home — not the
                // member's Trips, which is theirs.
                setBookedTripId(id);
                setBookedAt(at(day, time));
                return;
              }
              // Booked (D-333): the confirmation with Bring a friend, then
              // Trips with its confetti (D-241) from Done.
              setConfirmed({ id, at: at(day, time) });
              // The booked screen takes this screen's place in history (Will,
              // 7 October, D-337): Back from Policies to sign returns here,
              // not to a fresh Plan a visit at its first step.
              router.replace(`/trips/new/?booked=${encodeURIComponent(id)}`, { scroll: false });
            }}
          />
        ) : null
      }
      actions={
        step === 'where' ? (
          // Search opens Explore, where every place can be searched (Will,
          // 3 October, D-247) — rather than a second, smaller search here.
          <IconButton
            label={t('trips.new.search')}
            icon={<Icon icon="search" size="md" />}
            variant="ghost"
            href="/"
            xstyle={styles.round}
          />
        ) : step === 'when' ? undefined : (
          <HelpButton />
        )
      }
    >
      {step === 'where' ? (
        <>
          <Text type="supporting" xstyle={styles.hint}>
            {t('trips.new.whereHint')}
          </Text>
          <MenuList
            label={t('trips.new.where')}
            hasDividers
            items={[
              ...places.map((p) => ({
              id: p.id,
              label: p.name,
              description: t(categoryLabelKey(p.category)),
              icon: <BigCategoryIcon category={p.category} size={ICON} />,
              onSelect: () => {
                // A program with services: its page, to pick one (D-313).
                if (forPlace(p.id).length > 0) {
                  navigate(`/place/?id=${encodeURIComponent(p.id)}`);
                  return;
                }
                setPlace(p);
                setStep('when');
              },
            })),
              // A fourth way on (Will, 3 October): every place, on Explore.
              {
                id: 'all',
                label: t('trips.new.viewAll'),
                icon: <ExploreIcon {...ICON} />,
                href: '/',
              },
            ]}
          />
        </>
      ) : null}

      {step === 'when' && place ? (
        <>
          {triedNext && (!day || !time) ? (
            <Banner
              status="warning"
              title={t(!day && !time ? 'trips.new.missing.both' : !day ? 'trips.new.missing.day' : 'trips.new.missing.time')}
            />
          ) : null}
          <Text xstyle={styles.placeName}>{place.name}</Text>
          {chosenService ? (
            <Text type="supporting" xstyle={styles.hint}>
              {t('trips.new.service', { service: chosenService.name })}
            </Text>
          ) : null}
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.label}>
              {t('trips.new.day')}
            </Heading>
            <HStack gap={2} wrap="wrap" xstyle={styles.choices}>
              {days.map((d) => (
                <Button
                  key={d.toISOString()}
                  label={dayFmt.format(d)}
                  variant={day?.getTime() === d.getTime() ? 'primary' : 'secondary'}
                  aria-pressed={day?.getTime() === d.getTime()}
                  onClick={() => setDay(d)}
                  xstyle={[styles.choice, day?.getTime() === d.getTime() ? styles.choiceOn : styles.choiceOff]}
                />
              ))}
            </HStack>
          </VStack>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.label}>
              {t('trips.new.time')}
            </Heading>
            <HStack gap={2} wrap="wrap" xstyle={styles.choices}>
              {times.map((slot) => {
                const isOn = time !== null && time[0] === slot[0] && time[1] === slot[1];
                return (
                  <Button
                    key={`${slot[0]}:${slot[1]}`}
                    label={timeFmt.format(at(new Date(), slot))}
                    variant={isOn ? 'primary' : 'secondary'}
                    aria-pressed={isOn}
                    onClick={() => setTime(slot)}
                    xstyle={[styles.choice, isOn ? styles.choiceOn : styles.choiceOff]}
                  />
                );
              })}
            </HStack>
          </VStack>
        </>
      ) : null}

      {step === 'check' && place && day && time ? (
        <>
          {/* The program in its colour, then what is being booked (D-332). */}
          <ProgramVisitCard
            name={place.name}
            art={<CategoryPicture category={place.category} />}
            lines={[
              ...(chosenService ? [t('trips.new.service', { service: chosenService.name })] : []),
              `${dayLong.format(day)} · ${timeFmt.format(at(day, time))}`,
            ]}
            countdown={countdown(at(day, time), t)}
          />
          <TextArea label={t('trips.new.note')} value={note} onChange={setNote} rows={2} width="100%" />
          <Text type="supporting" xstyle={styles.note}>
            {t('trips.new.example')}
          </Text>
        </>
      ) : null}

    </SubPage>
  );
}
