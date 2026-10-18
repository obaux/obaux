'use client';

import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import { SettingsList, SettingsRow } from '@pam/ui/SettingsList';
import { useI18n } from '@/lib/i18n';
import { textKindsFor, type TextKindsFor } from '@/lib/textKinds';
import { useTextsLive } from '@/lib/useTextsLive';

/**
 * The kinds of texts Pam would send, as the consent screens show them (D-608, Will 18 October: "we don't need an introduction
 * paragraph"; Sage's words, 17:52): the label "Kinds of texts", then one row per kind, each with a "Coming soon" badge under its name
 * while its text is not sent yet. No switches: on these screens the choice is the Agree button, in its own words (A2P, D-453).
 *
 * One list for `/reminders/` and for the join step, so the two screens say the same thing and the registered paragraph quotes one set
 * of words. Which rows carry the badge is DATA, not copy: a row loses its badge the day its text goes live, with no edit here.
 *
 *   - A reminder before a trip (alerts.visit): not sent yet, whatever the switch (the visit reminders are not built).
 *   - A saved place closes or moves (alerts.closed): sent once `texts_live` is on (D-481).
 *   - A staff member's three (messages, a visit booked or changed, a visit planned): once `texts_live` is on AND the alert texts are
 *     switched on (`ALERT_TEXTS_LIVE`, D-478).
 * Rows that are on come first, the ones not yet below them (Will, 18 October, D-615).
 */
const styles = stylex.create({
  label: { fontSize: '17px', lineHeight: 1.35 },
});

export function TextKindsList({ who, bare = false }: { readonly who: TextKindsFor; readonly bare?: boolean }) {
  const { t } = useI18n();
  const textsLive = useTextsLive();
  const rows = textKindsFor(who, textsLive);
  return (
    <VStack gap={1}>
      {/* On a screen that keeps its card (the agree screens, a103: "keep the original layouts") the card carries the heading itself. */}
      {bare ? null : (
        <Text type="supporting" xstyle={styles.label}>
          {t('reminders.what')}
        </Text>
      )}
      <SettingsList>
        {rows.map((row) => (
          <SettingsRow key={row.key} label={t(row.key)} badge={row.live ? undefined : t('common.comingSoon')} control={null} />
        ))}
      </SettingsList>
    </VStack>
  );
}
