'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * The words of a message, in the reader's language, labelled as such (Will,
 * 9 October, D-423 — Uber's way): the translation, then under it "Translated"
 * and a link that shows what was actually written. Tap it and the original
 * replaces the translation, labelled "Original", with the way back.
 *
 * The original is never hidden for good, and never mistaken for the
 * translation: the label always says which one is on screen. It is marked
 * with the language it was written in (`lang`), and set in its own direction
 * (`dir="auto"`), so an Arabic message read in an English screen reads from
 * the right and a screen reader pronounces it as Arabic.
 *
 * Only ever given to a message somebody else wrote; your own words are shown
 * as you wrote them.
 */
export interface MessageTranslation {
  /** The words in the reader's language. */
  readonly body: string;
  /** The language the message was written in, as a BCP 47 tag ('und' when it could not be told). */
  readonly from: string;
}

const styles = stylex.create({
  // The same type as the message itself (ThreadView sets it at 16px).
  words: { fontSize: '16px', lineHeight: 1.4, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere' },
  tag: { fontSize: '14px' },
  row: { rowGap: '0px', columnGap: '8px' },
});

export function TranslatedBody({
  original,
  translation,
  captionStyle,
}: {
  readonly original: string;
  readonly translation: MessageTranslation;
  /** Extra look for the words when the message has a photo or a document above them. */
  readonly captionStyle?: stylex.StyleXStyles;
}) {
  const { t } = useI18n();
  const [isOriginal, setIsOriginal] = useState(false);
  const lang = translation.from === 'und' ? undefined : translation.from;

  return (
    <VStack gap={0}>
      {isOriginal ? (
        <span lang={lang} dir="auto">
          <Text xstyle={[styles.words, captionStyle]}>{original}</Text>
        </span>
      ) : (
        <Text xstyle={[styles.words, captionStyle]}>{translation.body}</Text>
      )}
      <HStack align="center" wrap="wrap" xstyle={styles.row}>
        <Text type="supporting" xstyle={styles.tag}>
          {isOriginal ? t('messages.translated.original') : t('messages.translated.label')}
          {' · '}
        </Text>
        <TextLink
          size="quiet"
          label={isOriginal ? t('messages.translated.showTranslation') : t('messages.translated.showOriginal')}
          onClick={() => setIsOriginal((now) => !now)}
        />
      </HStack>
    </VStack>
  );
}
