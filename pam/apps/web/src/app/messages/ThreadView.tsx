'use client';

import { useRef, useState } from 'react';
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
  useChatDictation,
  useChatLayoutContext,
  useChatStreamScroll,
  type ChatComposerInputHandle,
} from '@astryxdesign/core/Chat';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Notice, TextLink } from '@pam/ui';
import { MESSAGE_REPORT_REASONS, type MessageReportReason } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';

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
 * shape, so the demo cannot drift from the real thing. `onSend` and
 * `onReport` are whatever the caller wires — a real insert, or a
 * sessionStorage append — and this file never imports Supabase.
 *
 * PAM's rules, kept on top of Astryx's defaults: every control is a 48px
 * square — the send button included, which is this screen's one primary
 * action and, since A13 (D-192), the one primary action in PAM that is not
 * 64px: a chat's primary action repeats dozens of times per screen, and a
 * 64px block ate the message area on a phone. Message text is 18px. The
 * mic (`ChatDictationButton`) hides itself when the browser has no speech
 * recognition, which is the same §1 rule `VoiceInput` follows — a dead
 * button is worse than no button. Report is an icon-only 48px button on the
 * other person's messages, named for a screen reader and nothing more.
 *
 * `ChatLayout` (D-192) owns the scrolling: the messages scroll, the
 * composer stays docked at the bottom as a sticky flex item, so the last
 * message is never under it. The frame around this — the pinned headers —
 * is `ThreadFrame`.
 *
 * Reporting (D-177) lives here too, on the other person's messages only:
 * `report_message()` already refuses a report of your own words, and a
 * control that would always be refused should not be drawn. One fixed-list
 * reason, the same shape as flagging a place (0036).
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
  readonly onSend: (body: string) => Promise<boolean>;
  readonly sending: boolean;
  readonly sendFailed: boolean;
  /** When set, the other person's messages get a "Report" action. */
  readonly onReport?: (messageId: string, reason: MessageReportReason) => Promise<boolean>;
  /** BCP-47 tag for dictation, e.g. "en-US" or "es-US". */
  readonly speechLanguage: string;
  readonly supportPhone: string;
}

