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
 * **Which switches are on is kept on this phone for now.** The database has
 * one yes/no for texts; a yes per kind is a new column and a migration, for
 * Will to approve. Until then the per-kind choice is a preference here, and
 * the consent itself is the real, stored one. Nothing sends these yet either:
 * each needs an SMS template a person has reviewed (`sms-templates.ts`).
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

const keyFor = (who: string) => `pam.alerts.${who}`;

function readChoices(who: string): Partial<Record<Kind, boolean>> | null {
  try {
    const raw = window.localStorage.getItem(keyFor(who));
    return raw ? (JSON.parse(raw) as Partial<Record<Kind, boolean>>) : null;
  } catch {
    return null;
  }
}

/**
 * Whether any text alert is on for this kind of account, on this phone —
 * so a screen can stop offering to turn them on (D-386).
 */
export function hasTextAlerts(who: 'member' | 'admin' | 'provider'): boolean {
  return Object.values(readChoices(who) ?? {}).some(Boolean);
}

function writeChoices(who: string, choices: Partial<Record<Kind, boolean>>): void {
  try {
    window.localStorage.setItem(keyFor(who), JSON.stringify(choices));
  } catch {
    // Not kept between visits; the consent itself still is.
  }
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
  const [choices, setChoices] = useState<Partial<Record<Kind, boolean>>>({});
  const [failed, setFailed] = useState(false);

  // Last time's choices; or, with texts already agreed to and nothing kept
  // here, all three — that yes covered everything before there were switches.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const kept = readChoices(who);
      if (kept) {
        if (!cancelled) setChoices(kept);
        return;
      }
      const { getReminderConsent } = await import('@/lib/useReminderConsent');
      const agreed = await getReminderConsent(userId);
      if (!cancelled && agreed) setChoices(Object.fromEntries(KINDS_FOR[who].map((k) => [k, true])));
    })();
    return () => {
      cancelled = true;
    };
  }, [userId, who]);

  const change = async (kind: Kind, on: boolean) => {
    const next = { ...choices, [kind]: on };
    const sending = KINDS.filter((k) => LIVE.has(k));
    const wasAny = sending.some((k) => choices[k]);
    const isAny = sending.some((k) => next[k]);
    setChoices(next);
    writeChoices(who, next);
    if (userId && wasAny !== isAny) {
      const saved = await setReminderConsent(userId, isAny);
      setFailed(!saved);
    }
  };

  return (
    <SubPage title={t('alerts.title')} backHref="/profile/" backLabel={t('nav.back.profile')} actions={<HelpButton />}>
      <Text xstyle={styles.intro}>{t('alerts.intro')}</Text>
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
                value={live && !!choices[kind]}
                changeAction={(on) => change(kind, on)}
                isDisabled={!userId || !live}
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
