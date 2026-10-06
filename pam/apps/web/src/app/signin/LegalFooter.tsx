'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * Privacy and Terms at the foot of the way in (Will, 3 October, D-251):
 * pinned to the bottom of the screen whatever its height, so the two pages
 * somebody is entitled to read before handing over a number are always in
 * view rather than wherever the content happens to end.
 *
 * Still 48px targets (they are `TextLink`s), because a rule nobody can tap
 * is a rule nobody reads. `from` tells the page where Back returns (D-250).
 * The spacer keeps the end of the screen's own content clear of the bar.
 *
 * Render it **after** `Page`, not inside it: the page's entrance animation
 * sets a transform, and a fixed element inside a transformed one is fixed to
 * that element, not to the screen.
 */
const styles = stylex.create({
  bar: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: 5,
    paddingBottom: 'env(safe-area-inset-bottom)',
    backgroundColor: colorVars['--color-background-body'],
  },
  spacer: { height: '56px', flexShrink: 0 },
});

export function LegalFooter({ from }: { readonly from: 'signin' | 'join' }) {
  const { t } = useI18n();
  return (
    <>
      <VStack aria-hidden xstyle={styles.spacer} />
      {/* Three links, well apart (Will, 6 October, D-310): each is its own tap. */}
      <HStack gap={6} justify="center" wrap="nowrap" xstyle={styles.bar}>
        {/* What Pam is, for somebody deciding whether to sign in (D-259). */}
        <TextLink label={t('legal.about')} href="/about/" size="quiet" />
        <TextLink label={t('legal.privacy')} href={`/privacy/?from=${from}`} size="quiet" />
        <TextLink label={t('legal.terms')} href={`/terms/?from=${from}`} size="quiet" />
      </HStack>
    </>
  );
}
