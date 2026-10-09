'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { EyeIcon, EyeOffIcon, MessagesIcon, PeopleIcon, PhoneIcon } from '@pam/ui';
import {
  FactGroup,
  FactRow,
  GuideCard,
  ReadCard,
  SummaryCard,
  type Decor,
  type SummaryLine,
} from '@pam/ui/Reading';
import { TRANSPARENCY_GROUPS, TRANSPARENCY_SCREEN } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { READING_STYLE } from '@/lib/readingStyle';

/**
 * What your guide can see, for somebody who knows nothing about Pam (D-416).
 *
 * One component for both places a member reads it — the last step of signing
 * up, and Profile › What others can see — so they cannot drift apart. Top to
 * bottom: who "your guide" is (said once), the short version, then the detail
 * as two cards, "can see" in three short groups and "cannot see". Each card
 * has a copy icon that puts its text on the clipboard.
 *
 * The words of every line are `TRANSPARENCY_SCREEN` (packages/config/
 * transparency.ts) and are never re-worded here; a line that says two things
 * ("… A program you joined sees this too.") is split at the full stop into a
 * lead and a grey line, with every word kept, in order. The grouping is
 * `TRANSPARENCY_GROUPS`, and a test holds that no line falls out of it.
 */
const styles = stylex.create({
  small: { fontSize: '16px', lineHeight: 1.45 },
});

/** "Lead. Detail." → the lead, and the detail when there is one. */
export function splitLine(text: string): { lead: string; detail?: string } {
  const at = text.indexOf('. ');
  if (at < 0) return { lead: text };
  return { lead: text.slice(0, at + 1), detail: text.slice(at + 2) };
}

/** A card title is the contract's heading without its trailing colon. */
const asTitle = (heading: string) => heading.replace(/[:：]\s*$/, '');

export function TransparencyReading({ decor = READING_STYLE }: { readonly decor?: Decor }) {
  const { t } = useI18n();

  const byKey = new Map(TRANSPARENCY_SCREEN.canSee.map((line) => [line.key, line] as const));
  const source = `Pam — ${t('privacy.controls.title')}`;
  const copyProps = (text: string) => ({
    text,
    label: t('copy.section'),
    copiedLabel: t('copy.done'),
    failedLabel: t('copy.failed'),
  });

  const canTitle = asTitle(t(TRANSPARENCY_SCREEN.canSeeHeadingKey));
  const cannotTitle = asTitle(t(TRANSPARENCY_SCREEN.cannotSeeHeadingKey));

  const canText = [
    canTitle,
    ...TRANSPARENCY_GROUPS.flatMap((group) => [
      '',
      t(group.titleKey),
      ...group.keys.map((key) => `- ${t(key)}`),
    ]),
    '',
    source,
  ].join('\n');
  const cannotText = [
    cannotTitle,
    ...TRANSPARENCY_SCREEN.cannotSee.map((line) => `- ${t(line.key)}`),
    '',
    source,
  ].join('\n');

  const summary: SummaryLine[] = [
    { text: t('transparency.summary.see'), mark: 'yes', icon: <EyeIcon /> },
    { text: t('transparency.summary.cannot'), mark: 'no', icon: <EyeOffIcon /> },
    { text: t('transparency.summary.reported'), mark: 'yes', icon: <MessagesIcon /> },
    { text: t('privacy.s.contact.p1'), mark: 'call', icon: <PhoneIcon /> },
  ];

  return (
    <VStack gap={3}>
      <GuideCard title={t('guide.title')} body={t('guide.body')} decor={decor} icon={<PeopleIcon />} />

      <SummaryCard title={t('transparency.summary.title')} lines={summary} decor={decor} />

      <ReadCard title={canTitle} decor={decor} icon={<EyeIcon />} copy={copyProps(canText)}>
        <VStack gap={3}>
          {TRANSPARENCY_GROUPS.map((group) => (
            <FactGroup key={group.titleKey} title={t(group.titleKey)}>
              {group.keys.map((key) => {
                const line = byKey.get(key);
                if (!line) return null;
                const { lead, detail } = splitLine(t(line.key));
                return <FactRow key={key} lead={lead} detail={detail} mark="yes" decor={decor} />;
              })}
            </FactGroup>
          ))}
        </VStack>
      </ReadCard>

      <ReadCard title={cannotTitle} decor={decor} icon={<EyeOffIcon />} copy={copyProps(cannotText)}>
        <FactGroup>
          {TRANSPARENCY_SCREEN.cannotSee.map((line) => {
            const { lead, detail } = splitLine(t(line.key));
            return <FactRow key={line.key} lead={lead} detail={detail} mark="no" decor={decor} />;
          })}
        </FactGroup>
      </ReadCard>

      <Text type="supporting" xstyle={styles.small}>
        {t(TRANSPARENCY_SCREEN.footerKey)}
      </Text>
    </VStack>
  );
}
