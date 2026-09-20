'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { AppHeader, HelpBar, Loading, Notice, Page, PageTitle, TextLink } from '@pam/ui';
import { NOTICES, MESSAGE_REPORT_REASONS } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { useReports } from '@/lib/useReports';
import { whenHappened } from '@/lib/when';

/**
 * Reported messages, and nothing else (D-178).
 *
 * This is the screen the transparency contract has promised since day one:
 * "a message only if someone says it is not safe". It lists reports —
 * `reports.target_excerpt`, who reported, who it is about, the reason, when,
 * and whether it has been looked at — and it is the only place in PAM a
 * case manager ever reads a member's words from a conversation they are
 * not in. There is no link from here into the conversation, because there
 * is nothing to link to: `messages` still has no admin policy (D-074).
 *
 * Who sees it: `reports_for_review()` (0065) — every super admin, and the
 * case manager with an active assignment for the sender or the reporter.
 * Not every case manager in the region, and not the person the report is
 * about. The tile on Home and this screen's own gate follow the previewed
 * role (D-172); the query runs as the real one.
 *
 * List-only: `reports` has `resolved_at`/`resolution` columns but no
 * function writes them yet, and inventing one here would be a product
 * decision (what does "looked at" oblige?) rather than a screen.
 */

const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.5 },
  card: { width: '100%' },
  excerpt: { fontSize: '18px', lineHeight: 1.4, whiteSpace: 'pre-wrap' },
  meta: { fontSize: '16px' },
  name: { fontSize: '18px' },
});

function reasonLabel(reason: string | null, t: (key: string) => string): string | null {
  if (!reason) return null;
  return (MESSAGE_REPORT_REASONS as readonly string[]).includes(reason)
    ? t(`messages.report.reason.${reason}`)
    : reason;
}

export default function ReportsPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const canReview = viewedRole === 'admin' || viewedRole === 'super_admin';
  const realCanReview = trueRole === 'admin' || trueRole === 'super_admin';
  const { state } = useReports(realCanReview);

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <NotIn status={session.status} title={t('reports.signedOut.title')} body={t('reports.signedOut.body')} />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      </Page>
    );
  }

  const header = (
    <AppHeader
      roleLabel={t(`role.${viewedRole}`)}
      roleControl={
        trueRole === 'super_admin' ? (
          <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
        ) : undefined
      }
      trailing={<HeaderBell enabled role={viewedRole} />}
    />
  );

  if (!canReview) {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t('reports.notAllowed.title')}
          body={t('admin.notAdmin.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  // A preview of a reviewer role by an account that is not one: the screen,
  // with nothing real behind it — the query never ran (D-172).
  const shown = realCanReview ? state : ({ status: 'ready', reports: [] } as const);

  return (
    <Page gap={4}>
      {header}
      <PageTitle title={t('reports.title')} backHref="/" backLabel={t('nav.back.home')} />

      <Text type="supporting" xstyle={styles.intro}>
        {t('reports.intro')}
      </Text>

      {shown.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {shown.status === 'error' ? (
        <Notice
          notice={shown.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[shown.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[shown.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {shown.status === 'ready' && shown.reports.length === 0 ? (
        <Notice notice="no_caseload_members" title={t('reports.empty.title')} body={t('reports.empty.body')} />
      ) : null}

      {shown.status === 'ready' && shown.reports.length > 0 ? (
        <VStack gap={3}>
          {shown.reports.map((report) => {
            const reason = reasonLabel(report.reason, t);
            return (
              <Card key={report.id} xstyle={styles.card}>
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
                  {report.excerpt ? (
                    <Text xstyle={styles.excerpt}>{report.excerpt}</Text>
                  ) : null}
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
      ) : null}

      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
