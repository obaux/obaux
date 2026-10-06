'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { friendLink } from '@/lib/appUrl';

/**
 * Bring a friend (D-329, Will, 6 October): from the top of a program's
 * quick actions, a link a member sends so a friend can join the same
 * program. One sentence, the link shown so they see what they send, and
 * one button that opens the share sheet (or copies, where there is none) —
 * the same shape as a staff invite (D-254), without the code.
 */
const styles = stylex.create({
  body: { fontSize: '18px', lineHeight: 1.45 },
  link: {
    fontSize: '15px',
    lineHeight: 1.4,
    wordBreak: 'break-all',
    paddingBlock: '10px',
    paddingInline: '12px',
    borderRadius: '12px',
    backgroundColor: colorVars['--color-background-muted'],
  },
  note: { fontSize: '16px', lineHeight: 1.4 },
});

export function friendHref(placeId: string, placeName: string): string {
  return `/place/friend/?id=${encodeURIComponent(placeId)}&name=${encodeURIComponent(placeName)}`;
}

export function BringFriendScreen({ placeId, placeName }: { readonly placeId: string; readonly placeName: string }) {
  const { t } = useI18n();
  const [copied, setCopied] = useState(false);
  const url = friendLink(placeId);

  const send = async () => {
    const text = t('friend.message', { place: placeName, url });
    try {
      if (typeof navigator.share === 'function') {
        await navigator.share({ text });
        return;
      }
    } catch {
      // Closed the sheet, or sharing is blocked: copy instead.
    }
    try {
      await navigator.clipboard?.writeText(url);
      setCopied(true);
    } catch {
      // No clipboard either; the link is on the screen to copy by hand.
    }
  };

  return (
    <SubPage
      title={t('friend.title')}
      subtitle={placeName || undefined}
      backHref={`/place/?id=${encodeURIComponent(placeId)}`}
      backLabel={t('nav.back.place')}
      // The one button rides the foot of the screen (D-326).
      footer={
        <BigButton label={copied ? t('invite.link.copied') : t('invite.link.share')} onPress={() => void send()} />
      }
    >
      <VStack gap={3}>
        <Text xstyle={styles.body}>{t('friend.body', { place: placeName })}</Text>
        <Text xstyle={styles.link} aria-label={t('invite.link.label')}>
          {url}
        </Text>
        <Text type="supporting" xstyle={styles.note}>
          {t('friend.note')}
        </Text>
      </VStack>
    </SubPage>
  );
}
