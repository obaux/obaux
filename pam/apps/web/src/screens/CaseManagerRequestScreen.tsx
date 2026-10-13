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
import {
  looksLikeEmail,
  myStaffRequest,
  requestCaseManagerAccess,
  type CaseManagerAskFailure,
} from '@/lib/useCaseManagerRequest';
import { navigate } from '@/lib/navigate';
import { PhoneSignInCard } from '../app/signin/PhoneSignInCard';

/**
 * Asking to use Pam as a case manager, from the website's "Join as a case manager" (D-568). Until now
 * a case manager could only come in by an invite from the Pam team.
 *
 * One step at a time:
 *   1. **Sign in first**, with the normal code. Nothing is stored for a phone nobody proved, the code
 *      is the rate limit, and there is no public form for a bot to fill.
 *   2. **The few facts the super admin needs**: name, city (one Pam serves), where they work and
 *      their work email (staff need one, D-441). Nothing else: no ID, no caseload.
 *   3. **Where it stands**: sent and waiting (the answer is texted: a staff-request decision is an account
 *      text, sent whatever texts_live says, D-481), or not this time —
 *      they may ask again (D-525), and Contact Pam is there.
 *
 * The request is a staff request like any other, so the super admin's bell, Requests and the
 * approved and denied texts already exist. Nothing here makes a profile; somebody with an account
 * is told to contact Pam instead (D-491: approving a case manager onto an existing account is
 * refused).
 */
const styles = stylex.create({
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
});

type Stage = 'loading' | 'prove' | 'ask' | 'hasAccount' | 'waiting' | 'denied';
type Problem = CaseManagerAskFailure | 'missing' | 'email';

export function CaseManagerRequestScreen() {
  const { t, locale } = useI18n();
  const { state: session } = useSession();
  const flow = usePhoneSignIn();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [stage, setStage] = useState<Stage>('loading');

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [organization, setOrganization] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [cities, setCities] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<Problem | null>(null);
  // Sent just now, rather than found waiting on a later visit.
  const [fresh, setFresh] = useState(false);

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
    void myStaffRequest().then((mine) => {
      if (cancelled) return;
      if (!mine) {
        setStage('ask');
        return;
      }
      // A refused request is asked again with what they sent last time (D-525).
      setFirstName(mine.firstName);
      setLastName(mine.lastName);
      setCity(mine.city);
      setOrganization(mine.organization);
      setStage(mine.decision === 'denied' ? 'denied' : mine.decision === 'approved' ? 'hasAccount' : 'waiting');
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
    if (!firstName.trim() || !lastName.trim() || !city.trim() || !organization.trim() || !workEmail.trim()) {
      setProblem('missing');
      return;
    }
    if (!looksLikeEmail(workEmail)) {
      setProblem('email');
      return;
    }
    setProblem(null);
    setBusy(true);
    const result = await requestCaseManagerAccess({ firstName, lastName, city, organization, workEmail, language: locale });
    setBusy(false);
    if (result.ok || result.reason === 'waiting') {
      setFresh(result.ok);
      setStage('waiting');
    } else if (result.reason === 'hasAccount' || result.reason === 'approved') setStage('hasAccount');
    else setProblem(result.reason);
  };

  const back = { backHref: '/signin/', backLabel: t('nav.back.signInScreen') };
  const contact = <TextLink label={t('help.contact.action')} href={HELP_DESK_URL} />;

  if (stage === 'loading') {
    return (
      <SubPage title={t('caseManager.title')} {...back}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (stage === 'prove') {
    return (
      <SubPage title={t('caseManager.title')} {...back}>
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('caseManager.intro')}</Text>
          {flow.state.step === 'done' ? (
            <Loading label={t('common.loading')} variant="inline" />
          ) : (
            <PhoneSignInCard
              flow={flow}
              phone={phone}
              onPhoneChange={setPhone}
              code={code}
              onCodeChange={setCode}
              title={t('caseManager.card.title')}
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
      <SubPage title={t('caseManager.hasAccount.title')} {...back}>
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('caseManager.hasAccount.body')}</Text>
          {contact}
          <BigButton label={t('tab.home')} onPress={() => navigate('/')} />
        </VStack>
      </SubPage>
    );
  }

  if (stage === 'ask') {
    return (
      <SubPage
        title={t('caseManager.form.title')}
        {...back}
        footer={<BigButton label={busy ? t('join.saving') : t('caseManager.send')} isDisabled={busy} onPress={() => void send()} />}
      >
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('caseManager.form.intro')}</Text>
          <TextField purpose="name" label={t('join.details.first')} value={firstName} onChange={setFirstName} width="100%" />
          <TextField purpose="lastName" label={t('join.details.last')} value={lastName} onChange={setLastName} width="100%" />
          {cities.length > 0 ? (
            <Dropdown
              label={t('caseManager.city.label')}
              width="100%"
              value={city}
              options={cities.map((name) => ({ value: name, label: name }))}
              onChange={setCity}
            />
          ) : (
            <TextField purpose="city" label={t('caseManager.city.label')} value={city} onChange={setCity} width="100%" />
          )}
          <TextField
            purpose="organization"
            label={t('caseManager.organization.label')}
            value={organization}
            onChange={setOrganization}
            width="100%"
          />
          <TextField purpose="email" label={t('caseManager.email.label')} value={workEmail} onChange={setWorkEmail} width="100%" />
          {problem ? (
            <Text role="alert" xstyle={styles.small}>
              {t(`caseManager.problem.${problem}`)}
            </Text>
          ) : null}
          {problem === 'other' ? contact : null}
        </VStack>
      </SubPage>
    );
  }

  if (stage === 'denied') {
    return (
      <SubPage title={t('caseManager.denied.title')} {...back}>
        <VStack gap={4}>
          <Text xstyle={styles.body}>{t('caseManager.denied.body')}</Text>
          <BigButton label={t('caseManager.askAgain')} onPress={() => setStage('ask')} />
          {contact}
        </VStack>
      </SubPage>
    );
  }

  // Sent, or still waiting. The answer is texted (an account text, D-481) and can also be seen here.
  return (
    <SubPage title={t(fresh ? 'caseManager.sent.title' : 'caseManager.waiting.title')} {...back}>
      <VStack gap={4}>
        <Text xstyle={styles.body}>{t('caseManager.waiting.body')}</Text>
        {contact}
        <TextLink
          label={t('signin.signout')}
          onClick={() => {
            void signOut().then(() => navigate('/signin/'));
          }}
        />
      </VStack>
    </SubPage>
  );
}
