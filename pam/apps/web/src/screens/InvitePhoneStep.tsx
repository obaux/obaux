'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { toE164 } from '@/lib/usePhoneSignIn';

/**
 * Who the link is for, before it exists (Will, 4 October, D-258: "gather
 * phone number before generating links, so we can verify which person
 * invited who").
 *
 * The number goes into the invite (`create_invite`'s `p_phone`, there since
 * 0002), and `redeem_invite` already refuses any other verified phone — so a
 * link forwarded to somebody else does not work for them, and an expired
 * one's renewal request names the person it was for. Used by Invite someone,
 * the case manager's admin screen and the directory, the three ways to make
 * an invite.
 */
const styles = stylex.create({
  heading: { fontSize: '20px', lineHeight: 1.3 },
  hint: { fontSize: '16px', lineHeight: 1.5 },
  error: { fontSize: '16px', lineHeight: 1.5, color: colorVars['--color-error'] },
});

export function InvitePhoneStep({
  role,
  isBusy,
  onMake,
  onBack,
  isBare = false,
}: {
  readonly role: 'member' | 'provider' | 'admin';
  readonly isBusy: boolean;
  /** Called with the number in E.164, once it reads as one. */
  readonly onMake: (phone: string) => void;
  readonly onBack: () => void;
  /** Inside a card already (the directory). */
  readonly isBare?: boolean;
}) {
  const { t } = useI18n();
  const [phone, setPhone] = useState('');
  const [isInvalid, setIsInvalid] = useState(false);

  const make = () => {
    const e164 = toE164(phone);
    if (!e164) {
      setIsInvalid(true);
      return;
    }
    setIsInvalid(false);
    onMake(e164);
  };

  const content = (
    <VStack gap={3}>
      <Heading level={2} xstyle={styles.heading}>
        {t(`invite.phone.title.${role}`)}
      </Heading>
      <TextField purpose="phone" label={t('invite.phone.label')} value={phone} onChange={setPhone} width="100%" />
      {isInvalid ? (
        <Text role="alert" xstyle={styles.error}>
          {t('invite.phone.invalid')}
        </Text>
      ) : (
        <Text type="supporting" xstyle={styles.hint}>
          {t('invite.phone.hint')}
        </Text>
      )}
      <BigButton
        label={isBusy ? t('admin.invite.creating') : t('invite.phone.make')}
        onPress={make}
        isDisabled={isBusy || phone.trim() === ''}
      />
      <TextLink label={t('invite.phone.back')} onClick={onBack} />
    </VStack>
  );
  return isBare ? content : <Card padding={6}>{content}</Card>;
}
