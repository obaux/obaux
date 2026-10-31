'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { MetadataList, MetadataListItem } from '@astryxdesign/core/MetadataList';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { PlacesIcon } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { GAP_DETAILS, useProgramGaps } from '@/lib/useProgramGaps';

/**
 * The super admin's Home: how many programs Pam lists, and how many have a phone, a website, an address and real hours, each
 * over the places that need it (D-623; Will, 31 October: "visibility on how many programs exist total"). Parks & Rec need only
 * an address (D-622), which is why the phone, website and hours counts are over fewer places; the card says so. Then one row,
 * Missing information, with how many places lack something; it opens the list. The card shows once the counts are in: Home
 * does not wait on it, and if it cannot load, the list's own page says so and offers Try again.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  card: { width: '100%' },
  title: { fontSize: '20px', lineHeight: 1.3 },
  value: { fontSize: '17px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
  note: { fontSize: '15px', lineHeight: 1.4, color: colorVars['--color-text-secondary'] },
});

export function ProgramStats() {
  const { t } = useI18n();
  const gaps = useProgramGaps(true, false);

  return (
    <VStack gap={3}>
      {gaps.status === 'ready' ? (
        <Card padding={6} xstyle={styles.card}>
          <VStack gap={3}>
            <Heading level={2} xstyle={styles.title}>
              {t('programStats.title')}
            </Heading>
            <MetadataList>
              <MetadataListItem label={t('programStats.listed')}>
                <Text xstyle={styles.value}>{String(gaps.counts.total)}</Text>
              </MetadataListItem>
              {GAP_DETAILS.map((detail) => (
                <MetadataListItem key={detail} label={t(`programStats.${detail}`)}>
                  <Text xstyle={styles.value}>
                    {t('programStats.ofNeeded', {
                      have: String(gaps.counts.details[detail].have),
                      need: String(gaps.counts.details[detail].need),
                    })}
                  </Text>
                </MetadataListItem>
              ))}
            </MetadataList>
            <Text xstyle={styles.note}>{t('programStats.parksNote')}</Text>
          </VStack>
        </Card>
      ) : null}
      <MenuList
        label={t('missingInfo.title')}
        items={[
          {
            id: 'missing-info',
            label: t('missingInfo.title'),
            href: '/places/missing/?from=home',
            icon: <PlacesIcon {...ICON} />,
            // A plain number (D-586), like the team's other rows.
            ...(gaps.status === 'ready' && gaps.counts.missing > 0 ? { value: String(gaps.counts.missing) } : {}),
          },
        ]}
      />
    </VStack>
  );
}
