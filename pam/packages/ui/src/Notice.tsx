'use client';

import { createContext, useContext, useEffect, useId, useRef, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Icon } from '@astryxdesign/core/Icon';
import { Button } from './Button.js';
import { HelpIcon } from './icons.js';
import { textLinkLook } from './TextLink.js';
import { pam } from './tokens.stylex.js';
import { NOTICES, type NoticeKey } from '@pam/config';
import { NoticeSinkContext } from './noticeSink.js';

/**
 * How Pam says something went wrong, or that there is nothing here.
 *
 * A query that returns null because an admin is out of region, or empty because
 * a feature was turned off, renders as a blank screen unless something says
 * otherwise. §0 forbids that: "Never dead-end. Every screen has a visible way
 * back and a visible 'Get help'."
 *
 * The copy and the rules behind it live in `@pam/config/notices` — this only
 * decides how it looks. Two shapes, following Astryx's own guidance:
 *
 *   a status card — a problem the reader has to act on, carrying `role="alert"`
 *     so a screen reader announces it (WCAG 4.1.3).
 *   EmptyState — an area with no data, explaining why rather than showing a
 *     blank list. Astryx: "always explain what happened and what the user can
 *     do next."
 *
 * The status card is composed from Card, Text and Button rather than Astryx's
 * `Banner`, which is otherwise the right component. Banner's dismiss control
 * carries a tooltip, so importing it drags in the whole overlay/layer
 * subsystem: 125 kB gzipped, a quarter of the §12 first-load budget, and enough
 * on its own to put the app over it. A message that has to work when everything
 * else has failed is the wrong place to spend that. What Banner gave us that
 * matters — the alert role, the status colour, the icon — is a few lines here.
 *
 * The support action is "Contact Pam" (A28: Pam has no phone line). It is a plain
 * link to the app's Help screen, the same place the HelpBar goes, so it works with
 * no JavaScript and no session — which is the state someone is most likely to be
 * in when they need it. From Help the person is led to the help desk first, and
 * only after that to an email.
 */
/**
 * Where "Contact Pam" goes when a `Notice` is not told. The app puts the right place here once: Help when
 * somebody is signed in, and the help desk on the website when they are not, because a sign-in error or a
 * paused account shows the button to somebody who cannot get in (A28, Sage's words §1).
 */
const ContactHrefContext = createContext('/help/');

export function ContactHrefProvider({ href, children }: { readonly href: string; readonly children: ReactNode }) {
  return <ContactHrefContext.Provider value={href}>{children}</ContactHrefContext.Provider>;
}

export interface NoticeProps {
  notice: NoticeKey;
  /** Localised title and body, resolved by the caller through i18n. */
  title: string;
  /** Left out when the title says it all (D-608: screens do not explain). */
  body?: string;
  /**
   * Localised label for the support action, "Contact Pam" (`help.contact.action`).
   * Omit it to leave the action out. It opens Help (A28), never a dialler.
   */
  contactLabel?: string;
  /** Where the support action goes. Help (or the help desk when signed out), unless a screen has a better page. */
  contactHref?: string;
  /**
   * An admin's own note to this person, from `access_controls.user_facing_note`.
   * Shown instead of the generic body when present.
   *
   * The internal `reason` on that row is NEVER passed here — §4.1 promises the
   * subject sees a plain note, not the justification written about them.
   */
  userFacingNote?: string | null;
  /** Optional extra action, e.g. "Try again". Rendered before the Contact Pam button. */
  retry?: { label: string; onPress: () => void };
  /**
   * A calm card for something that is on purpose and has a reason, rather than
   * a fault (a limited account, D-432): more room round the words, the smallest
   * body text Pam allows (16px, A23) for the title and the message alike, and
   * the support action as a link, not a primary button. Everything else is the same:
   * the 48px target, the alert role.
   */
  quiet?: boolean;
  /**
   * A one-off the person may close (D-619). A status `Notice` is a toast where the app has one, and a state that lasts (offline, an account
   * that is paused, a page that cannot load) is not closable: it goes when the state ends, and a member must not be able to swipe away the
   * reason their account is paused. Say `closable` only for something that happened once.
   */
  closable?: boolean;
}

