'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { useI18n } from '@/lib/i18n';
import { isVerified, signedBy, usePolicies } from '@/lib/usePolicies';

/**
 * Verified (Will, 4 October, D-261): a small tick beside a member's name,
 * in a program's own views, when they have signed every one of the
 * program's policies. Tapping it says which. Kept small — it is a detail,
 * not a status — but still a 48px target around a small mark. Shown for
 * nobody who has not signed everything; a half-signed person has no mark,
 * not a half one.
 */
const styles = stylex.create({
  button: {
    width: '40px',
    height: '40px',
    minHeight: '40px',
    marginBlock: '-4px',
    flexShrink: 0,
    color: colorVars['--color-icon-accent'],
  },
  card: { maxWidth: '280px', padding: '16px' },
  title: { fontSize: '17px', fontWeight: 700 },
  item: { fontSize: '16px', lineHeight: 1.45 },
});

export function VerifiedBadge({ personId, name }: { readonly personId: string; readonly name: string }) {
  const { t } = useI18n();
  const { policies } = usePolicies();
  if (!isVerified(personId, policies)) return null;
  return (
    <Popover
      placement="below"
      alignment="start"
      content={
        <VStack gap={1} xstyle={styles.card}>
          <Text xstyle={styles.title}>{t('verified.title', { name })}</Text>
          {signedBy(personId, policies).map((p) => (
            <HStack key={p.id} gap={2} align="center" wrap="nowrap">
              <Icon icon="check" size="sm" />
              <Text xstyle={styles.item}>{p.title}</Text>
            </HStack>
          ))}
        </VStack>
      }
    >
      <IconButton
        label={t('verified.label', { name })}
        variant="ghost"
        icon={<Icon icon="success" size="sm" />}
        xstyle={styles.button}
      />
    </Popover>
  );
}
