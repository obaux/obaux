'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { InfoTip, SignedDocIcon } from '@pam/ui';
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
  // The one mark for "signed every policy" (D-316, D-324; P5, D-582): a green document with a tick,
  // the same beside a name on Home and here.
  mark: { width: '24px', height: '24px', flexShrink: 0, color: colorVars['--color-success'] },
  // Each signed policy (Will, 7 October, D-369): a tick in the mark's own
  // light-green circle, so the list reads as done at a glance.
  tick: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-success-muted'],
    color: colorVars['--color-success'],
  },
  // The heading quiet, the policies strong (Will, 7 October, D-371): what
  // was signed is the news, "Jordan signed" only says whose list it is.
  title: { fontSize: '15px', fontWeight: 400, color: colorVars['--color-text-secondary'] },
  item: { fontSize: '16px', lineHeight: 1.45, fontWeight: 600 },
  // A hairline between policies, none after the last (Will, D-372).
  row: { paddingBlock: '8px' },
  ruled: {
    borderBottomWidth: '1px',
    borderBottomStyle: 'solid',
    borderBottomColor: colorVars['--color-border'],
  },
  list: { rowGap: 0 },
  tickIcon: { fontSize: '12px' },
});

export function VerifiedBadge({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t, tPlain } = useI18n();
  const { policies } = usePolicies();
  if (!isVerified(personId, policies)) return null;
  return (
    // An info tip (D-368): 36px, a true circle, the popover with room.
    <InfoTip
      label={tPlain('verified.label', { name })}
      icon={<SignedMark />}
      content={
        <>
          <Text xstyle={styles.title}>{t('verified.title', { name })}</Text>
          <VStack xstyle={styles.list}>
            {signedBy(personId, policies).map((p, i, all) => (
              <HStack
                key={p.id}
                gap={2}
                align="center"
                wrap="nowrap"
                xstyle={[styles.row, i < all.length - 1 && styles.ruled]}
              >
                <HStack align="center" justify="center" xstyle={styles.tick} aria-hidden>
                  <HStack xstyle={styles.tickIcon}>
                    <Icon icon="check" size="sm" />
                  </HStack>
                </HStack>
                <Text xstyle={styles.item}>{p.title}</Text>
              </HStack>
            ))}
          </VStack>
        </>
      }
    />
  );
}

/**
 * "Signed every policy": a document with a tick, in the success green, no circle behind it (Dot's A, decided 15 October;
 * Iris's program lead pass P5). The pen read as "edit". Nothing marks people still to sign: no mark is the mark.
 * Decorative; the caller names it.
 */
export function SignedMark() {
  return <SignedDocIcon {...stylex.props(styles.mark)} aria-hidden />;
}
