'use client';

import { useMemo, useState } from 'react';
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
import { useI18n } from '@/lib/i18n';
import { addTrip } from '@/lib/addedTrips';
import { navigate } from '@/lib/navigate';
import { HelpButton } from './HelpButton';
import { BigCategoryIcon } from './SavedView';

/**
 * New trip — planning a visit (D-225, Will, 2 October: the + on Trips "opens
 * up the appointment setting journey"). Three short steps on the nested
 * template, one decision each, so nobody has to hold more than one thing:
 *
 *   1. **Where** — a program, the saved ones first, one tap each.
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

const styles = stylex.create({
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

export function NewTripView({ initialPlace = null }: { readonly initialPlace?: TripPlaceSeed | null }) {
  const { t, locale } = useI18n();
  const places = useMemo(() => Object.values(DUMMY_PLACES_BY_ID), []);
  const initial = useMemo(() => seedToPlace(initialPlace), [initialPlace]);
  const [step, setStep] = useState<Step>(initial ? 'when' : 'where');
  const [place, setPlace] = useState<DummySavedPlace | null>(initial);
  const [day, setDay] = useState<Date | null>(null);
  const [time, setTime] = useState<readonly [number, number] | null>(null);
  const [note, setNote] = useState('');

  const days = useMemo(() => nextWeekdays(10), []);
  const dayFmt = new Intl.DateTimeFormat(locale, { weekday: 'short', month: 'short', day: 'numeric' });
  const dayLong = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const timeFmt = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  const at = (d: Date, [h, m]: readonly [number, number]) => {
    const x = new Date(d);
    x.setHours(h, m, 0, 0);
    return x;
  };

  const stepNumber = step === 'where' ? 1 : step === 'when' ? 2 : 3;
  const title =
    step === 'where'
      ? t('trips.new.where')
      : step === 'when'
        ? t('trips.new.when')
        : t('trips.new.check');

  return (
    <SubPage
      title={title}
      subtitle={t('trips.new.step', { current: stepNumber, total: 3 })}
      backHref="/trips/"
      backLabel={step === 'where' ? t('nav.back.trips') : t('trips.new.back')}
      // Back is a step (Will, 3 October, D-235): Check → When → Where →
      // Trips. That is the way to change an answer, so no "Change" links.
      {...(step === 'when'
        ? { onBack: () => setStep('where') }
        : step === 'check'
          ? { onBack: () => setStep('when') }
          : {})}
      // Plan a trip (D-235): search where Help was on the first step; no
      // Help on When either (Will). Check and Done keep Help.
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
          <BigButton label={t('trips.new.next')} onPress={() => setStep('check')} isDisabled={!day || !time} />
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
              <Text xstyle={styles.summaryLine}>
                {dayLong.format(day)} · {timeFmt.format(at(day, time))}
              </Text>
            </VStack>
          </Card>
          <TextArea label={t('trips.new.note')} value={note} onChange={setNote} rows={2} width="100%" />
          <BigButton
            label={t('trips.new.add')}
            onPress={() => {
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
              });
              // Straight to Trips (Will, 3 October, D-241): the drawer tall,
              // confetti, and the new trip arriving in the list.
              navigate(`/trips/?added=${encodeURIComponent(id)}`);
            }}
          />
          <Text type="supporting" xstyle={styles.note}>
            {t('trips.new.example')}
          </Text>
        </>
      ) : null}

    </SubPage>
  );
}
