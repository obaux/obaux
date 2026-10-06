'use client';

import { BookIcon } from '@pam/ui';
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
    </SubPage>
  );
}
