'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, CopyIcon, TextLink, TrashIcon } from '@pam/ui';
import { IconTile } from '@pam/ui/Reading';
import { SubPage } from '@pam/ui/SubPage';
import { TransparencyReading } from '@/screens/TransparencyReading';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';

/**
 * What others can see — and what you can do about your data (D-213, from the
 * reference Will gave on 1 October). Reached from Legal.
 *
 * The visibility list is `TRANSPARENCY_SCREEN` (packages/config/transparency.ts),
 * the same words a member agreed to when they joined — never re-worded here,
 * because that list is a promise and the tests hold it to its source.
 *
 * The two actions are what the privacy policy already offers ("Ask us for a
 * copy of what we keep about you, or ask us to delete it"). Neither is
 * self-serve in Pam today, so each opens a page that says so plainly and
 * puts the call to Pam one tap away — not a button that pretends.
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  line: { fontSize: '17px', lineHeight: 1.5 },
  action: { width: '100%' },
  actionLabel: { fontSize: '18px', fontWeight: 600, flexGrow: 1 },
  body: { fontSize: '18px', lineHeight: 1.55 },
});

function ActionCard({
  label,
  href,
  icon,
  tone,
}: {
  readonly label: string;
  readonly href: string;
  readonly icon: ReactNode;
  readonly tone: 'grey' | 'red';
}) {
  return (
    <ClickableCard label={label} href={href} padding={5} xstyle={styles.action}>
      <HStack gap={3} align="center" wrap="nowrap">
        {/* The same small round tile as the statements above, grey for a copy and red for
            a deletion (Will, D-417). */}
        <IconTile small tone={tone}>
          {icon}
        </IconTile>
        <Text xstyle={styles.actionLabel}>{label}</Text>
        <Icon icon="chevronRight" size="md" />
      </HStack>
    </ClickableCard>
  );
}

export function PrivacyControlsView() {
  const { t } = useI18n();
  return (
    <SubPage title={t('privacy.controls.title')} backHref="/legal/" backLabel={t('nav.back.legal')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('privacy.controls.intro')}
      </Text>

      {/* The guide and the short version, then the full policy (Will, D-417). */}
      <TransparencyReading detail={false} />

      <TextLink label={t('privacy.controls.policy')} href="/privacy/" />

      {/* No heading: straight into what a person can do about their data (Will, D-417). */}
      <VStack gap={3}>
        <ActionCard label={t('privacy.controls.copy')} href="/legal/privacy/copy/" icon={<CopyIcon />} tone="grey" />
        <ActionCard label={t('privacy.controls.delete')} href="/legal/privacy/delete/" icon={<TrashIcon />} tone="red" />
      </VStack>
    </SubPage>
  );
}

export function DataCopyView() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  return (
    <SubPage
      title={t('privacy.copy.title')}
      backHref="/legal/privacy/"
      backLabel={t('nav.back.privacyControls')}
    >
      <Text xstyle={styles.body}>{t('privacy.copy.body')}</Text>
      <Text type="supporting" xstyle={styles.body}>
        {t('help.call.body')}
      </Text>
      <BigButton label={t('help.call.action')} href={`tel:${supportPhone}`} />
    </SubPage>
  );
}

export function DeleteAccountView() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  return (
    <SubPage
      title={t('privacy.delete.title')}
      backHref="/legal/privacy/"
      backLabel={t('nav.back.privacyControls')}
    >
      <Text xstyle={styles.body}>{t('privacy.delete.body')}</Text>
      <Text type="supporting" xstyle={styles.body}>
        {t('privacy.delete.stop')}
      </Text>
      <BigButton label={t('help.call.action')} href={`tel:${supportPhone}`} variant="secondary" />
    </SubPage>
  );
}
