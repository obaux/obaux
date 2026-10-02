'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { HelpIcon } from '@pam/ui';
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
 * Help, as a round button in a screen's top bar (D-210, D-217) — the one
 * shape a way to get help takes on the redesign: beside the bell on a tab
 * screen, in the template's action slot on a screen you tap into. It
 * replaces the old full-width Help bar at the foot of a page.
 */
export function HelpButton() {
  const { t } = useI18n();
  return (
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
  );
}
