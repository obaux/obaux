'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import {
  AppHeader,
  BigButton,
  Notice,
  Page,
  PointsBadge,
  StarIcon,
  StepHeader,
  TextField,
  TextLink,
} from '@pam/ui';
import { TRANSPARENCY_SCREEN, badgeForPoints } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { usePhoneSignIn } from '@/lib/usePhoneSignIn';
import { useSession } from '@/lib/useSession';
import { usePoints } from '@/lib/usePoints';
import { setReminderConsent } from '@/lib/useReminderConsent';
import {
  finishSetup,
  joinWaitingCity,
  servedCities,
  submitDetails,
  type JoinKind,
} from '@/lib/useJoin';
import { PhoneSignInCard } from '../signin/PhoneSignInCard';

/**
 * Signing up: five steps, and four of them are one question each.
 *
 * Until this screen existed, every account in PAM was made by the seeding
 * script or by an invite code, and somebody arriving at the front door with no
 * code was shown a sign-in button that led back to the same place. It also
 * answers a question Will asked on the 14th — how does the app know my name if
 * I never entered it? — which had the honest answer "it doesn't", because
 * nothing had ever asked.
 *
 * **The progress bar is the point** (Will, 14 September). Somebody deciding
 * whether they have time for this needs to know how much there is, and the
 * honest answer is "not much": a phone number, your name and your city, one
 * screen to read, one yes-or-no about texts. Five, counting the one that
 * congratulates you.
 *
 * **Nothing here says "role".** A member picks from three sentences about
 * themselves — "Someone in need of support", "Someone willing to help",
 * "Parole Officer or Case Manager" — because role is a word this system uses
 * about people, not a word people use about themselves (Will, 14 September).
 *
 * **The two staff answers create nothing.** They record a claim and say
 * somebody will call. Those roles read other people's information, and a form
 * is not a credential; 0046 has the long version. It is also why this screen
 * cannot be used to become a case manager by typing it.
 *
 * **A city PAM does not serve is a different screen, not an error.** Somebody
 * in Scranton typed their name in good faith. They are told where PAM is, and
 * offered a text when it opens — which they have to tick, because an opt-in
 * that arrives pre-ticked is not one (A2P 30925).
 *
 * The last step is the first points. Twenty-five for finishing setup, awarded
 * by the database (0047), counted up on screen, with the badge they just
 * earned. A member who lands on home with a number already on it has been told
 * something true about this app in the first minute: things you do here count.
 */

type Phase = 'phone' | 'details' | 'waiting' | 'waitingDone' | 'privacy' | 'texts' | 'done';

/** Which of the five steps a phase is, for the bar. */
const STEP: Record<Phase, number> = {
  phone: 1,
  details: 2,
  waiting: 2,
  waitingDone: 2,
  privacy: 3,
  texts: 4,
  done: 5,
};

const styles = stylex.create({
  card: { width: '100%' },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  heading: { fontSize: '17px' },
  field: { textAlign: 'start' },
  // 12px between the three sentences, so they read as three things to choose
  // between rather than one paragraph (the flag screen learned this first).
  choices: { rowGap: spacingVars['--spacing-3'] },
  item: { fontSize: '17px', lineHeight: 1.45 },
  /** The badge the last screen hands over. */
  medal: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '32px',
    backgroundColor: colorVars['--color-accent'],
    color: colorVars['--color-on-accent'],
  },
  celebrate: { textAlign: 'center', alignItems: 'center' },
  badgeName: { fontSize: '22px', fontWeight: 700 },
});

/** The three sentences, and what each one means to the database. */
const KINDS: readonly { readonly kind: JoinKind; readonly key: string }[] = [
  { kind: 'member', key: 'join.fit.member' },
  { kind: 'provider', key: 'join.fit.provider' },
  { kind: 'admin', key: 'join.fit.admin' },
];