const styles = stylex.create({
  list: { width: '100%' },
  body: { fontSize: '18px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  time: { fontSize: '13px' },
  // §2.5's floor, as a square: send, mic and report alike (A13, D-192).
  square: { width: '48px', height: '48px', minWidth: '48px', minHeight: '48px', flexShrink: 0 },
  // The scroll region's inner column keeps the page's reading width.
  messages: { width: '100%' },
  // Reaching the end of the messages must not scroll the page under them.
  layout: { overscrollBehavior: 'contain' },
  scrollWrap: { width: '100%', paddingBlockEnd: '12px', pointerEvents: 'auto' },
  reportCard: { width: '100%' },
  reportAction: { minHeight: '48px', fontSize: '17px' },
  intro: { fontSize: '16px', lineHeight: 1.5 },
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

type ReportPhase =
  | { step: 'idle' }
  | { step: 'choosing'; messageId: string; reason: MessageReportReason; busy: boolean }
  | { step: 'done' }
  | { step: 'failed'; messageId: string };

export function ThreadView({
  messages,
  otherName,
  onSend,
  sending,
  sendFailed,
  onReport,
  speechLanguage,
  supportPhone,
}: ThreadViewProps) {
  const { t, locale } = useI18n();
  const inputRef = useRef<ChatComposerInputHandle>(null);
  const [draft, setDraft] = useState('');
  const [report, setReport] = useState<ReportPhase>({ step: 'idle' });
  const dictation = useChatDictation({ inputRef, lang: speechLanguage });

  const name = otherName ?? t('messages.thread.someone');

  const submit = async (value: string) => {
    if (sending || value.trim() === '') return;
    const ok = await onSend(value);
    if (ok) setDraft('');
  };

  const sendReport = async () => {
    if (report.step !== 'choosing' || !onReport) return;
    setReport({ ...report, busy: true });
    const ok = await onReport(report.messageId, report.reason);
    setReport(ok ? { step: 'done' } : { step: 'failed', messageId: report.messageId });
  };

  const composer = (
    <ChatComposer
      value={draft}
      onChange={setDraft}
      onSubmit={(value) => void submit(value)}
      placeholder={t('messages.thread.placeholder')}
      isDisabled={sending}
      input={
        <ChatComposerInput
          handleRef={inputRef}
          label={t('messages.thread.placeholder')}
          placeholder={t('messages.thread.placeholder')}
          hasHistory={false}
          maxRows={4}
        />
      }
      sendActions={
        <ChatDictationButton
          dictation={dictation}
          size="md"
          label={dictation.isListening ? t('messages.thread.dictateStop') : t('messages.thread.dictate')}
          xstyle={styles.square}
        />
      }
      sendButton={<ChatSendButton size="md" xstyle={styles.square} />}
    />
  );

  return (
    <ChatLayout composer={composer} density="compact" scrollButton={<ScrollToBottom />} xstyle={styles.layout}>
    <VStack gap={4} xstyle={styles.messages}>
      <ChatMessageList
        density="spacious"
        align="top"
        xstyle={styles.list}
        emptyState={
          <Text type="supporting" xstyle={styles.body}>
            {t('messages.thread.empty')}
          </Text>
        }
      >
        {messages.map((message) => {
          const when = whenHappened(message.createdAt, locale, t);
          const time = new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(
            new Date(message.createdAt),
          );
          const canReport = Boolean(onReport) && !message.mine && report.step !== 'done';
          return (
            <ChatMessage
              key={message.id}
              sender={message.mine ? 'user' : 'assistant'}
              avatar={message.mine ? undefined : <Avatar size="md" name={name} />}
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
                        {when} · {time}
                      </Text>
                    }
                    footer={
                      canReport ? (
                        <Button
                          label={t('messages.report.action')}
                          variant="ghost"
                          size="md"
                          isIconOnly
                          icon={<Icon icon="warning" size="sm" />}
                          xstyle={styles.square}
                          onClick={() =>
                            setReport({
                              step: 'choosing',
                              messageId: message.id,
                              reason: MESSAGE_REPORT_REASONS[0],
                              busy: false,
                            })
                          }
                        />
                      ) : undefined
                    }
                  />
                }
              >
                <Text xstyle={styles.body}>{message.body ?? ''}</Text>
              </ChatMessageBubble>
            </ChatMessage>
          );
        })}
      </ChatMessageList>

      {report.step === 'choosing' ? (
        <Card padding={4} xstyle={styles.reportCard}>
          <VStack gap={3}>
            <Text xstyle={styles.body}>{t('messages.report.title')}</Text>
            <Text type="supporting" xstyle={styles.intro}>
              {t('messages.report.intro')}
            </Text>
            <RadioList
              label={t('messages.report.title')}
              isLabelHidden
              value={report.reason}
              onChange={(next) => setReport({ ...report, reason: next as MessageReportReason })}
            >
              {MESSAGE_REPORT_REASONS.map((key) => (
                <RadioListItem key={key} value={key} label={t(`messages.report.reason.${key}`)} />
              ))}
            </RadioList>
            <HStack gap={3} align="center" wrap="wrap">
              <Button
                label={report.busy ? t('messages.report.sending') : t('messages.report.send')}
                variant="secondary"
                isDisabled={report.busy}
                xstyle={styles.reportAction}
                onClick={() => void sendReport()}
              />
              <TextLink label={t('messages.report.cancel')} onClick={() => setReport({ step: 'idle' })} />
            </HStack>
          </VStack>
        </Card>
      ) : null}

      {report.step === 'done' ? (
        <Notice
          notice="service_not_available"
          title={t('messages.report.done.title')}
          body={t('messages.report.done.body')}
        />
      ) : null}

      {report.step === 'failed' ? (
        <Notice
          notice="something_went_wrong"
          title={t('messages.report.failed.title')}
          body={t('messages.report.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

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
