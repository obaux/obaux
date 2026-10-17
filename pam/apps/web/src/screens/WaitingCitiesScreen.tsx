'use client';

import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'next/navigation';
import { Text } from '@astryxdesign/core/Text';
import { List, ListItem } from '@astryxdesign/core/List';
import { Page, Loading, Notice } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { peopleWaiting, useWaitingCities } from '@/lib/useWaitingCities';
import { NotIn } from '../app/NotIn';
import { HelpButton } from './HelpButton';

/**
 * Cities people are waiting for (D-593; card a96): each city someone signed up from that Pam is not in, and how many,
 * biggest first, so Will can choose where to open next. Counts only, read through a function that refuses anyone who
 * is not a super admin; there is no person on this screen to tap.
 */
const styles = stylex.create({
  // A place as people typed it: it wraps rather than being cut, and reads in its own direction in Arabic.
  place: { fontSize: '17px', lineHeight: 1.35, overflowWrap: 'anywhere' },
  count: { fontSize: '17px', fontWeight: 600, fontVariantNumeric: 'tabular-nums' },
});

export function WaitingCitiesScreen() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const state = useWaitingCities(isSuperAdmin);

  const fromHome = useSearchParams().get('from') === 'home';
  const back = fromHome
    ? { backHref: '/', backLabel: t('nav.back.home') }
    : { backHref: '/profile/', backLabel: t('nav.back.profile') };
  const header = (subtitle?: string) => (
    <SubPageHeader title={t('waitingCities.title')} {...(subtitle ? { subtitle } : {})} {...back} actions={<HelpButton />} />
  );

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        {header()}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }
  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        {header()}
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }
  if (!isSuperAdmin) {
    return (
      <Page gap={4}>
        {header()}
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
      {header(state.status === 'ready' && state.cities.length > 0 ? t('requests.count', { count: peopleWaiting(state.cities) }) : undefined)}

      {state.status === 'loading' ? <Loading label={t('common.loading')} variant="inline" /> : null}

      {state.status === 'error' ? (
        <Notice
          notice={state.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[state.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'ready' && state.cities.length === 0 ? (
        <Notice
          notice="no_caseload_members"
          title={t('waitingCities.empty.title')}
          body={t('waitingCities.empty.body')}
          contactLabel={t('help.contact.action')}
        />
      ) : null}

      {state.status === 'ready' && state.cities.length > 0 ? (
        <List hasDividers density="spacious" aria-label={t('waitingCities.title')}>
          {state.cities.map((city) => (
            <ListItem
              key={city.place}
              label={
                <Text dir="auto" xstyle={styles.place}>
                  {city.place}
                </Text>
              }
              endContent={<Text xstyle={styles.count}>{String(city.people)}</Text>}
            />
          ))}
        </List>
      ) : null}
    </Page>
  );
}
