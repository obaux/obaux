'use client';

import { shareText } from '@pam/ui/share';
import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { inviteLink } from '@/lib/appUrl';
import type { CreatedInvite } from '@/lib/useCaseload';
import { intlLocale } from '@pam/config';

/**
 * An invite, made (D-254, Will, 3 October): a **link**, not a code to read
 * out. It opens Pam's sign in with a black line on top saying what they were
 * invited to be, and the code rides along to joining, so the person who
 * receives it never types it.
 *
 * - **Send the link** is the one action. On a phone it opens the share
 *   sheet (Messages first), with a short sentence and the link already
 *   written; where there is no share sheet, it copies the link instead and
 *   says so.
 * - The link is shown, so somebody can see what they are sending.
 * - **On the phone?** The code is still there, small, for an invite made
 *   during a call. It works typed into joining, as it always has.
 *
 * Used by Invite someone, the case-manager admin screen and the directory,
 * which each had their own copy of the old code card.
 */
const styles = stylex.create({
  heading: { fontSize: '20px', lineHeight: 1.3 },
  body: { fontSize: '16px', lineHeight: 1.5 },
  link: {
    fontSize: '15px',
    lineHeight: 1.4,
    wordBreak: 'break-all',
    paddingBlock: '10px',
    paddingInline: '12px',
    borderRadius: '12px',
    backgroundColor: colorVars['--color-background-muted'],
  },
  code: { fontSize: '15px', lineHeight: 1.5 },
});

export function InviteReady({
  invite,
  onAnother,
  isBare = false,
}: {
  readonly invite: CreatedInvite;
  readonly onAnother: () => void;
  /** Inside a card already (the directory): the content without its own. */
  readonly isBare?: boolean;
}) {
  const { t, tPlain, locale } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = inviteLink(invite.code, invite.role);
  const date = new Intl.DateTimeFormat(intlLocale(locale), { month: 'long', day: 'numeric' }).format(new Date(invite.expiresAt));

  const send = async () => {
    const text = tPlain('invite.link.message', { url });
    // The share sheet, in the app too (D-350); with none, copy instead.
    if (await shareText(text)) return;
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard either; the link is on the screen to copy by hand.
    }
  };

  const content = (
    <VStack gap={3}>
      <Heading level={2} xstyle={styles.heading}>
        {t(`invite.link.title.${invite.role}`)}
      </Heading>
      <Text type="supporting" xstyle={styles.body}>
        {t('invite.link.body', { date })}
      </Text>
      <Text xstyle={styles.link} aria-label={t('invite.link.label')}>
        {url}
      </Text>
      <BigButton
        label={copied ? t('invite.link.copied') : t('invite.link.share')}
        onPress={() => void send()}
      />
      <Text type="supporting" xstyle={styles.code}>
        {t('invite.link.code', { code: invite.code })}
      </Text>
      <TextLink label={t('admin.invite.another')} onClick={onAnother} />
    </VStack>
  );
  return isBare ? content : <Card padding={6}>{content}</Card>;
}
