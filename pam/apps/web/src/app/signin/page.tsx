'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { AppHeader, BigButton, Notice, TextField } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';

/**
 * The only way into PAM, and the same door for everybody: a member, a program
 * manager, a case manager, a super admin. No password, ever (§9). What you see
 * after the code comes from the account, never from which link you followed —
 * nobody has to know what kind of user they are in order to get in.
 *
 * Known gap: Astryx's TextInput takes no `inputMode`, so the code field opens a
 * full keyboard rather than a numeric keypad. For somebody who has not held a
 * phone in years that is a real cost, and it is worth raising upstream rather
 * than casting past the type.
 *
 * Two screens in one route, because they are one thought: give us your number,
 * type what we sent. Each shows a single primary action, and the thing a member
 * will actually hit — a code that never arrives — is a state with a way out
 * rather than a spinner that never resolves (§0).
 *
 * The layout is centred and the form sits in a card: the card is the task, and
 * everything outside it — the way to get help, what PAM will text you — is
 * context. Somebody who needs help should not have to read past a form to find
 * it.
 */

const styles = stylex.create({
  page: {
    maxWidth: '520px',
    marginInline: 'auto',
    paddingInline: '16px',
    paddingBlock: '32px',
    textAlign: 'center',
  },
  title: { fontSize: '28px', lineHeight: 1.2 },
  hint: { fontSize: '17px', lineHeight: 1.5 },
  quiet: { fontSize: '17px' },
  link: { minHeight: '48px', fontSize: '17px' },
  consent: { fontSize: '15px', lineHeight: 1.5 },
  card: { width: '100%' },
  legalLink: { minHeight: '48px', fontSize: '15px' },
  // The field's own label reads left-to-right even on a centred page: a label
  // sitting over the left edge of the box it names is easier to tie to it, and
  // a centred one above a full-width input floats loose.
  field: { textAlign: 'start' },
});

export default function SignInPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state, sendCode, verifyCode, startOver } = usePhoneSignIn();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const phoneId = useId();
  const codeId = useId();

  const busy = state.step === 'sending' || state.step === 'verifying';
  const onCodeStep = state.step === 'code' || state.step === 'verifying';
  const onFirstStep = !onCodeStep && state.step !== 'done';

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={4} align="center">
        <AppHeader align="center" />

        <Heading level={1} xstyle={styles.title}>
          {t('signin.title')}
        </Heading>

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

        {state.step === 'done' ? (
          <Text xstyle={styles.quiet}>{t('signin.verifying')}</Text>
        ) : null}

        {state.step === 'done' ? null : (
          <Card padding={4} xstyle={styles.card}>
            {onCodeStep ? (
              <VStack gap={3}>
                <TextField
                  id={codeId}
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
                <Button
                  label={t('signin.code.resend')}
                  variant="ghost"
                  onClick={() => void sendCode(state.phone)}
                  isDisabled={busy}
                  xstyle={styles.link}
                />
              </VStack>
            ) : (
              <VStack gap={3}>
                <TextField
                  id={phoneId}
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
              </VStack>
            )}
          </Card>
        )}

        {state.step === 'failed' && state.phone !== null ? (
          <Button
            label={t('signin.phone.label')}
            variant="ghost"
            onClick={startOver}
            xstyle={styles.link}
          />
        ) : null}

        <Button label={t('help.title')} variant="ghost" href="/help/" xstyle={styles.link} />

        {/*
          What PAM will send, and how to stop it, at the foot of the screen.
          Below the action rather than above it: the screen is short enough that
          it is on screen without scrolling either way, and somebody reaching for
          the button should meet the button, not a paragraph.

          It still has to be here, and visible, on the same screen where somebody
          types their number — US carriers review this before an application may
          send at all, and the browser test asserts it is on screen without
          scrolling rather than asserting where it sits, so it can move again
          without breaking anything that matters.
        */}
        {onFirstStep ? (
          <Text type="supporting" xstyle={styles.consent}>
            {t('signin.phone.consent')}
          </Text>
        ) : null}

        {/*
          The two pages somebody is entitled to read before they hand over a
          number. Ghost buttons rather than small print: they are 48px targets
          like everything else, because a rule nobody can tap is a rule nobody
          reads.
        */}
        <HStack gap={2} justify="center" wrap="wrap">
          <Button
            label={t('legal.privacy')}
            variant="ghost"
            href="/privacy/"
            xstyle={styles.legalLink}
          />
          <Button
            label={t('legal.terms')}
            variant="ghost"
            href="/terms/"
            xstyle={styles.legalLink}
          />
        </HStack>
      </VStack>
    </main>
  );
}
