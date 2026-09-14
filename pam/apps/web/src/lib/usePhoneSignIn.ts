'use client';

import { useEffect, useState } from 'react';

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

/**
 * Says why sign-in failed, to the console only.
 *
 * A member is shown plain language and a phone number to call — "this is not
 * your fault" — and that is all they should ever see. But every cause looks the
 * same from that screen: unset configuration, a provider that is not connected,
 * a number a carrier will not accept in trial, a network that dropped. Losing
 * the difference cost this project most of a day, so the real error goes where
 * somebody helping can read it.
 *
 * Never the phone number: a console log is copied into bug reports and support
 * threads, and a number identifies the person.
 */
function reportSignInProblem(step: 'send' | 'verify', error: unknown): void {
  const detail = error instanceof Error ? error.message : String(error);
  console.error(`PAM sign-in failed at "${step}": ${detail}`);
}

/** Digits in, E.164 out. A member types what is on their phone bill. */
export function toE164(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  if (input.trim().startsWith('+') && digits.length >= 8 && digits.length <= 15) return `+${digits}`;
  return null;
}

/**
 * How long "Send it again" waits before it will.
 *
 * A code takes a few seconds to arrive and a person who taps the link three
 * times in a minute gets three codes, of which only the last one works — and a
 * carrier that sees the pattern stops delivering to that number. The live logs
 * on the night of the 14th show exactly that: one phone, three requests in
 * eight minutes, no sign-in. Thirty seconds is what the major verification
 * services enforce on their side; enforcing it on the screen means the person
 * is told to wait rather than silently rate-limited.
 */
export const RESEND_WAIT_SECONDS = 30;

/** What the hook hands back, named so a screen can take it as a prop. */
export interface PhoneSignIn {
  state: SignInStep;
  sendCode: (phone: string) => Promise<void>;
  verifyCode: (code: string) => Promise<void>;
  startOver: () => void;
  /** Seconds until "Send it again" works. 0 when it does. */
  resendIn: number;
}

export function usePhoneSignIn(): PhoneSignIn {
  const [state, setState] = useState<SignInStep>({ step: 'phone' });
  const [resendAt, setResendAt] = useState<number | null>(null);
  const [now, setNow] = useState(() => Date.now());

  // Tick once a second while somebody is waiting, and not otherwise.
  useEffect(() => {
    if (resendAt === null || resendAt <= now) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [resendAt, now]);

  const resendIn = resendAt === null ? 0 : Math.max(0, Math.ceil((resendAt - now) / 1000));

  const sendCode = async (input: string): Promise<void> => {
    const phone = toE164(input);
    if (!phone) {
      setState({ step: 'failed', reason: 'send', phone: null });
      return;
    }

    // Asked for again too soon: keep the code step, say nothing new. The
    // screen's own label already says how long is left.
    if (resendAt !== null && resendAt > Date.now()) return;

    setState({ step: 'sending' });
    try {
      const { createClient } = await import('./supabase');
      const { error } = await createClient().auth.signInWithOtp({ phone });
      if (error) reportSignInProblem('send', error);
      if (!error) {
        const at = Date.now() + RESEND_WAIT_SECONDS * 1000;
        setResendAt(at);
        setNow(Date.now());
      }
      setState(error ? { step: 'failed', reason: 'send', phone } : { step: 'code', phone });
    } catch (error) {
      reportSignInProblem('send', error);
      setState({ step: 'failed', reason: 'send', phone });
    }
  };

  const verifyCode = async (code: string): Promise<void> => {
    const phone = 'phone' in state ? state.phone : null;
    if (!phone) return;

    setState({ step: 'verifying', phone });
    try {
      const { createClient } = await import('./supabase');
      const { error } = await createClient().auth.verifyOtp({
        phone,
        token: code.replace(/\D/g, ''),
        type: 'sms',
      });
      if (error) reportSignInProblem('verify', error);
      setState(error ? { step: 'failed', reason: 'verify', phone } : { step: 'done' });
    } catch (error) {
      reportSignInProblem('verify', error);
      setState({ step: 'failed', reason: 'verify', phone });
    }
  };

  return {
    state,
    sendCode,
    verifyCode,
    startOver: () => setState({ step: 'phone' }),
    resendIn,
  };
}
