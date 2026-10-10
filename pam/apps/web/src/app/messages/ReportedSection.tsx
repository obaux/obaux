'use client';

import * as stylex from '@stylexjs/stylex';
import { Text } from '@astryxdesign/core/Text';
import { Loading, Notice } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { useI18n } from '@/lib/i18n';
import type { ReportsState } from '@/lib/useReports';
import { DummyReportsLazy } from './DummyRowsLazy';
import { ReportsList } from './ReportsList';

/**
 * The Reported section of Messages (D-171, D-184, D-464): the messages somebody
 * said were not safe, for a case manager and a super admin. Each card is one
 * report (`ReportsList`); a preview, or a genuinely empty real list, shows the
 * example set through the same cards (D-183). Nothing about the conversation
 * itself is reachable from here: a report carries the one message and nothing
 * else (D-074).
 *
 * Drawn on the redesigned Messages screen under "Conversations | Reported".
 * What is fetched follows the true role and what is drawn the previewed one
 * (D-172), which is the caller's to decide: this takes the state and whether
 * it is a preview.
 */
const styles = stylex.create({
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function ReportedSection({
  state,
  previewing,
  supportPhone,
}: {
  readonly state: ReportsState;
  readonly previewing: boolean;
  readonly supportPhone: string;
}) {
  const { t } = useI18n();
  const real = !previewing;
  const emptyReal = real && state.status === 'ready' && state.reports.length === 0;
  const failure = state.status === 'error' ? (state.offline ? 'offline' : 'something_went_wrong') : null;

  return (
    <>
      {real && state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {real && failure ? (
        <Notice
          notice={failure}
          title={t(NOTICES[failure].titleKey)}
          body={t(NOTICES[failure].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {real && state.status === 'ready' && state.reports.length > 0 ? <ReportsList reports={state.reports} /> : null}

      {emptyReal && !USE_DUMMY_PEOPLE ? (
        <Notice notice="no_caseload_members" title={t('reports.empty.title')} body={t('reports.empty.body')} />
      ) : null}

      {USE_DUMMY_PEOPLE && (previewing || emptyReal) ? <DummyReportsLazy /> : null}

      <Text type="supporting" xstyle={styles.note}>
        {t('reports.intro')}
      </Text>
    </>
  );
}
