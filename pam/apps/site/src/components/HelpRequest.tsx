'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { HELP_REQUEST_ORIGINS, HELP_REQUEST_URL } from '../lib/links';
import { HelpAddress } from './HelpAddress';
import { tap } from '../lib/tap';

const styles = stylex.create({
  // The honeypot: a field no person sees or reaches. Hidden by position, not `type=hidden`, so a bot still fills it.
  trap: { position: 'absolute', insetInlineStart: '-10000px', width: '1px', height: '1px', overflow: 'hidden' },
  form: { width: '100%' },
});

/** What a field says when it is empty or wrong (Sage, signed, 11 October). */
const WORDS = {
  message: 'Tell us what happened, in a few words.',
  emailEmpty: 'Add your email so we can write back.',
  emailWrong: 'That email does not look right. Check it and try again.',
} as const;

type Phase = 'address' | 'form' | 'sending' | 'sent' | 'failed';

/**
 * The words under "Still stuck?": the address while the form is off, the form when it is on (A28, Will; Nico's
 * `help-request`, D-521). The page is built with the address, so nobody is ever left with nothing; on arrival it asks
 * the function with an empty request, which sends nothing: 503 `{"live": false}` (off), a network error or a refusal
 * leaves the address, and only a 400 (on, and asking for a message) shows the form. The words are Sage's (A28 §3).
 * The phone field waits for `texts_live` (later).
 */
export function HelpRequest() {
  const [phase, setPhase] = useState<Phase>('address');
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [bad, setBad] = useState<{ message?: string; email?: string }>({});

  // The probe costs the function an invocation (and the free plan counts them), so it is made rarely: only from the real
  // site's origin (CI, local builds and previews never call it), only when this box comes near the screen, and once a
  // visit (the answer is kept in sessionStorage, so moving between posts does not ask again).
  const sentinel = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!HELP_REQUEST_ORIGINS.includes(window.location.origin)) return;
    const KEY = 'pam-help-request-live';
    let known: string | null = null;
    try {
      known = window.sessionStorage.getItem(KEY);
    } catch {
      // storage can be off: then it asks once per page
    }
    if (known === '0') return;
    if (known === '1') {
      setPhase('form');
      return;
    }
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    let alive = true;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        io.disconnect();
        fetch(HELP_REQUEST_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
          .then((r) => {
            const live = r.status === 400;
            try {
              if (r.status === 400 || r.status === 503) window.sessionStorage.setItem(KEY, live ? '1' : '0');
            } catch {
              // ignore
            }
            if (alive && live) setPhase('form');
          })
          .catch(() => undefined);
      },
      { rootMargin: '800px 0px' },
    );
    io.observe(el);
    return () => {
      alive = false;
      io.disconnect();
    };
  }, []);

  if (phase === 'address') {
    return (
      <Text as="p">
        <span ref={sentinel} aria-hidden="true" />
        Write to us at <HelpAddress />. Tell us what happened and what you see on the screen. A person at Pam reads
        every message.
      </Text>
    );
  }

  if (phase === 'sent') {
    return (
      <VStack gap={1} role="status">
        <Text as="p" xstyle={tap.target}>
          <strong>Sent. Thank you.</strong>
        </Text>
        <Text as="p">A person at Pam will read it and write back.</Text>
      </VStack>
    );
  }

  const send = async (form: HTMLFormElement) => {
    const trap = (form.elements.namedItem('website') as HTMLInputElement | null)?.value ?? '';
    const problems: { message?: string; email?: string } = {
      ...(message.trim().length < 3 ? { message: WORDS.message } : {}),
      ...(!email.trim() ? { email: WORDS.emailEmpty } : !/^\S+@\S+\.\S+$/.test(email.trim()) ? { email: WORDS.emailWrong } : {}),
    };
    if (problems.message || problems.email) return setBad(problems);
    setBad({});
    setPhase('sending');
    try {
      const r = await fetch(HELP_REQUEST_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim(),
          page: window.location.pathname,
          lang: document.documentElement.lang || 'en',
          website: trap,
        }),
      });
      if (r.ok) return setPhase('sent');
      if (r.status === 400) {
        const body = (await r.json().catch(() => ({}))) as { field?: string };
        setBad(body.field === 'message' ? { message: WORDS.message } : body.field === 'email' ? { email: WORDS.emailWrong } : {});
        setPhase('form');
        return;
      }
      if (r.status === 503) return setPhase('address');
      setPhase('failed');
    } catch {
      setPhase('failed');
    }
  };

  return (
    <VStack
      as="form"
      gap={4}
      xstyle={styles.form}
      onSubmit={(e) => {
        e.preventDefault();
        void send(e.currentTarget as unknown as HTMLFormElement);
      }}
    >
      <Text as="p">Tell us what happened. A person at Pam reads every message.</Text>
      {phase === 'failed' ? (
        <VStack gap={1} role="alert">
          <Text as="p">
            <strong>That did not send.</strong>
          </Text>
          <Text as="p">
            Check your connection and try again, or write to <HelpAddress />.
          </Text>
        </VStack>
      ) : null}
      <TextArea
        label="What’s wrong?"
        description="In your own words. You don’t need to know what to ask for."
        value={message}
        onChange={setMessage}
        rows={5}
        maxLength={3000}
        isRequired
        {...(bad.message ? { status: { type: 'error' as const, message: bad.message } } : {})}
      />
      <TextInput
        label="How should we answer you?"
        description="Your email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        isRequired
        {...(bad.email ? { status: { type: 'error' as const, message: bad.email } } : {})}
      />
      <span {...stylex.props(styles.trap)} aria-hidden="true">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
      </span>
      <Text type="supporting" as="p">
        We send what you write, this page and the language you read in. Nothing else from your account.
      </Text>
      <Button label={phase === 'sending' ? 'Sending' : 'Send to Pam'} variant="primary" type="submit" isDisabled={phase === 'sending'} xstyle={tap.target} />
    </VStack>
  );
}
