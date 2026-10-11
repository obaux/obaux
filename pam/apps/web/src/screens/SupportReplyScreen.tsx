'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'next/navigation';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { renderSms } from '@pam/config';
import { BigButton, Notice, TextField } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
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
  const { t } = useI18n();
  const params = useSearchParams();
  const to = (params.get('to') ?? '').trim();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const [words, setWords] = useState('');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [problem, setProblem] = useState<string | null>(null);

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
          <Text xstyle={styles.to}>{t('supportReply.to', { phone: to })}</Text>
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
