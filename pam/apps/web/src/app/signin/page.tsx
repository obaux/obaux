'use client';

import { useEffect, useId, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import {
  AppHeader,
  BigButton,
  Notice,
  OnboardingSlides,
  Page,
  PeopleIcon,
  PlacesIcon,
  PlanIcon,
  TextField,
  TextLink,
} from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';

/**
 * The only way into PAM, and the same door for everybody: a member, a program
 * manager, a case manager, a super admin. No password, ever (§9). What you see
 * after the code comes from the account, never from which link you followed —
 * nobody has to know what kind of user they are in order to get in.
 *
 * The screen is two things stacked. Above: three slides saying what PAM is,
 * one idea each, because somebody arriving has been handed a link and has no
 * reason yet to type their phone number into it. Below: the card, which is the
 * whole job — a heading, a field, a button, and the sentence about texts that
 * has to be read before the number is handed over. Everything the card needs
 * is inside the card; nothing else on the screen asks for anything.
 *
 * The mark stays pinned at the top while the rest scrolls, so the answer to
 * "what am I signing in to" never leaves the screen (Will, 13 September).
 *
 * **No help link here** (Will, 13 September) — the second deliberate exception
 * to §0's "every screen has a visible way to get help", after /reminders/. A
 * ghost button between the slides and the card reads as a fourth thing to
 * decide before anybody has decided the first. The path it guarded is still
 * open where it matters: every failure on this screen renders a Notice
 * carrying PAM's number, which is where somebody stuck actually is.
 *
 * Known gap: Astryx's TextInput takes no `inputMode` prop, so `purpose` on
 * TextField sets the attribute directly — the code field needs a numeric
 * keypad, and for somebody who has not held a phone in years that is a real
 * cost rather than a nicety.
 *
 * Two steps in one route, because they are one thought: give us your number,
 * type what we sent. Each shows a single primary action, and the thing a member
 * will actually hit — a code that never arrives — is a state with a way out
 * rather than a spinner that never resolves (§0).
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  hint: { fontSize: '17px', lineHeight: 1.5 },
  quiet: { fontSize: '17px' },
  consent: { fontSize: '15px', lineHeight: 1.5 },
  card: { width: '100%' },
  // The field's own label reads left-to-right even on a centred page: a label
  // sitting over the left edge of the box it names is easier to tie to it, and
  // a centred one above a full-width input floats loose.
  field: { textAlign: 'start' },
});

export default function SignInPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state, sendCode, verifyCode, startOver } = usePhoneSignIn();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const phoneId = useId();
  const codeId = useId();

  /**
   * What PAM is, in three sentences: a place to look, a person to ask, a
   * reminder so it does not get missed. That is the product, in the order
   * somebody meets it.
   */
  const slides = useMemo(
    () => [
      { id: 'places', icon: <PlacesIcon />, text: t('onboarding.1') },
      { id: 'people', icon: <PeopleIcon />, text: t('onboarding.2') },
      { id: 'plan', icon: <PlanIcon />, text: t('onboarding.3') },
    ],
    [t],
  );

  /**
   * Where somebody lands after the code works.
   *
   * Anybody who has never been asked goes to the reminders screen once, and
   * everybody else goes straight to the app.
   *
   * It was members only until Will noticed the hole: staff are texted too — an
   * introduction to their programme, a change to their account — and an account
   * that was never asked has consent switched off, so those messages are
   * cancelled rather than sent. Silent and safe, but a feature that quietly
   * does not work. The screen adjusts its examples by role (D-090).
   */
  useEffect(() => {
    if (state.step !== 'done') return;
    let cancelled = false;

    void (async () => {
      try {
        const [{ createClient }, { getReminderConsent }] = await Promise.all([
          import('@/lib/supabase'),
          import('@/lib/useReminderConsent'),
        ]);
        const supabase = createClient();
        const { data: auth } = await supabase.auth.getUser();
        if (cancelled || !auth.user) return;

        const asked = await getReminderConsent(auth.user.id);
        if (cancelled) return;

        router.replace(asked === null ? '/reminders/' : '/');
      } catch {
        // A redirect that cannot decide still has to go somewhere.
        if (!cancelled) router.replace('/');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [state.step, router]);

  const busy = state.step === 'sending' || state.step === 'verifying';
  const onCodeStep = state.step === 'code' || state.step === 'verifying';
  const onFirstStep = !onCodeStep && state.step !== 'done';

  return (
    <Page align="center" gap={3}>
      <AppHeader align="center" isSticky />

      {/*
        The slides belong to the first step only. Somebody waiting on a code has
        already decided what PAM is; what they need is the field, and a pitch
        above it is now in the way.
      */}
      {onFirstStep ? <OnboardingSlides slides={slides} label={t('onboarding.label')} /> : null}

      {state.step === 'failed' ? (
        <Notice
          notice="something_went_wrong"
          title={t(`signin.failed.${state.reason}.title`)}
          body={
            state.phone === null
              ? t('signin.phone.invalid')
              : t(`signin.failed.${state.reason}.body`)
          }
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.step === 'done' ? <Text xstyle={styles.quiet}>{t('signin.verifying')}</Text> : null}

      {state.step === 'done' ? null : (
        <Card padding={4} xstyle={styles.card}>
          {onCodeStep ? (
            <VStack gap={3}>
              <Heading level={1} xstyle={styles.title}>
                {t('signin.title')}
              </Heading>
              <TextField
                id={codeId}
                purpose="code"
                label={t('signin.code.label')}
                value={code}
                onChange={(next) => setCode(next)}
                width="100%"
                xstyle={styles.field}
              />
              <Text type="supporting" xstyle={styles.hint}>
                {t('signin.code.hint', { phone: state.phone })}
              </Text>
              <BigButton
                label={busy ? t('signin.verifying') : t('signin.code.action')}
                onPress={() => void verifyCode(code)}
                isDisabled={busy || code.trim().length === 0}
              />
              <TextLink
                label={t('signin.code.resend')}
                onClick={() => void sendCode(state.phone)}
                isDisabled={busy}
              />
            </VStack>
          ) : (
            <VStack gap={3}>
              {/*
                The heading sits inside the card with the field it names, so the
                task is one block rather than a title floating above a box.
              */}
              <Heading level={1} xstyle={styles.title}>
                {t('signin.title')}
              </Heading>
              <TextField
                id={phoneId}
                purpose="phone"
                label={t('signin.phone.label')}
                value={phone}
                onChange={(next) => setPhone(next)}
                width="100%"
                xstyle={styles.field}
              />
              <Text type="supporting" xstyle={styles.hint}>
                {t('signin.phone.hint')}
              </Text>
              <BigButton
                label={state.step === 'sending' ? t('signin.sending') : t('signin.phone.action')}
                onPress={() => void sendCode(phone)}
                isDisabled={state.step === 'sending' || phone.trim().length === 0}
              />
              {/*
                What PAM will send, and how to stop it — directly under the
                button that hands over the number, inside the same card, so it
                is part of the act rather than small print further down the
                page.

                It has to be here and visible on the same screen where somebody
                types their number: US carriers review this before an
                application may send at all, and the browser test asserts it is
                on screen without scrolling rather than asserting where it sits,
                so it can move again without breaking anything that matters.
              */}
              <Text type="supporting" xstyle={styles.consent}>
                {t('signin.phone.consent')}
              </Text>
            </VStack>
          )}
        </Card>
      )}

      {state.step === 'failed' && state.phone !== null ? (
        <TextLink label={t('signin.phone.label')} onClick={startOver} />
      ) : null}

      {/*
        The two pages somebody is entitled to read before they hand over a
        number. Ghost buttons rather than small print: they are 48px targets
        like everything else, because a rule nobody can tap is a rule nobody
        reads.
      */}
      <HStack gap={2} justify="center" wrap="wrap">
        <TextLink label={t('legal.privacy')} href="/privacy/" size="quiet" />
        <TextLink label={t('legal.terms')} href="/terms/" size="quiet" />
      </HStack>
    </Page>
  );
}
