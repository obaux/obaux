'use client';

import { useRef, useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useMalfunction } from '@/lib/malfunction';
import { markHere, markWent } from '@/lib/imHere';
import { loadSavedTrips } from '@/lib/savedTrips';

/**
 * "I'm here" (D-535): on a real visit's page, from two hours before it to four
 * hours after it starts. One primary button asks the phone where it is, once, and
 * the database says whether that is the place; "I went" says so without sharing a
 * position, for fewer points. Nothing about where the person is stays in the app.
 */
type Step = 'idle' | 'locating' | 'sending' | 'not-yet' | 'no-location' | 'limit' | 'too-late' | 'done';

export function ImHereCard({
  visitId,
  placeName,
  onMarked,
}: {
  readonly visitId: string;
  readonly placeName: string;
  /** The visit is marked: the page can stop offering what only an unmarked visit needs (Cancel this visit). */
  readonly onMarked?: () => void;
}) {
  const { t } = useI18n();
  const malfunction = useMalfunction();
  const [step, setStep] = useState<Step>('idle');
  const [points, setPoints] = useState(0);
  const locating = step === 'locating';
  // "I went" sends no position, so it never says it is checking where you are.
  // A second tap while one is out is ignored, and the buttons stay enabled: a disabled button that has focus drops it to the page, and
  // after a failure the page jumps to the bottom with the button off screen (Iris L2). The words say what is happening instead.
  const inFlight = useRef(false);
  const root = useRef<HTMLDivElement | null>(null);
  /** The control that was tapped: the focused one, or (a phone does not focus a tapped button) the card's button or link. */
  const tapped = (which: 'here' | 'went'): Element | null => {
    const now = document.activeElement;
    if (now && now !== document.body && root.current?.contains(now)) return now;
    const controls = root.current?.querySelectorAll('button, a') ?? [];
    return (which === 'here' ? controls[0] : controls[controls.length - 1]) ?? null;
  };

  const done = (earned: number) => {
    setPoints(earned);
    setStep('done');
    onMarked?.();
    // Trips and this page read the visit again: it is marked now.
    void loadSavedTrips();
  };
  /** The save did not go through (D-616): the small alert at the bottom, and the card is as it was. A late answer is read again. */
  const failed = (action: 'checkin.here' | 'checkin.went', result: { readonly error: unknown; readonly late?: Promise<void> }, from: Element | null) => {
    setStep('idle');
    malfunction.show(action, result.error, from);
    // Keep the person where they were (Iris L2): the control that failed keeps focus, and the page does not jump away from it.
    if (from instanceof HTMLElement && from.isConnected) from.focus({ preventScroll: true });
    void result.late?.then(() => loadSavedTrips());
  };
  const here = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const from = tapped('here');
    setStep('locating');
    const result = await markHere(visitId).finally(() => {
      inFlight.current = false;
    });
    if (result.kind === 'there') return done(result.points);
    if (result.kind === 'error') return failed('checkin.here', result, from);
    setStep(result.kind);
  };
  const went = async () => {
    if (inFlight.current) return;
    inFlight.current = true;
    const from = tapped('went');
    setStep('sending');
    const result = await markWent(visitId).finally(() => {
      inFlight.current = false;
    });
    if (result.kind === 'went') return done(result.points);
    if (result.kind === 'error') return failed('checkin.went', result, from);
    setStep(result.kind);
  };

  if (step === 'done') {
    return <Banner status="success" title={t('checkin.done')} description={points > 0 ? t('checkin.points', { points }) : undefined} />;
  }
  return (
    <div ref={root}>
    <VStack gap={3}>
      {step === 'not-yet' ? <Banner status="info" title={t('checkin.notYet', { place: placeName })} /> : null}
      {step === 'no-location' ? <Banner status="info" title={t('checkin.noLocation', { place: placeName })} /> : null}
      {step === 'limit' ? <Banner status="info" title={t('checkin.limit')} /> : null}
      {step === 'too-late' ? <Banner status="info" title={t('checkin.tooLate')} /> : null}
      <BigButton
        label={t(locating ? 'checkin.locating' : 'checkin.here')}
        onPress={() => void here()}
      />
      <TextLink label={t('checkin.went')} onClick={() => void went()} />
    </VStack>
    </div>
  );
}
