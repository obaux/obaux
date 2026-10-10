'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Switch } from '@astryxdesign/core/Switch';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Notice } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
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
 * Pam's first campaign for an opt-in that arrived pre-selected (30925) — and
 * the STOP / HELP / rates line sits under them, as on the member's screen.
 * Turning any switch on records consent (`setReminderConsent(true)`); turning
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
 * happened (D-478). A visit reminder for a member has its own screen; someone
 * wanting to connect has no text yet, so those two say "coming soon".
 */
const LIVE: ReadonlySet<Kind> = new Set<Kind>(['closed', 'message', 'booked', 'changed', 'trip']);

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
  intro: { fontSize: '18px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  soon: { fontSize: '15px', lineHeight: 1.5, fontWeight: 600 },
  label: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  words: { flexGrow: 1, minWidth: 0 },
});

export function AlertsView() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const userId = session.status === 'signed-in' ? session.session.userId : null;
  const role = session.status === 'signed-in' ? session.session.role : null;
  const who = role === 'provider' ? 'provider' : role === 'admin' ? 'admin' : 'member';
  const KINDS = KINDS_FOR[who];
  /** The account's one yes/no for texts (`notification_preferences`), which every sent kind shares. */
  const [consent, setConsent] = useState(false);
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
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const change = async (kind: Kind, on: boolean) => {
    if (!LIVE.has(kind) || !userId || stopped) return;
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
      ) : (
        <Text xstyle={styles.intro}>{t('alerts.intro')}</Text>
      )}
      <Card padding={6}>
        <VStack gap={5}>
          {KINDS.map((kind) => {
            const live = LIVE.has(kind);
            return (
            // Pam's own sizes for the words (17px, 15px under it): Astryx's
            // switch label is set smaller than §12 allows on a phone. The
            // switch keeps its label, hidden, so it is still named.
            <HStack key={kind} gap={3} align="center" wrap="nowrap">
              <VStack gap={1} xstyle={styles.words}>
                <HStack gap={0} align="center" wrap="nowrap">
                  <Text xstyle={styles.label}>{t(`alerts.${kind}`)}</Text>
                  {TERM_FOR[kind] ? <TermInfo term={TERM_FOR[kind]} /> : null}
                </HStack>
                <Text type="supporting" xstyle={styles.small}>
                  {t(`alerts.${kind}.body`)}
                </Text>
                {live ? null : (
                  <Text xstyle={styles.soon}>{t('alerts.comingSoon')}</Text>
                )}
              </VStack>
              <Switch
                label={t(`alerts.${kind}`)}
                isLabelHidden
                value={live && isOn(kind)}
                changeAction={(on) => change(kind, on)}
                isDisabled={!userId || !live || stopped}
              />
            </HStack>
            );
          })}
        </VStack>
      </Card>
      <Text type="supporting" xstyle={styles.small}>
        {/* Not "a few a week": a busy program hears more than that (D-256). */}
        {t('alerts.how')}
      </Text>
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
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
    </SubPage>
  );
}
