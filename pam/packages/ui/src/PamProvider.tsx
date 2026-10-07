'use client';

import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { pamTheme } from './theme/pam.js';
import { MotionProvider } from './motion.js';

/**
 * Everything a Pam component needs around it to look and move like Pam, and
 * nothing it does not: the Astryx theme (colour, type, radii — and the
 * `data-astryx-theme="pam"` scope the theme's CSS hangs on) and the motion
 * runtime (which stays off on 2G and Data Saver).
 *
 * Wrap anything you render outside the app in it — a Storybook story, a page
 * in a design tool, a test. The app's own `Providers` adds the rest (session,
 * language, the alert banner) on top.
 *
 *     <PamProvider mode="light"><BigButton label="Plan a trip" /></PamProvider>
 */
export function PamProvider({
  children,
  mode,
}: {
  readonly children: ReactNode;
  /** Light or dark. Leave unset to follow the device. */
  readonly mode?: 'light' | 'dark';
}) {
  return (
    <Theme theme={pamTheme} {...(mode ? { mode } : {})}>
      <MotionProvider>{children}</MotionProvider>
    </Theme>
  );
}
