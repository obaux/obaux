'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * Privacy and Terms at the foot of the way in (Will, 3 October, D-251): the three links somebody is
 * entitled to read before handing over a number. Passed to `Page` as its `footer` with `isFooterInFlow`, so on a tall
 * screen they sit at the bottom edge as they always did, and on a short one they follow the content.
 *
 * They were `position: fixed` (D-251) with a spacer under the content; on a 320×568 phone the bar stood over "Send
 * me a code" and a tap on the button opened Privacy or Terms instead (Iris's member pass, S1; D-500). Nothing is
 * pinned now, so nothing can cover the button at any height or in any language. Still 48px targets (they are
 * `TextLink`s): a rule nobody can tap is a rule nobody reads. `from` tells the page where Back returns (D-250).
 *
 * **The row wraps** (D-422). Three links fit side by side in English; "Конфиденциальность" and "Условия
 * использования" do not at 390px.
 */
const styles = stylex.create({
  // Rows of 48px targets sit flush: the space that matters is between links in a row.
  rows: { rowGap: '0px', columnGap: '24px' },
});

export function LegalLinks({ from }: { readonly from: 'signin' | 'join' }) {
  const { t } = useI18n();
  return (
    // Three links, well apart (Will, 6 October, D-310): each is its own tap.
    <HStack justify="center" wrap="wrap" xstyle={styles.rows}>
      {/* What Pam is, for somebody deciding whether to sign in (D-259). */}
      <TextLink label={t('legal.about')} href="/about/" size="quiet" />
      <TextLink label={t('legal.privacy')} href={`/privacy/?from=${from}`} size="quiet" />
      <TextLink label={t('legal.terms')} href={`/terms/?from=${from}`} size="quiet" />
    </HStack>
  );
}