const styles = stylex.create({
  // §2.5 — every control here clears the minimum target, including the one
  // someone reaches for when they are already stuck.
  action: { minHeight: '48px', fontSize: '17px' },
  block: { width: '100%' },
  title: { fontSize: '19px', lineHeight: 1.3 },
  body: { fontSize: '17px', lineHeight: 1.5 },
  // A coloured edge rather than a coloured fill: it survives a high-contrast
  // mode, and it never fights the text for contrast (§2.5 wants AAA body text).
  // The quiet look (D-432): the body-text floor for everything on the card, and a
  // call that reads as a link (accent, underlined) at the same size.
  quietTitle: { fontSize: pam['--pam-body-text-mobile'], lineHeight: 1.4 },
  quietBody: { fontSize: pam['--pam-body-text-mobile'], lineHeight: 1.5 },
  quietCall: {
    minHeight: '48px',
    fontSize: pam['--pam-body-text-mobile'],
    color: { default: 'var(--color-text-accent, currentColor)', ':hover': 'var(--color-text-accent, currentColor)' },
    textDecorationLine: 'underline',
  },
  card: {
    width: '100%',
    borderInlineStartWidth: '4px',
    borderInlineStartStyle: 'solid',
  },
  error: { borderInlineStartColor: 'var(--color-text-error, currentColor)' },
  warning: { borderInlineStartColor: 'var(--color-text-warning, currentColor)' },
  info: { borderInlineStartColor: 'var(--color-text-accent, currentColor)' },
});

/**
 * Astryx's semantic status icons and the matching icon colour. Decorative — the
 * title carries the meaning, which is why Astryx tells you not to rely on the
 * icon alone. Astryx has no 'info' icon colour, so informational notices use
 * the accent.
 */
const STATUS_ICON = { error: 'error', warning: 'warning', info: 'info' } as const;
const STATUS_ICON_COLOR = { error: 'error', warning: 'warning', info: 'accent' } as const;

