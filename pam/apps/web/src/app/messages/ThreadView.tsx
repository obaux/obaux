'use client';

import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import {
  ChatComposer,
  ChatComposerDrawer,
  ChatComposerInput,
  ChatDictationButton,
  ChatLayout,
  ChatMessage,
  ChatMessageBubble,
  ChatMessageList,
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
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { Lightbox } from '@astryxdesign/core/Lightbox';
import { Notice, PhotoIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
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
 * 64px block ate the message area on a phone. Message text is 16px — the
 * one place Pam drops below its 18px body floor (A21, D-392: a phone's
 * conversation apps read at 16–17px, and at 18px the bubbles wrapped every
 * few words). The
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
 * the phone's width — nothing here is hand-overridden.
 *
 * Days, not dates, under bubbles (Will, 8 October, D-389): each day opens
 * with one centred divider — "Today", "Yesterday", a weekday, then a date.
 * A date repeated under every bubble was noise; one per day is what the
 * conversation apps people already use do.
 *
 * Who and when are out of sight until asked for (Will, 8 October, D-390):
 * no "You" or name over a bubble and no time under it. Side and colour say
 * who — mine on the right in light green, theirs on the left in grey with
 * their photo — and dragging the conversation sideways slides each time
 * into view at the right edge, as iMessage does (`RevealTimes`). Nothing is
 * lost to a screen reader: the name and time stay as each message's label,
 * visually hidden, through Astryx's own `ChatMessage` `name` wiring.
 *
 * The composer is one rounded box (D-389, Will's reference): the text on top,
 * a row under it with the mic and the photo button (D-394) on the left and a
 * round send button on the right — grey while there is nothing to send,
 * Pam's dark green once there is. Flat, with a border (`elevation="none"`),
 * so it reads as a field and not as a card floating over the conversation.
 * The mic, photo and idle arrow are Astryx's secondary icon grey (Will,
 * 8 October, D-396: "more greyed out, less emphasis") at the heavier
 * stroke D-390 asked for; the words are what the box is for.
 *
 * `ChatLayout` (D-192) owns the scrolling: the messages scroll, the
 * composer stays docked at the bottom as a sticky flex item, so the last
 * message is never under it. The frame around this — the pinned headers —
 * is `ThreadFrame`. The room under the composer is the composer's own
 * margin (D-396), so it sits inside `ChatLayout`'s frosted dock and the
 * conversation fades under it to the bottom edge.
 *
 * Reporting (D-177) no longer lives here (D-213, Will, 1 October): a warning
 * button under every message crowded the conversation. It is one row on the
 * thread's ⋯ page now (`/messages/thread/report/`), on the nested-page
 * template.
 */
export interface ThreadViewMessage {
  readonly id: string;
  readonly body: string | null;
  /** A link to the message's photo (D-394), or null. */
  readonly photoUrl?: string | null;
  readonly createdAt: string;
  readonly mine: boolean;
}

export interface ThreadViewProps {
  readonly messages: readonly ThreadViewMessage[];
  /** The other person's first name; `null` shows "This person". */
  readonly otherName: string | null;
  /** Their photo when Pam has one (D-335); their initials otherwise. */
  readonly otherPhotoUrl?: string | null;
  /** Sends the words, the photo, or both; true once it has gone. */
  readonly onSend: (body: string, photo: Blob | null) => Promise<boolean>;
  readonly sending: boolean;
  readonly sendFailed: boolean;
  /** BCP-47 tag for dictation, e.g. "en-US" or "es-US". */
  readonly speechLanguage: string;
  readonly supportPhone: string;
}

/**
 * How far a sideways drag slides my bubbles and the times (D-390): the time
 * column's width — 12px of air, then room for the widest time Pam prints
 * ("12:45 p. m." in Spanish).
 */
const REVEAL = 84;

// What a drag moves, it moves by this one custom property, set once on
// `RevealTimes` and read by every bubble and time below it — so a pointer
// move restyles one element and re-renders none of the messages.
const SLIDE = 'translateX(calc(-1 * var(--pam-reveal, 0px)))';
const slideMotion = {
  transform: SLIDE,
  transitionProperty: 'transform',
  transitionDuration: { default: 'var(--pam-reveal-ms, 220ms)', '@media (prefers-reduced-motion: reduce)': '0ms' },
  transitionTimingFunction: 'cubic-bezier(0.2, 0.8, 0.2, 1)',
} as const;

const styles = stylex.create({
  list: { width: '100%' },
  body: { fontSize: '16px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  // Each message row is the anchor for its own time (D-390).
  row: { position: 'relative' },
  // The time, parked just past the row's end — outside what the list shows,
  // so it is out of sight until a drag slides it in. The 12px start padding
  // is the same 12px the list keeps at its sides, so not one pixel of the
  // time shows at rest.
  stamp: {
    position: 'absolute',
    insetInlineStart: '100%',
    insetBlockStart: 0,
    insetBlockEnd: 0,
    width: `${REVEAL}px`,
    boxSizing: 'border-box',
    paddingInlineStart: spacingVars['--spacing-3'],
    display: 'flex',
    alignItems: 'center',
    fontSize: '13px',
    whiteSpace: 'nowrap',
    pointerEvents: 'none',
    ...slideMotion,
  },
  // A bubble leaves the time column free, so a time never lands on a bubble
  // — theirs stay where they are while the times slide in beside them, the
  // way iMessage keeps its grey bubbles still. Astryx's own cap otherwise.
  // The negative margin: a hidden name above the bubble (it labels the
  // message for a screen reader) still brings Astryx's 4px gap under a name
  // row; this takes it back so a bubble sits level with its avatar.
  bubble: {
    maxWidth: `min(max(80%, 280px), calc(100% - ${REVEAL}px))`,
    marginBlockStart: `calc(-1 * ${spacingVars['--spacing-1']})`,
  },
  // Mine light green and moving with the drag; theirs the default grey,
  // still (D-390).
  mine: { backgroundColor: colorVars['--color-background-green'], ...slideMotion },
  // The drag surface: a vertical swipe is still the page's scroll, a
  // sideways one is ours. `clip`, not `hidden`, so it clips the parked
  // times without becoming a second scroll box.
  reveal: { width: '100%', overflowX: 'clip', touchAction: 'pan-y' },
  notice: { paddingInline: spacingVars['--spacing-3'] },
  // A photo in a bubble (D-394): a 240px square, cropped to fill, that opens
  // full size when tapped. A photo on its own sits in a thin rim of the
  // bubble's colour; with words, the words follow it.
  photo: { width: '240px', height: '240px', maxWidth: '100%', borderRadius: '14px' },
  photoOnly: { paddingBlock: spacingVars['--spacing-1'], paddingInline: spacingVars['--spacing-1'] },
  caption: { paddingInline: spacingVars['--spacing-2'], paddingBlockEnd: spacingVars['--spacing-1'] },
  // The photo picked and not sent yet, above where you type.
  pending: { width: '72px', height: '72px', borderRadius: '12px' },
  // The file picker itself is never seen: the photo button opens it (the
  // same pattern as the staff photo and policy uploads in @pam/ui).
  fileInput: { position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' },
  // Room under the composer, inside the dock's frosted fade (Will, 8 October,
  // D-396: "it should be inside the box with fade"). Was the frame's bottom
  // padding (D-391, D-393), which put a strip of bare page under the fade.
  // 32px here and the dock's own 8px: still 40px off the bottom edge, or the
  // phone's home-indicator inset where that is larger.
  composer: { marginBlockEnd: `max(env(safe-area-inset-bottom, 0px), ${spacingVars['--spacing-8']})` },
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
    color: colorVars['--color-icon-secondary'],
  },
  day: { fontSize: '14px', fontWeight: 600 },
  // A day is a section (D-392): more air above its divider than inside it,
  // so the break between days reads before the break between messages —
  // 32px above (the list's 8px gap and this 24px), 16px below. The first
  // day's divider needs none above it.
  dayGap: { marginBlockStart: spacingVars['--spacing-6'], marginBlockEnd: spacingVars['--spacing-2'] },
  dayFirst: { marginBlockEnd: spacingVars['--spacing-2'] },
  // The scroll region's inner column keeps the page's reading width.
  messages: { width: '100%' },
  // Reaching the end of the messages must not scroll the page under them.
  layout: { overscrollBehavior: 'contain' },
  scrollWrap: { width: '100%', paddingBlockEnd: '12px', pointerEvents: 'auto' },
  // The scroll-to-bottom button floats over the conversation (D-393).
  floating: {
    backgroundColor: colorVars['--color-background-popover'],
    color: colorVars['--color-text-primary'],
  },
});

const dynamic = stylex.create({
  // Mid-drag the slide follows the finger with no easing, and the text under
  // it is not selected by the same press; let go and it eases back.
  reveal: (x: number, isDragging: boolean) => ({
    '--pam-reveal': `${x}px`,
    '--pam-reveal-ms': isDragging ? '0ms' : '220ms',
    userSelect: isDragging ? 'none' : 'auto',
  }),
});

/**
 * Drag the conversation sideways to see when each message was sent, the way
 * iMessage does (Will, 8 October, D-390). Let go and it slides back.
 *
 * My bubbles and every time slide; theirs, the avatars and the day
 * dividers stay put. The drag state lives here, not in `ThreadView`: the
 * messages arrive as `children` and read the distance from a custom
 * property, so a pointer move re-renders this wrapper alone — not every
 * bubble in the conversation.
 *
 * Only a drag that starts out sideways is taken. One that starts upward or
 * downward belongs to the scroll, and `touch-action: pan-y` hands it to the
 * browser untouched.
 */
function RevealTimes({ children }: { readonly children: ReactNode }) {
  const [offset, setOffset] = useState(0);
  const [isDragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; id: number; axis: 'x' | 'y' | null } | null>(null);

  const end = () => {
    drag.current = null;
    setDragging(false);
    setOffset(0);
  };

  return (
    <VStack
      xstyle={[styles.reveal, dynamic.reveal(offset, isDragging)]}
      onPointerDown={(e: React.PointerEvent) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        drag.current = { x: e.clientX, y: e.clientY, id: e.pointerId, axis: null };
      }}
      onPointerMove={(e: React.PointerEvent) => {
        const d = drag.current;
        if (!d || d.id !== e.pointerId) return;
        const dx = e.clientX - d.x;
        const dy = e.clientY - d.y;
        if (d.axis === null) {
          if (Math.abs(dx) < 8 && Math.abs(dy) < 8) return;
          d.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y';
          if (d.axis === 'x') {
            (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
            setDragging(true);
          }
        }
        if (d.axis === 'x') setOffset(Math.min(Math.max(-dx, 0), REVEAL));
      }}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {children}
    </VStack>
  );
}

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
 *
 * White, with a bigger, heavier arrow (Will, 8 October, D-393): the pale
 * green it had read as part of the conversation underneath it, not as a
 * control floating over it. Its shadow stays the light one it always had
 * (Will: "ignore stronger shadow"). White is the popover ground, so in dark mode
 * it is the raised grey a floating control takes there rather than a white
 * disc; the arrow is the 24px icon at the composer's 2.25 stroke
 * (`globals.css`).
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
        icon={<Icon icon="chevronDown" size="lg" />}
        variant="secondary"
        size="md"
        elevation="low"
        onClick={() => scroll.scrollToBottom()}
        xstyle={[styles.square, styles.floating]}
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

  // While the mic is on, the words follow you (Will, 8 October, D-397). The
  // box grows to 8 lines, then scrolls inside itself; a typed word keeps
  // the caret in view because the browser scrolls to it, but dictated words
  // are written into the box from script — the grey words still being heard
  // at the end, then the settled ones — and the browser follows none of
  // that, so from the 9th line on you talked into lines out of sight. So
  // while it listens, every change to the box scrolls it to its last line.
  // Only then: someone editing the middle of a long message by hand is
  // never pulled away from where they are.
  const inputBox = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!dictation.isListening) return;
    const editable = inputBox.current?.querySelector<HTMLElement>('[contenteditable]');
    if (!editable) return;
    const follow = () => {
      editable.scrollTop = editable.scrollHeight;
    };
    follow();
    const watch = new MutationObserver(follow);
    watch.observe(editable, { childList: true, subtree: true, characterData: true });
    return () => watch.disconnect();
  }, [dictation.isListening]);

  const name = otherName ?? t('messages.thread.someone');
  // A photo picked to send (D-394), shown above where you type until it goes.
  const picker = useRef<HTMLInputElement>(null);
  const [photo, setPhoto] = useState<{ file: File; preview: string } | null>(null);
  // The photo open full size, if any.
  const [viewing, setViewing] = useState<{ src: string; alt: string } | null>(null);
  const canSend = (draft.trim() !== '' || photo !== null) && !sending;

  const clearPhoto = () => {
    setPhoto((prev) => {
      if (prev) URL.revokeObjectURL(prev.preview);
      return null;
    });
  };

  const submit = async (value: string) => {
    if (sending || (value.trim() === '' && !photo)) return;
    const ok = await onSend(value, photo?.file ?? null);
    if (ok) {
      setDraft('');
      clearPhoto();
    }
  };

  const composer = (
    <ChatComposer
      value={draft}
      onChange={setDraft}
      onSubmit={(value) => void submit(value)}
      placeholder={t('messages.thread.placeholder')}
      isDisabled={sending}
      elevation="none"
      xstyle={styles.composer}
      drawer={
        photo ? (
          <ChatComposerDrawer>
            <HStack gap={2} align="center">
              <Thumbnail
                src={photo.preview}
                alt={t('messages.thread.photo.picked')}
                label={t('messages.thread.photo.picked')}
                xstyle={styles.pending}
              />
              <IconButton
                label={t('messages.thread.photo.remove')}
                icon={<Icon icon="close" size="md" />}
                variant="ghost"
                size="md"
                onClick={clearPhoto}
                xstyle={styles.square}
              />
            </HStack>
          </ChatComposerDrawer>
        ) : undefined
      }
      input={
        <ChatComposerInput
          ref={inputBox}
          handleRef={inputRef}
          label={t('messages.thread.placeholder')}
          placeholder={t('messages.thread.placeholder')}
          hasHistory={false}
          maxRows={8}
        />
      }
      footerActions={
        <>
          <ChatDictationButton
            dictation={dictation}
            size="md"
            label={dictation.isListening ? t('messages.thread.dictateStop') : t('messages.thread.dictate')}
            xstyle={styles.square}
          />
          <IconButton
            label={t('messages.thread.photo.add')}
            icon={<Icon icon={PhotoIcon} size="md" color="secondary" />}
            variant="ghost"
            size="md"
            isDisabled={sending}
            onClick={() => picker.current?.click()}
            xstyle={styles.square}
          />
          <input
            ref={picker}
            type="file"
            accept="image/*"
            tabIndex={-1}
            aria-hidden
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = '';
              if (!file) return;
              clearPhoto();
              setPhoto({ file, preview: URL.createObjectURL(file) });
            }}
            {...stylex.props(styles.fileInput)}
          />
        </>
      }
      sendButton={
        <ChatSendButton
          size="md"
          sendIcon={<Icon icon="arrowUp" size="md" />}
          // Its own rule, not the composer's: a photo with no words can go.
          isDisabled={!canSend}
          onSend={() => void submit(draft)}
          xstyle={[styles.square, styles.round, !canSend && styles.sendIdle]}
        />
      }
    />
  );

  return (
    <>
    <ChatLayout composer={composer} density="compact" scrollButton={<ScrollToBottom />} xstyle={styles.layout}>
    <VStack gap={4} xstyle={styles.messages}>
      <RevealTimes>
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
                  <ChatSystemMessage variant="divider" xstyle={i === 0 ? styles.dayFirst : styles.dayGap}>
                    <Text type="supporting" xstyle={styles.day}>
                      {dayLabel(message.createdAt, locale, t)}
                    </Text>
                  </ChatSystemMessage>
                ) : null}
                <ChatMessage
                  sender={message.mine ? 'user' : 'assistant'}
                  xstyle={styles.row}
                  // Not drawn (D-390), but still the message's label: a
                  // screen reader hears "You, 2:14 PM" before the words.
                  name={
                    <VisuallyHidden>
                      {t('messages.thread.from', { name: message.mine ? t('messages.thread.you') : name, time })}
                    </VisuallyHidden>
                  }
                  avatar={
                    message.mine ? undefined : (
                      <Avatar size="md" name={name} {...(otherPhotoUrl ? { src: otherPhotoUrl } : {})} />
                    )
                  }
                >
                  <ChatMessageBubble
                    xstyle={[
                      styles.bubble,
                      message.mine && styles.mine,
                      message.photoUrl != null && !message.body && styles.photoOnly,
                    ]}
                  >
                    {message.photoUrl ? (
                      <VStack gap={2}>
                        <Thumbnail
                          src={message.photoUrl}
                          alt={message.mine ? t('messages.thread.photo.yours') : t('messages.thread.photo.theirs', { name })}
                          onClick={() =>
                            setViewing({
                              src: message.photoUrl!,
                              alt: message.mine
                                ? t('messages.thread.photo.yours')
                                : t('messages.thread.photo.theirs', { name }),
                            })
                          }
                          xstyle={styles.photo}
                        />
                        {message.body ? (
                          <Text xstyle={[styles.body, styles.caption]}>{message.body}</Text>
                        ) : null}
                      </VStack>
                    ) : (
                      <Text xstyle={styles.body}>{message.body ?? ''}</Text>
                    )}
                  </ChatMessageBubble>
                  <Text type="supporting" aria-hidden xstyle={styles.stamp}>
                    {time}
                  </Text>
                </ChatMessage>
              </Fragment>
            );
          })}
        </ChatMessageList>
      </RevealTimes>

      {sendFailed ? (
        <VStack xstyle={styles.notice}>
          <Notice
            notice="something_went_wrong"
            title={t('messages.thread.failed.title')}
            body={t('messages.thread.failed.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        </VStack>
      ) : null}
    </VStack>
    </ChatLayout>
    <Lightbox
      isOpen={viewing !== null}
      onOpenChange={(open) => {
        if (!open) setViewing(null);
      }}
      media={{ src: viewing?.src ?? '', alt: viewing?.alt ?? '' }}
      hasZoom
    />
    </>
  );
}
