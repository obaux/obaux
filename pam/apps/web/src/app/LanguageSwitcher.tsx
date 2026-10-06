'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import {
  DropdownMenu,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@astryxdesign/core/DropdownMenu';
import { GlobeIcon } from '@pam/ui';
import type { Locale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useChooseLanguage } from '@/lib/useChooseLanguage';

/**
 * English or Spanish, wherever PAM offers the choice — the icon beside the
 * bell on the way in, and a row in account settings (Will, 16 September).
 *
 * Language names are shown in themselves, not translated into whichever
 * locale is currently active: "English" and "Español" read the same to
 * everybody looking for their own language in a list, which is the point of
 * a language switcher — see `language.en` / `language.es`.
 *
 * Switching updates the active locale immediately either way. Signed in, it
 * also writes `profiles.preferred_language`, which is what a later sign-in
 * — on this device or another — reads back through `LocaleSync`. Signed out,
 * the choice lives in this browser only (`I18nProvider`'s own cache) until an
 * account exists to attach it to.
 */

const OPTIONS: readonly { value: Locale; labelKey: 'language.en' | 'language.es' }[] = [
  { value: 'en', labelKey: 'language.en' },
  { value: 'es', labelKey: 'language.es' },
];

const styles = stylex.create({
  // Astryx's own Badge has no plain/white variant, and no xstyle to add one —
  // this is a small chip built from Text instead, painted with the card
  // background (white in light mode) rather than Badge's muted grey (Will,
  // 16 September: "make chip white"), with room on its own left edge so it
  // reads as a separate thing from the icon+label beside it rather than
  // crowding against them.
  chip: {
    fontSize: '15px',
    fontWeight: 600,
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-background-card'],
    borderRadius: '999px',
    paddingInline: '10px',
    paddingBlock: '4px',
    marginInlineStart: '8px',
  },
  // The white disc with a thin grey edge every round header button uses —
  // bell, Help, search (D-216) — on the page and over the sign-in photo
  // alike (Will, 3 October, D-253). Exactly 48px round.
  round: {
    width: '48px',
    height: '48px',
    minHeight: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    color: colorVars['--color-text-primary'],
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  // The menu is drawn at the small size, so the radio dial is small (Will,
  // 6 October, D-311) — the rows keep the 48px floor and their 17px words,
  // and get as much room on the right as the dial has on the left.
  option: { minHeight: '48px', fontSize: '17px', paddingInlineEnd: '24px' },
});

export function LanguageSwitcher({
  variant = 'icon',
  rowStyle,
}: {
  readonly variant?: 'icon' | 'row';
  /** The same row style every other Settings item uses, for the trigger button. */
  readonly rowStyle?: StyleXStyles;
}) {
  const { locale, t } = useI18n();
  const choose = useChooseLanguage();

  const items = (
    <DropdownMenuRadioGroup
      label={t('language.title')}
      value={locale}
      onChange={(next) => choose(next as Locale)}
    >
      {OPTIONS.map((option) => (
        <DropdownMenuRadioItem key={option.value} value={option.value} label={t(option.labelKey)} xstyle={styles.option} />
      ))}
    </DropdownMenuRadioGroup>
  );

  if (variant === 'icon') {
    return (
      <DropdownMenu
        button={{
          label: t('language.title'),
          icon: <GlobeIcon />,
          isIconOnly: true,
          variant: 'ghost',
          size: 'sm',
          xstyle: styles.round,
        }}
        hasChevron={false}
        placement="below"
        alignment="end"
      >
        {items}
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu
      button={{
        label: t('language.title'),
        variant: 'ghost',
        icon: <GlobeIcon />,
        endContent: (
          <Text xstyle={styles.chip}>{t(locale === 'en' ? 'language.en' : 'language.es')}</Text>
        ),
        xstyle: rowStyle,
      }}
    >
      {items}
    </DropdownMenu>
  );
}
