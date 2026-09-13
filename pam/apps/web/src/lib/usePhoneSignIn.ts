'use client';

import { useState } from 'react';

/**
 * Phone sign-in. There is no password anywhere in PAM (§9).
 *
 * Two steps, and the second one is the whole reason for the first: a code
 * arrives by text, and the member types it. Nothing here decides who somebody
 * is — Supabase does that, and the database decides what they may see.
 *
 * The failure a member will actually hit is a code that never arrives, so that
 * state gets a way forward rather than a spinner: try again, or call for help.
 */
export type SignInStep =
  | { step: 'phone' }
  | { step: 'sending' }
  | { step: 'code'; phone: string }
  | { step: 'verifying'; phone: string }
  | { step: 'done' }
  | { step: 'failed'; reason: 'send' | 'verify'; phone: string | null };

/** Digits in, E.164 out. A member types what is on their phone bill. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

export function usePhoneSignIn(): {
  state: SignInStep;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string, wantsReminders?: boolean) => Promise<void>;
  startOver: () => void;
} {
  const [state, setState] = useState<SignInStep>({ step: 'phone' });

  const sendCode = async (input: string): Promise<void> => {
    const phone = toE164(input);
    if (!phone) {
      setState({ step: 'failed', reason: 'send', phone: null });
      return;
    }

    setState({ step: 'sending' });
    try {
      const { createClient } = await import('./supabase');
      const { error } = await createClient().auth.signInWithOtp({ phone });
      setState(error ? { step: 'failed', reason: 'send', phone } : { step: 'code', phone });
    } catch {
      setState({ step: 'failed', reason: 'send', phone });
    }
  };

  /**
   * Records that somebody ticked the reminders box, once they are signed in.
   *
   * Written after the code is verified rather than before, because until then
   * there is no account to record it against. A failure here is deliberately
   * silent to the member: reminders staying off is the safe direction, and a
   * sign-in that succeeded should not present itself as broken.
   */
  const recordReminderConsent = async (userId: string): Promise<void> => {
    try {
      const { createClient } = await import('./supabase');
      await createClient()
        .from('notification_preferences')
        .upsert({ member_id: userId, sms_enabled: true }, { onConflict: 'member_id' });
    } catch {
      // Left off. A member can turn reminders on again from their own settings.
    }
  };

  const verifyCode = async (code: string, wantsReminders = false): Promise<void> => {
    const phone = 'phone' in state ? state.phone : null;
    if (!phone) return;

    setState({ step: 'verifying', phone });
    try {
      const { createClient } = await import('./supabase');
      const { data, error } = await createClient().auth.verifyOtp({
        phone,
        token: code.replace(/\D/g, ''),
        type: 'sms',
      });

      if (!error && wantsReminders && data.user) {
        await recordReminderConsent(data.user.id);
      }
      setState(error ? { step: 'failed', reason: 'verify', phone } : { step: 'done' });
    } catch {
      setState({ step: 'failed', reason: 'verify', phone });
    }
  };

  return { state, sendCode, verifyCode, startOver: () => setState({ step: 'phone' }) };
}
