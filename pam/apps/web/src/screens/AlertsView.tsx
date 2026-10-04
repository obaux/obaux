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

/**
 * Text alerts, for a program (Will, 3 October, D-256): programs hear from
 * people more than anyone, so what PAM texts them about is three switches,
 * one each, rather than one yes to everything:
 *
 *   - someone books a visit,
 *   - someone changes a booking (moved or cancelled),
 *   - someone messages you — that one is waiting, never what it says.
 *
 * **Consent stays an act.** Every switch starts off — a carrier rejected
 * PAM's first campaign for an opt-in that arrived pre-selected (30925) — and
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
type Kind = 'booked' | 'changed' | 'message';
const KINDS: readonly Kind[] = ['booked', 'changed', 'message'];
const KEY = 'pam.alerts';

function readChoices(): Partial<Record<Kind, boolean>> | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Partial<Record<Kind, boolean>>) : null;
  } catch {
    return null;
  }
}

function writeChoices(choices: Record<Kind, boolean>): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(choices));
  } catch {
    // Not kept between visits; the consent itself still is.
  }
}

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  small: { fontSize: '15px', lineHeight: 1.5 },
  label: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600 },
  words: { flexGrow: 1, minWidth: 0 },
});

export function AlertsView() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const userId = session.status === 'signed-in' ? session.session.userId : null;
  const [choices, setChoices] = useState<Record<Kind, boolean>>({ booked: false, changed: false, message: false });
  const [failed, setFailed] = useState(false);

  // Last time's choices; or, with texts already agreed to and nothing kept
  // here, all three — that yes covered everything before there were switches.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    void (async () => {
      const kept = readChoices();
      if (kept) {
        if (!cancelled) setChoices({ booked: !!kept.booked, changed: !!kept.changed, message: !!kept.message });
        return;
      }
      const { getReminderConsent } = await import('@/lib/useReminderConsent');
      const agreed = await getReminderConsent(userId);
      if (!cancelled && agreed) setChoices({ booked: true, changed: true, message: true });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const change = async (kind: Kind, on: boolean) => {
    const next = { ...choices, [kind]: on };
    const wasAny = KINDS.some((k) => choices[k]);
    const isAny = KINDS.some((k) => next[k]);
    setChoices(next);
    writeChoices(next);
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
          {KINDS.map((kind) => (
            // PAM's own sizes for the words (17px, 15px under it): Astryx's
            // switch label is set smaller than §12 allows on a phone. The
            // switch keeps its label, hidden, so it is still named.
            <HStack key={kind} gap={3} align="center" wrap="nowrap">
              <VStack gap={1} xstyle={styles.words}>
                <Text xstyle={styles.label}>{t(`alerts.${kind}`)}</Text>
                <Text type="supporting" xstyle={styles.small}>
                  {t(`alerts.${kind}.body`)}
                </Text>
              </VStack>
              <Switch
                label={t(`alerts.${kind}`)}
                isLabelHidden
                value={choices[kind]}
                changeAction={(on) => change(kind, on)}
                isDisabled={!userId}
              />
            </HStack>
          ))}
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
