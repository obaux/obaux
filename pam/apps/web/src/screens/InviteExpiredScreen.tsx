'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, Loading, Page, TextField, TextLink } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import type { Invite } from '@/lib/appUrl';
import { isEmailAddress, previewInvite, requestInviteLink, type InvitePreview } from '@/lib/useInviteLinks';
import { LegalFooter } from '../app/signin/LegalFooter';

/**
 * An expired invite link (Will, 4 October, D-258; reworked by D-263).
 *
 * Opened by Sign in when an invite link has run out (`invite_preview`). It
 * keeps the invitation in view — the same black line, and "Dana invited you
 * to be a case manager" — then one thing to do: give an email address, and a
 * fresh link for the same role goes there (`request_invite_link`). Nobody
 * approves it (Will: "remove the need for super admin to approve"), and the
 * new link is never shown here — only the inbox gets it. A used or unknown
 * link says so plainly, with the way to sign in.
 */
const styles = stylex.create({
  invited: {
    display: 'block',
    width: '100%',
    paddingBlock: '10px',
    paddingInline: '16px',
    boxSizing: 'border-box',
    textAlign: 'center',
    fontSize: '15px',
    lineHeight: 1.4,
    fontWeight: 600,
    color: '#FFFFFF',
    backgroundColor: '#000000',
  },
  body: { fontSize: '18px', lineHeight: 1.5 },
  small: { fontSize: '16px', lineHeight: 1.5 },
  error: { fontSize: '16px', lineHeight: 1.5, color: colorVars['--color-error'] },
});

export function InviteExpiredScreen({ invite }: { readonly invite: Invite | null }) {
  const { t } = useI18n();
  const [preview, setPreview] = useState<InvitePreview | null | 'loading'>('loading');
  const [email, setEmail] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!invite) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    void previewInvite(invite.code).then((result) => {
      if (!cancelled) setPreview(result);
    });
    return () => {
      cancelled = true;
    };
  }, [invite]);

  const role = (preview !== 'loading' && preview?.role) || invite?.role || 'member';
  const name = (preview !== 'loading' && preview?.inviterFirstName) || t('invite.expired.someone');
  const state = preview === 'loading' ? 'loading' : (preview?.state ?? 'not_found');

  const ask = async () => {
    if (!invite) return;
    if (!isEmailAddress(email)) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    setBusy(true);
    setFailed(false);
    const ok = await requestInviteLink(invite.code, email);
    setBusy(false);
    if (ok) setSent(true);
    else setFailed(true);
  };

  const title =
    state === 'used' ? t('invite.expired.used.title') : state === 'not_found' ? t('invite.expired.missing.title') : sent ? t('invite.expired.sent.title') : t('invite.expired.title');

  return (
    <>
      {state === 'expired' || state === 'valid' ? (
        <Text role="note" xstyle={styles.invited}>
          {t(`signin.invited.${role}`)}
        </Text>
      ) : null}
      <Page gap={4}>
        <SubPageHeader title={title} backHref="/signin/" backLabel={t('nav.back.signInScreen')} />
        {state === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

        {state === 'expired' || state === 'valid' ? (
          sent ? (
            <Text xstyle={styles.body}>{t('invite.expired.sent.body', { email: email.trim() })}</Text>
          ) : (
            <>
              <Text xstyle={styles.body}>{t(`invite.expired.body.${role}`, { name })}</Text>
              <Card padding={6}>
                <VStack gap={3}>
                  <Text xstyle={styles.body}>{t('invite.expired.ask')}</Text>
                  <TextField
                    purpose="email"
                    label={t('invite.expired.email')}
                    // Ready to type on arrival (Will, 7 October, D-365).
                    hasAutoFocus
                    value={email}
                    onChange={setEmail}
                    width="100%"
                  />
                  {isInvalid ? (
                    <Text role="alert" xstyle={styles.error}>
                      {t('invite.expired.emailInvalid')}
                    </Text>
                  ) : (
                    <Text type="supporting" xstyle={styles.small}>
                      {t('invite.expired.emailHint')}
                    </Text>
                  )}
                  {failed ? (
                    <Text role="alert" xstyle={styles.error}>
                      {t('invite.expired.failed')}
                    </Text>
                  ) : null}
                  <BigButton
                    label={busy ? t('join.saving') : t('invite.expired.action')}
                    onPress={() => void ask()}
                    isDisabled={busy || email.trim() === ''}
                  />
                </VStack>
              </Card>
            </>
          )
        ) : null}

        {state === 'used' ? <Text xstyle={styles.body}>{t('invite.expired.used.body')}</Text> : null}
        {state === 'not_found' ? <Text xstyle={styles.body}>{t('invite.expired.missing.body')}</Text> : null}

        <TextLink label={t('invite.expired.signin')} href="/signin/" />
      </Page>
      <LegalFooter from="signin" />
    </>
  );
}
