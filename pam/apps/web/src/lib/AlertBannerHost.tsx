'use client';

import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { TextLink } from '@pam/ui';
import type { AlertBannerInput } from './alertBanner';

/**
 * The actual banner render, split out of `alertBanner.tsx` and loaded with
 * `next/dynamic` there. `Banner` is the heaviest thing this file touches, and
 * every screen mounts `AlertBannerProvider` whether or not anything is ever
 * shown — so its weight has to be off Home's static bundle entirely, not just
 * unused most of the time. Same trade `HeaderBell` and `useSavedPlaces` make
 * for their own dummy-data paths; see those files' comments for what shipping
 * a rarely-needed static import costs on a shared screen.
 */

const styles = stylex.create({
  // Fixed, not sticky: it floats above the page rather than taking a row in
  // it. Above `AppHeader`'s own z-index, so it reads as an interruption.
  host: {
    position: 'fixed',
    insetInline: 0,
    top: 0,
    zIndex: 100,
  },
});

export interface AlertBannerHostProps {
  readonly banner: AlertBannerInput;
  readonly onDismiss: () => void;
}

export function AlertBannerHost({ banner, onDismiss }: AlertBannerHostProps) {
  return (
    <Banner
      status={banner.status}
      title={banner.title}
      description={banner.description}
      container="section"
      elevation="high"
      isDismissable
      onDismiss={onDismiss}
      endContent={
        banner.actionLabel && banner.onAction ? (
          <TextLink label={banner.actionLabel} onClick={banner.onAction} />
        ) : undefined
      }
      xstyle={styles.host}
    />
  );
}