export function Notice({
  notice,
  title,
  body,
  contactLabel,
  contactHref: contactHrefProp,
  userFacingNote,
  retry,
  quiet = false,
  closable = false,
}: NoticeProps) {
  const definition = NOTICES[notice];
  const message = userFacingNote?.trim() || body;
  const fromApp = useContext(ContactHrefContext);
  const contactHref = contactHrefProp ?? fromApp;
  const offersContact = definition.offersSupport && Boolean(contactLabel);

  // A status card is a toast where the app has one (D-619), and the card here is what it falls back to.
  const sink = useContext(NoticeSinkContext);
  const id = useId();
  const toasted = definition.kind !== 'empty' && sink?.ready === true;
  const register = sink?.register;
  const unregister = sink?.unregister;
  const status = definition.status;
  const retryLabel = retry?.label ?? null;
  // A caller's handler is a new function every render; the toast keeps one and calls the latest, so it is not torn down and redrawn each time.
  const retryPress = useRef<(() => void) | null>(null);
  retryPress.current = retry?.onPress ?? null;
  useEffect(() => {
    if (!toasted || !register || !unregister) return;
    register(id, {
      status,
      title,
      body: message,
      contact: offersContact ? { label: contactLabel ?? '', href: contactHref } : null,
      retry: retryLabel ? { label: retryLabel, onPress: () => retryPress.current?.() } : null,
      quiet,
      closable,
    });
    return () => unregister(id);
  }, [toasted, register, unregister, id, status, title, message, offersContact, contactLabel, contactHref, retryLabel, quiet, closable]);
  if (toasted) return null;

  const actions = (
    <>
      {retry ? (
        <Button
          label={retry.label}
          variant="secondary"
          clickAction={retry.onPress}
          xstyle={styles.action}
        />
      ) : null}
      {offersContact ? (
        quiet ? (
          <Button
            label={contactLabel ?? ""}
            variant="ghost"
            href={contactHref}
            icon={<HelpIcon />}
            xstyle={[textLinkLook.link, styles.quietCall]}
          />
        ) : (
          <Button
            label={contactLabel ?? ""}
            variant="primary"
            href={contactHref}
            icon={<HelpIcon />}
            xstyle={styles.action}
          />
        )
      ) : null}
    </>
  );

  const hasActions = Boolean(retry) || offersContact;

  if (definition.kind === 'empty') {
    return (
      <EmptyState
        title={title}
        description={message}
        headingLevel={2}
        actions={hasActions ? actions : undefined}
        xstyle={styles.block}
      />
    );
  }

  return (
    <Card
      padding={quiet ? 6 : 4}
      xstyle={[styles.card, styles[definition.status]]}
      // Errors and warnings interrupt; an informational note is announced when
      // the reader gets to it. Nothing here is dismissable — a member should not
      // be able to swipe away the reason their account is paused.
      role={definition.status === 'info' ? 'status' : 'alert'}
    >
      <VStack gap={2}>
        <HStack gap={2} align="center">
          <Icon icon={STATUS_ICON[definition.status]} color={STATUS_ICON_COLOR[definition.status]} />
          <Heading level={2} xstyle={quiet ? styles.quietTitle : styles.title}>
            {title}
          </Heading>
        </HStack>
        {message ? <Text xstyle={quiet ? styles.quietBody : styles.body}>{message}</Text> : null}
        {hasActions ? (
          <HStack gap={2} wrap="wrap">
            {actions}
          </HStack>
        ) : null}
      </VStack>
    </Card>
  );
}

/**
 * The small alert (D-509): one row, a small icon and one line of words, no
 * action. Same three tones as `Notice`, same alert role.
 *
 * **When to use which.** A compact alert is for a mistake the person fixes on
 * the spot, where they already are: a wrong code, a field to correct. Whatever
 * they must do next is the control they are already looking at, so it offers
 * nothing of its own. `Notice` is for a state they are stuck in: the account is
 * paused, the page cannot load, there is nobody to ask. It has a title, a
 * reason, and somewhere to go. If you find yourself adding a button to the
 * compact alert, you want `Notice`.
 */
export interface CompactNoticeProps {
  /** The tone; the same colours as `Notice`'s `error`, `warning` and `info`. */
  status?: 'error' | 'warning' | 'info';
  /** One short sentence, already localised. */
  text: string;
  id?: string;
}

const compactStyles = stylex.create({
  row: {
    width: '100%',
    boxSizing: 'border-box',
    minHeight: '40px',
    paddingBlock: '8px',
    paddingInline: '12px',
    borderInlineStartWidth: '4px',
    borderInlineStartStyle: 'solid',
    borderRadius: '8px',
    backgroundColor: 'var(--color-background-muted, transparent)',
  },
  text: { fontSize: '16px', lineHeight: 1.4 },
  error: { borderInlineStartColor: 'var(--color-text-red, currentColor)' },
  warning: { borderInlineStartColor: 'var(--color-text-orange, currentColor)' },
  info: { borderInlineStartColor: 'var(--color-text-accent, currentColor)' },
});

export function CompactNotice({ status = 'error', text, id }: CompactNoticeProps) {
  return (
    <HStack
      id={id}
      gap={2}
      align="center"
      wrap="nowrap"
      role={status === 'info' ? 'status' : 'alert'}
      xstyle={[compactStyles.row, compactStyles[status]]}
    >
      <Icon icon={STATUS_ICON[status]} color={STATUS_ICON_COLOR[status]} size="sm" />
      <Text xstyle={compactStyles.text}>{text}</Text>
    </HStack>
  );
}
