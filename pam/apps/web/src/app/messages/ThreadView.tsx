'use client';

import { Fragment, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  ChatComposer,
  ChatComposerInput,
  ChatDictationButton,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
  ChatMessageMetadata,
  ChatSendButton,
  ChatSystemMessage,
  useChatDictation,
  useChatLayoutContext,
  useChatStreamScroll,
  type ChatComposerInputHandle,
} from '@astryxdesign/core/Chat';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Notice } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { dayKey, dayLabel } from '@/lib/when';

/**
 * One conversation, drawn with Astryx's Chat family (D-181): `ChatMessageList`
 * > `ChatMessage` > `ChatMessageBubble` for what was said, `ChatComposer`
 * for saying the next thing. The hand-rolled `MessageBubble` this replaces
 * was a `Card` with a `maxWidth` — it looked close enough and got the
 * accessibility of a chat log (`role="log"`, `aria-live`, sender-aware
 * alignment for screen readers) wrong in ways nobody would notice by eye.
 *
 * Shared by the real thread (`useThread`) and the example thread a preview
 * opens (`DUMMY_THREADS` + `demoMessages`, D-180): both hand this the same
 * shape, so the demo cannot drift from the real thing. `onSend` is
 * whatever the caller wires — a real insert, or a
 * sessionStorage append — and this file never imports Supabase.
 *
 * Pam's rules, kept on top of Astryx's defaults: every control is a 48px
 * square — the send button included, which is this screen's one primary
 * action and, since A13 (D-192), the one primary action in Pam that is not
 * 64px: a chat's primary action repeats dozens of times per screen, and a
 * 64px block ate the message area on a phone. Message text is 18px. The
 * mic (`ChatDictationButton`) hides itself when the browser has no speech
 * recognition, which is the same §1 rule `VoiceInput` follows — a dead
 * button is worse than no button.
 *
 * The send button's icon is `<Icon icon="arrowUp" size="md" />`, not
 * `ChatSendButton`'s own default (Will's screenshot, 21 September: the
 * arrow read heavier than the mic glyph beside it, and small in its 48px
 * square). The two were never actually matched: `ChatDictationButton`
 * sizes its mic through `<Icon icon="microphone" size="md" />` — an
 * explicit 20px box — while `ChatSendButton`'s own default `sendIcon` is
 * the bare registry SVG, unwrapped, which falls back to the *button's*
 * 16px icon slot instead. Same 1.5px stroke, smaller box, so it read both
 * smaller and (proportionally) thicker. Astryx has no separate icon-weight
 * prop to reach for — checked the registry (`defaultIcons.tsx`) directly —
 * so the fix is sizing the arrow through the same `Icon` component and the
 * same `size="md"` the mic already uses, not a hand-drawn SVG.
 *
 * `ChatMessageList` runs `density="compact"` (was `spacious`, Will's same
 * screenshot: too much air between bubbles, and too much side padding).
 * Astryx's density scale sets a message row's gap *and* its side padding
 * together (`ChatMessageList.tsx`'s `gapCompact`/`gapSpacious`), so this one
 * prop both tightens the row gap and, incidentally, gives bubbles more of
 * the phone's width — nothing here is hand-overridden. Every message still
 * carries its own name row, so a tighter gap does not run two bubbles from
 * the same sender together without a visible break.
 *
 * Days, not dates, under bubbles (Will, 8 October, D-389): each day opens
 * with one centred divider — "Today", "Yesterday", a weekday, then a date —
 * and a bubble keeps only its time. A date repeated under every bubble was
 * noise; one per day is what the conversation apps people already use do.
 *
 * The composer is one rounded box (D-389, Will's reference): the text on top,
 * a row under it with the mic on the left and a round send button on the
 * right — grey while there is nothing to send, Pam's dark green once there
 * is. Flat, with a border (`elevation="none"`), so it reads as a field and
 * not as a card floating over the conversation. No attach button yet: Pam
 * has nowhere to keep a photo (no storage bucket), and a button that does
 * nothing is worse than none.
 *
 * `ChatLayout` (D-192) owns the scrolling: the messages scroll, the
 * composer stays docked at the bottom as a sticky flex item, so the last
 * message is never under it. The frame around this — the pinned headers —
 * is `ThreadFrame`, which also owns the composer's true bottom inset.
 *
 * Reporting (D-177) no longer lives here (D-213, Will, 1 October): a warning
 * button under every message crowded the conversation. It is one row on the
 * thread's ⋯ page now (`/messages/thread/report/`), on the nested-page
 * template.
 */
export interface ThreadViewMessage {
  readonly id: string;
  readonly body: string | null;
  readonly createdAt: string;
  readonly mine: boolean;
}

export interface ThreadViewProps {
  readonly messages: readonly ThreadViewMessage[];
  /** The other person's first name; `null` shows "This person". */
  readonly otherName: string | null;
  /** Their photo when Pam has one (D-335); their initials otherwise. */
  readonly otherPhotoUrl?: string | null;
  readonly onSend: (body: string) => Promise<boolean>;
  readonly sending: boolean;
  readonly sendFailed: boolean;
  /** BCP-47 tag for dictation, e.g. "en-US" or "es-US". */
  readonly speechLanguage: string;
  readonly supportPhone: string;
}

