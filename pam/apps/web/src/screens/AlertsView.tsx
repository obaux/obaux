'use client';

import { Suspense, useEffect, useId, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Notice } from '@pam/ui';
import { SettingsList, SettingsRow } from '@pam/ui/SettingsList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { ALERT_TEXTS_LIVE } from '@/lib/alertTextsLive';
import { useTextsLive } from '@/lib/useTextsLive';
import { setReminderConsent, setTextAlert, type AlertFlags, type AlertKind } from '@/lib/useReminderConsent';
import { HelpButton } from './HelpButton';
import { TermInfo } from './TermInfo';
import type { GlossaryTerm } from '@pam/config';

/**
 * Text alerts, one switch per kind (D-256 for programs; D-260, Will, 4
 * October, for case managers and members too). For a program, three:
 *
 *   - someone books a visit,
 *   - someone changes a booking (moved or cancelled),
 *   - someone messages you — that one is waiting, never what it says.
 *
 * **Consent stays an act.** Every switch starts off — a carrier rejected
 * Pam's first campaign for an opt-in that arrived pre-selected (30925). The STOP /
 * HELP / rates line is not repeated here (D-615): people saw it when they first agreed
 * to texts, and no switch can turn on without that agreement. Turning any switch on records consent (`setReminderConsent(true)`); turning
 * the last one off withdraws it.
 *
 * **What is on is kept on the account (D-453, D-478).** Not on this phone: a
 * person's choice follows them. A saved place closing is the account's one
 * yes/no (`sms_enabled`); the four texts that say something happened — a new
 * message, a visit booked, a visit changed, a visit planned — each have their own
 * switch (`alert_message`, `alert_booked`, `alert_changed`, `alert_trip`), which
 * start off. Turning one on records the yes to texts as well.
 */
type Kind = 'booked' | 'changed' | 'message' | 'trip' | 'visit' | 'closed' | 'connect';

/**
 * What each kind of person can be texted about (D-256, D-260), most wanted
 * first. A program hears from people most; a case manager, about messages
 * and the trips their people plan ("trip" explained from the glossary); a
 * member, about their own visits, saved places, people and messages.
 */
const KINDS_FOR: Record<'member' | 'admin' | 'provider', readonly Kind[]> = {
  provider: ['booked', 'changed', 'message'],
  admin: ['message', 'trip'],
  member: ['visit', 'message', 'connect', 'closed'],
};

/** A word in a switch's label that the glossary explains (D-260). */
const TERM_FOR: Partial<Record<Kind, GlossaryTerm>> = { trip: 'trip' };

/**
 * The kinds Pam really sends a text for today (Will, 10 October 2026: "keep the
 * promise" — build them, and until they are built, do not offer them). A saved
 * place closing or moving (0035–0037), and the four alerts that say something
 * happened (D-478), the latter only once `ALERT_TEXTS_LIVE` is flipped on the day Will says go
 * (`lib/alertTextsLive.ts`); until then they say "coming soon" and nothing is written. Even those
 * wait for the server's own switch, `texts_live` (D-481): while it is off every switch says "coming soon",
 * the closed-place one included, because the server holds the text (Lena's promise check, 11 October). A visit reminder for a member has its own screen; someone
 * wanting to connect has no text yet, so those two say "coming soon".
 */
const LIVE_KINDS: ReadonlySet<Kind> = new Set<Kind>(
  ALERT_TEXTS_LIVE ? ['closed', 'message', 'booked', 'changed', 'trip'] : ['closed'],
);
const NONE_LIVE: ReadonlySet<Kind> = new Set<Kind>();

/** The kinds with a switch of their own (`alert_*`). */
const ALERT_KINDS: ReadonlySet<Kind> = new Set<Kind>(['message', 'booked', 'changed', 'trip']);

/**
 * Whether any text alert is on for this kind of account, so a screen can stop
 * offering to turn them on (D-386). Nothing is sent to a program lead or a case
 * manager yet, so for them it is always no; a member's answer is the account's
 * own consent, which a synchronous call cannot read, so it is not asked here.
 */
export function hasTextAlerts(who: 'member' | 'admin' | 'provider'): boolean {
  void who;
  return false;
}

const styles = stylex.create({
  small: { fontSize: '15px', lineHeight: 1.5 },
  label: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  words: { flexGrow: 1, minWidth: 0 },
});

