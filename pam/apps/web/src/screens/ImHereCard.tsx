'use client';

import { useState } from 'react';
import { Banner } from '@astryxdesign/core/Banner';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { markHere, markWent } from '@/lib/imHere';
import { loadSavedTrips } from '@/lib/savedTrips';

/**
 * "I'm here" (D-535): on a real visit's page, from two hours before it to four
 * hours after it starts. One primary button asks the phone where it is, once, and
 * the database says whether that is the place; "I went" says so without sharing a
 * position, for fewer points. Nothing about where the person is stays in the app.
 */
type Step = 'idle' | 'locating' | 'sending' | 'not-yet' | 'no-location' | 'limit' | 'too-late' | 'failed' | 'done';

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
  const [step, setStep] = useState<Step>('idle');
  const [points, setPoints] = useState(0);
  const locating = step === 'locating';
  // "I went" sends no position, so it never says it is checking where you are.
  const busy = locating || step === 'sending';

  const done = (earned: number) => {
    setPoints(earned);
    setStep('done');
    onMarked?.();
    // Trips and this page read the visit again: it is marked now.
    void loadSavedTrips();
  };
  const here = async () => {
    setStep('locating');
    const result = await markHere(visitId);
    if (result.kind === 'there') return done(result.points);
    setStep(result.kind === 'error' ? 'failed' : result.kind);
  };
  const went = async () => {
    setStep('sending');
    const result = await markWent(visitId);
    if (result.kind === 'went') return done(result.points);
    setStep(result.kind === 'error' ? 'failed' : result.kind);
  };

  if (step === 'done') {
    return <Banner status="success" title={t('checkin.done')} description={points > 0 ? t('checkin.points', { points }) : undefined} />;
  }
  return (
    <VStack gap={3}>
      {step === 'not-yet' ? <Banner status="info" title={t('checkin.notYet', { place: placeName })} /> : null}
      {step === 'no-location' ? <Banner status="info" title={t('checkin.noLocation', { place: placeName })} /> : null}
      {step === 'limit' ? <Banner status="info" title={t('checkin.limit')} /> : null}
      {step === 'too-late' ? <Banner status="info" title={t('checkin.tooLate')} /> : null}
      {step === 'failed' ? <Banner status="error" title={t('join.failed.title')} /> : null}
      <BigButton
        label={t(locating ? 'checkin.locating' : 'checkin.here')}
        isDisabled={busy}
        onPress={() => void here()}
      />
      <TextLink label={t('checkin.went')} onClick={() => void went()} isDisabled={busy} />
    </VStack>
  );
}
