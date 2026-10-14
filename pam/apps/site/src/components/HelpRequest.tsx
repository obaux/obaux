'use client';

import { useEffect, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { CheckboxInput } from '@astryxdesign/core/CheckboxInput';
import { Dialog } from '@astryxdesign/core/Dialog';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { TextInput } from '@astryxdesign/core/TextInput';
import { VStack } from '@astryxdesign/core/VStack';
import { Button } from '@pam/ui/Button';
import { HELP_REQUEST_ORIGINS, HELP_REQUEST_URL } from '../lib/links';
import { HelpAddress } from './HelpAddress';
import { SoftButton } from './SoftButton';
import { tap } from '../lib/tap';
import { type } from '../lib/website-type.stylex';
import { website } from '../lib/website.stylex';

const fadeIn = stylex.keyframes({
  from: { opacity: 0 },
  to: { opacity: 1 },
});

const styles = stylex.create({
  // The honeypot: a field no person sees or reaches. Hidden by position, not `type=hidden`, so a bot still fills it.
  trap: { position: 'absolute', insetInlineStart: '-10000px', width: '1px', height: '1px', overflow: 'hidden' },
  // Astryx draws a field's words at 12 to 14px; inside this form they are 15 and 17px (Will, 13 October: "text is small").
  form: {
    width: '100%',
    paddingBlockEnd: '8px',
    '--text-label-size': '1.0625rem',
    '--text-body-size': '1.0625rem',
    '--text-supporting-size': '0.9375rem',
  },
  // The words in the form: the site's reading size (17px) and an even 24px between questions (Will, 13 October: "text is small").
  intro: { color: website['--website-text-primary'], margin: 0 },
  note: { color: website['--website-text-secondary'], margin: 0 },
  title: { color: website['--website-text-primary'], margin: 0 },
  // "Write to us": the width of the phone on a phone, as wide as its words from 900px, left-aligned under the line (Will, 14 October).
  open: { alignSelf: { default: 'stretch', '@media (min-width: 900px)': 'flex-start' } },
  // Raises the keyboard inside the tap that opens the form: iOS only shows it for focus that happens in the gesture itself, and
  // the dialog's own field does not exist until after it. Focus is given here first, then moves to the message box.
  proxy: { position: 'fixed', insetBlockStart: 0, insetInlineStart: 0, width: '1px', height: '1px', padding: 0, border: 'none', opacity: 0, pointerEvents: 'none', fontSize: '16px' },
  // The dialog (Dot, D-562): full screen on a phone, a 560px card from 900px, backdrop black at 50% (60% in dark).
  dialog: {
    borderRadius: { default: '0px', '@media (min-width: 900px)': '24px' },
    borderWidth: { default: '0px', '@media (min-width: 900px)': '1px' },
    borderStyle: 'solid',
    borderColor: website['--website-border-subtle'],
    backgroundColor: website['--website-surface-page'],
    color: website['--website-text-primary'],
    '::backdrop': { backgroundColor: 'light-dark(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.6))' },
    // It fades in over 160ms on the app's easing, nothing else moves (Dot, D-562); instant under reduced motion.
    animationName: { default: 'none', '@media (prefers-reduced-motion: no-preference)': fadeIn },
    animationDuration: '160ms',
    animationTimingFunction: 'cubic-bezier(0.2, 0, 0, 1)',
    animationFillMode: 'both',
  },
  // The fields: 56px tall, radius 12, a 1.5px border (Dot, D-562). Astryx applies `xstyle` to the field's own box.
  areaBox: { borderRadius: '12px', borderWidth: '1.5px', minHeight: '160px' },
  field: { height: '56px', borderRadius: '12px', borderWidth: '1.5px' },
  inside: {
    boxSizing: 'border-box',
    paddingTop: { default: 'calc(24px + env(safe-area-inset-top, 0px))', '@media (min-width: 900px)': '32px' },
    paddingBottom: { default: 'calc(24px + env(safe-area-inset-bottom, 0px))', '@media (min-width: 900px)': '32px' },
    paddingInline: { default: '24px', '@media (min-width: 900px)': '32px' },
  },
  head: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: '56px', gap: '8px' },
  close: { width: '48px', height: '48px', minWidth: '48px', flexShrink: 0 },
  // The who-are-you question is a real fieldset with a legend, so a reader hears the question before each choice.
  fieldset: { border: 'none', margin: 0, padding: 0, minWidth: 0, display: 'flex', flexDirection: 'column', gap: '4px' },
  legend: { padding: 0, marginBlockEnd: '4px', color: website['--website-text-primary'] },
  legendHint: { color: website['--website-text-secondary'], fontWeight: 400 },
});