function AlertsList() {
  const { t } = useI18n();
  const soonId = useId();
  const textsLive = useTextsLive();
  const LIVE = textsLive ? LIVE_KINDS : NONE_LIVE;
  const { state: session } = useSession();
  const userId = session.status === 'signed-in' ? session.session.userId : null;
  const role = session.status === 'signed-in' ? session.session.role : null;
  const who = role === 'provider' ? 'provider' : role === 'admin' ? 'admin' : 'member';
  const KINDS = KINDS_FOR[who];
  const router = useRouter();
  const query = useSearchParams();
  /** The account's one yes/no for texts (`notification_preferences`), which every sent kind shares. */
  const [consent, setConsent] = useState(false);
  /** The account's answer has come: until it has, no switch can be tapped (a tap would be routed on a guess). */
  const [loaded, setLoaded] = useState(false);
  /** The four alert switches, each its own yes (D-478). */
  const [alerts, setAlerts] = useState<AlertFlags>({ message: false, booked: false, changed: false, trip: false });
  const [saved, setSaved] = useState(false);
  const [failed, setFailed] = useState(false);
  /** They replied STOP (D-453): the switches are off and cannot be turned on from here. */
  const [stopped, setStopped] = useState(false);

  // What the account says: yes, no, nobody asked, or a STOP.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const { getTextStatus } = await import('@/lib/useReminderConsent');
      const status = await getTextStatus(userId);
      if (cancelled) return;
      setStopped(status.stopped);
      setConsent(status.consent === true);
      setAlerts(status.alerts);
      setLoaded(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  // Back from the agree screen with "Agree to receive texts": the switch they tapped is turned on, once.
  useEffect(() => {
    if (!loaded || !consent || stopped) return;
    const kind = query.get('on');
    if (!kind) return;
    router.replace('/alerts/');
    const asked = KINDS.find((k) => k === kind);
    if (asked && LIVE.has(asked) && !isOn(asked)) void change(asked, true);
    // Once, on arrival with the answer in.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loaded, consent, stopped]);

  const change = async (kind: Kind, on: boolean) => {
    if (!LIVE.has(kind) || !userId || stopped) return;
    // The agree screen is the only opt-in (D-615): with no yes on file, a switch records nothing and turns nothing on.
    // It opens the agree screen for this role, which brings the person back here with this switch on, or off after "Not now".
    if (on && !consent) {
      router.push(`/reminders/?next=alerts&kind=${kind}`);
      return;
    }
    setSaved(false);
    setFailed(false);
    if (ALERT_KINDS.has(kind)) {
      const key = kind as AlertKind;
      const before = alerts;
      setAlerts({ ...alerts, [key]: on });
      if (on) setConsent(true);
      const ok = await setTextAlert(userId, key, on, before, who !== 'member');
      setFailed(!ok);
      setSaved(ok);
      if (!ok) {
        setAlerts(before);
        setConsent(consent);
      } else if (!on && who !== 'member' && !Object.entries({ ...before, [key]: false }).some(([, v]) => v)) {
        setConsent(false);
      }
      return;
    }
    setConsent(on);
    const ok = await setReminderConsent(userId, on);
    setFailed(!ok);
    setSaved(ok);
    if (!ok) setConsent(!on);
  };

  /** A switch shows on only while the account says yes to texts and it has not been stopped. */
  const isOn = (kind: Kind) =>
    !stopped && consent && (ALERT_KINDS.has(kind) ? alerts[kind as AlertKind] : kind === 'closed');

  return (
    <SubPage title={t('alerts.title')} backHref="/profile/" backLabel={t('nav.back.profile')} actions={<HelpButton />}>
      {stopped ? (
        <Card padding={6}>
          <VStack gap={2}>
            <Text xstyle={styles.label}>{t('reminders.stopped.title')}</Text>
            <Text xstyle={styles.small}>{t('reminders.stopped.body')}</Text>
          </VStack>
        </Card>
      ) : null}
      <Text type="supporting" xstyle={styles.small}>
        {t('alerts.kinds')}
      </Text>
      {/* No card, no instructions, no Privacy link (D-615, Will, 18 October): a list of rows, each its own setting. */}
      <SettingsList>
        {KINDS.map((kind) => {
          const live = LIVE.has(kind);
          const badgeId = `${soonId}-${kind}`;
          return (
            <SettingsRow
              key={kind}
              label={t(`alerts.${kind}`)}
              adornment={TERM_FOR[kind] ? <TermInfo term={TERM_FOR[kind]} /> : null}
              badge={live ? undefined : t('common.comingSoon')}
              badgeId={badgeId}
              control={
                <Switch
                  ref={(input) => {
                    // The badge is the switch's description, so a screen reader hears "{row}, switch, off, Coming soon" (D-608).
                    if (!input) return;
                    if (live) input.removeAttribute('aria-describedby');
                    else input.setAttribute('aria-describedby', badgeId);
                  }}
                  label={t(`alerts.${kind}`)}
                  isLabelHidden
                  value={live && isOn(kind)}
                  changeAction={(on) => change(kind, on)}
                  isDisabled={!userId || !loaded || !live || stopped}
                />
              }
            />
          );
        })}
      </SettingsList>
      {saved && !failed ? (
        <Text type="supporting" xstyle={styles.small}>
          {t('alerts.saved')}
        </Text>
      ) : null}
      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={t('notice.something_went_wrong.title')}
          body={t('notice.something_went_wrong.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}
    </SubPage>
  );
}

/** `useSearchParams` needs a Suspense boundary in an exported app; the fallback is the real header, so the way back is always there. */
export function AlertsView() {
  const { t } = useI18n();
  return (
    <Suspense
      fallback={<SubPage title={t('alerts.title')} backHref="/profile/" backLabel={t('nav.back.profile')} actions={<HelpButton />}>{null}</SubPage>}
    >
      <AlertsList />
    </Suspense>
  );
}
