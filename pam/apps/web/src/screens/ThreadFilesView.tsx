'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { VStack } from '@astryxdesign/core/VStack';
import { Loading } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useThread, type ThreadMessage } from '@/lib/useThread';
import { googleLinkIn } from '@/lib/messageFile';
import { GoogleLinkCard, MessageFileCard } from '@/app/messages/MessageFileCard';
import { PhotoViewer } from '@/app/messages/PhotoViewer';

/**
 * Everything shared in one conversation, in one place (Will, 9 October,
 * D-402: "a list of images and documents in the chat, a summary. Almost like
 * a file list"), from the conversation's ⋯ page. The photos as a grid that
 * opens full size and pages through them all; the documents as the same
 * cards the conversation shows, opened with a tap; the Google Docs links as
 * their cards — newest first in each, each saying who sent it and when.
 *
 * It reads the conversation the conversation screen reads (`useThread`: the
 * same 200 messages, the same rules about who can see a photo or open a
 * document), so it can show nothing the conversation would not. An example
 * conversation has nothing shared in it, and says so.
 */
const styles = stylex.create({
  section: { width: '100%' },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  photo: { width: '100%', height: 'auto', aspectRatio: '1', borderRadius: '12px' },
  meta: { fontSize: '14px', lineHeight: 1.3 },
  empty: { fontSize: '18px', lineHeight: 1.5 },
});

function isExample(id: string) {
  return id.startsWith('dummy-conv-');
}

function ThreadFiles() {
  const { t, locale } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const example = isExample(id);
  const { state: session } = useSession();
  const { state } = useThread(!example && session.status === 'signed-in' ? id : null);
  const [viewing, setViewing] = useState<number | null>(null);

  const messages: readonly ThreadMessage[] = state.status === 'ready' ? [...state.messages].reverse() : [];
  const otherName = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : '';
  const who = (m: ThreadMessage) => (m.mine ? t('messages.thread.you') : otherName);
  const when = (m: ThreadMessage) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(m.createdAt));
  const from = (m: ThreadMessage) => t('messages.files.from', { who: who(m), date: when(m) });

  const photos = messages.filter((m) => m.photoUrl);
  const documents = messages.filter((m) => m.file);
  const links = messages
    .map((m) => ({ message: m, link: googleLinkIn(m.body) }))
    .filter((x): x is { message: ThreadMessage; link: NonNullable<ReturnType<typeof googleLinkIn>> } => x.link !== null);
  const alt = (m: ThreadMessage) =>
    m.mine ? t('messages.thread.photo.yours') : t('messages.thread.photo.theirs', { name: otherName });

  const loading = !example && (state.status === 'loading' || session.status === 'loading');
  const nothing = photos.length === 0 && documents.length === 0 && links.length === 0;

  return (
    <SubPage
      title={t('messages.files.title')}
      backHref={`/messages/thread/options/?id=${encodeURIComponent(id)}`}
      backLabel={t('nav.back.options')}
      gap={4}
    >
      {loading ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : nothing ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('messages.files.empty')}
        </Text>
      ) : (
        <>
          {photos.length > 0 ? (
            <VStack gap={3} xstyle={styles.section}>
              <Heading level={2} xstyle={styles.heading}>
                {t('messages.files.photos')}
              </Heading>
              <Grid columns={3} gap={2}>
                {photos.map((m, i) => (
                  <Thumbnail
                    key={m.id}
                    src={m.photoUrl!}
                    alt={`${alt(m)}, ${when(m)}`}
                    onClick={() => setViewing(i)}
                    xstyle={styles.photo}
                  />
                ))}
              </Grid>
            </VStack>
          ) : null}

          {documents.length > 0 ? (
            <VStack gap={3} xstyle={styles.section}>
              <Heading level={2} xstyle={styles.heading}>
                {t('messages.files.documents')}
              </Heading>
              {documents.map((m) => (
                <VStack key={m.id} gap={1}>
                  <MessageFileCard file={m.file!} isWide />
                  <Text type="supporting" xstyle={styles.meta}>
                    {from(m)}
                  </Text>
                </VStack>
              ))}
            </VStack>
          ) : null}

          {links.length > 0 ? (
            <VStack gap={3} xstyle={styles.section}>
              <Heading level={2} xstyle={styles.heading}>
                {t('messages.files.google')}
              </Heading>
              {links.map(({ message, link }) => (
                <VStack key={message.id} gap={1}>
                  <GoogleLinkCard url={link.url} kind={link.kind} isWide />
                  <Text type="supporting" xstyle={styles.meta}>
                    {from(message)}
                  </Text>
                </VStack>
              ))}
            </VStack>
          ) : null}
        </>
      )}
      <PhotoViewer
        media={viewing === null ? null : photos.map((m) => ({ src: m.photoUrl!, alt: alt(m) }))}
        {...(viewing !== null ? { index: viewing } : {})}
        onIndexChange={setViewing}
        onClose={() => setViewing(null)}
      />
    </SubPage>
  );
}

export function ThreadFilesView() {
  return (
    <Suspense fallback={null}>
      <ThreadFiles />
    </Suspense>
  );
}
