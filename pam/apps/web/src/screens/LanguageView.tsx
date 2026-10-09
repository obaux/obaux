'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { SUPPORTED_LOCALES } from '@pam/config';
import { GlobeIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { useChooseLanguage } from '@/lib/useChooseLanguage';

/**
 * Language (D-213): the one thing the old Account screen held that Profile
 * did not, given its own page. Each language is written in itself —
 * "English", "Español", "Português (Brasil)" — so somebody looking for theirs
 * finds it whatever the screen is in now. The tick moves at once; nothing to
 * save. One row for each of `SUPPORTED_LOCALES`, so a new language appears
 * here by being added there.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({ intro: { fontSize: '18px', lineHeight: 1.5 } });

export function LanguageView() {
  const { t, locale, pendingLocale } = useI18n();
  const shown = pendingLocale ?? locale;
  const choose = useChooseLanguage();
  return (
    <SubPage title={t('language.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
      <Text type="supporting" xstyle={styles.intro}>
        {t('language.intro')}
      </Text>
      <MenuList
        label={t('language.title')}
        items={SUPPORTED_LOCALES.map((code) => ({
          id: code,
          label: t(`language.${code}`),
          icon: <GlobeIcon {...ICON} />,
          isSelected: shown === code,
          onSelect: () => choose(code),
        }))}
      />
    </SubPage>
  );
}
