'use client';

import { useId, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { TextInput } from '@astryxdesign/core/TextInput';
import { BigButton, Notice } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';

/**
 * The only way into PAM. No password, ever (§9).
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
 */

const styles = stylex.create({
  page: { maxWidth: '520px', marginInline: 'auto', paddingInline: '16px', paddingBlock: '32px' },
  title: { fontSize: '28px', lineHeight: 1.2 },
  hint: { fontSize: '17px', lineHeight: 1.5 },
  quiet: { fontSize: '17px' },
  link: { minHeight: '48px', fontSize: '17px' },
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

  return (
    <main {...stylex.props(styles.page)}>
      <VStack gap={4}>
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

        {onCodeStep ? (
          <VStack gap={3}>
            <TextInput
              id={codeId}
              label={t('signin.code.label')}
              value={code}
              onChange={(next) => setCode(next)}
              width="100%"
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
        ) : state.step === 'done' ? null : (
          <VStack gap={3}>
            <TextInput
              id={phoneId}
              label={t('signin.phone.label')}
              value={phone}
              onChange={(next) => setPhone(next)}
              width="100%"
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

        {state.step === 'failed' && state.phone !== null ? (
          <Button
            label={t('signin.phone.label')}
            variant="ghost"
            onClick={startOver}
            xstyle={styles.link}
          />
        ) : null}

        <Button label={t('help.title')} variant="ghost" href="/help/" xstyle={styles.link} />
      </VStack>
    </main>
  );
}
