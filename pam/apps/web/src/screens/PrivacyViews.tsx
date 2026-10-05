'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { TRANSPARENCY_SCREEN } from '@pam/config';
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
 * self-serve in PAM today, so each opens a page that says so plainly and
 * puts the call to PAM one tap away — not a button that pretends.
 */
const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  line: { fontSize: '17px', lineHeight: 1.5 },
  action: { width: '100%' },
  actionLabel: { fontSize: '18px', fontWeight: 600, flexGrow: 1 },
  body: { fontSize: '18px', lineHeight: 1.55 },
});

function ActionCard({ label, href }: { readonly label: string; readonly href: string }) {
  return (
    <ClickableCard label={label} href={href} padding={5} xstyle={styles.action}>
      <HStack gap={2} align="center" wrap="nowrap">
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

      <Card padding={4}>
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.heading}>
            {t(TRANSPARENCY_SCREEN.canSeeHeadingKey)}
          </Heading>
          {TRANSPARENCY_SCREEN.canSee.map((line) => (
            <Text key={line.key} xstyle={styles.line}>
              • {t(line.key)}
            </Text>
          ))}
          <Heading level={2} xstyle={styles.heading}>
            {t(TRANSPARENCY_SCREEN.cannotSeeHeadingKey)}
          </Heading>
          {TRANSPARENCY_SCREEN.cannotSee.map((line) => (
            <Text key={line.key} xstyle={styles.line}>
              • {t(line.key)}
            </Text>
          ))}
        </VStack>
      </Card>

      <VStack gap={3}>
        <Heading level={2} xstyle={styles.heading}>
          {t('privacy.controls.data')}
        </Heading>
        <ActionCard label={t('privacy.controls.copy')} href="/legal/privacy/copy/" />
        <ActionCard label={t('privacy.controls.delete')} href="/legal/privacy/delete/" />
      </VStack>

      <TextLink label={t('privacy.controls.policy')} href="/privacy/" />
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
