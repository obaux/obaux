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
import { setReminderConsent } from '@/lib/useReminderConsent';
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
 * **What is on is kept on the account (D-453).** It used to be kept in this
 * phone's `localStorage`, so a person's choice did not follow them to another
 * phone and a stale one could disagree with the database. Today exactly one
 * kind is really sent (a saved place closing or moving, `LIVE` below), and for
 * it the one yes/no in `notification_preferences` is the whole answer, so the
 * switch simply shows that. A yes per kind is a column and a migration for the
 * day a second kind is built; until then there is nothing else to remember.
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
 * promise" — build them, and until they are built, do not offer them).
 *
 * Only a saved place closing or moving is queued for a text (0035–0037). The
 * rest — a visit reminder, someone wanting to connect, a message waiting, a
 * visit booked, changed or planned — have templates (drafts nobody has signed,
 * `sms-templates.ts`) and nothing that queues them, so their switches say
 * "coming soon" and cannot be turned on. When a text is built and signed, its
 * kind joins this list in the same change.
 */
const LIVE: ReadonlySet<Kind> = new Set<Kind>(['closed']);

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
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const change = async (kind: Kind, on: boolean) => {
    if (!LIVE.has(kind) || !userId || stopped) return;
    setSaved(false);
    setFailed(false);
    setConsent(on);
    const ok = await setReminderConsent(userId, on);
    setFailed(!ok);
    setSaved(ok);
    if (!ok) setConsent(!on);
  };

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
                value={live && !stopped && consent}
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
