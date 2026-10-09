'use client';

import { useEffect, useRef, useState } from 'react';
import { MESSAGE_TRANSLATION, TRANSLATION_BATCH } from '@pam/config';
import { useI18n } from './i18n';
import type { MessageTranslation } from '@/app/messages/TranslatedBody';

/**
 * Other people's messages, in the reader's language (D-423).
 *
 * Asks the `translate-messages` function — once for each message, in the
 * language the reader uses — and returns what it found, by message id. A
 * message that needed none (already in the reader's language, or no words)
 * is simply absent. Anything that goes wrong is absence too: the person keeps
 * the message as it was written, which is always right to show.
 *
 * **Does nothing while `MESSAGE_TRANSLATION.enabled` is false:** no request,
 * no import of the Supabase client for this, nothing. The same switch puts
 * the privacy page's words about it in front of people.
 *
 * The reader's own messages are never sent: the function drops them as well,
 * so this is the second wall, not the only one.
 */
export interface TranslatableMessage {
  readonly id: string;
  readonly body: string | null;
  readonly mine: boolean;
}

export function useMessageTranslations(messages: readonly TranslatableMessage[]): Readonly<Record<string, MessageTranslation>> {
  const { locale } = useI18n();
  const [found, setFound] = useState<{ locale: string; byId: Record<string, MessageTranslation> }>({ locale, byId: {} });
  // Ids already asked about, in this language: one question per message.
  const asked = useRef<{ locale: string; ids: Set<string> }>({ locale, ids: new Set() });
  // A question already on its way is answered even if the list it came from
  // has since changed (a new message arriving re-runs the effect below).
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  useEffect(() => {
    if (!MESSAGE_TRANSLATION.enabled) return;
    if (asked.current.locale !== locale) asked.current = { locale, ids: new Set() };
    const fresh = messages
      .filter((m) => !m.mine && m.body !== null && m.body.trim() !== '' && !asked.current.ids.has(m.id))
      .map((m) => m.id);
    if (fresh.length === 0) return;
    for (const id of fresh) asked.current.ids.add(id);

    const run = async () => {
      try {
        const { createClient } = await import('./supabase');
        const client = createClient();
        for (let i = 0; i < fresh.length; i += TRANSLATION_BATCH) {
          const { data, error } = await client.functions.invoke('translate-messages', {
            body: { messageIds: fresh.slice(i, i + TRANSLATION_BATCH), target: locale },
          });
          // Gone from the screen, or read in another language since: drop it.
          if (!alive.current || asked.current.locale !== locale) return;
          if (error || !data || data.enabled === false) {
            // Not available: forget the question so a later visit asks again.
            for (const id of fresh.slice(i, i + TRANSLATION_BATCH)) asked.current.ids.delete(id);
            continue;
          }
          const rows = (data.translations ?? []) as { messageId: string; sourceLocale: string; body: string }[];
          if (rows.length > 0) {
            setFound((now) => ({
              locale,
              byId: {
                ...(now.locale === locale ? now.byId : {}),
                ...Object.fromEntries(rows.map((r) => [r.messageId, { body: r.body, from: r.sourceLocale }])),
              },
            }));
          }
        }
      } catch {
        for (const id of fresh) asked.current.ids.delete(id);
      }
    };
    void run();
  }, [messages, locale]);

  return found.locale === locale ? found.byId : {};
}
