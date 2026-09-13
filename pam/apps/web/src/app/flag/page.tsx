'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { RadioList } from '@astryxdesign/core/RadioList';
import { RadioListItem } from '@astryxdesign/core/RadioList';
import { TextArea } from '@astryxdesign/core/TextArea';
import { AppHeader, BigButton, HelpBar, Notice, Page, PageTitle, TextLink } from '@pam/ui';
import { SERVICE_FLAG_REASON_KEYS, type ServiceFlagReason } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * "Something is wrong here."
 *
 * A member standing outside a place that is closed, or that moved, or that
 * never took new people, is the person PAM has failed most concretely — they
 * made a journey on our word. This screen is how that fact gets back, and it is
 * deliberately three taps: pick the reason, send, done.
 *
 * **The reasons are fixed, and they are the four the database accepts**
 * (`flag_service`, 0036). Not a free-text box with examples: a free-text box
 * asks somebody to write a sentence about a bad morning, produces answers
 * nobody can count, and is the thing most likely to make them give up. The four
 * cover what actually goes wrong with a listing, and the note underneath is
 * there for the fifth case, optional and clearly so.
 *
 * Where it goes: a flag writes a row, and a database trigger notifies every
 * super admin and the case manager of anybody who had saved that place (A7,
 * 0038). A super admin decides — keep it or take it off the list — and that
 * decision is theirs alone (0033). Nobody at the place is told who reported it,
 * which is stated on the screen rather than left to be assumed, because the
 * person doing this is often the person with the least power in the situation.
 */

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  card: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

function FlagForm() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const serviceId = params.get('place');

  const [reason, setReason] = useState<ServiceFlagReason>('closed');
  const [note, setNote] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'failed'>('idle');

  if (!serviceId) {
    // Arrived without a place: a shared link, a stale bookmark, a typo. Say so
    // and point at the way in rather than showing a form that cannot send.
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('flag.title')} backHref="/places/" backLabel={t('nav.back.places')} />
        <Notice
          notice="something_went_wrong"
          title={t('flag.missing.title')}
          body={t('flag.missing.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('places.title')} href="/places/" />
      </Page>
    );
  }

  const send = async () => {
    setStatus('sending');
    try {
      const { createClient } = await import('@/lib/supabase');
      const { error } = await createClient().rpc('flag_service', {
        p_service_id: serviceId,
        p_reason: reason,
        p_note: note.trim() === '' ? null : note.trim(),
      });
      setStatus(error ? 'failed' : 'done');
    } catch {
      setStatus('failed');
    }
  };

  if (status === 'done') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('flag.title')} backHref="/places/" backLabel={t('nav.back.places')} />
        <Notice
          notice="service_not_available"
          title={t('flag.done.title')}
          body={t('flag.done.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('places.title')} href="/places/" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader />
      <PageTitle title={t('flag.title')} backHref="/places/" backLabel={t('nav.back.places')} />

      <Text type="supporting" xstyle={styles.intro}>
        {t('flag.intro')}
      </Text>

      {status === 'failed' ? (
        <Notice
          notice="something_went_wrong"
          title={t('flag.failed.title')}
          body={t('flag.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      <Card padding={4} xstyle={styles.card}>
        <VStack gap={3}>
          {/*
            One choice, always one selected, in the order things go wrong. The
            keys are the database's four and the labels are the member's words
            for them — "It is closed", not "closed".
          */}
          <RadioList
            label={t('flag.title')}
            isLabelHidden
            value={reason}
            onChange={(next) => setReason(next as ServiceFlagReason)}
          >
            {SERVICE_FLAG_REASON_KEYS.map((key) => (
              <RadioListItem key={key} value={key} label={t(`flag.reason.${key}`)} />
            ))}
          </RadioList>

          <TextArea
            label={t('flag.note')}
            value={note}
            onChange={(next) => setNote(next)}
            rows={3}
            width="100%"
          />

          <BigButton
            label={status === 'sending' ? t('flag.sending') : t('flag.action')}
            onPress={() => void send()}
            isDisabled={status === 'sending'}
          />
        </VStack>
      </Card>

      <TextLink label={t('places.title')} href="/places/" />
      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary in an exported app, and the
 * fallback is a real screen rather than a spinner: the header and the way back
 * are the two things that must never depend on a chunk arriving.
 */
export default function FlagPage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <AppHeader />
        </Page>
      }
    >
      <FlagForm />
    </Suspense>
  );
}
