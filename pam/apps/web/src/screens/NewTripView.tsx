'use client';

import { useEffect, useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { CATEGORY_DEFINITIONS, categoryLabelKey, type Category } from '@pam/config';
import { DUMMY_PLACES_BY_ID, type DummySavedPlace } from '@pam/config/dummy-places';
import { BigButton, ExploreIcon } from '@pam/ui';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { SuccessScreen } from '@pam/ui/SuccessScreen';
import { useI18n } from '@/lib/i18n';
import { addTrip, moveTrip } from '@/lib/addedTrips';
import { inviteLink } from '@/lib/appUrl';
import { navigate } from '@/lib/navigate';
import { useServices } from '@/lib/useServices';
import { HelpButton } from './HelpButton';
import { BigCategoryIcon } from './SavedView';

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
 * Then a plain "Trip added" with the way back to the map.
 *
 * **Example only, for now**: nothing books an appointment with a program yet.
 * The trip is kept for the visit (`addedTrips`) so it appears on the map and
 * in the drawer as the real one will; the screen says so under the button.
 */
type Step = 'where' | 'when' | 'check';

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
  summaryName: { fontSize: '22px', lineHeight: 1.25, fontWeight: 700 },
  summaryLine: { fontSize: '18px', lineHeight: 1.4 },
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
}: {
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
  const { t, locale } = useI18n();
  const places = useMemo(() => Object.values(DUMMY_PLACES_BY_ID), []);
  const { forPlace } = useServices();
  const initial = useMemo(() => seedToPlace(initialPlace), [initialPlace]);
  const [place, setPlace] = useState<DummySavedPlace | null>(initial);
  // The service picked on the place's page (D-313), carried in the link.
  const offered = place ? forPlace(place.id) : [];
  const chosenService = initialService ? (offered.find((s) => s.id === initialService) ?? null) : null;
  // Started from a place's page: two steps, and Back returns to that page
  // (Will, D-313: "when going back from booking flow it should return to
  // the profile page, not all trips page").
  const fromPlace = initial !== null && !changing;
  const placeHref = initial ? `/place/?id=${encodeURIComponent(initial.id)}` : '/trips/';
  const [step, setStep] = useState<Step>(initial ? 'when' : 'where');
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<readonly [number, number] | null>(null);
  const [note, setNote] = useState('');
  // The visit's new time, once saved (D-282): the celebration shows it.
  const [movedTo, setMovedTo] = useState<Date | null>(null);
  // Booked for a member (D-316): the moment, then the program's Home.
  const [bookedAt, setBookedAt] = useState<Date | null>(null);
  const [bookedTripId, setBookedTripId] = useState<string | null>(null);
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

  const days = useMemo(() => nextWeekdays(10), []);
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const dayLong = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
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
          <BigButton label={t('trips.new.next')} onPress={() => setStep('check')} isDisabled={!day || !time} />
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
              // Straight to Trips (Will, 3 October, D-241): the drawer tall,
              // confetti, and the new trip arriving in the list.
              navigate(`/trips/?added=${encodeURIComponent(id)}`);
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
              {TIMES.map((slot) => {
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
          <Card padding={6}>
            <VStack gap={4}>
              <HStack gap={3} align="center" wrap="nowrap">
                <BigCategoryIcon category={place.category} size={{ width: 40, height: 40, 'aria-hidden': true }} />
                <Text xstyle={styles.summaryName}>{place.name}</Text>
              </HStack>
              {chosenService ? <Text xstyle={styles.summaryLine}>{t('trips.new.service', { service: chosenService.name })}</Text> : null}
              <Text xstyle={styles.summaryLine}>
                {dayLong.format(day)} · {timeFmt.format(at(day, time))}
              </Text>
            </VStack>
          </Card>
          <TextArea label={t('trips.new.note')} value={note} onChange={setNote} rows={2} width="100%" />
          <Text type="supporting" xstyle={styles.note}>
            {t('trips.new.example')}
          </Text>
        </>
      ) : null}

    </SubPage>
  );
}
