'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Dropdown, Loading, Notice, TextField, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { HELP_DESK_URL } from '@/lib/helpDesk';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';
import { signOut, useSession } from '@/lib/useSession';
import { servedCities } from '@/lib/useJoin';
import { myNumberChange, submitNumberChange, type AskFailure, type NumberChangeStatus } from '@/lib/useNumberChange';
import { navigate } from '@/lib/navigate';
import { PhoneSignInCard } from '../app/signin/PhoneSignInCard';

/**
 * Moving an account to a new phone number (D-567; card a73). Reached from "New number?" beside Privacy
 * on Sign in, by somebody who cannot sign in because the number on their account is not theirs any more.
 *
 * Three steps, and the screen is one of them at a time:
 *   1. **The new number proves itself** with the normal sign-in code. That signs them in with the new
 *      number only — a "temporary sign-in" with no profile. Nothing here, and nothing it calls, ever
 *      makes a profile for it or starts setting one up (Join is never offered).
 *   2. **The old account**: the old number, their name, their city and who at Pam knows them. The
 *      answer is the same whatever they type: whether the old number has an account is for the person
 *      who decides to know, nobody else.
 *   3. **Where it stands**: still being checked, moved (sign in again), or not moved — and Contact Pam.
 *
 * Nothing is texted while texts are off (texts_live). A case manager, or the super admin who spoke to
 * them, decides; the move itself is `move-number`'s.
 */
const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
});

type Stage = 'loading' | 'prove' | 'ask' | 'hasAccount' | { status: NumberChangeStatus; fresh: boolean };

export function NewNumberScreen() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const flow = usePhoneSignIn();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('loading');

  const [oldPhone, setOldPhone] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [whoKnows, setWhoKnows] = useState('');
  const [cities, setCities] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<AskFailure | 'missing' | null>(null);

  // Where this person stands, each time the sign-in changes.
  useEffect(() => {
    if (session.status === 'loading') return;
    if (session.status === 'signed-in' || session.status === 'suspended') {
      setStage('hasAccount');
      return;
    }
    if (session.status !== 'no-profile') {
      setStage('prove');
      return;
    }
    let cancelled = false;
    void myNumberChange().then((status) => {
      if (cancelled) return;
      setStage(status ? { status, fresh: false } : 'ask');
    });
    return () => {
      cancelled = true;
    };
  }, [session.status]);

  useEffect(() => {
    if (stage !== 'ask') return;
    let cancelled = false;
    void servedCities().then((list) => {
      if (cancelled) return;
      setCities(list);
      if (list.length === 1) setCity((current) => current || list[0]!);
    });
    return () => {
      cancelled = true;
    };
  }, [stage]);

  const send = async () => {
    if (!oldPhone.trim() || !firstName.trim() || !lastName.trim() || !city.trim()) {
      setProblem('missing');
      return;
    }
    setProblem(null);
    setBusy(true);
    const result = await submitNumberChange({ oldPhone, firstName, lastName, city, whoKnows });
    setBusy(false);
    if (result.ok) setStage({ status: 'waiting', fresh: true });
    else if (result.reason === 'waiting') setStage({ status: 'waiting', fresh: false });
    else if (result.reason === 'hasAccount') setStage('hasAccount');
    else setProblem(result.reason);
  };

  const back = { backHref: '/signin/', backLabel: t('nav.back.signInScreen') };
  const contact = <TextLink label={t('help.contact.action')} href={HELP_DESK_URL} />;

  if (stage === 'loading') {
    return (
      <SubPage title={t('newNumber.title')} {...back}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (stage === 'prove') {
    return (
      <SubPage title={t('newNumber.title')} {...back}>
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('newNumber.intro')}</Text>
          {flow.state.step === 'done' ? (
            <Loading label={t('common.loading')} variant="inline" />
          ) : (
            <PhoneSignInCard
              flow={flow}
              phone={phone}
              onPhoneChange={setPhone}
              code={code}
              onCodeChange={setCode}
              hasTitle={false}
              headingLevel={2}
              codeAction={t('action.next')}
              isFlat
            />
          )}
          {flow.state.step === 'failed' ? (
            <Notice
              notice="something_went_wrong"
              title={t('signin.failed.send.title')}
              body={flow.state.phone === null ? t('signin.phone.invalid') : t('signin.failed.send.body')}
              contactLabel={t('help.contact.action')}
            />
          ) : null}
        </VStack>
      </SubPage>
    );
  }

  if (stage === 'hasAccount') {
    return (
      <SubPage title={t('newNumber.hasAccount.title')} {...back}>
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('newNumber.hasAccount.body')}</Text>
          <BigButton label={t('tab.home')} onPress={() => navigate('/')} />
        </VStack>
      </SubPage>
    );
  }

  if (stage === 'ask') {
    return (
      <SubPage
        title={t('newNumber.form.title')}
        {...back}
        footer={
          <BigButton label={busy ? t('join.saving') : t('newNumber.send')} isDisabled={busy} onPress={() => void send()} />
        }
      >
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('newNumber.form.intro')}</Text>
          <TextField purpose="oldPhone" label={t('newNumber.old.label')} value={oldPhone} onChange={setOldPhone} width="100%" />
          <TextField purpose="name" label={t('join.details.first')} value={firstName} onChange={setFirstName} width="100%" />
          <TextField purpose="lastName" label={t('join.details.last')} value={lastName} onChange={setLastName} width="100%" />
          {cities.length > 0 ? (
            <Dropdown
              label={t('join.details.city')}
              width="100%"
              value={city}
              options={cities.map((name) => ({ value: name, label: name }))}
              onChange={setCity}
            />
          ) : (
            <TextField purpose="city" label={t('join.details.city')} value={city} onChange={setCity} width="100%" />
          )}
          <TextField
            label={t('newNumber.who.label')}
            description={t('newNumber.who.hint')}
            isOptional
            value={whoKnows}
            onChange={setWhoKnows}
            width="100%"
          />
          {problem ? (
            <Text role="alert" xstyle={styles.small}>
              {t(`newNumber.problem.${problem}`)}
            </Text>
          ) : null}
          {problem === 'tooMany' || problem === 'other' ? contact : null}
        </VStack>
      </SubPage>
    );
  }

  // Where it stands. "Received" the moment it is sent; "still checking" after that.
  const key = stage.status === 'waiting' ? (stage.fresh ? 'received' : 'waiting') : stage.status;
  return (
    <SubPage title={t(`newNumber.${key}.title`)} {...back}>
      <VStack gap={4}>
        <Text xstyle={styles.body}>{t(`newNumber.${key}.body`)}</Text>
        {stage.status === 'approved' ? (
          <BigButton
            label={t('signin.title')}
            onPress={() => {
              void signOut().then(() => navigate('/signin/'));
            }}
          />
        ) : null}
        {stage.status === 'denied' ? contact : null}
        {stage.status === 'waiting' ? (
          <TextLink
            label={t('signin.signout')}
            onClick={() => {
              void signOut().then(() => navigate('/signin/'));
            }}
          />
        ) : null}
      </VStack>
    </SubPage>
  );
}
