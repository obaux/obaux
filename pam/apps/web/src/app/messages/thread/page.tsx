'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { TextArea } from '@astryxdesign/core/TextArea';
import { AppHeader, BigButton, HelpBar, Loading, Notice, Page, PageTitle } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../../NotIn';
import { HeaderBell } from '../../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useThread, type ThreadMessage } from '@/lib/useThread';
import { whenHappened } from '@/lib/when';

/**
 * One conversation — read what has been said, and send the next thing.
 *
 * Messaging is staff-to-member (D-152): a member, their case manager, or
 * their program admin can all land here, and all three read this screen the
 * same way — `useThread` checks conversation *membership*, never role. A
 * case manager who is themselves a participant reads the full history the
 * ordinary way any conversation member does (§4.1's transparency contract now
 * says so explicitly — `transparency.canSee.directMessages`). What has not
 * changed is D-074: a case manager who is *not* in a conversation still has
 * no route into it except a report, because there is still no `admin_covers`
 * policy on `messages` anywhere — this screen only ever renders what
 * `in_conversation()` already allows.
 *
 * One primary action: `Send`. Nothing else on this screen is a `BigButton`.
 */

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  thread: { width: '100%' },
  bubble: { maxWidth: '82%', width: 'auto' },
  bubbleWrap: { width: '100%' },
  body: { fontSize: '17px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  time: { fontSize: '13px' },
  empty: { fontSize: '17px', lineHeight: 1.5 },
  compose: { width: '100%' },
});

function MessageBubble({ message, locale, t }: {
  readonly message: ThreadMessage;
  readonly locale: string;
  readonly t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  return (
    <HStack justify={message.mine ? 'end' : 'start'} wrap="nowrap" xstyle={styles.bubbleWrap}>
      <Card variant={message.mine ? 'blue' : 'muted'} padding={3} xstyle={styles.bubble}>
        <VStack gap={1}>
          <Text xstyle={styles.body}>{message.body}</Text>
          <Text type="supporting" xstyle={styles.time}>
            {whenHappened(message.createdAt, locale, t)}
          </Text>
        </VStack>
      </Card>
    </HStack>
  );
}

function ThreadScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const params = useSearchParams();
  const conversationId = params.get('id');

  const signedIn = session.status === 'signed-in';
  const canMessage =
    signedIn &&
    (session.session.role === 'member' ||
      session.session.role === 'admin' ||
      session.session.role === 'provider');
  const { state, send, sending, sendFailed } = useThread(canMessage ? conversationId : null);
  const [draft, setDraft] = useState('');

  const submit = async () => {
    const ok = await send(draft);
    if (ok) setDraft('');
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <NotIn status={session.status} title={t('messages.signedOut.title')} body={t('messages.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  if (!canMessage) {
    return (
      <Page gap={4}>
        <AppHeader trailing={<HeaderBell enabled={signedIn} role={session.session.role} />} />
        <PageTitle title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
        <Notice
          notice="no_mentors_found"
          title={t('messages.notForRole.title')}
          body={t('messages.notForRole.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  const title = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : t('messages.title');

  return (
    <Page gap={4}>
      <AppHeader trailing={<HeaderBell enabled={signedIn} role={session.session.role} />} />
      <PageTitle title={title} backHref="/messages/" backLabel={t('nav.back.messages')} />

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'not_found' ? (
        <Notice
          notice="service_not_available"
          title={t('messages.thread.notFound.title')}
          body={t('messages.thread.notFound.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {state.status === 'ready' ? (
        <>
          <VStack gap={3} xstyle={styles.thread}>
            {state.messages.length === 0 ? (
              <Text type="supporting" xstyle={styles.empty}>
                {t('messages.thread.empty')}
              </Text>
            ) : (
              state.messages.map((message) => (
                <MessageBubble key={message.id} message={message} locale={locale} t={t} />
              ))
            )}
          </VStack>

          {sendFailed ? (
            <Notice
              notice="something_went_wrong"
              title={t('messages.thread.failed.title')}
              body={t('messages.thread.failed.body')}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}

          <TextArea
            label={t('messages.thread.placeholder')}
            isLabelHidden
            placeholder={t('messages.thread.placeholder')}
            value={draft}
            onChange={(next) => setDraft(next)}
            rows={2}
            width="100%"
            xstyle={styles.compose}
          />

          <BigButton
            label={sending ? t('messages.thread.sending') : t('messages.thread.send')}
            onPress={() => void submit()}
            isDisabled={sending || draft.trim() === ''}
          />
        </>
      ) : null}

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}

/**
 * `useSearchParams` needs a Suspense boundary in an exported app — see
 * `/flag/page.tsx` for the same shape and why the fallback is a real header
 * rather than a spinner.
 */
export default function MessageThreadPage() {
  return (
    <Suspense
      fallback={
        <Page gap={3}>
          <AppHeader />
        </Page>
      }
    >
      <ThreadScreen />
    </Suspense>
  );
}
