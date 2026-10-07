'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { InfoTip, SignIcon } from '@pam/ui';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from '@/lib/i18n';
import { isVerified, signedBy, usePolicies } from '@/lib/usePolicies';

/**
 * Verified (Will, 4 October, D-261): a small tick beside a member's name,
 * in a program's own views, when they have signed every one of the
 * program's policies. Tapping it says which. Kept small — it is a detail,
 * not a status — an info tip (D-368), 36px around the small mark. Shown for
 * nobody who has not signed everything; a half-signed person has no mark,
 * not a half one.
 */
const styles = stylex.create({
  // The one mark for "signed every policy" (D-316, D-324): a light-green
  // circle with the signing pen, the same beside a name on Home and here.
  mark: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-success-muted'],
    color: colorVars['--color-success'],
  },
  markIcon: { width: '14px', height: '14px' },
  // Each signed policy (Will, 7 October, D-369): a tick in the mark's own
  // light-green circle, so the list reads as done at a glance.
  tick: {
    width: '22px',
    height: '22px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-success-muted'],
    color: colorVars['--color-success'],
  },
  title: { fontSize: '17px', fontWeight: 700 },
  item: { fontSize: '16px', lineHeight: 1.45 },
});

export function VerifiedBadge({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t } = useI18n();
  const { policies } = usePolicies();
  if (!isVerified(personId, policies)) return null;
  return (
    // An info tip (D-368): 36px, a true circle, the popover with room.
    <InfoTip
      label={t('verified.label', { name })}
      icon={<SignedMark />}
      content={
        <>
          <Text xstyle={styles.title}>{t('verified.title', { name })}</Text>
          {signedBy(personId, policies).map((p) => (
            <HStack key={p.id} gap={2} align="center" wrap="nowrap">
              <HStack align="center" justify="center" xstyle={styles.tick} aria-hidden>
                <Icon icon="check" size="sm" />
              </HStack>
              <Text xstyle={styles.item}>{p.title}</Text>
            </HStack>
          ))}
        </>
      }
    />
  );
}

/** The light-green pen on its own — decorative; the caller names it. */
export function SignedMark() {
  return (
    <HStack align="center" justify="center" xstyle={styles.mark} aria-hidden>
      <SignIcon {...stylex.props(styles.markIcon)} aria-hidden />
    </HStack>
  );
}
