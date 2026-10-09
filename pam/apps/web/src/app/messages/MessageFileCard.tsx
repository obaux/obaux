'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { ClickableCard } from '@astryxdesign/core/ClickableCard';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { FileTypeIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import {
  formatFileSize,
  handOver,
  loadMessageFile,
  messageFileKind,
  type GoogleLinkKind,
  type MessageFile,
} from '@/lib/messageFile';

/**
 * Documents and Google links in a conversation (D-399).
 *
 * A document shows what it is before anybody spends data on it: its icon
 * (`FileTypeIcon`: a red PDF, or a page in Google-Doc blue for Word and for
 * a Google link — D-401), its name in full (two lines before it is
 * cut), and "PDF · 240 kB". Tapping it downloads it with the person's own
 * sign-in and hands it to the phone under its own name — opened in the
 * phone's viewer, or saved for the app that opens Word files. Once fetched
 * it is kept for the visit, so a second tap does not download it again.
 *
 * A Google Doc is a link. The words of the message keep the link as it was
 * sent; under them, a card names what it is — "Google Doc", "Google Sheet" —
 * and opens it in Google, in a new tab. Who can open the doc is set in
 * Google, not in Pam, and the card says it opens in Google so nobody is
 * surprised to leave.
 */
const styles = stylex.create({
  card: { width: '100%', maxWidth: '300px', borderRadius: '14px' },
  text: { minWidth: 0, flexGrow: 1 },
  name: {
    fontSize: '16px',
    lineHeight: 1.3,
    fontWeight: 600,
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  },
  meta: { fontSize: '14px', lineHeight: 1.3 },
});

/** The icon, name, and "PDF · 240 kB" — what every document card shows. */
export function FileSummary({
  name,
  bytes,
  note,
}: {
  readonly name: string;
  readonly bytes: number;
  readonly note?: string;
}) {
  const { t, locale } = useI18n();
  const kind = messageFileKind(name);
  const meta = t('messages.file.meta', {
    kind: t(kind === 'pdf' ? 'messages.file.kind.pdf' : 'messages.file.kind.word'),
    size: formatFileSize(bytes, locale),
  });
  return (
    <HStack gap={3} align="center">
      <FileTypeIcon kind={kind} />
      <VStack gap={0.5} xstyle={styles.text}>
        <Text xstyle={styles.name}>{name}</Text>
        <Text type="supporting" xstyle={styles.meta}>
          {note ?? meta}
        </Text>
      </VStack>
    </HStack>
  );
}

/**
 * A document in a message, opened when tapped. `localUrl` is for one that is
 * already on this phone (just sent, or the example conversation's), which
 * needs no download.
 */
export function MessageFileCard({
  file,
  localUrl = null,
}: {
  readonly file: MessageFile;
  readonly localUrl?: string | null;
}) {
  const { t, locale } = useI18n();
  const [fetched, setFetched] = useState<string | null>(localUrl);
  const [state, setState] = useState<'idle' | 'opening' | 'failed'>('idle');
  const kind = messageFileKind(file.name);

  const open = async () => {
    if (state === 'opening') return;
    let url = fetched;
    if (!url) {
      setState('opening');
      url = await loadMessageFile(file.path);
      if (!url) {
        setState('failed');
        return;
      }
      setFetched(url);
    }
    setState('idle');
    handOver(url, file.name);
  };

  return (
    <ClickableCard
      label={t('messages.file.open', {
        name: file.name,
        kind: t(kind === 'pdf' ? 'messages.file.kind.pdf' : 'messages.file.kind.word'),
        size: formatFileSize(file.bytes, locale),
      })}
      onClick={() => void open()}
      padding={3}
      xstyle={styles.card}
    >
      <FileSummary
        name={file.name}
        bytes={file.bytes}
        {...(state === 'opening'
          ? { note: t('messages.file.opening') }
          : state === 'failed'
            ? { note: t('messages.file.failed') }
            : {})}
      />
    </ClickableCard>
  );
}

const GOOGLE_TITLE: Record<GoogleLinkKind, string> = {
  doc: 'messages.google.doc',
  sheet: 'messages.google.sheet',
  slides: 'messages.google.slides',
  form: 'messages.google.form',
  drive: 'messages.google.drive',
};

/** A Google Docs, Sheets, Slides, Forms or Drive link, as a card that opens it in Google. */
export function GoogleLinkCard({
  url,
  kind,
}: {
  readonly url: string;
  readonly kind: GoogleLinkKind;
}) {
  const { t } = useI18n();
  const title = t(GOOGLE_TITLE[kind]);
  return (
    <ClickableCard
      label={t('messages.google.open', { what: title })}
      href={url}
      target="_blank"
      padding={3}
      xstyle={styles.card}
    >
      <HStack gap={3} align="center">
        <FileTypeIcon kind="google" />
        <VStack gap={0.5} xstyle={styles.text}>
          <Text xstyle={styles.name}>{title}</Text>
          <Text type="supporting" xstyle={styles.meta}>
            {t('messages.google.opens')}
          </Text>
        </VStack>
      </HStack>
    </ClickableCard>
  );
}
