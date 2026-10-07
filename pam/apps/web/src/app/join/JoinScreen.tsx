'use client';

import { useEffect, useId, useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Banner } from '@astryxdesign/core/Banner';
import { Selector } from '@astryxdesign/core/Selector';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BellIcon, BigButton, Loading, Notice, Page, PointsBadge, StarIcon, TextField, TextLink, TripsIcon } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { TRANSPARENCY_SCREEN, badgeForPoints, type Locale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { forgetInvite, recallInvite, type Invite } from '@/lib/appUrl';
import { readAddedTrips, withMoves } from '@/lib/addedTrips';
import { DUMMY_TRIPS } from '@pam/config/dummy-trips';
import { Confetti } from '@pam/ui/SuccessScreen';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { signOut, useSession } from '@/lib/useSession';
import { usePoints } from '@/lib/usePoints';
import { setReminderConsent } from '@/lib/useReminderConsent';
import {
  finishSetup,
  joinWaitingCity,
  redeemInvite,
  servedCities,
  submitDetails,
  type InviteProblem,
  type JoinKind,
} from '@/lib/useJoin';
import { NOTICES } from '@pam/config';
import { markFreshAccount } from '@/lib/programSetup';
import { SetupArt, type SetupArtKind } from '@pam/ui/SetupArt';
import { ChoiceChips } from '@pam/ui/ChoiceChips';
import { InfoTip } from '@pam/ui/InfoTip';

/**
 * Signing up: five steps, and four of them are one question each.
 *
 * Until this screen existed, every account in Pam was made by the seeding
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
 * **Nothing here says "role", and nobody picks one.** There used to be three
 * sentences to choose from ("Someone in need of support", "Someone willing to
 * help", "Parole Officer or Case Manager"); since D-369 there are none. A
 * program or a case manager arrives by the link they were sent, which says
 * what they are; without one, this is a member's sign-up, so nobody can call
 * themselves staff by mistake. (A staff claim made here before created
 * nothing anyway — 0046.)
 *
 * **A city Pam does not serve is a different screen, not an error.** Somebody
 * in Scranton typed their name in good faith. They are told where Pam is, and
 * offered a text when it opens — which they have to tick, because an opt-in
 * that arrives pre-ticked is not one (A2P 30925).
 *
 * The last step is the first points. Twenty-five for finishing setup, awarded
 * by the database (0047), counted up on screen, with the badge they just
 * earned. A member who lands on home with a number already on it has been told
 * something true about this app in the first minute: things you do here count.
 */

export type JoinPhase = 'details' | 'waiting' | 'waitingDone' | 'privacy' | 'texts' | 'done';
type Phase = JoinPhase;

/**
 * Which step a phase is, for the badge on its button (D-359). Sign in has
 * already asked for the phone and the code, so About you is step 1: staff
 * have two steps (About you, What to expect), a member three (and texts).
 */
const STEP: Record<Phase, number> = {
  details: 1,
  waiting: 1,
  waitingDone: 1,
  privacy: 2,
  texts: 3,
  done: 3,
};

/** What to expect, for a program lead (D-354): one picture per line. */
const PROVIDER_EXPECT: readonly SetupArtKind[] = ['calendar', 'message', 'policy', 'private'];

/** The small print at the foot of the city list: shown, never chosen. */
const CITY_NOTE = '__note';

const styles = stylex.create({
  // Small print, centred, at the foot of the city list (D-369).
  cityNote: { width: '100%', textAlign: 'center', fontSize: '13px', lineHeight: 1.4 },
  quietIntro: { fontSize: '16px', lineHeight: 1.5 },
  // The bell in the brand green, its middle on the first line's middle.
  bell: { flexShrink: 0, paddingBlockStart: '3px', color: colorVars['--color-icon-accent'] },
  // A label that is not a field's own — the language chips, the code row with
  // its info tip — drawn like a field's (globals.css: 14px, 600), so the page
  // reads as one form (D-369).
  chipsLabel: { fontSize: '14px', lineHeight: '20px', fontWeight: 600, color: colorVars['--color-text-secondary'] },
  expectArt: { flexShrink: 0, borderRadius: '14px', overflow: 'hidden' },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  body: { fontSize: '17px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  heading: { fontSize: '17px' },
  field: { textAlign: 'start' },
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


/**
 * For the Storybook prototype only (D-249): sign up as this kind of person,
 * every screen in order, with a stand-in phone flow and nothing written —
 * each step moves on as if the database had said yes, and the last one goes
 * Home as the story's role. The real route passes none of this.
 */
export interface JoinPreview {
  readonly kind: JoinKind;
  readonly firstName: string;
  /** Arriving from Sign in: the number is given, so open on the code. */
  readonly phone?: string;
  /** Arriving by an invite link (D-254): the phone is done, open on About you. */
  readonly invite?: Invite;
  /** Open on this step (D-319): one story per screen, not one per flow. */
  readonly startAt?: JoinPhase;
}

export function JoinScreen({ preview = null }: { readonly preview?: JoinPreview | null } = {}) {
  const { t, locale, setLocale } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const [phase, setPhase] = useState<Phase | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [city, setCity] = useState('');
  const [kind, setKind] = useState<JoinKind>('member');
  /**
   * A code from the person who invited them. Optional: a member can come in
   * without one, and a program lead or case manager cannot come in without one
   * (0049). Prefilled from `?code=` so an invite can be sent as a link.
   */
  const [inviteCode, setInviteCode] = useState('');
  const [inviteProblem, setInviteProblem] = useState<InviteProblem | null>(null);
  /** Whether step 2 made an account, as opposed to recording a request. */
  const [hasAccount, setHasAccount] = useState(false);
  /**
   * Invited by a link (D-254): Sign in kept the code and who it is for, so
   * About you asks neither — no code to type, no "which one fits you best".
   * It says what they were invited as instead. `?code=` still works too.
   */
  const [invitedAs, setInvitedAs] = useState<JoinKind | null>(null);
  // A visit a program booked for them before they had Pam (D-322): the
  // link carried it, and it is the first thing they see at the end.
  const [bookedTrip, setBookedTrip] = useState<string | null>(null);
  useEffect(() => {
    const invite = preview?.invite ?? recallInvite();
    if (invite) {
      setInviteCode(invite.code);
      setKind(invite.role);
      setInvitedAs(invite.role);
      setBookedTrip(invite.trip ?? null);
      return;
    }
    const fromLink = new URLSearchParams(window.location.search).get('code');
    if (fromLink) setInviteCode(fromLink.toUpperCase());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [wantsUpdates, setWantsUpdates] = useState(false);
  const [cities, setCities] = useState<readonly string[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [invalid, setInvalid] = useState<'name' | 'city' | null>(null);

  const firstId = useId();
  const lastId = useId();
  const cityId = useId();
  const codeFieldId = useId();

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
    if (preview) {
      // The preview starts at the door, whoever the story is signed in as.
      setKind(preview.kind);
      setFirstName(preview.firstName);
      setCity('Philadelphia');
      // Approved, as if invited: staff finish on "I understand" and go Home
      // rather than on the waiting-for-review notice.
      setHasAccount(true);
      // The phone was done at Sign in (D-254, D-359); or wherever the story
      // asked to open (D-319).
      setPhase(preview.startAt ?? 'details');
      return;
    }
    // No verified phone yet: that is Sign in's job (D-359), and it comes
    // back here once the code works. Any ?code= goes with it.
    if (session.status === 'signed-out') router.replace(`/signin/${window.location.search}`);
    else if (session.status === 'no-profile') setPhase('details');
    else if (session.status === 'signed-in') {
      // Finished already: there is nothing here for them. Otherwise pick up at
      // step 3, as whatever the account says they are.
      if (session.session.isOnboarded) {
        router.replace('/');
        return;
      }
      const role = session.session.role;
      if (role === 'member' || role === 'provider' || role === 'admin') setKind(role);
      setHasAccount(true);
      setFirstName((current) => current || (session.session.firstName ?? ''));
      setPhase('privacy');
    }
  }, [session, phase, router, preview]);


  // Which cities Pam is in — for the sentence somebody in the wrong one reads.
  useEffect(() => {
    if (phase !== 'details' && phase !== 'waiting') return;
    let cancelled = false;
    void servedCities().then((list) => {
      if (cancelled) return;
      setCities(list);
      // Pre-set to a city Pam is in (D-369): the list is the admin's.
      setCity((current) => (current && list.includes(current) ? current : (list[0] ?? current)));
    });
    return () => {
      cancelled = true;
    };
  }, [phase]);

  const isStaff = kind !== 'member';
  // A program is added from Home once the account exists (D-353), not asked
  // for here: staff finish on What to expect, step 2 of 2 (D-359).
  const total = kind === 'member' ? 3 : 2;

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

    // The preview moves on as if the database had said yes (D-249).
    if (preview) {
      setPhase('privacy');
      return;
    }

    // A code decides everything the radio buttons would have: the invite
    // carries the role and the city, chosen by the person who made it.
    if (inviteCode.trim() !== '') {
      setBusy(true);
      setFailed(false);
      setInviteProblem(null);
      const redeemed = await redeemInvite(inviteCode, { firstName, lastName, city, language: locale });
      setBusy(false);
      if (redeemed.result === 'failed') {
        setInviteProblem(redeemed.problem);
        return;
      }
      setKind(redeemed.role === 'super_admin' ? 'admin' : redeemed.role);
      setHasAccount(true);
      forgetInvite();
      setPhase('privacy');
      return;
    }

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
    else {
      setHasAccount(outcome.result === 'member');
      setPhase('privacy');
    }
  };

  /** Staff with an account: nothing to ask about texts, so this is the end. */
  const finishStaff = async () => {
    if (!preview) {
      if (!userId) return;
      setBusy(true);
      const finished = await finishSetup(userId, false);
      setBusy(false);
      if (!finished) {
        setFailed(true);
        return;
      }
    }
    // Straight Home (D-353): a last screen whose only words were "go Home"
    // was a tap that did nothing. Home opens on getting started (D-352).
    markFreshAccount();
    if (preview) navigate('/');
    else router.replace('/');
  };

  const answerTexts = async (wants: boolean) => {
    if (preview) {
      setPhase('done');
      return;
    }
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
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  // Staff never reach 'done' (D-353): theirs ends on step 2 of 2.
  const step = STEP[phase];
  const progress = t('join.progress', { current: step, total });
  // The booked visit itself, from the example trips or the ones a program
  // added this session (D-322); null when the link carried none.
  const booked = bookedTrip
    ? (withMoves([...DUMMY_TRIPS, ...readAddedTrips()]).find((trip) => trip.id === bookedTrip) ?? null)
    : null;
  const bookedDay = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const bookedTime = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' });
  // Back from About you is back to Sign in: signed out first, or Sign in
  // would send a verified phone straight back here.
  const toSignIn = () => {
    if (preview) {
      navigate('/prototype/signin/');
      return;
    }
    void signOut().then(() => router.replace('/signin/'));
  };
  const back: { readonly backLabel: string; readonly backHref?: string; readonly onBack?: () => void } =
    phase === 'details'
        ? { backLabel: t('nav.back.signInScreen'), onBack: toSignIn }
        : phase === 'waiting'
          ? { backLabel: t('trips.new.back'), onBack: () => setPhase('details') }
          : phase === 'texts'
            ? { backLabel: t('trips.new.back'), onBack: () => setPhase('privacy') }
            : { backLabel: t('trips.new.back') };

  /*
   * Each step's button, pinned to the foot of the screen (Will, 7 October,
   * D-359): past the phone step a person is filling in a form, not choosing
   * how to arrive, so the legal links go and the next step stays in reach.
   */
  const footer =
    phase === 'details' ? (
      <BigButton
        label={busy ? t('join.saving') : t('action.next')}
        badge={progress}
        onPress={() => void submit()}
        isDisabled={busy}
      />
    ) : phase === 'waiting' ? (
      <VStack gap={1} align="center">
        <BigButton
          label={busy ? t('join.saving') : t('join.waiting.action')}
          onPress={() => void leaveName()}
          isDisabled={busy}
        />
        <TextLink label={t('join.waiting.skip')} href="/" />
      </VStack>
    ) : phase === 'privacy' && !isStaff ? (
      <BigButton label={t(TRANSPARENCY_SCREEN.confirmKey)} badge={progress} onPress={() => setPhase('texts')} />
    ) : phase === 'privacy' && isStaff ? (
      hasAccount ? (
        // Came in by code: the account exists, and this is the last step.
        <BigButton
          label={busy ? t('join.saving') : t(TRANSPARENCY_SCREEN.confirmKey)}
          badge={progress}
          onPress={() => void finishStaff()}
          isDisabled={busy}
        />
      ) : (
        <BigButton label={t('action.done')} href="/" />
      )
    ) : phase === 'texts' ? (
      // Either button is an answer, and the agreement is the button's own
      // words — nothing here is pre-selected, because there is nothing to select.
      <VStack gap={1} align="center">
        <BigButton
          label={busy ? t('join.saving') : t('reminders.optIn')}
          badge={progress}
          onPress={() => void answerTexts(true)}
          isDisabled={busy}
        />
        <TextLink label={t('reminders.skip')} onClick={() => void answerTexts(false)} />
      </VStack>
    ) : null;

  return (
    <>
      <Page gap={4} {...(footer ? { footer } : {})}>
        {/*
          The nested-page template with the step said under the title, as in
          Plan a trip (Will, 3 October, D-251) — no progress bar. Back goes one
          step back while there is one: from the phone or the code, to Sign in;
          from About you, to the phone; from the waiting list, to About you; from Text messages, to the screen before.
          Once the account exists (What others can see, and the end) there is
          nothing to go back to, so there is no back: the way out is the step.
        */}
        <SubPageHeader
          title={
            // The privacy step is three different screens, so it is three
                // different titles: what a member is promised is not what a case
                // manager is told they will see.
                phase === 'privacy'
                ? t(`join.privacy.title.${kind}`)
                : t(`join.${phase}.title`)
          }
          {...back}
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

        {phase === 'details' ? (
          <>
            <VStack gap={3}>
              {/* What they were invited as, first: the reason this form is short —
                  a green alert, the role in bold (Will, 7 October, D-369). */}
              {invitedAs ? (
                <Banner
                  status="success"
                  title={
                    <>
                      <Text as="span" weight="normal">
                        {t('join.invited.as')}
                      </Text>{' '}
                      <Text as="span" weight="bold">
                        {t(`join.invited.role.${invitedAs}`)}
                      </Text>
                    </>
                  }
                />
              ) : null}
              <TextField
                id={firstId}
                purpose="name"
                label={t('join.details.first')}
                // Ready to type on arrival (Will, 7 October, D-365).
                hasAutoFocus
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
              {/* A list, not a box to type in (Will, 7 October, D-369): Pam is
                  only in the cities an admin has set up, so the list is those,
                  with a line of small print at its foot that says so. If the
                  list cannot be fetched, the box comes back — somebody offline
                  can still say where they live. */}
              {cities.length > 0 ? (
                <Selector
                  label={t('join.details.city')}
                  size="lg"
                  width="100%"
                  value={city}
                  options={[
                    ...cities.map((name) => ({ value: name, label: name })),
                    { type: 'divider' as const },
                    { value: CITY_NOTE, label: t('join.details.city.note'), disabled: true },
                  ]}
                  renderOption={(option) =>
                    option.value === CITY_NOTE ? (
                      <Text type="supporting" xstyle={styles.cityNote}>
                        {option.label}
                      </Text>
                    ) : (
                      option.label
                    )
                  }
                  onChange={(next) => {
                    if (next !== CITY_NOTE) setCity(next);
                  }}
                />
              ) : (
                <TextField
                  id={cityId}
                  purpose="city"
                  label={t('join.details.city')}
                  value={city}
                  onChange={setCity}
                  width="100%"
                  xstyle={styles.field}
                />
              )}

              {invalid ? (
                <Text type="supporting" xstyle={styles.body}>
                  {t(`join.details.need.${invalid}`)}
                </Text>
              ) : null}

              {/*
                Defaults to whatever is already active — a language switched on
                the way in, before this screen, or English otherwise — and
                switching it here changes the whole screen's own copy live, not
                just what gets submitted (Will, 16 September: "ask them to
                select their default language... what is set in the form
                becomes their default language"). `submitDetails`/`redeemInvite`
                already send this locale as `language` — that part was here
                before this control was; only the way to change it is new.
              */}
              {/* Chips, as Plan a visit's days and times (D-359); the chosen one
                  in the secondary green. English unless already switched. */}
              <VStack gap={2}>
                <Text xstyle={styles.chipsLabel}>{t('onboarding.language.title')}</Text>
                <ChoiceChips
                  label={t('onboarding.language.title')}
                  options={[
                    { value: 'en', label: t('language.en') },
                    { value: 'es', label: t('language.es') },
                  ]}
                  value={locale as 'en' | 'es'}
                  onChange={(code) => setLocale(code as Locale)}
                />
              </VStack>

              {invitedAs ? null : (
                <>
                {/*
                  The code, if there is one. It sits above the three sentences
                  because it replaces them: a person with a code was told what
                  they are by the person who gave it to them.
                */}
                {/* The hint behind an info tip on the label's line (D-369):
                    the form stays fields; the field keeps its own label for
                    screen readers, and the line you see is that label again. */}
                <VStack gap={1}>
                  <HStack gap={1} align="center" wrap="nowrap">
                    <Text aria-hidden="true" xstyle={styles.chipsLabel}>
                      {t('join.code.label')}
                    </Text>
                    <InfoTip label={t('join.code.more')} content={t('join.code.hint')} />
                  </HStack>
                  <TextField
                    id={codeFieldId}
                    purpose="inviteCode"
                    label={t('join.code.label')}
                    isLabelHidden
                    value={inviteCode}
                    onChange={(next) => setInviteCode(next.toUpperCase())}
                    width="100%"
                    xstyle={styles.field}
                  />
                </VStack>
                </>
              )}

              {inviteProblem ? (
                <Notice
                  notice={inviteProblem}
                  title={t(NOTICES[inviteProblem].titleKey)}
                  body={t(NOTICES[inviteProblem].bodyKey)}
                  supportPhone={supportPhone}
                  callLabel={t('help.callSupport')}
                />
              ) : null}

              {/* No "Which one fits you best?" (Will, 7 October, D-369): a
                  program or a case manager joins by the link they are sent, so
                  a member cannot say they are staff by mistake. Without a link,
                  this is a member's sign-up. */}

            </VStack>
          </>
        ) : null}

        {phase === 'waiting' ? (
          <>
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
            </VStack>
          </>
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
          <>
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
            </VStack>
          </>
        ) : null}

        {phase === 'privacy' && isStaff ? (
          <>
            <>
              <VStack gap={3}>
                <Text xstyle={styles.intro}>{t(`join.privacy.${kind}.intro`)}</Text>
                {kind === 'provider' ? (
                  // Four things to scan, each with a small picture (Will,
                  // 7 October, D-354): how Pam works for a program now.
                  <VStack gap={4} role="list">
                    {PROVIDER_EXPECT.map((art, i) => (
                      <HStack key={art} gap={3} align="center" wrap="nowrap" role="listitem">
                        <HStack xstyle={styles.expectArt}>
                          <SetupArt kind={art} size={48} />
                        </HStack>
                        <Text xstyle={styles.item}>{t(`join.privacy.provider.${i + 1}`)}</Text>
                      </HStack>
                    ))}
                  </VStack>
                ) : (
                  [1, 2, 3, 4].map((n) => (
                    <Text key={n} xstyle={styles.item}>
                      {t(`join.privacy.${kind}.${n}`)}
                    </Text>
                  ))
                )}
              </VStack>
            </>
            {hasAccount ? null : (
              <>
                {/*
                  Nothing was created, and saying so is the whole screen. Somebody
                  who believes they have an account and does not will try to sign
                  in, fail silently, and never come back.
                */}
                <Notice
                  notice="service_not_available"
                  title={t('join.staff.title')}
                  body={t('join.staff.body')}
                  supportPhone={supportPhone}
                  callLabel={t('help.callSupport')}
                />
              </>
            )}
          </>
        ) : null}

        {phase === 'texts' ? (
          <>
            <VStack gap={3}>
              {/* Easier to scan (Will, 7 October, D-359): a quieter intro, and
                  what Pam would send as three bell bullets, evenly spaced. */}
              <Text type="supporting" xstyle={styles.quietIntro}>
                {t('reminders.intro')}
              </Text>
              <VStack gap={3}>
                <Heading level={2} xstyle={styles.heading}>
                  {t('reminders.what')}
                </Heading>
                <VStack gap={3} role="list">
                  {[1, 2, 3].map((n) => (
                    <HStack key={n} gap={3} align="start" wrap="nowrap" role="listitem">
                      <HStack xstyle={styles.bell}>
                        <BellIcon width={20} height={20} aria-hidden />
                      </HStack>
                      <Text xstyle={styles.item}>{t(`reminders.what.${n}`)}</Text>
                    </HStack>
                  ))}
                </VStack>
              </VStack>
              <Text type="supporting" xstyle={styles.small}>
                {t('reminders.how')}
              </Text>
            </VStack>
          </>
        ) : null}

        {phase === 'done' && !isStaff && booked ? (
          <>
            <Confetti />
            <>
              <VStack gap={3} xstyle={styles.celebrate}>
                <span aria-hidden="true" {...stylex.props(styles.medal)}>
                  <TripsIcon />
                </span>
                <Text xstyle={styles.badgeName}>{t('join.booked.title')}</Text>
                <Text xstyle={styles.body}>
                  {t('join.booked.body', {
                    place: booked.placeName,
                    day: bookedDay.format(new Date(booked.startsAt)),
                    time: bookedTime.format(new Date(booked.startsAt)),
                  })}
                </Text>
                <BigButton
                  label={t('join.booked.action')}
                  onPress={() => {
                    const href = `/place/?${new URLSearchParams({ id: booked.placeId, from: 'trips', trip: booked.id }).toString()}`;
                    if (preview) navigate(href);
                    else router.replace(href);
                  }}
                />
                <TextLink label={t('join.booked.trips')} href="/trips/" />
              </VStack>
            </>
          </>
        ) : null}

        {phase === 'done' && !isStaff && !booked ? (
          <>
            <VStack gap={3} xstyle={styles.celebrate}>
              <span aria-hidden="true" {...stylex.props(styles.medal)}>
                <StarIcon />
              </span>
              <Text xstyle={styles.badgeName}>{t(`badge.${badgeForPoints(points ?? 0).key}`)}</Text>
              {/*
                The number counts up, which is the reward — PointsBadge handles
                the part that matters, which is that somebody who asked for less
                motion simply gets the number.
              */}
              <PointsBadge points={points ?? 0} label={t('points.title')} />
              <Text xstyle={styles.body}>{t('join.done.body', { name: firstName.trim() || t('app.name') })}</Text>
              <BigButton label={t('join.done.action')} onPress={() => (preview ? navigate('/') : router.replace('/'))} />
            </VStack>
          </>
        ) : null}

      </Page>
    </>
  );
}
