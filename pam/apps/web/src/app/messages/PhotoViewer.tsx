'use client';

import * as stylex from '@stylexjs/stylex';
import { Lightbox, type LightboxMedia } from '@astryxdesign/core/Lightbox';

/**
 * A photo from a conversation, full screen (D-394), on Astryx's `Lightbox`.
 *
 * Near-black behind the photo (Will, 9 October, D-401: "make background extra
 * dark overlay so photo stands out") — the dialog itself is painted over
 * Astryx's half-black backdrop, whatever the phone's mode. Its round buttons
 * (close, and previous / next in a gallery) are Pam's circle buttons for a
 * dark ground: 48px, dark grey with a lighter rim, a larger, heavier white
 * mark. Lightbox has no prop for its buttons, so that is one rule in
 * `globals.css`, scoped to `.astryx-lightbox`.
 *
 * One viewer for a conversation, the report screen and the photos page.
 */
const styles = stylex.create({
  dark: { backgroundColor: 'var(--pam-viewer-backdrop)' },
});

export function PhotoViewer({
  media,
  index,
  onIndexChange,
  onClose,
}: {
  /** One photo, or several to page through; null when closed. */
  readonly media: LightboxMedia | readonly LightboxMedia[] | null;
  readonly index?: number;
  readonly onIndexChange?: (index: number) => void;
  readonly onClose: () => void;
}) {
  const items = media ?? { src: '', alt: '' };
  return (
    <Lightbox
      isOpen={media !== null}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
      media={Array.isArray(items) ? [...items] : (items as LightboxMedia)}
      {...(index !== undefined ? { index } : {})}
      {...(onIndexChange ? { onIndexChange } : {})}
      hasZoom
      xstyle={styles.dark}
    />
  );
}
