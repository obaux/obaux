'use client';

import { useMemo, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { categoryLabelKey } from '@pam/config';
import { DUMMY_PLACES_BY_ID, type DummySavedPlace } from '@pam/config/dummy-places';
import { BigButton, TextLink, TripsIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { addTrip } from '@/lib/addedTrips';
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
type Step = 'where' | 'when' | 'check' | 'done';

const TIMES: readonly (readonly [number, number])[] = [
  [9, 0],
  [10, 30],
  [13, 0],
  [15, 30],
];

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  hint: { fontSize: '18px', lineHeight: 1.5 },
  label: { fontSize: '18px', fontWeight: 600 },
  choices: { width: '100%' },
  choice: { minHeight: '56px', minWidth: '96px', fontSize: '17px', borderRadius: '14px' },
  summaryName: { fontSize: '22px', lineHeight: 1.25, fontWeight: 700 },
  summaryLine: { fontSize: '18px', lineHeight: 1.4 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  state: { paddingBlock: '40px' },
  stateIcon: { width: '64px', height: '64px', color: colorVars['--color-icon-accent'] },
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

export function NewTripView({ initialPlaceId }: { readonly initialPlaceId?: string | null }) {
  const { t, locale } = useI18n();
  const places = useMemo(() => Object.values(DUMMY_PLACES_BY_ID), []);
  const initial = initialPlaceId ? (DUMMY_PLACES_BY_ID[initialPlaceId] ?? null) : null;
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
        : step === 'check'
          ? t('trips.new.check')
          : t('trips.new.done.title');

  return (
    <SubPage
      title={step === 'done' ? t('trips.new') : title}
      {...(step === 'done' ? {} : { subtitle: t('trips.new.step', { current: stepNumber, total: 3 }) })}
      backHref="/trips/"
      backLabel={t('nav.back.trips')}
      actions={<HelpButton />}
    >
      {step === 'where' ? (
        <>
          <Text type="supporting" xstyle={styles.hint}>
            {t('trips.new.whereHint')}
          </Text>
          <MenuList
            label={t('trips.new.where')}
            items={places.map((p) => ({
              id: p.id,
              label: p.name,
              description: t(categoryLabelKey(p.category)),
              icon: <BigCategoryIcon category={p.category} size={ICON} />,
              onSelect: () => {
                setPlace(p);
                setStep('when');
              },
            }))}
          />
        </>
      ) : null}

      {step === 'when' && place ? (
        <>
          <HStack gap={2} align="center" justify="between" wrap="nowrap">
            <Text xstyle={styles.hint}>{place.name}</Text>
            <TextLink label={t('trips.new.change')} onClick={() => setStep('where')} />
          </HStack>
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
                  xstyle={styles.choice}
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
                    xstyle={styles.choice}
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
              <HStack gap={3} align="center" justify="between" wrap="nowrap">
                <HStack gap={3} align="center" wrap="nowrap">
                  <BigCategoryIcon category={place.category} size={{ width: 40, height: 40, 'aria-hidden': true }} />
                  <Text xstyle={styles.summaryName}>{place.name}</Text>
                </HStack>
                <TextLink label={t('trips.new.change')} onClick={() => setStep('where')} />
              </HStack>
              <HStack gap={3} align="center" justify="between" wrap="nowrap">
                <Text xstyle={styles.summaryLine}>
                  {dayLong.format(day)} · {timeFmt.format(at(day, time))}
                </Text>
                <TextLink label={t('trips.new.change')} onClick={() => setStep('when')} />
              </HStack>
            </VStack>
          </Card>
          <TextArea label={t('trips.new.note')} value={note} onChange={setNote} rows={2} width="100%" />
          <BigButton
            label={t('trips.new.add')}
            onPress={() => {
              addTrip({
                id: `added-${Date.now()}`,
                placeId: place.id,
                placeName: place.name,
                category: place.category,
                lat: place.lat,
                lon: place.lon,
                startsAt: at(day, time).toISOString(),
                note: note.trim(),
              });
              setStep('done');
            }}
          />
          <Text type="supporting" xstyle={styles.note}>
            {t('trips.new.example')}
          </Text>
        </>
      ) : null}

      {step === 'done' ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<TripsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t('trips.new.done.title')}
          description={t('trips.new.done.body')}
          actions={<Button label={t('trips.new.done.see')} variant="primary" href="/trips/" />}
        />
      ) : null}
    </SubPage>
  );
}
