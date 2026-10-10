'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextField, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * Who an invite is for (D-373, Will, 7 October: "required phone number and
 * name fields"). Their first name and their mobile number, both needed: the
 * number is how Pam finds this invite when they sign in — even if they never
 * open the link — and the only number that can use it; the name is how
 * joining greets them.
 *
 * Used wherever an invite is made: Invite someone, the case manager's admin
 * screen, the directory. No card (D-369); the kind of invite is the heading.
 */
export interface InviteWho {
  readonly firstName: string;
  readonly phone: string;
}

const styles = stylex.create({
  heading: { fontSize: '20px', lineHeight: 1.3 },
  field: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  error: { fontSize: '16px', lineHeight: 1.5 },
});

export function InviteForWho({
  role,
  busy,
  onSubmit,
  onCancel,
  hasHeading = true,
}: {
  readonly role: 'member' | 'provider' | 'admin';
  readonly busy: boolean;
  readonly onSubmit: (who: InviteWho) => void;
  /** A way to choose a different kind of invite, where this form sits on a page of choices. */
  readonly onCancel?: () => void;
  /** Off on a page whose title already says it (Invite someone › the nested page, D-442). */
  readonly hasHeading?: boolean;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [tried, setTried] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const missing = firstName.trim() === '' ? 'name' : digits.length < 10 ? 'phone' : null;

  return (
    <VStack gap={4}>
      {hasHeading ? (
        <Heading level={2} xstyle={styles.heading}>
          {t(`invite.link.title.${role}`)}
        </Heading>
      ) : null}
      <TextField
        label={t('invite.who.name')}
        // Ready to type on arrival (D-365).
        hasAutoFocus
        value={firstName}
        onChange={setFirstName}
        width="100%"
        xstyle={styles.field}
      />
      <TextField
        // Their number, not yours: the phone keypad without the browser
        // offering the inviter's own number.
        type={'tel' as 'text'}
        label={t('invite.who.phone')}
        value={phone}
        onChange={setPhone}
        width="100%"
        xstyle={styles.field}
      />
      <Text type="supporting" xstyle={styles.note}>
        {t('invite.who.note')}
      </Text>
      {tried && missing ? (
        <Text role="alert" xstyle={styles.error}>
          {t(`invite.who.need.${missing}`)}
        </Text>
      ) : null}
      <BigButton
        label={busy ? t('admin.invite.creating') : t('invite.who.make')}
        isDisabled={busy}
        onPress={() => {
          setTried(true);
          if (missing) return;
          onSubmit({ firstName: firstName.trim(), phone: phone.trim() });
        }}
      />
      {onCancel ? <TextLink label={t('invite.who.back')} onClick={onCancel} /> : null}
    </VStack>
  );
}
