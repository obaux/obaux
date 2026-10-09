'use client';

import { useLayoutEffect, useRef } from 'react';
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
 *
 * It opens on the photo, not on ×: the browser puts focus on the first
 * button, and a phone draws that button as chosen (Will, 9 October, D-411).
 * So once Lightbox has opened, focus moves to the viewer itself — in a
 * layout effect, before anything is painted, so × never shows as chosen.
 * Escape and the arrow keys work from there; Tab reaches ×. (`autofocus` on
 * the dialog would say the same, but Chromium ignores it there.)
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
  const viewer = useRef<HTMLDialogElement>(null);
  const isOpen = media !== null;
  // After Lightbox's own layout effect (children's run first) has called
  // showModal(), which focused ×.
  useLayoutEffect(() => {
    if (isOpen) viewer.current?.focus({ preventScroll: true });
  }, [isOpen]);
  return (
    <Lightbox
      ref={viewer}
      tabIndex={-1}
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
