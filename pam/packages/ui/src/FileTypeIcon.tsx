import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { DocumentIcon, PdfIcon } from './icons.js';
import { pam } from './tokens.stylex.js';

/**
 * A document's icon in a conversation, in its own colour (D-399, D-401): a
 * PDF in red, with its letters; a Word file or a Google Doc as a page in the
 * bright blue of a Google Doc (Will, 9 October: "Document Icon should be
 * bright blue like a google doc color"). 32px, decoration only — the card it
 * sits in says what the file is in words.
 */
export type FileTypeIconKind = 'pdf' | 'word' | 'google';

const styles = stylex.create({
  icon: { fontSize: '32px', lineHeight: 1, flexShrink: 0 },
  pdf: { color: colorVars['--color-icon-red'] },
  document: { color: pam['--pam-document-blue'] },
});

export function FileTypeIcon({ kind }: { readonly kind: FileTypeIconKind }) {
  const Glyph = kind === 'pdf' ? PdfIcon : DocumentIcon;
  return (
    <Text aria-hidden xstyle={[styles.icon, kind === 'pdf' ? styles.pdf : styles.document]}>
      <Glyph />
    </Text>
  );
}