/** What a field says when it is empty or wrong (Sage, signed, 11 October). */
const WORDS = {
  message: 'Tell us what happened, in a few words.',
  emailEmpty: 'Add your email so we can write back.',
  emailWrong: 'That email does not look right. Check it and try again.',
} as const;

/**
 * How they use Pam, choose all that fit (Sage, signed 13 October; Will: "I didn't know whether the user was a member,
 * program, both, or case manager"). Optional, so nobody is blocked. What goes to the help-request function is `roles`,
 * an array of `member`, `program`, `case_manager` (Nico, D-559); "I don't use Pam yet" sends `not_yet`.
 */
const WHO = [
  { id: 'member', label: 'I’m a member', role: 'member' },
  { id: 'program', label: 'I run a program', role: 'program' },
  { id: 'case-manager', label: 'I’m a case manager', role: 'case_manager' },
  { id: 'not-yet', label: 'I don’t use Pam yet', role: 'not_yet' },
] as const;
const WHO_WORDS = { question: 'How do you use Pam?', hint: 'Choose all that fit.' } as const;

function CloseMark() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="m6 6 12 12M18 6 6 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

type Phase = 'address' | 'form' | 'sending' | 'sent' | 'failed';

/**
 * The words under "Still stuck?": the address while the form is off, a call-out that opens the form when it is on (A28,
 * Will; Nico's `help-request`, D-521; Will, 13 October: "the help form shouldn't be directly on the page they're in, we
 * just want a call out, clicking it opens the help form"). The page is built with the address, so nobody is ever left with
 * nothing; on arrival it asks the function with an empty request, which sends nothing: 503 `{"live": false}` (off), a
 * network error or a refusal leaves the address, and only a 400 (on, and asking for a message) shows the call-out.
 * The form is a dialog: full screen on a phone, a card from 600px; Esc or Close shuts it and focus goes back to the
 * button. The phone field waits for `texts_live` (later).
 */
