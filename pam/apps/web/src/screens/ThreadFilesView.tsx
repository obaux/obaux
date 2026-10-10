'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import type { StyleXStyles } from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Thumbnail } from '@astryxdesign/core/Thumbnail';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { DocumentIcon, GlobeIcon, Loading, MarqueeText, PdfIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useThread, type ThreadMessage } from '@/lib/useThread';
import {
  googleLinkIn,
  handOver,
  loadMessageFile,
  messageFileKind,
  type GoogleLinkKind,
  type MessageFile,
} from '@/lib/messageFile';
import {
  loadLinkPreviews,
  loadPreviewImages,
  requestLinkPreviews,
  sharedLinkIn,
  shortLink,
  wantsPreview,
  type LinkPreview,
} from '@/lib/linkPreview';
import { PhotoViewer } from '@/app/messages/PhotoViewer';
import { intlLocale } from '@pam/config';

/**
 * Stuff shared: everything sent in one conversation, in one flat list (Will,
 * 9 October, D-407 — "I don't like the image carousel. Scratch that idea …
 * create a flat list item, similar to policy item", then, of mockup A: "instead
 * of chevron, add timestamp and person there, tucked at the end").
 *
 * One row per thing, newest first, in the policy row's shape (`MenuList`,
 * D-210: 64px, 18px name, 14px grey line, dividers): a small preview where
 * the icon goes — the photo; a document's icon on a tint of its colour (PDF
 * red, Word and Google Docs blue, Google Sheets green); a link's picture from
 * its page, or a globe — then its name on one line, which slides to show its
 * end when it is cut off (`MarqueeText`), then what kind of thing it is —
 * "Photo" or "Document" (Will, 9 October, D-409: "for the end user, they
 * only care if it's a link, doc, or photo. So the formats don't need to
 * show"; it was "PDF · 180 kB", "Google Sheet"), or for a link where it goes,
 * "example-library.org" (D-410: "Link makes sense to show") — and at the end
 * who sent it over when (D-410: "From who and when also makes sense"). Pam still tells formats apart underneath:
 * the preview's icon and colour, and what it accepts (D-408).
 *
 * A photo opens the viewer, paging through every photo; a document downloads
 * with the person's sign-in, as in the conversation; a Google Doc or a link
 * opens in a new tab. Link previews come from Pam's server (`link-preview`,
 * 0081): asked for when a link is sent, and here for any older link that has
 * none yet. The same 200 messages and rules as the conversation (`useThread`).
 */
const styles = stylex.create({
  list: { width: '100%' },
  // The policy row (MenuList): 64px, an 18px name, a 14px grey line.
  row: { minHeight: '64px' },
  lastRow: { borderBlockEndWidth: '0px' },
  name: { fontSize: '18px', lineHeight: 1.35 },
  what: {
    fontSize: '14px',
    lineHeight: 1.35,
    display: 'block',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    minWidth: 0,
  },
  // Who over when, tucked at the end where the chevron was.
  end: { alignItems: 'flex-end', flexShrink: 0, maxWidth: '96px' },
  endLine: { fontSize: '14px', lineHeight: 1.35, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '96px' },
  preview: { width: '48px', height: '48px', borderRadius: '10px', flexShrink: 0, overflow: 'hidden' },
  tile: { alignItems: 'center', justifyContent: 'center' },
  glyph: { fontSize: '28px', lineHeight: 1 },
  red: { backgroundColor: colorVars['--color-background-red'], color: colorVars['--color-icon-red'] },
  blue: { backgroundColor: colorVars['--color-background-blue'], color: 'var(--pam-document-blue)' },
  green: { backgroundColor: colorVars['--color-background-green'], color: colorVars['--color-icon-green'] },
  grey: { backgroundColor: colorVars['--color-background-gray'], color: colorVars['--color-icon-secondary'] },
  inherit: { font: 'inherit', color: 'inherit' },
  empty: { fontSize: '18px', lineHeight: 1.5 },
});

function isExample(id: string) {
  return id.startsWith('dummy-conv-');
}

type Shared =
  | { readonly kind: 'photo'; readonly message: ThreadMessage }
  | { readonly kind: 'file'; readonly message: ThreadMessage; readonly file: MessageFile }
  | { readonly kind: 'google'; readonly message: ThreadMessage; readonly url: string; readonly google: GoogleLinkKind }
  | { readonly kind: 'link'; readonly message: ThreadMessage; readonly url: URL };

const GOOGLE_TITLE: Record<GoogleLinkKind, string> = {
  doc: 'messages.google.doc',
  sheet: 'messages.google.sheet',
  slides: 'messages.google.slides',
  form: 'messages.google.form',
  drive: 'messages.google.drive',
};

