'use client';

import type { ReactNode } from 'react';
import { Theme } from '@astryxdesign/core/theme';
import { pamTheme } from '@pam/ui/theme';

/**
 * Pam's theme, applied by a provider, exactly as in the app
 * (`apps/web/src/lib/providers.tsx`): importing the three stylesheets is
 * necessary but not sufficient — `<Theme>` is what puts the theme on the page.
 * Follows the device's light/dark setting.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <Theme theme={pamTheme} mode="system">
      {children}
    </Theme>
  );
}
