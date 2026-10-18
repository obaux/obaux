'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'next/navigation';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Loading, Notice, OfflineIcon, Page } from '@pam/ui';
import { Button } from '@pam/ui/Button';
import { emptyState } from '@pam/ui/emptyState';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { whenHappened } from '@/lib/when';
import { useAppProblems } from '@/lib/useAppProblems';
import { NotIn } from '../app/NotIn';

/**
 * Problems (D-616): what broke in the app over the last week, for the super admin, so the team can fix it. One row per screen,
 * action and code: what the person was doing, where, how often, and when it first and last happened, the newest first. The bell
 * opens it when an action first fails within an hour. Nothing here names a person or says what they typed: the log keeps a route
 * pattern, an action key from a closed list and a code, and those are shown as they are, for whoever fixes it.
 */
const styles = stylex.create({
  // A key or a route as stored: it wraps anywhere rather than being cut, and reads left to right in every language.
  action: { fontSize: '17px', lineHeight: 1.35, fontWeight: 600, overflowWrap: 'anywhere' },
  detail: { fontSize: '15px', lineHeight: 1.4, overflowWrap: 'anywhere', color: colorVars['--color-text-secondary'] },
  count: { fontSize: '17px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
});

export function ProblemsScreen() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const [refresh, setRefresh] = useState(0);
  const state = useAppProblems(isSuperAdmin, refresh);

  const from = useSearchParams().get('from');
  const back =
    from === 'home'
      ? { backHref: '/', backLabel: t('nav.back.home') }
      : from === 'notifications'
        ? { backHref: '/notifications/', backLabel: t('nav.back.notifications') }
        : { backHref: '/profile/', backLabel: t('nav.back.profile') };
  const header = <SubPageHeader title={t('problems.title')} subtitle={t('problems.window')} {...back} />;

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        {header}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }
  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header}
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }
  if (!isSuperAdmin) {
    return (
      <Page gap={4}>
        {header}
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      {header}

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'error' ? (
        // Try again, as the team's other lists have (Iris P5).
        <EmptyState
          headingLevel={2}
          icon={<OfflineIcon {...stylex.props(emptyState.icon)} aria-hidden />}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          description={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          actions={<Button label={t('explore.error.retry')} variant="primary" onClick={() => setRefresh((n) => n + 1)} />}
        />
      ) : null}

      {state.status === 'ready' && state.problems.length === 0 ? <Text type="supporting">{t('problems.empty')}</Text> : null}

      {state.status === 'ready' && state.problems.length > 0 ? (
        <List hasDividers density="spacious" aria-label={t('problems.title')}>
          {state.problems.map((p) => (
            <ListItem
              key={`${p.area} ${p.action} ${p.code}`}
              label={
                <Text dir="ltr" xstyle={styles.action}>
                  {p.action}
                </Text>
              }
              description={
                <VStack gap={0}>
                  <Text dir="ltr" xstyle={styles.detail}>
                    {`${p.area} · ${p.code}`}
                  </Text>
                  <Text xstyle={styles.detail}>{t('problems.last', { when: whenHappened(p.lastSeen, locale, t) })}</Text>
                  <Text xstyle={styles.detail}>{t('problems.first', { when: whenHappened(p.firstSeen, locale, t) })}</Text>
                </VStack>
              }
              endContent={
                <Text xstyle={styles.count} aria-label={tPlain('problems.times', { count: p.count })}>
                  {String(p.count)}
                </Text>
              }
            />
          ))}
        </List>
      ) : null}
    </Page>
  );
}