function sharedIn(messages: readonly ThreadMessage[]): Shared[] {
  return messages.flatMap((m): Shared[] => {
    if (m.photoUrl) return [{ kind: 'photo', message: m }];
    if (m.file) return [{ kind: 'file', message: m, file: m.file }];
    const google = googleLinkIn(m.body);
    if (google) return [{ kind: 'google', message: m, url: google.url, google: google.kind }];
    const link = sharedLinkIn(m.body);
    return link ? [{ kind: 'link', message: m, url: link }] : [];
  });
}

function Tile({ tint, children }: { readonly tint: StyleXStyles; readonly children: ReactNode }) {
  return (
    <HStack aria-hidden xstyle={[styles.preview, styles.tile, tint]}>
      <Text xstyle={styles.glyph}>{children}</Text>
    </HStack>
  );
}

function Preview({ item, image }: { readonly item: Shared; readonly image: string | null }) {
  if (item.kind === 'photo' || (item.kind === 'link' && image)) {
    return (
      <HStack aria-hidden xstyle={styles.preview}>
        <Thumbnail src={item.kind === 'photo' ? item.message.photoUrl! : image!} xstyle={styles.preview} />
      </HStack>
    );
  }
  if (item.kind === 'file') {
    return messageFileKind(item.file.name) === 'pdf' ? (
      <Tile tint={styles.red}>
        <PdfIcon />
      </Tile>
    ) : (
      <Tile tint={styles.blue}>
        <DocumentIcon />
      </Tile>
    );
  }
  if (item.kind === 'google') {
    return (
      <Tile tint={item.google === 'sheet' ? styles.green : styles.blue}>
        <DocumentIcon />
      </Tile>
    );
  }
  return (
    <Tile tint={styles.grey}>
      <GlobeIcon />
    </Tile>
  );
}

