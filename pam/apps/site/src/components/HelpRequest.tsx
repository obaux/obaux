'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { HELP_REQUEST_URL } from '../lib/links';
import { HelpAddress } from './HelpAddress';
import { tap } from '../lib/tap';

const styles = stylex.create({
  // The honeypot: a field no person sees or reaches. Hidden by position, not `type=hidden`, so a bot still fills it.
  trap: { position: 'absolute', insetInlineStart: '-10000px', width: '1px', height: '1px', overflow: 'hidden' },
  form: { width: '100%' },
});

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
  const [bad, setBad] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetch(HELP_REQUEST_URL, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}' })
      .then((r) => {
        if (alive && r.status === 400) setPhase('form');
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (phase === 'address') {
    return (
      <Text as="p">
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
    if (message.trim().length < 3) return setBad('message');
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setBad('email');
    setBad(null);
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
        setBad(body.field ?? null);
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
        {...(bad === 'message' ? { status: { type: 'error' as const } } : {})}
      />
      <TextInput
        label="How should we answer you?"
        description="Your email"
        type="email"
        autoComplete="email"
        value={email}
        onChange={setEmail}
        isRequired
        {...(bad === 'email' ? { status: { type: 'error' as const } } : {})}
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
