'use client';

import { useCallback } from 'react';
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
import { useSession } from '@/lib/useSession';

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
  /*
   * A ghost icon button is transparent by design, which disappears on a
   * photo the way it never does on a plain page. Over the sign-in hero the
   * trigger needs a scrim of its own to read as a control rather than a
   * loose icon floating on the art (Will, 16 September, working from a Figma
   * redesign showing exactly this treatment) — a translucent dark circle,
   * regardless of light/dark theme, since it sits on art, not on the page.
   */
  onPhoto: {
    // Darker still (Will, 17 September) — a lighter scrim read as barely
    // there against some of the brighter photos.
    backgroundColor: 'rgba(15, 15, 15, 0.6)',
    color: '#FFFFFF',
    borderRadius: '17px',
  },
  // 2x the glyph Astryx's own icon set draws at, and a heavier stroke to
  // match (Will, 17 September) — a barely-there hairline globe read as an
  // afterthought floating on the art, next to a mark and a pill both drawn
  // with real weight. CSS `width`/`stroke-width` on the `<svg>` beat the
  // element's own presentation attributes, so this overrides `icons.tsx`'s
  // shared `1em`/`1.5` defaults without needing a variant on the icon itself.
  onPhotoGlyph: { width: '2em', height: '2em', strokeWidth: 2.5 },
});

export function LanguageSwitcher({
  variant = 'icon',
  rowStyle,
  tone,
}: {
  readonly variant?: 'icon' | 'row';
  /** The same row style every other Settings item uses, for the trigger button. */
  readonly rowStyle?: StyleXStyles;
  /** `'onPhoto'` swaps the icon trigger's usual transparent ghost for a scrim that stays legible over artwork — see the sign-in hero. */
  readonly tone?: 'onPhoto';
}) {
  const { locale, setLocale, t } = useI18n();
  const { state: session } = useSession();

  const choose = useCallback(
    (next: Locale) => {
      setLocale(next);
      if (session.status !== 'signed-in') return;
      void (async () => {
        const { createClient } = await import('@/lib/supabase');
        await createClient()
          .from('profiles')
          .update({ preferred_language: next })
          .eq('id', session.session.userId);
      })();
    },
    [session, setLocale],
  );

  const items = (
    <DropdownMenuRadioGroup
      label={t('language.title')}
      value={locale}
      onChange={(next) => choose(next as Locale)}
    >
      {OPTIONS.map((option) => (
        <DropdownMenuRadioItem key={option.value} value={option.value} label={t(option.labelKey)} />
      ))}
    </DropdownMenuRadioGroup>
  );

  if (variant === 'icon') {
    return (
      <DropdownMenu
        button={{
          label: t('language.title'),
          icon:
            tone === 'onPhoto' ? (
              <GlobeIcon {...stylex.props(styles.onPhotoGlyph)} />
            ) : (
              <GlobeIcon />
            ),
          isIconOnly: true,
          variant: 'ghost',
          xstyle: tone === 'onPhoto' ? styles.onPhoto : undefined,
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