function ThreadFiles() {
  const { t, tPlain, locale } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const example = isExample(id);
  const { state: session } = useSession();
  const { state } = useThread(!example && session.status === 'signed-in' ? id : null);
  const [viewing, setViewing] = useState<number | null>(null);
  const [previews, setPreviews] = useState<Record<string, LinkPreview>>({});
  const [images, setImages] = useState<Record<string, string>>({});
  const [opening, setOpening] = useState<Record<string, 'opening' | 'failed'>>({});
  const fetched = useRef<Record<string, string>>({});
  const asked = useRef(false);

  // Newest first.
  const messages: readonly ThreadMessage[] = state.status === 'ready' ? [...state.messages].reverse() : [];
  const otherName = state.status === 'ready' ? (state.otherName ?? t('messages.thread.someone')) : '';
  const shared = sharedIn(messages);
  const photos = shared.filter((s) => s.kind === 'photo');
  const linkIds = shared.filter((s) => s.kind === 'link').map((s) => s.message.id);

  // Link previews: read what is kept; ask Pam's server once for any link
  // that has none yet, then read again.
  const ready = state.status === 'ready';
  const linkKey = linkIds.join(',');
  useEffect(() => {
    if (!ready || !id || example || linkIds.length === 0) return;
    let live = true;
    const read = async () => {
      const kept = await loadLinkPreviews(id);
      if (!live) return kept;
      setPreviews(kept);
      const paths = Object.values(kept)
        .map((p) => p.imagePath)
        .filter((p): p is string => p !== null && !fetched.current[p]);
      if (paths.length > 0) {
        const loaded = await loadPreviewImages(paths);
        fetched.current = { ...fetched.current, ...loaded };
        if (live) setImages({ ...fetched.current });
      }
      return kept;
    };
    void (async () => {
      const kept = await read();
      if (asked.current) return;
      asked.current = true;
      const missing = messages
        .filter((m) => linkIds.includes(m.id) && !kept[m.id] && wantsPreview(m.body))
        .map((m) => m.id);
      if (missing.length > 0 && (await requestLinkPreviews(missing)) > 0 && live) await read();
    })();
    return () => {
      live = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, id, example, linkKey]);

  const at = (m: ThreadMessage) => new Date(m.createdAt);
  const time = (d: Date) => new Intl.DateTimeFormat(locale, { hour: 'numeric', minute: '2-digit' }).format(d);
  const day = (d: Date) =>
    new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', ...(d.getFullYear() !== new Date().getFullYear() ? { year: 'numeric' } : {}) }).format(d);
  /** At the end of the row: the time today, "Yesterday", or the day. */
  const when = (m: ThreadMessage) => {
    const d = at(m);
    const today = new Date();
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    if (d.toDateString() === today.toDateString()) return time(d);
    if (d.toDateString() === yesterday.toDateString()) return t('when.yesterday');
    return day(d);
  };
  const who = (m: ThreadMessage) => (m.mine ? t('messages.thread.you') : otherName);

  const titleOf = (item: Shared): string => {
    if (item.kind === 'photo') return item.message.body?.trim() || t('messages.files.photo');
    if (item.kind === 'file') return item.file.name;
    if (item.kind === 'google') return t(GOOGLE_TITLE[item.google]);
    return previews[item.message.id]?.title ?? shortLink(item.url);
  };
  const whatOf = (item: Shared): string | null => {
    if (item.kind === 'photo') return item.message.body?.trim() ? t('messages.files.photo') : null;
    if (item.kind === 'file') {
      const state = opening[item.message.id];
      if (state === 'opening') return t('messages.file.opening');
      if (state === 'failed') return t('messages.file.failed');
      return t('messages.file.document');
    }
    // A Google Doc, Sheet or Slides is, to the person, a document.
    if (item.kind === 'google') return t('messages.file.document');
    // A link shows where it goes (Will, D-410: "Link makes sense to show"):
    // its real address, never the name the page gives itself, which can be
    // anything. With no preview the address is already the name above, so
    // this just says it is a link.
    return previews[item.message.id]?.title ? item.url.hostname.replace(/^www\./, '') : t('messages.files.link');
  };

  const openFile = async (item: Extract<Shared, { kind: 'file' }>) => {
    const key = item.message.id;
    if (opening[key] === 'opening') return;
    setOpening((o) => ({ ...o, [key]: 'opening' }));
    const url = await loadMessageFile(item.file.path);
    if (!url) {
      setOpening((o) => ({ ...o, [key]: 'failed' }));
      return;
    }
    setOpening((o) => {
      const next = { ...o };
      delete next[key];
      return next;
    });
    handOver(url, item.file.name);
  };

  const loading = !example && (state.status === 'loading' || session.status === 'loading');

  return (
    <SubPage
      title={t('messages.files.title')}
      backHref={`/messages/thread/options/?id=${encodeURIComponent(id)}`}
      backLabel={t('nav.back.options')}
    >
      {loading ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : shared.length === 0 ? (
        <Text type="supporting" xstyle={styles.empty}>
          {t('messages.files.empty')}
        </Text>
      ) : (
        <List aria-label={t('messages.files.title')} hasDividers xstyle={styles.list}>
          {shared.map((item, index) => {
            const what = whatOf(item);
            const sentBy = tPlain('messages.files.sentBy', { who: who(item.message), when: `${day(at(item.message))}, ${time(at(item.message))}` });
            const image = item.kind === 'link' ? (images[previews[item.message.id]?.imagePath ?? ''] ?? null) : null;
            const action =
              item.kind === 'photo'
                ? { onClick: () => setViewing(photos.indexOf(item)) }
                : item.kind === 'file'
                  ? { onClick: () => void openFile(item) }
                  : { href: item.kind === 'google' ? item.url : item.url.toString(), target: '_blank', rel: 'noreferrer' };
            return (
              <ListItem
                key={item.message.id}
                {...action}
                startContent={<Preview item={item} image={image} />}
                label={
                  <MarqueeText xstyle={styles.name} delay={500 + (index % 6) * 350}>
                    {titleOf(item)}
                  </MarqueeText>
                }
                description={
                  // Eyes read what it is here and who/when at the end; a
                  // screen reader hears one sentence: "PDF · 180 kB, Sent by …".
                  <Text type="supporting" xstyle={styles.what}>
                    {what ? (
                      <Text as="span" aria-hidden xstyle={styles.inherit}>
                        {what}
                      </Text>
                    ) : null}
                    <VisuallyHidden>{[what, sentBy].filter(Boolean).join(', ')}</VisuallyHidden>
                  </Text>
                }
                endContent={
                  <VStack gap={0.5} aria-hidden xstyle={styles.end}>
                    <Text type="supporting" xstyle={styles.endLine}>
                      {who(item.message)}
                    </Text>
                    <Text type="supporting" xstyle={styles.endLine}>
                      {when(item.message)}
                    </Text>
                  </VStack>
                }
                xstyle={[styles.row, index === shared.length - 1 && styles.lastRow]}
              />
            );
          })}
        </List>
      )}
      <PhotoViewer
        media={
          viewing === null
            ? null
            : photos.map((p) => ({
                src: p.message.photoUrl!,
                alt: p.message.mine ? tPlain('messages.thread.photo.yours') : tPlain('messages.thread.photo.theirs', { name: otherName }),
              }))
        }
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
