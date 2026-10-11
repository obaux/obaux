'use client';

import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BookIcon, TextLink } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';

/**
 * Legal (D-213, from the reference Will gave on 1 October): one row on
 * Profile instead of three, opening this list. The policies themselves are
 * the ones Pam already has — the terms, the privacy policy, and the part of
 * it that says who can see what (`#who-can-see`).
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

/**
 * "Data sources" (D-540): the credit the neighborhood list's licence (CC BY 4.0) asks for — the creator, the licence with its
 * link, a link to the source, and that it was changed. Not in Privacy or Terms: it is a licence notice, not a promise.
 */
const SOURCE_URL =
  'https://github.com/azavea/geo-data/tree/5c4538b5f4d2a26a81b7fab2d0006d327a39e3d0/philadelphia-neighborhoods';
const LICENCE_URL = 'https://creativecommons.org/licenses/by/4.0/';

const styles = stylex.create({
  title: { fontSize: '20px', lineHeight: 1.3 },
  body: { fontSize: '17px', lineHeight: 1.5 },
});

export function LegalView() {
  const { t } = useI18n();
  return (
    <SubPage title={t('legal.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
      <MenuList
        label={t('legal.title')}
        items={[
          { id: 'terms', label: t('legal.menu.terms'), href: '/terms/', icon: <BookIcon {...ICON} /> },
          { id: 'privacy', label: t('legal.menu.privacy'), href: '/privacy/', icon: <BookIcon {...ICON} /> },
          {
            id: 'visibility',
            label: t('legal.menu.visibility'),
            href: '/legal/privacy/',
            icon: <BookIcon {...ICON} />,
          },
        ]}
      />
      <VStack gap={2}>
        <Heading level={2} xstyle={styles.title}>
          {t('legal.sources.title')}
        </Heading>
        <Text xstyle={styles.body}>{t('legal.sources.neighborhoods')}</Text>
        <TextLink label={t('legal.sources.link')} href={SOURCE_URL} />
        <TextLink label={t('legal.sources.licence')} href={LICENCE_URL} />
      </VStack>
    </SubPage>
  );
}
