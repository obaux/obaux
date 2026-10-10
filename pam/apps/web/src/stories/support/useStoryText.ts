'use client';

import { useCallback } from 'react';
import { useI18n } from '@/lib/i18n';
import { formatTime } from '@/lib/usePlaceStatus';
import { intlLocale } from '@pam/config';

/**
 * Story text that follows the Language toolbar.
 *
 * A story's args are the component's own props, so a designer can still type
 * anything into a control. A string arg that is an i18n key is translated the
 * way the app translates it; anything else is shown as typed (`t` returns an
 * unknown key unchanged), which is what catalogue data — a place's name, a
 * description — should do, because the app does not translate it either.
 *
 * A key that needs variables carries them as a query string:
 * `place.openUntil?time=17:00`, `places.miles?count=1.2`. A `HH:MM` value is
 * formatted as a time and a number as a number, both in the current locale,
 * so Spanish reads "17:00" and "1,2" where English reads "5:00 PM" and "1.2".
 */
const KEY = /^[a-z][\w-]*(\.[\w-]+)+$/i;
const TIME = /^\d{1,2}:\d{2}$/;
const NUMBER = /^\d+(\.\d+)?$/;

export type StoryText = {
  (value: string): string;
  (value: string | null | undefined): string | null | undefined;
};

export function useStoryText(): StoryText {
  const { t, locale } = useI18n();
  return useCallback(
    ((value: string | null | undefined) => {
      if (value == null) return value;
      const at = value.indexOf('?');
      const key = at === -1 ? value : value.slice(0, at);
      if (!KEY.test(key)) return value;
      if (at === -1) return t(key);
      const vars: Record<string, string> = {};
      for (const [name, raw] of new URLSearchParams(value.slice(at + 1))) {
        vars[name] = TIME.test(raw)
          ? formatTime(raw, locale)
          : NUMBER.test(raw)
            ? new Intl.NumberFormat(intlLocale(locale)).format(Number(raw))
            : t(raw);
      }
      return t(key, vars);
    }) as StoryText,
    [t, locale],
  );
}
