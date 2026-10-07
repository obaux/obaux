'use client';

import { useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { PdfIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * Adding a policy, as one card (D-348, D-317: "the uploader as a full card
 * with a PDF icon, modern styling").
 *
 * The drop area people know from every upload today: a dashed edge, a big
 * document in the middle, one line saying what to add, and one button. On a
 * phone the button opens the file picker (a PDF, or a photo of each page);
 * on a computer a file can be dragged onto the card too, which lights up
 * while one is over it. The file picker itself is never seen.
 */
export interface PolicyUploadCardProps {
  /** "Add a policy". */
  readonly title: string;
  /** "A PDF, or a photo of each page." */
  readonly hint: string;
  /** "Choose files". */
  readonly buttonLabel: string;
  /** Any files picked or dropped. */
  readonly onFiles: (files: File[]) => void;
  /** What the picker accepts. */
  readonly accept?: string;
}

const styles = stylex.create({
  card: {
    width: '100%',
    paddingBlock: '28px',
    paddingInline: '20px',
    borderRadius: '24px',
    borderWidth: '2px',
    borderStyle: 'dashed',
    borderColor: colorVars['--color-border'],
    backgroundColor: colorVars['--color-background-card'],
    alignItems: 'center',
    textAlign: 'center',
    transitionProperty: 'border-color, background-color',
    transitionDuration: '150ms',
  },
  over: {
    borderColor: colorVars['--color-text-accent'],
    backgroundColor: pam['--pam-secondary-fill'],
  },
  art: {
    width: '72px',
    height: '72px',
    borderRadius: '50%',
    backgroundColor: pam['--pam-secondary-fill'],
    color: colorVars['--color-text-accent'],
  },
  title: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  hint: { fontSize: '16px', lineHeight: 1.45, maxWidth: '280px' },
  button: { minHeight: pam['--pam-touch-target-min'], paddingInline: '24px', fontSize: '17px' },
  fileInput: { position: 'absolute', width: '1px', height: '1px', opacity: 0, pointerEvents: 'none' },
});

export function PolicyUploadCard({ title, hint, buttonLabel, onFiles, accept = '.pdf,image/*' }: PolicyUploadCardProps) {
  const picker = useRef<HTMLInputElement>(null);
  const [isOver, setIsOver] = useState(false);
  const take = (list: FileList | null | undefined) => {
    const files = list ? Array.from(list) : [];
    if (files.length > 0) onFiles(files);
  };

  return (
    <VStack
      gap={3}
      xstyle={[styles.card, isOver && styles.over]}
      onDragOver={(event: React.DragEvent) => {
        event.preventDefault();
        setIsOver(true);
      }}
      onDragLeave={() => setIsOver(false)}
      onDrop={(event: React.DragEvent) => {
        event.preventDefault();
        setIsOver(false);
        take(event.dataTransfer?.files);
      }}
    >
      <HStack align="center" justify="center" xstyle={styles.art}>
        <PdfIcon width={36} height={36} aria-hidden />
      </HStack>
      <VStack gap={1} align="center">
        <Heading level={2} xstyle={styles.title}>
          {title}
        </Heading>
        <Text type="supporting" xstyle={styles.hint}>
          {hint}
        </Text>
      </VStack>
      <Button label={buttonLabel} variant="secondary" onClick={() => picker.current?.click()} xstyle={styles.button} />
      <input
        ref={picker}
        type="file"
        accept={accept}
        multiple
        tabIndex={-1}
        aria-hidden
        onChange={(event) => {
          take(event.target.files);
          event.target.value = '';
        }}
        {...stylex.props(styles.fileInput)}
      />
    </VStack>
  );
}
