'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Button } from '@astryxdesign/core/Button';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from './i18n';
import type { AlertBannerInput, AlertBannerStatus } from './alertBanner';

/**
 * The actual banner render, split out of `alertBanner.tsx` and loaded with a
 * raw `import()` there — see that file's comment for why. `Banner` is the
 * heaviest thing this file used to touch; it is gone entirely now, in favour
 * of a compact composition from plain Astryx primitives (`HStack`, `Text`,
 * `IconButton`), the same move `Notice`/`AreaChip`/`PeopleStrip` already make
 * where PAM's own product needs something narrower than what the library's
 * own component draws.
 *
 * **A real block at the top of the page, not a floating overlay** (Will, 17
 * September: it "should be on top of the page, so it doesn't overlap with
 * navigation, or logo"). `AlertBannerProvider` already renders this as a
 * sibling *before* `{children}`, so a plain, non-`position:fixed` element
 * here pushes the whole page down instead of floating over it — the fixed
 * `position: fixed; top: 0` this used to carry sat above the sign-in hero
 * once that hero itself reached the true top of the screen, landing right
 * over the mark and the "Philadelphia" pill it was never supposed to cover.
 *
 * **A solid status colour, not `Banner`'s own muted tint** (Will, same day:
 * "transparent and makes it hard to read"). `Banner`'s status fills
 * (`--color-accent-muted` etc.) are deliberately translucent — right for a
 * banner sitting on a plain page background, wrong for one that can float
 * over a photo. `--color-<status>` (solid) paired with `--color-on-<status>`
 * text is the same pairing a solid `Button` uses, always legible regardless
 * of what used to be under it.
 */

const styles = stylex.create({
  host: {
    width: '100%',
    paddingBlock: '10px',
    paddingInline: '16px',
  },
  title: {
    fontSize: '15px',
    fontWeight: 600,
    lineHeight: 1.3,
  },
  description: {
    fontSize: '14px',
    lineHeight: 1.3,
  },
  // A smaller glyph than the 48px button drawing it: the touch target stays
  // at PAM's own floor (§2.5), which is what actually costs height here, but
  // the icon inside it does not have to match that size to be legible.
  dismissIcon: { fontSize: '16px' },
  // `TextLink` has no styling escape hatch (by design — see its own file
  // comment), so the action reaches for `Button` directly instead, the same
  // way this whole file reaches for primitives over a wrapper that does not
  // fit. Still the same 48px floor `TextLink` bakes in for exactly this
  // reason — `apps/web`'s own screens all state PAM's touch-target rule as
  // this literal directly rather than importing `packages/ui`'s `pam`
  // tokens into their own `stylex.create()`, which StyleX's babel plugin
  // cannot statically resolve across a workspace package boundary.
  action: { minHeight: '48px', fontSize: '14px', paddingInline: 0 },
  // The 32px `IconButton` renders at by default is well under PAM's own
  // floor — every other icon-only control in this app sets this same pair
  // explicitly (see `AppHeader`'s account button, `AreaChip`) rather than
  // trusting Astryx's own default.
  dismissButton: { minHeight: '48px', minWidth: '48px' },
});

/**
 * One static class per status rather than an inline `{backgroundColor: bg}`
 * object: `stylex.props()` only accepts compiled `stylex.create()` results,
 * and there are exactly four known statuses to enumerate, unlike a per-slide
 * image URL (see `OnboardingSlides`' own `heroBackground` for the one case
 * in this codebase where the value truly cannot be known ahead of time).
 */
const statusStyles = stylex.create({
  info: { backgroundColor: colorVars['--color-accent'], color: colorVars['--color-on-accent'] },
  success: {
    backgroundColor: colorVars['--color-success'],
    color: colorVars['--color-on-success'],
  },
  warning: {
    backgroundColor: colorVars['--color-warning'],
    color: colorVars['--color-on-warning'],
  },
  error: { backgroundColor: colorVars['--color-error'], color: colorVars['--color-on-error'] },
});

/** Just the foreground half of `statusStyles`, for children that must not also repaint the background they already sit on. */
const statusText = stylex.create({
  info: { color: colorVars['--color-on-accent'] },
  success: { color: colorVars['--color-on-success'] },
  warning: { color: colorVars['--color-on-warning'] },
  error: { color: colorVars['--color-on-error'] },
});

const roleByStatus: Record<AlertBannerStatus, 'alert' | 'status'> = {
  info: 'status',
  success: 'status',
  warning: 'alert',
  error: 'alert',
};

export interface AlertBannerHostProps {
  readonly banner: AlertBannerInput;
  readonly onDismiss: () => void;
}

export function AlertBannerHost({ banner, onDismiss }: AlertBannerHostProps) {
  const { t } = useI18n();
  const fg = statusText[banner.status];

  return (
    <div role={roleByStatus[banner.status]} {...stylex.props(styles.host, statusStyles[banner.status])}>
      <HStack gap={2} align="center" justify="between" wrap="nowrap">
        <HStack gap={1} align="center" wrap="wrap">
          <Text xstyle={[styles.title, fg]}>{banner.title}</Text>
          {banner.description ? <Text xstyle={[styles.description, fg]}>{banner.description}</Text> : null}
          {banner.actionLabel && banner.onAction ? (
            <Button
              label={banner.actionLabel}
              variant="ghost"
              onClick={banner.onAction}
              xstyle={[styles.action, fg]}
            />
          ) : null}
        </HStack>
        <IconButton
          label={t('common.dismiss')}
          icon={<Icon icon="close" xstyle={styles.dismissIcon} color="inherit" />}
          variant="ghost"
          onClick={onDismiss}
          xstyle={[styles.dismissButton, fg]}
        />
      </HStack>
    </div>
  );
}
