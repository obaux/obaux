'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { GlobeIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { useChooseLanguage } from '@/lib/useChooseLanguage';

/**
 * Language (D-213): the one thing the old Account screen held that Profile
 * did not, given its own page. Each language is written in itself —
 * "English", "Español" — so somebody looking for theirs finds it whatever
 * the screen is in now. The tick moves at once; nothing to save.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({ intro: { fontSize: '18px', lineHeight: 1.5 } });

export function LanguageView() {
  const { t, locale } = useI18n();
  const choose = useChooseLanguage();
  return (
    <SubPage title={t('language.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('language.intro')}
      </Text>
      <MenuList
        label={t('language.title')}
        items={[
          {
            id: 'en',
            label: t('language.en'),
            icon: <GlobeIcon {...ICON} />,
            isSelected: locale === 'en',
            onSelect: () => choose('en'),
          },
          {
            id: 'es',
            label: t('language.es'),
            icon: <GlobeIcon {...ICON} />,
            isSelected: locale === 'es',
            onSelect: () => choose('es'),
          },
        ]}
      />
    </SubPage>
  );
}
