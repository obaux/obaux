'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { MESSAGE_REPORT_REASONS, type Role } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { whenHappened } from '@/lib/when';

/**
 * Reported messages, as a list (D-178, D-184) — the "Reported" section of
 * Messages for a case manager or a super admin. Each card is one report:
 * excerpt, who said it, who reported it, why, when, and whether it has been
 * looked at. No link into the conversation, because there is nothing to
 * link to: `messages` still has no admin policy (D-074).
 *
 * Shared by the real list (`useReports`) and the example list
 * (`DUMMY_REPORTS`), so a preview shows exactly the real thing.
 */
export interface ReportListItem {
  readonly id: string;
  readonly reason: string | null;
  readonly excerpt: string | null;
  readonly createdAt: string;
  readonly resolvedAt: string | null;
  readonly reporterName: string | null;
  readonly reporterRole: Role;
  readonly aboutName: string | null;
  readonly aboutRole: Role | null;
}

const styles = stylex.create({
  card: { width: '100%' },
  excerpt: { fontSize: '18px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  meta: { fontSize: '16px' },
  name: { fontSize: '18px' },
});

export function ReportsList({ reports }: { readonly reports: readonly ReportListItem[] }) {
  const { t, locale } = useI18n();

  return (
    <VStack gap={3}>
      {reports.map((report) => {
        const reason =
          report.reason && (MESSAGE_REPORT_REASONS as readonly string[]).includes(report.reason)
            ? t(`messages.report.reason.${report.reason}`)
            : report.reason;
        return (
          <Card key={report.id} id={`report-${report.id}`} xstyle={styles.card}>
            <VStack gap={2}>
              <HStack gap={2} wrap="wrap" align="center">
                <Badge
                  variant={report.resolvedAt ? 'neutral' : 'warning'}
                  label={t(report.resolvedAt ? 'reports.status.resolved' : 'reports.status.open')}
                />
                <Text type="supporting" xstyle={styles.meta}>
                  {whenHappened(report.createdAt, locale, t)}
                </Text>
              </HStack>
              {report.excerpt ? <Text xstyle={styles.excerpt}>{report.excerpt}</Text> : null}
              <Heading level={3} xstyle={styles.name}>
                {t('reports.about', { name: report.aboutName ?? t('messages.thread.someone') })}
                {report.aboutRole ? ` · ${t(`role.${report.aboutRole}`)}` : ''}
              </Heading>
              <Text type="supporting" xstyle={styles.meta}>
                {t('reports.reportedBy', { name: report.reporterName ?? t('messages.thread.someone') })}
                {` · ${t(`role.${report.reporterRole}`)}`}
              </Text>
              {reason ? (
                <Text type="supporting" xstyle={styles.meta}>
                  {t('reports.reason', { reason })}
                </Text>
              ) : null}
            </VStack>
          </Card>
        );
      })}
    </VStack>
  );
}
