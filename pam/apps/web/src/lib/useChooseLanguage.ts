'use client';

import { useCallback } from 'react';
import type { Locale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';

/**
 * Choosing a language (moved out of `LanguageSwitcher` for the Language
 * screen, D-213). Switches the active locale at once; signed in, it also
 * writes `profiles.preferred_language`, which a later sign-in reads back
 * through `LocaleSync`. Signed out, the choice lives in this browser only.
 */
export function useChooseLanguage(): (next: Locale) => void {
  const { setLocale } = useI18n();
  const { state: session } = useSession();
  return useCallback(
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
}
