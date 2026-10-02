'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { HelpIcon } from '@pam/ui';
import type { Role } from '@pam/config';
import { HeaderBell } from '../app/HeaderBell';
import { useI18n } from '@/lib/i18n';

const styles = stylex.create({
  // White with a thin grey edge, like the bell (Will, 2 October).
  help: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
});

/**
 * The redesign's header actions: the notifications bell, then Help (D-210).
 * Help sits here on every redesigned screen — the bottom bar no longer has it.
 */
export function HeaderActions({ role = 'member', enabled = true }: { readonly role?: Role | null; readonly enabled?: boolean }) {
  const { t } = useI18n();
  return (
    <>
      <HeaderBell enabled={enabled} role={role} appearance="round" />
      <IconButton
        label={t('nav.help')}
        // Wrapped, or the button's icon slot shrinks the SVG back to 16px.
        icon={
          <HStack>
            <HelpIcon width={24} height={24} aria-hidden />
          </HStack>
        }
        variant="ghost"
        href="/help/"
        xstyle={styles.help}
      />
    </>
  );
}
