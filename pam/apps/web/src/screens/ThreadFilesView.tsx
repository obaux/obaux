'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { VStack } from '@astryxdesign/core/VStack';
import { Loading } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useThread, type ThreadMessage } from '@/lib/useThread';
import { googleLinkIn, type GoogleLinkKind } from '@/lib/messageFile';
import { GoogleLinkCard, MessageFileCard, type SentBy } from '@/app/messages/MessageFileCard';
import { PhotoViewer } from '@/app/messages/PhotoViewer';

/**
 * Everything shared in one conversation, in one place (Will, 9 October,
 * D-402: "a list of images and documents in the chat, a summary. Almost like
 * a file list"), from the conversation's ⋯ page.
 *
 * Laid out to read (Will, 9 October, D-404): the photos first, as a row you
 * swipe through (Astryx's `Carousel`, snapping a photo at a time), each with
 * who sent it and when under it; then one Documents list — PDFs, Word files
 * and Google Docs together, one card on top of the other, the full width of
 * the page — each card saying who sent it on its second line and when at its
 * end. Newest first, in both. 32px between the two, so they read as two.
 *
 * It reads the conversation the conversation screen reads (`useThread`: the
 * same 200 messages, the same rules about who can see a photo or open a
 * document), so it can show nothing the conversation would not. An example
 * conversation has nothing shared in it, and says so.
 */
const styles = stylex.create({
  sections: { width: '100%' },
  section: { width: '100%' },
  heading: { fontSize: '20px', lineHeight: 1.3 },
  slide: { width: '200px', flexShrink: 0 },
  photo: { width: '200px', height: '200px', borderRadius: '14px' },
  who: { fontSize: '16px', lineHeight: 1.3, fontWeight: 600 },
  when: { fontSize: '14px', lineHeight: 1.3 },
  empty: { fontSize: '18px', lineHeight: 1.5 },
});

function isExample(id: string) {
  return id.startsWith('dummy-conv-');
}

type Shared =
  | { readonly kind: 'file'; readonly message: ThreadMessage }
  | { readonly kind: 'google'; readonly message: ThreadMessage; readonly url: string; readonly google: GoogleLinkKind };

function ThreadFiles() {
  const { t, locale } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const example = isExample(id);
  const { state: session } = useSession();
  const { state } = useThread(!example && session.status === 'signed-in' ? id : null);
  const [viewing, setViewing] = useState<number | null>(null);

  // Newest first.
  const messages: readonly ThreadMessage[] = state.status === 'ready' ? [...state.messages].reverse() : [];
  const otherName = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : '';
  const sentBy = (m: ThreadMessage): SentBy => {
    const at = new Date(m.createdAt);
    return {
      who: m.mine ? t('messages.thread.you') : otherName,
      date: new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(at),
      time: new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(at),
    };
  };

  const photos = messages.filter((m) => m.photoUrl);
  const documents: Shared[] = messages.flatMap((m): Shared[] => {
    if (m.file) return [{ kind: 'file', message: m }];
    const link = googleLinkIn(m.body);
    return link ? [{ kind: 'google', message: m, url: link.url, google: link.kind }] : [];
  });
  const alt = (m: ThreadMessage) =>
    m.mine ? t('messages.thread.photo.yours') : t('messages.thread.photo.theirs', { name: otherName });

  const loading = !example && (state.status === 'loading' || session.status === 'loading');
  const nothing = photos.length === 0 && documents.length === 0;

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
        <VStack gap={8} xstyle={styles.sections}>
          {photos.length > 0 ? (
            <VStack gap={3} xstyle={styles.section}>
              <Heading level={2} xstyle={styles.heading}>
                {t('messages.files.photos')}
              </Heading>
              <Carousel aria-label={t('messages.files.photos')} gap={3} hasSnap>
                {photos.map((m, i) => {
                  const sent = sentBy(m);
                  return (
                    <VStack key={m.id} gap={2} xstyle={styles.slide}>
                      <Thumbnail
                        src={m.photoUrl!}
                        alt={`${alt(m)}, ${sent.date}, ${sent.time}`}
                        onClick={() => setViewing(i)}
                        xstyle={styles.photo}
                      />
                      <VStack gap={0.5}>
                        <Text xstyle={styles.who}>{sent.who}</Text>
                        <Text type="supporting" xstyle={styles.when}>
                          {t('messages.files.when', { date: sent.date, time: sent.time })}
                        </Text>
                      </VStack>
                    </VStack>
                  );
                })}
              </Carousel>
            </VStack>
          ) : null}

          {documents.length > 0 ? (
            <VStack gap={3} xstyle={styles.section}>
              <Heading level={2} xstyle={styles.heading}>
                {t('messages.files.documents')}
              </Heading>
              <VStack gap={2}>
                {documents.map((item) =>
                  item.kind === 'file' ? (
                    <MessageFileCard
                      key={item.message.id}
                      file={item.message.file!}
                      sent={sentBy(item.message)}
                      isWide
                    />
                  ) : (
                    <GoogleLinkCard
                      key={item.message.id}
                      url={item.url}
                      kind={item.google}
                      sent={sentBy(item.message)}
                      isWide
                    />
                  ),
                )}
              </VStack>
            </VStack>
          ) : null}
        </VStack>
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
