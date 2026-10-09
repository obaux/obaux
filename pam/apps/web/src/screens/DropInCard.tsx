'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { nextDropIn, type DropInSchedule } from '@pam/config/dummy-booking';
import { ClockIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { intlLocale } from '@pam/config';

/**
 * When a drop-in program meets (D-313, Will: "some programs won't have a
 * booking thing, only day/time, and show up at that time, either weekly,
 * bi weekly, or monthly"). In place of the services and Plan a trip: the
 * rhythm in one line — "Every Tuesday · 4:00 PM" — the next date, and
 * that there is nothing to book.
 */
const styles = stylex.create({
  card: { width: '100%' },
  icon: { flexShrink: 0, color: colorVars['--color-text-accent'] },
  title: { fontSize: '15px', fontWeight: 600 },
  when: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
  next: { fontSize: '16px', lineHeight: 1.4 },
  body: { fontSize: '16px', lineHeight: 1.5 },
});

export function DropInCard({ schedule }: { readonly schedule: DropInSchedule }) {
  const { t, locale } = useI18n();
  const next = nextDropIn(schedule);
  const day = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long' }).format(next);
  const time = new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' }).format(next);
  const date = new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'long', month: 'long', day: 'numeric' }).format(next);
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={2}>
        <HStack gap={2} align="center" wrap="nowrap">
          <ClockIcon width={22} height={22} aria-hidden {...stylex.props(styles.icon)} />
          <Text xstyle={styles.title}>{t('place.dropin.title')}</Text>
        </HStack>
        <Text xstyle={styles.when}>{t(`place.dropin.${schedule.cadence}`, { day, time })}</Text>
        <Text type="supporting" xstyle={styles.next}>
          {t('place.dropin.next', { date })}
        </Text>
        <Text xstyle={styles.body}>{t('place.dropin.body')}</Text>
      </VStack>
    </Card>
  );
}