export default function JoinPage() {
  const { t, locale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const flow = usePhoneSignIn();

  const [phase, setPhase] = useState<Phase | null>(null);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [kind, setKind] = useState<JoinKind>('member');
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [cities, setCities] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState<'name' | 'city' | null>(null);

  const firstId = useId();
  const lastId = useId();
  const cityId = useId();

  /**
   * Who is signed in, asked of the sign-in system rather than of the profile.
   *
   * `useSession` answers "no-profile" for exactly the person this screen is
   * for, and it does not re-ask after step 2 creates one — so reading the id
   * from there left the last two steps with nobody to write for, silently. The
   * id is a fact about the phone that was verified; it is true from step 1.
   */
  const [userId, setUserId] = useState<string | null>(null);
  const points = usePoints(phase === 'done' ? userId : null);

  useEffect(() => {
    if (session.status === 'signed-out' || session.status === 'loading') return;
    let cancelled = false;
    void (async () => {
      const { createClient } = await import('@/lib/supabase');
      const { data } = await createClient().auth.getUser();
      if (!cancelled) setUserId(data.user?.id ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [session.status, phase]);

  /**
   * Where somebody is picked up.
   *
   * The flow survives a closed tab, because it will happen: a code arrives, the
   * phone switches app, the browser drops the page. Signing in again lands on
   * whichever step is actually outstanding rather than starting over — and
   * somebody who already has a profile is past step 2 whatever this tab
   * remembers.
   */
  useEffect(() => {
    if (phase !== null) return;
    if (session.status === 'signed-out') setPhase('phone');
    else if (session.status === 'no-profile') setPhase('details');
    else if (session.status === 'signed-in') setPhase('privacy');
  }, [session.status, phase]);

  /** Step 1 ends where step 2 begins: a verified phone with no profile yet. */
  useEffect(() => {
    if (flow.state.step === 'done' && phase === 'phone') setPhase('details');
  }, [flow.state.step, phase]);

  // Which cities PAM is in — for the sentence somebody in the wrong one reads.
  useEffect(() => {
    if (phase !== 'details' && phase !== 'waiting') return;
    let cancelled = false;
    void servedCities().then((list) => {
      if (!cancelled) setCities(list);
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const isStaff = kind !== 'member';
  /** Staff never reach the texts step: there is no account to attach it to. */
  const total = isStaff ? 4 : 5;

  const submit = async () => {
    if (firstName.trim() === '') {
      setInvalid('name');
      return;
    }
    if (city.trim() === '') {
      setInvalid('city');
      return;
    }
    setInvalid(null);
    setBusy(true);
    setFailed(false);

    const outcome = await submitDetails({
      firstName,
      lastName,
      city,
      kind,
      language: locale,
    });
    setBusy(false);

    if (outcome.result === 'failed') setFailed(true);
    else if (outcome.result === 'city-not-served') setPhase('waiting');
    else setPhase('privacy');
  };

  const answerTexts = async (wants: boolean) => {
    if (!userId) return;
    setBusy(true);
    const saved = await setReminderConsent(userId, wants);
    const finished = saved ? await finishSetup(userId, true) : false;
    setBusy(false);
    if (!saved || !finished) {
      setFailed(true);
      return;
    }
    setPhase('done');
  };

  const leaveName = async () => {
    setBusy(true);
    const saved = await joinWaitingCity(city, wantsUpdates);
    setBusy(false);
    setFailed(!saved);
    if (saved) setPhase('waitingDone');
  };

  if (phase === null) {
    return (
      <Page gap={3}>
        <AppHeader homeHref={null} />
        <Text xstyle={styles.intro}>{t('places.loading')}</Text>
      </Page>
    );
  }

  const step = STEP[phase];

  return (
    <Page gap={4}>
      {/* No way home from a flow that has not finished: the way out is the
          steps themselves, and the mark is identity here as it is on sign-in. */}
      <AppHeader homeHref={null} />

      <StepHeader
        current={step}
        total={total}
        title={
          // The privacy step is three different screens, so it is three
          // different titles: what a member is promised is not what a case
          // manager is told they will see.
          phase === 'privacy' ? t(`join.privacy.title.${kind}`) : t(`join.${phase}.title`)
        }
        progressLabel={t('join.step', { current: step, total })}
      />

      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('join.failed.title')}
          body={t('join.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {phase === 'phone' ? (
        <>
          {flow.state.step === 'failed' ? (
            <Notice
              notice="something_went_wrong"
              title={t(`signin.failed.${flow.state.reason}.title`)}
              body={
                flow.state.phone === null
                  ? t('signin.phone.invalid')
                  : t(`signin.failed.${flow.state.reason}.body`)
              }
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}
          <PhoneSignInCard
            flow={flow}
            phone={phone}
            onPhoneChange={setPhone}
            code={code}
            onCodeChange={setCode}
            headingLevel={2}
          />
        </>
      ) : null}

      {phase === 'details' ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <TextField
              id={firstId}
              purpose="name"
              label={t('join.details.first')}
              value={firstName}
              onChange={setFirstName}
              width="100%"
              xstyle={styles.field}
            />
            <TextField
              id={lastId}
              purpose="lastName"
              label={t('join.details.last')}
              value={lastName}
              onChange={setLastName}
              width="100%"
              xstyle={styles.field}
            />
            <TextField
              id={cityId}
              purpose="city"
              label={t('join.details.city')}
              value={city}
              onChange={setCity}
              width="100%"
              xstyle={styles.field}
            />

            {invalid ? (
              <Text type="supporting" xstyle={styles.body}>
                {t(`join.details.need.${invalid}`)}
              </Text>
            ) : null}

            {/*
              Three sentences about the person, not three roles. Always one
              selected, and the first one is the one most people arriving here
              are — asking somebody to declare themselves before they have seen
              anything is hard enough without a blank set of buttons.
            */}
            <RadioList
              label={t('join.details.fit')}
              value={kind}
              onChange={(next) => setKind(next as JoinKind)}
              xstyle={styles.choices}
            >
              {KINDS.map((option) => (
                <RadioListItem key={option.kind} value={option.kind} label={t(option.key)} />
              ))}
            </RadioList>

            <BigButton
              label={busy ? t('join.saving') : t('action.next')}
              onPress={() => void submit()}
              isDisabled={busy}
            />
          </VStack>
        </Card>
      ) : null}

      {phase === 'waiting' ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <Text xstyle={styles.intro}>{t('join.waiting.body', { city: city.trim() })}</Text>
            {cities.length > 0 ? (
              <Text type="supporting" xstyle={styles.body}>
                {t('join.waiting.where', { cities: cities.join(', ') })}
              </Text>
            ) : null}
            {/*
              Unticked, and it stays unticked unless somebody ticks it. Consent
              that arrives pre-selected is not consent, and this is the exact
              thing a carrier audit looks for.
            */}
            <CheckboxInput
              label={t('join.waiting.optIn', { city: city.trim() })}
              value={wantsUpdates}
              onChange={(next) => setWantsUpdates(next)}
            />
            <Text type="supporting" xstyle={styles.small}>
              {t('reminders.how')}
            </Text>
            <BigButton
              label={busy ? t('join.saving') : t('join.waiting.action')}
              onPress={() => void leaveName()}
              isDisabled={busy}
            />
            <TextLink label={t('join.waiting.skip')} href="/" />
          </VStack>
        </Card>
      ) : null}

      {phase === 'waitingDone' ? (
        <>
          <Notice
            notice="service_not_available"
            title={t('join.waitingDone.heading')}
            body={t(wantsUpdates ? 'join.waitingDone.yes' : 'join.waitingDone.no')}
          />
          <BigButton label={t('action.done')} href="/" />
        </>
      ) : null}

      {/*
        What is visible, before anything is. Three different screens, because
        three different people are reading it and only one of them is being
        asked to trust us with their life (Will, 14 September).
      */}
      {phase === 'privacy' && !isStaff ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <Text xstyle={styles.intro}>{t('join.privacy.member.intro')}</Text>

            <VStack gap={2}>
              <Heading level={2} xstyle={styles.heading}>
                {t(TRANSPARENCY_SCREEN.canSeeHeadingKey)}
              </Heading>
              {TRANSPARENCY_SCREEN.canSee.map((line) => (
                <Text key={line.key} xstyle={styles.item}>
                  {t(line.key)}
                </Text>
              ))}
            </VStack>

            <VStack gap={2}>
              <Heading level={2} xstyle={styles.heading}>
                {t(TRANSPARENCY_SCREEN.cannotSeeHeadingKey)}
              </Heading>
              {TRANSPARENCY_SCREEN.cannotSee.map((line) => (
                <Text key={line.key} xstyle={styles.item}>
                  {t(line.key)}
                </Text>
              ))}
            </VStack>

            <Text type="supporting" xstyle={styles.small}>
              {t(TRANSPARENCY_SCREEN.footerKey)}
            </Text>

            <BigButton
              label={t(TRANSPARENCY_SCREEN.confirmKey)}
              onPress={() => setPhase('texts')}
            />
          </VStack>
        </Card>
      ) : null}

      {phase === 'privacy' && isStaff ? (
        <>
          <Card padding={4} xstyle={styles.card}>
            <VStack gap={3}>
              <Text xstyle={styles.intro}>{t(`join.privacy.${kind}.intro`)}</Text>
              {[1, 2, 3].map((n) => (
                <Text key={n} xstyle={styles.item}>
                  {t(`join.privacy.${kind}.${n}`)}
                </Text>
              ))}
            </VStack>
          </Card>
          {/*
            Nothing was created, and saying so is the whole screen. Somebody who
            believes they have an account and does not will try to sign in, fail
            silently, and never come back.
          */}
          <Notice
            notice="service_not_available"
            title={t('join.staff.title')}
            body={t('join.staff.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
          <BigButton label={t('action.done')} href="/" />
        </>
      ) : null}

      {phase === 'texts' ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3}>
            <Text xstyle={styles.intro}>{t('reminders.intro')}</Text>
            <VStack gap={2}>
              <Heading level={2} xstyle={styles.heading}>
                {t('reminders.what')}
              </Heading>
              <Text xstyle={styles.item}>{t('reminders.what.1')}</Text>
              <Text xstyle={styles.item}>{t('reminders.what.2')}</Text>
              <Text xstyle={styles.item}>{t('reminders.what.3')}</Text>
            </VStack>
            <Text type="supporting" xstyle={styles.small}>
              {t('reminders.how')}
            </Text>
            {/*
              Either button is an answer, and the agreement is the button's own
              words — nothing here is pre-selected, because there is nothing to
              select.
            */}
            <BigButton
              label={busy ? t('join.saving') : t('reminders.optIn')}
              onPress={() => void answerTexts(true)}
              isDisabled={busy}
            />
            <TextLink label={t('reminders.skip')} onClick={() => void answerTexts(false)} />
          </VStack>
        </Card>
      ) : null}

      {phase === 'done' ? (
        <Card padding={4} xstyle={styles.card}>
          <VStack gap={3} xstyle={styles.celebrate}>
            <span aria-hidden="true" {...stylex.props(styles.medal)}>
              <StarIcon />
            </span>
            <Text xstyle={styles.badgeName}>
              {t(`badge.${badgeForPoints(points ?? 0).key}`)}
            </Text>
            {/*
              The number counts up, which is the reward — PointsBadge handles
              the part that matters, which is that somebody who asked for less
              motion simply gets the number.
            */}
            <PointsBadge points={points ?? 0} label={t('points.title')} />
            <Text xstyle={styles.body}>
              {t('join.done.body', { name: firstName.trim() || t('app.name') })}
            </Text>
            <BigButton label={t('join.done.action')} onPress={() => router.replace('/')} />
          </VStack>
        </Card>
      ) : null}

      <HStack gap={2} justify="center" wrap="wrap">
        <TextLink label={t('legal.privacy')} href="/privacy/" size="quiet" />
        <TextLink label={t('legal.terms')} href="/terms/" size="quiet" />
      </HStack>
    </Page>
  );
}
