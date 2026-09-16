'use client';

import { useCallback } from 'react';
import { Badge } from '@astryxdesign/core/Badge';
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

export function LanguageSwitcher({ variant = 'icon' }: { readonly variant?: 'icon' | 'row' }) {
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
        button={{ label: t('language.title'), icon: <GlobeIcon />, isIconOnly: true, variant: 'ghost' }}
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
        endContent: <Badge variant="neutral" label={t(locale === 'en' ? 'language.en' : 'language.es')} />,
      }}
    >
      {items}
    </DropdownMenu>
  );
}
