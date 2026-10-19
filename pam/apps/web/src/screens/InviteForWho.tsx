'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, TextField } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { isEmailAddress } from '@/lib/useInviteLinks';

/**
 * Who an invite is for (D-373, Will, 7 October: "required phone number and
 * name fields"). Their first name and their mobile number, both needed: the
 * number is how Pam finds this invite when they sign in — even if they never
 * open the link — and the only number that can use it; the name is how
 * joining greets them.
 *
 * **Staff also need an email** (D-441, Will, 10 October: "Not optional for
 * staff"). A case manager or a program lead is asked for the address Pam will
 * write to; it lands on their account when they sign in with this number. A
 * member is never asked: not everyone has an email, and nobody should be turned
 * away for lacking one.
 *
 * Used wherever an invite is made: Invite someone, the case manager's admin
 * screen, the directory. No card (D-369). It is a page of its own, on the nested
 * template (Will, 10 October): the caller draws the header — the kind of invite
 * is the large title (`invite.link.title.*`), the round back goes to the choice
 * — and this is the body.
 */
export interface InviteWho {
  readonly firstName: string;
  readonly phone: string;
  /** Staff invites only; required for them. */
  readonly email?: string;
}

const styles = stylex.create({
  field: { width: '100%' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  error: { fontSize: '16px', lineHeight: 1.5 },
});

export function InviteForWho({
  role,
  busy,
  onSubmit,
  refused = null,
  onEdit,
}: {
  readonly role: 'member' | 'provider' | 'admin';
  readonly busy: boolean;
  readonly onSubmit: (who: InviteWho) => void;
  /**
   * A field the database refused although it passed the checks here (D-618, Iris): a number that is not a real mobile number,
   * an address too long to be one. It is the person's to fix, so it is said here, with the other field lines, not as an alert.
   */
  readonly refused?: 'phone' | 'emailInvalid' | null;
  /** Called when the refused field is edited, so its line goes. */
  readonly onEdit?: () => void;
}) {
  const { t } = useI18n();
  const [firstName, setFirstName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [tried, setTried] = useState(false);
  const digits = phone.replace(/\D/g, '');
  const staff = role !== 'member';
  // Every missing field at once, in the order they are on the screen (Iris, case manager P9): one at a time
  // made an empty form a guessing game, the number reported only after the name was filled.
  const missing = [
    ...(firstName.trim() === '' ? (['name'] as const) : []),
    ...(digits.length < 10 ? (['phone'] as const) : []),
    ...(staff && email.trim() === '' ? (['email'] as const) : []),
    ...(staff && email.trim() !== '' && !isEmailAddress(email.trim()) ? (['emailInvalid'] as const) : []),
  ];
  const shown = tried && missing.length > 0 ? missing : refused ? [refused] : [];

  return (
    <VStack gap={4}>
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
        onChange={(next) => {
          setPhone(next);
          if (refused === 'phone') onEdit?.();
        }}
        width="100%"
        xstyle={styles.field}
      />
      {staff ? (
        <>
          <TextField
            // Their address, not yours: no autofill of the inviter's own. Nothing
            // here says what Pam does with it: that is for us, and a staff
            // invite is not about members (Will, 10 October).
            purpose="theirEmail"
            label={t('invite.who.email')}
            value={email}
            onChange={(next) => {
              setEmail(next);
              if (refused === 'emailInvalid') onEdit?.();
            }}
            width="100%"
            xstyle={styles.field}
          />
        </>
      ) : null}
      <Text type="supporting" xstyle={styles.note}>
        {t('invite.who.note')}
      </Text>
      {shown.length > 0 ? (
        <VStack gap={1} role="alert">
          {shown.map((need) => (
            <Text key={need} xstyle={styles.error}>
              {t(`invite.who.need.${need}`)}
            </Text>
          ))}
        </VStack>
      ) : null}
      <BigButton
        label={busy ? t('admin.invite.creating') : t('invite.who.make')}
        isDisabled={busy}
        onPress={() => {
          setTried(true);
          if (missing.length > 0) return;
          onSubmit({ firstName: firstName.trim(), phone: phone.trim(), ...(staff ? { email: email.trim() } : {}) });
        }}
      />
    </VStack>
  );
}