const styles = stylex.create({
  list: { width: '100%' },
  body: { fontSize: '18px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  time: { fontSize: '13px' },
  // §2.5's floor, as a square: send and mic alike (A13, D-192).
  square: { width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', flexShrink: 0 },
  // The send button is a circle (D-389): grey until there is something to
  // send — not the half-faded green a disabled primary button draws — then
  // Pam's dark green.
  round: { borderRadius: '50%' },
  sendIdle: {
    opacity: 1,
    backgroundImage: 'none',
    backgroundColor: colorVars['--color-background-muted'],
    color: colorVars['--color-text-secondary'],
  },
  day: { fontSize: '14px', fontWeight: 600 },
  // The scroll region's inner column keeps the page's reading width.
  messages: { width: '100%' },
  // Reaching the end of the messages must not scroll the page under them.
  layout: { overscrollBehavior: 'contain' },
  scrollWrap: { width: '100%', paddingBlockEnd: '12px', pointerEvents: 'auto' },
});

/**
 * The scroll-to-bottom button, drawn at 48px (D-196).
 *
 * `ChatLayout`'s default is Astryx's `ChatLayoutScrollButton`, which puts a
 * medium `Button` and a medium chevron inside a 32px pill — the chevron
 * overflows the circle, visibly, on a phone (Will's screenshot, 21
 * September). Passing nothing does not fix it; it is the library's own
 * default. So this is the same behaviour on the library's own hooks —
 * `useChatStreamScroll` against the layout's scroll container — drawn as an
 * `IconButton` that clears the 48px floor and holds its chevron. Hidden,
 * not removed, while the log is at the bottom.
 */
function ScrollToBottom() {
  const { t } = useI18n();
  const layout = useChatLayoutContext();
  const fallback = useRef<HTMLElement | null>(null);
  const scroll = useChatStreamScroll({ scrollRef: layout?.scrollContainerRef ?? fallback });
  if (!scroll.isScrolledUp) return null;
  return (
    <HStack justify="center" xstyle={styles.scrollWrap}>
      <IconButton
        label={t('messages.thread.scrollToBottom')}
        icon={<Icon icon="chevronDown" size="sm" />}
        variant="secondary"
        size="md"
        elevation="low"
        onClick={() => scroll.scrollToBottom()}
        xstyle={styles.square}
      />
    </HStack>
  );
}

export function ThreadView({
  messages,
  otherName,
  otherPhotoUrl = null,
  onSend,
  sending,
  sendFailed,
  speechLanguage,
  supportPhone,
}: ThreadViewProps) {
  const { t, locale } = useI18n();
  const inputRef = useRef<ChatComposerInputHandle>(null);
  const [draft, setDraft] = useState('');
  const dictation = useChatDictation({ inputRef, lang: speechLanguage });

  const name = otherName ?? t('messages.thread.someone');
  const canSend = draft.trim() !== '' && !sending;

  const submit = async (value: string) => {
    if (sending || value.trim() === '') return;
    const ok = await onSend(value);
    if (ok) setDraft('');
  };

  const composer = (
    <ChatComposer
      value={draft}
      onChange={setDraft}
      onSubmit={(value) => void submit(value)}
      placeholder={t('messages.thread.placeholder')}
      isDisabled={sending}
      elevation="none"
      input={
        <ChatComposerInput
          handleRef={inputRef}
          label={t('messages.thread.placeholder')}
          placeholder={t('messages.thread.placeholder')}
          hasHistory={false}
          maxRows={4}
        />
      }
      footerActions={
        <ChatDictationButton
          dictation={dictation}
          size="md"
          label={dictation.isListening ? t('messages.thread.dictateStop') : t('messages.thread.dictate')}
          xstyle={styles.square}
        />
      }
      sendButton={
        <ChatSendButton
          size="md"
          sendIcon={<Icon icon="arrowUp" size="md" />}
          xstyle={[styles.square, styles.round, !canSend && styles.sendIdle]}
        />
      }
    />
  );

  return (
    <ChatLayout composer={composer} density="compact" scrollButton={<ScrollToBottom />} xstyle={styles.layout}>
    <VStack gap={4} xstyle={styles.messages}>
      <ChatMessageList
        density="compact"
        align="top"
        xstyle={styles.list}
        emptyState={
          <Text type="supporting" xstyle={styles.body}>
            {t('messages.thread.empty')}
          </Text>
        }
      >
        {messages.map((message, i) => {
          const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
            new Date(message.createdAt),
          );
          // A divider opens each day (D-389).
          const isNewDay = i === 0 || dayKey(message.createdAt) !== dayKey(messages[i - 1]!.createdAt);
          return (
            <Fragment key={message.id}>
              {isNewDay ? (
                <ChatSystemMessage variant="divider">
                  <Text type="supporting" xstyle={styles.day}>
                    {dayLabel(message.createdAt, locale, t)}
                  </Text>
                </ChatSystemMessage>
              ) : null}
              <ChatMessage
                sender={message.mine ? 'user' : 'assistant'}
                avatar={
                  message.mine ? undefined : (
                    <Avatar size="md" name={name} {...(otherPhotoUrl ? { src: otherPhotoUrl } : {})} />
                  )
                }
              >
                <ChatMessageBubble
                  name={
                    <Text type="supporting" xstyle={styles.time}>
                      {message.mine ? t('messages.thread.you') : name}
                    </Text>
                  }
                  metadata={
                    <ChatMessageMetadata
                      timestamp={
                        <Text type="supporting" xstyle={styles.time}>
                          {time}
                        </Text>
                      }
                    />
                  }
                >
                  <Text xstyle={styles.body}>{message.body ?? ''}</Text>
                </ChatMessageBubble>
              </ChatMessage>
            </Fragment>
          );
        })}
      </ChatMessageList>

      {sendFailed ? (
        <Notice
          notice="something_went_wrong"
          title={t('messages.thread.failed.title')}
          body={t('messages.thread.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}
    </VStack>
    </ChatLayout>
  );
}
