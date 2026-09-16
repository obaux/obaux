'use client';

import { useId } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import type { PhoneSignIn } from '@/lib/usePhoneSignIn';

/**
 * Give us your number; type what we sent.
 *
 * The two steps are one thought, so they are one card, and the card is the
 * whole job on whichever screen it appears: a heading, a field, a button, and
 * the sentence about texts that has to be read before the number is handed
 * over. Nothing else inside it asks for anything.
 *
 * It lives on its own because there are two doors into the same act. Somebody
 * who already has an account signs in at `/signin/`; somebody who does not is
 * on step 1 of `/join/`, under a progress bar. Same card, same copy, same
 * consent sentence — which is the point. That sentence is what US carriers
 * reviewed, and a second hand-written copy of it is the thing most likely to
 * drift from the one they approved.
 *
 * The heading level is a prop because of that: on `/signin/` this is the page's
 * only heading, and in the flow the step header above it is already the h1.
 */
export interface PhoneSignInCardProps {
  readonly flow: PhoneSignIn;
  readonly phone: string;
  readonly onPhoneChange: (next: string) => void;
  readonly code: string;
  readonly onCodeChange: (next: string) => void;
  /** 1 on the sign-in screen, 2 inside a flow that already has a title. */
  readonly headingLevel?: 1 | 2;
}

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  stepTitle: { fontSize: '20px', lineHeight: 1.3 },
  hint: { fontSize: '17px', lineHeight: 1.5 },
  // Every word here is the sentence carriers reviewed and filed against this
  // exact screen (D-085, D-086, docs/sms-campaign-samples.md) — shortening it
  // needs a new carrier submission, not a design pass. Tightened to read as
  // less visual weight under the button instead (Will, 16 September), the
  // way the Figma redesign's shorter-looking line does, without dropping the
  // STOP/rates language that line is missing.
  consent: { fontSize: '14px', lineHeight: 1.35 },
  card: { width: '100%' },
  // The field's own label reads left-to-right even on a centred page: a label
  // sitting over the left edge of the box it names is easier to tie to it, and
  // a centred one above a full-width input floats loose.
  field: { textAlign: 'start' },
});

export function PhoneSignInCard({
  flow,
  phone,
  onPhoneChange,
  code,
  onCodeChange,
  headingLevel = 1,
}: PhoneSignInCardProps) {
  const { t } = useI18n();
  const { state, sendCode, verifyCode } = flow;
  const phoneId = useId();
  const codeId = useId();

  const busy = state.step === 'sending' || state.step === 'verifying';
  const onCodeStep = state.step === 'code' || state.step === 'verifying';
  const titleStyle = headingLevel === 1 ? styles.title : styles.stepTitle;

  return (
    // More breathing room around the card's own content (Will, 16 September,
    // matching the Figma redesign's roomier card) — one spacing step up from
    // the rest of the app's cards, since this is the one screen where the
    // card is the entire job rather than one of several things on the page.
    <Card padding={5} xstyle={styles.card}>
      {onCodeStep ? (
        <VStack gap={3}>
          <Heading level={headingLevel} xstyle={titleStyle}>
            {t('signin.title')}
          </Heading>
          <TextField
            id={codeId}
            purpose="code"
            label={t('signin.code.label')}
            value={code}
            onChange={onCodeChange}
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
          {/*
            Thirty seconds between codes, said on the link itself. A person
            who taps "send it again" three times gets three codes and a carrier
            that stops delivering; a person who can see the count waits.
          */}
          <TextLink
            label={
              flow.resendIn > 0
                ? t('signin.code.resendIn', { seconds: flow.resendIn })
                : t('signin.code.resend')
            }
            onClick={() => void sendCode(state.phone)}
            isDisabled={busy || flow.resendIn > 0}
          />
        </VStack>
      ) : (
        <VStack gap={3}>
          {/*
            The heading sits inside the card with the field it names, so the
            task is one block rather than a title floating above a box.
          */}
          <Heading level={headingLevel} xstyle={titleStyle}>
            {t('signin.title')}
          </Heading>
          <TextField
            id={phoneId}
            purpose="phone"
            label={t('signin.phone.label')}
            value={phone}
            onChange={onPhoneChange}
            width="100%"
            xstyle={styles.field}
          />
          <BigButton
            label={state.step === 'sending' ? t('signin.sending') : t('signin.phone.action')}
            onPress={() => void sendCode(phone)}
            isDisabled={state.step === 'sending' || phone.trim().length === 0}
          />
          {/*
            What PAM will send, and how to stop it — directly under the button
            that hands over the number, inside the same card, so it is part of
            the act rather than small print further down the page.

            It has to be here and visible on the same screen where somebody
            types their number: US carriers review this before an application
            may send at all, and the browser test asserts it is on screen
            without scrolling rather than asserting where it sits, so it can
            move again without breaking anything that matters.
          */}
          <Text type="supporting" xstyle={styles.consent}>
            {t('signin.phone.consent')}
          </Text>
        </VStack>
      )}
    </Card>
  );
}
