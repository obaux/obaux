'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'next/navigation';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { displayPhone, intlLocale, renderSms } from '@pam/config';
import { BigButton, Notice, TextField } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
import { replyContextFrom, type ReplyContext } from '@/lib/replyContext';
import { useExamplesOn } from '@/lib/useExamplesOn';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';

/**
 * Answer a help request by text (A28, D-524; Will, 11 October: "text back"). The number comes in the link from the
 * request email; the super admin types a short answer; Pam sends it once, from its own number, as `support_reply`.
 *
 * The server refuses a number that asked Pam to stop, and anything while Pam's texts are off, and says why in plain
 * English; this screen shows that reason as it is. The words are checked here first with the dispatcher's own rules
 * (160 characters with the STOP line, no emoji, nothing that would name a person's situation), so a refusal is
 * seen now, not lost later. It keeps nothing: the number is in the link and the answer is not stored here.
 */
const MAX = 120;

const styles = stylex.create({
  to: { fontSize: '18px', lineHeight: 1.5 },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // What they wrote, in their own words and line breaks.
  question: { fontSize: '17px', lineHeight: 1.5, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  field: { width: '100%' },
});

/** Why the dispatcher would refuse these words, or null if it would not. */
function refusal(words: string): string | null {
  try {
    renderSms({ key: 'support_reply', locale: 'en', vars: { reply: words }, allowUnreviewed: true, includeStop: true });
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : 'Pam would not send these words.';
  }
}

export function SupportReplyScreen() {
  const { t, locale } = useI18n();
  const params = useSearchParams();
  const to = (params.get('to') ?? '').trim();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const [words, setWords] = useState('');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

  // Who the number belongs to, if Pam knows (the Everyone list's first names, matched by number), and what they
  // asked and when: the words come from the link, never the database (D-583).
  const examples = useExamplesOn();
  const [name, setName] = useState<string | null>(null);
  const [asked, setAsked] = useState<ReplyContext>({ question: null, askedAt: null });
  useEffect(() => {
    // From the address after `#`, which no server sees. Storybook and demo accounts may also pass them as ordinary
    // query values, so a story can show the screen; a real link does not.
    const fromAddress = replyContextFrom(window.location.hash);
    const fromQuery = examples ? replyContextFrom(`q=${encodeURIComponent(params.get('q') ?? '')}&at=${encodeURIComponent(params.get('at') ?? '')}`) : null;
    setAsked({
      question: fromAddress.question ?? fromQuery?.question ?? null,
      askedAt: fromAddress.askedAt ?? fromQuery?.askedAt ?? null,
    });
  }, [examples, params]);
  useEffect(() => {
    if (!isSuperAdmin || to === '') return;
    let cancelled = false;
    void (async () => {
      try {
        const { createClient } = await import('@/lib/supabase');
        const { data, error } = await createClient().rpc('profile_first_name_for_phone', { p_phone: to });
        if (!cancelled) setName(!error && typeof data === 'string' && data !== '' ? data : null);
      } catch {
        if (!cancelled) setName(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin, to]);
  const askedWhen = asked.askedAt
    ? new Intl.DateTimeFormat(intlLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(asked.askedAt))
    : null;

  const trimmed = words.trim();
  const over = trimmed.length > MAX;
  const unsendable = trimmed === '' || over ? null : refusal(trimmed);

  const send = async () => {
    setPhase('sending');
    setProblem(null);
    try {
      const { createClient } = await import('@/lib/supabase');
      const { error } = await createClient().rpc('send_support_text', { p_phone: to, p_words: trimmed });
      if (error) {
        setProblem(error.message);
        setPhase('idle');
        return;
      }
      setPhase('sent');
    } catch {
      setProblem(t('supportReply.failed'));
      setPhase('idle');
    }
  };

  return (
    <SubPage title={t('supportReply.title')} onBack={() => goBack('/')} backLabel={t('nav.back.home')}>
      {!isSuperAdmin && session.status !== 'loading' ? (
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : to === '' ? (
        <Text type="supporting" xstyle={styles.to}>
          {t('supportReply.noNumber')}
        </Text>
      ) : phase === 'sent' ? (
        <Text xstyle={styles.to}>{t('supportReply.sent')}</Text>
      ) : (
        <VStack gap={4}>
          <Text xstyle={styles.to}>
            {name
              ? t('supportReply.toNamed', { name, phone: displayPhone(to) })
              : t('supportReply.to', { phone: displayPhone(to) })}
          </Text>
          {asked.question ? (
            <Card padding={6}>
              <VStack gap={2}>
                <Text type="supporting" xstyle={styles.note}>
                  {askedWhen ? `${t('supportReply.theyWrote')} · ${askedWhen}` : t('supportReply.theyWrote')}
                </Text>
                <Text dir="auto" xstyle={styles.question}>
                  {asked.question}
                </Text>
              </VStack>
            </Card>
          ) : null}
          <Card padding={6}>
            <TextField
              label={t('supportReply.label')}
              hasAutoFocus
              value={words}
              onChange={setWords}
              width="100%"
              xstyle={styles.field}
            />
          </Card>
          <Text type="supporting" xstyle={styles.note} {...(over ? { role: 'alert' } : {})}>
            {t('supportReply.count', { used: trimmed.length, max: MAX })}
          </Text>
          {unsendable ?? problem ? (
            <Text role="alert" xstyle={styles.note}>
              {unsendable ?? problem}
            </Text>
          ) : null}
          <BigButton
            label={t('supportReply.send')}
            isDisabled={trimmed === '' || over || unsendable !== null || phase === 'sending'}
            onPress={() => void send()}
          />
        </VStack>
      )}
    </SubPage>
  );
}
