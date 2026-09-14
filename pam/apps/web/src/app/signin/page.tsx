'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { AppHeader, Notice, OnboardingSlides, Page, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';
import { PhoneSignInCard } from './PhoneSignInCard';

/**
 * The only way into PAM, and the same door for everybody: a member, a program
 * manager, a case manager, a super admin. No password, ever (§9). What you see
 * after the code comes from the account, never from which link you followed —
 * nobody has to know what kind of user they are in order to get in.
 *
 * The screen is two things stacked. Above: three slides saying what PAM is,
 * one idea each, because somebody arriving has been handed a link and has no
 * reason yet to type their phone number into it. Below: the card, which is the
 * whole job. The card itself lives in `PhoneSignInCard` — step 1 of `/join/`
 * is the same act and shows the same thing, including the consent sentence the
 * carriers reviewed.
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
 */

const styles = stylex.create({
  quiet: { fontSize: '17px' },
});

export default function SignInPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const flow = usePhoneSignIn();
  const { state, startOver } = flow;
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  /**
   * What PAM is, in three sentences: a place to look, a person to ask, a
   * reminder so it does not get missed. That is the product, in the order
   * somebody meets it.
   */
  const slides = useMemo(
    () => [
      { id: 'places', image: '/onboarding/places.svg', text: t('onboarding.1') },
      { id: 'people', image: '/onboarding/people.svg', text: t('onboarding.2') },
      { id: 'plan', image: '/onboarding/plan.svg', text: t('onboarding.3') },
    ],
    [t],
  );

  /**
   * Where somebody lands after the code works.
   *
   * Three ways out, in the order they are decided.
   *
   * **No profile** means the phone is verified and PAM has no record of this
   * person: they are signing up, not signing in, and the flow picks them up at
   * step 2 with the step behind them already done. Until sign-up existed this
   * case landed on a home screen that offered them the door they had just come
   * through.
   *
   * Then the reminders question, once, for anybody who has never been asked —
   * staff included, because staff are texted too and an account that was never
   * asked has consent switched off (D-090). Everybody else goes to the app.
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

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', auth.user.id)
          .maybeSingle();
        if (cancelled) return;

        if (!profile) {
          router.replace('/join/');
          return;
        }

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

  const onFirstStep =
    state.step !== 'code' && state.step !== 'verifying' && state.step !== 'done';

  return (
    <Page align="center" gap={3}>
      {/*
        The mark is identity here, not navigation: there is nowhere to go until
        somebody is in, and the 48px tap target a link needs costs 22px of the
        height the consent sentence is fighting for.
      */}
      <AppHeader align="center" isSticky homeHref={null} />

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
        <PhoneSignInCard
          flow={flow}
          phone={phone}
          onPhoneChange={setPhone}
          code={code}
          onCodeChange={setCode}
        />
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