export function HelpRequest() {
  const [phase, setPhase] = useState<Phase>('address');
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(false);
  const [message, setMessage] = useState('');
  const [email, setEmail] = useState('');
  const [who, setWho] = useState<readonly string[]>([]);
  const [bad, setBad] = useState<{ message?: string; email?: string }>({});
  const [focusError, setFocusError] = useState(0); // bumped when Send finds a problem: focus goes to the first field in error
  const formBox = useRef<HTMLDivElement>(null);
  const keyboardProxy = useRef<HTMLInputElement>(null);
  const calloutBox = useRef<HTMLDivElement>(null);
  const wasOpen = useRef(false);
  const sentBox = useRef<HTMLDivElement>(null);

  // An empty or wrong Send says nothing to a screen reader unless focus moves: it goes to the first field in error, which
  // carries `aria-invalid` and `aria-describedby`, so its error is read (Iris W1).
  useEffect(() => {
    if (!focusError) return;
    const id = window.requestAnimationFrame(() => formBox.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [focusError]);

  // The message box takes focus as soon as the form is there; the keyboard is already up from the proxy (above).
  useEffect(() => {
    if (!open) return;
    const id = window.requestAnimationFrame(() => formBox.current?.querySelector<HTMLTextAreaElement>('textarea')?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // When the form closes, focus goes back to "Write to us" (the dialog would hand it to the keyboard proxy it saw first).
  useEffect(() => {
    if (open) {
      wasOpen.current = true;
      return;
    }
    if (!wasOpen.current) return;
    wasOpen.current = false;
    const id = window.requestAnimationFrame(() => calloutBox.current?.querySelector<HTMLElement>('a, button')?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [open]);

  // After a successful Send "Write to us" is replaced by the thank-you: focus goes to it, so a person keeps their place (Iris P2).
  useEffect(() => {
    if (phase === 'sent') sentBox.current?.focus();
  }, [phase]);

  // The page behind does not scroll while the form is open (iOS ignores the dialog's own lock): globals.css reads this.
  useEffect(() => {
    if (!open) return;
    document.documentElement.setAttribute('data-dialog-open', '');
    return () => document.documentElement.removeAttribute('data-dialog-open');
  }, [open]);

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
      <>
        <Heading level={2} xstyle={[type.heading_title24, styles.title]}>
          Still stuck?
        </Heading>
        <Text as="p">
          <span ref={sentinel} aria-hidden="true" />
          Write to us at <HelpAddress />. Tell us what happened and what you see on the screen. A person at Pam reads
          every message.
        </Text>
      </>
    );
  }

  if (phase === 'sent') {
    return (
      <VStack gap={1} role="status" ref={sentBox} tabIndex={-1} id="help-sent">
        <Heading level={2} xstyle={[type.heading_title24, styles.title]}>
          Still stuck?
        </Heading>
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
    if (problems.message || problems.email) {
      setBad(problems);
      setFocusError((n) => n + 1);
      return;
    }
    setBad({});
    setPhase('sending');
    const roles = WHO.filter((w) => who.includes(w.id) && w.role).map((w) => w.role);
    try {
      const r = await fetch(HELP_REQUEST_URL, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          email: email.trim(),
          page: window.location.pathname,
          lang: document.documentElement.lang || 'en',
          ...(roles.length ? { roles } : {}),
          website: trap,
        }),
      });
      if (r.ok) {
        setOpen(false);
        return setPhase('sent');
      }
      if (r.status === 400) {
        const body = (await r.json().catch(() => ({}))) as { field?: string };
        setBad(body.field === 'message' ? { message: WORDS.message } : body.field === 'email' ? { email: WORDS.emailWrong } : {});
        setPhase('form');
        return;
      }
      if (r.status === 503) {
        setOpen(false);
        return setPhase('address');
      }
      setPhase('failed');
    } catch {
      setPhase('failed');
    }
  };

  return (
    <VStack gap={3} ref={calloutBox}>
      <Heading level={2} xstyle={[type.heading_title24, styles.title]}>
        Still stuck?
      </Heading>
      <Text as="p" xstyle={styles.intro}>
        Write to us. A person at Pam reads every message.
      </Text>
      <input ref={keyboardProxy} type="text" aria-hidden="true" tabIndex={-1} autoComplete="off" {...stylex.props(styles.proxy)} />
      <SoftButton
        label="Write to us"
        xstyle={styles.open}
        onClick={() => {
          keyboardProxy.current?.focus({ preventScroll: true });
          setPhone(window.matchMedia('(max-width: 899px)').matches);
          setOpen(true);
        }}
      />
      <Dialog
        isOpen={open}
        onOpenChange={(next) => {
          if (!next && phase === 'sending') return; // not while it is sending
          setOpen(next);
        }}
        variant={phone ? 'fullscreen' : 'standard'}
        width={phone ? undefined : 560}
        padding={0}
        purpose="form"
        aria-labelledby="help-title"
        xstyle={styles.dialog}
      >
        <VStack gap={6} xstyle={styles.inside} ref={formBox}>
        <VStack xstyle={styles.head}>
          <Heading level={2} id="help-title" xstyle={[type.heading_title24, styles.title]}>
            Still stuck?
          </Heading>
          <Button label="Close" isIconOnly variant="ghost" icon={<CloseMark />} onClick={() => setOpen(false)} xstyle={styles.close} />
        </VStack>
        <VStack
          as="form"
          gap={6}
          xstyle={styles.form}
          onSubmit={(e) => {
            e.preventDefault();
            void send(e.currentTarget as unknown as HTMLFormElement);
          }}
        >
          <Text as="p" xstyle={[type.lead_17, styles.intro]}>
            Tell us what happened. A person at Pam reads every message.
          </Text>
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
            rows={6}
            size="lg"
            maxLength={3000}
            isRequired
            hasAutoFocus
            xstyle={styles.areaBox}
            {...(bad.message ? { status: { type: 'error' as const, message: bad.message } } : {})}
          />
          <fieldset {...stylex.props(styles.fieldset)}>
            <legend {...stylex.props(type.label_strong17, styles.legend)}>
              {WHO_WORDS.question} <span {...stylex.props(styles.legendHint)}>{WHO_WORDS.hint}</span>
            </legend>
            <VStack gap={1}>
              {WHO.map((w) => (
                <CheckboxInput
                  key={w.id}
                  label={w.label}
                  value={who.includes(w.id)}
                  onChange={(on) => setWho((cur) => (on ? [...cur, w.id] : cur.filter((x) => x !== w.id)))}
                  xstyle={tap.target}
                />
              ))}
            </VStack>
          </fieldset>
          <TextInput
            label="How should we answer you?"
            description="Your email"
            type="email"
            autoComplete="email"
            xstyle={styles.field}
            value={email}
            onChange={setEmail}
            isRequired
            {...(bad.email ? { status: { type: 'error' as const, message: bad.email } } : {})}
          />
          <span {...stylex.props(styles.trap)} aria-hidden="true">
            <input type="text" name="website" tabIndex={-1} autoComplete="off" defaultValue="" />
          </span>
          <Text as="p" xstyle={[type.body_15, styles.note]}>
            We send what you write, how you use Pam if you tell us, this page and the language you read in. Nothing else from your account.
          </Text>
          <Button label={phase === 'sending' ? 'Sending' : 'Send to Pam'} variant="primary" type="submit" isDisabled={phase === 'sending'} xstyle={tap.target} />
        </VStack>
        </VStack>
      </Dialog>
    </VStack>
  );
}
