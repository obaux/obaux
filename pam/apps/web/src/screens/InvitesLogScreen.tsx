'use client';

import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { Token } from '@astryxdesign/core/Token';
import { VStack } from '@astryxdesign/core/VStack';
import { NOTICES } from '@pam/config';
import { Loading, Notice } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
import { useInvitesLog, type InviteLogRow } from '@/lib/useInviteLinks';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useRoleView } from '@/lib/useViewedRole';
import { HelpButton } from './HelpButton';

/**
 * Invited people (Will, 4 October, D-263): "keep a log of invited people in
 * an item above bottom bar, and opens a new page with back button. Page lists
 * all invitees by date, and show status: active vs link expired."
 *
 * Every invite anybody made (`invites_log`, super admin only), newest day
 * first. Each row says who — the person's first name once they joined, or
 * what they were invited as until then — who invited them, and one status:
 * Active (joined), Link open (not used yet) or Link expired. A link that was
 * sent again by email after expiring says where it went. Nothing here needs
 * a decision; expired links renew themselves by email (D-263).
 */
const styles = stylex.create({
  day: { fontSize: '17px', lineHeight: 1.3, marginTop: '8px' },
  name: { fontSize: '18px', lineHeight: 1.3 },
  line: { fontSize: '15px', lineHeight: 1.4 },
  count: { fontSize: '16px', lineHeight: 1.5 },
});

const STATUS = {
  joined: { key: 'invites.log.status.active', color: 'green' },
  open: { key: 'invites.log.status.open', color: 'blue' },
  expired: { key: 'invites.log.status.expired', color: 'gray' },
} as const;

export function InvitesLogScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const { state } = useInvitesLog(isSuperAdmin);

  const dayLabel = new Intl.DateTimeFormat(locale, { weekday: 'long', month: 'long', day: 'numeric' });
  const days: { label: string; rows: InviteLogRow[] }[] = [];
  if (state.status === 'ready') {
    for (const row of state.invites) {
      const label = dayLabel.format(new Date(row.createdAt));
      const last = days[days.length - 1];
      if (last && last.label === label) last.rows.push(row);
      else days.push({ label, rows: [row] });
    }
  }

  const subtitle =
    state.status === 'ready' ? t('invites.log.count', { count: state.invites.length }) : undefined;

  return (
    <SubPage
      title={t('invites.log.title')}
      {...(subtitle ? { subtitle } : {})}
      onBack={() => goBack('/')}
      backLabel={t('nav.back.home')}
      actions={<HelpButton />}
    >
      {!isSuperAdmin && session.status !== 'loading' ? (
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : state.status === 'loading' ? (
        <Loading label={t('common.loading')} variant="inline" />
      ) : state.status === 'error' ? (
        <Notice
          notice="something_went_wrong"
          title={t(NOTICES.something_went_wrong.titleKey)}
          body={t(NOTICES.something_went_wrong.bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : days.length === 0 ? (
        <Text type="supporting" xstyle={styles.count}>
          {t('invites.log.empty')}
        </Text>
      ) : (
        <VStack gap={3}>
          {days.map((day) => (
            <VStack key={day.label} gap={1}>
              <Heading level={2} xstyle={styles.day}>
                {day.label}
              </Heading>
              <List hasDividers density="spacious">
                {day.rows.map((row) => {
                  const status = STATUS[row.state];
                  const inviter = [row.inviterFirst, row.inviterLast].filter(Boolean).join(' ') || '—';
                  return (
                    <ListItem
                      key={row.id}
                      label={
                        <Text xstyle={styles.name}>
                          {row.state === 'joined' && row.joinedFirst
                            ? row.joinedFirst
                            : t(`invites.log.who.${row.role}`)}
                        </Text>
                      }
                      description={
                        <Text type="supporting" xstyle={styles.line}>
                          {t('invites.log.by', { name: inviter, role: t(`role.${row.inviterRole}`) })}
                          {row.reissued && row.emailedTo ? ` · ${t('invites.log.emailed', { email: row.emailedTo })}` : ''}
                        </Text>
                      }
                      endContent={<Token label={t(status.key)} color={status.color} size="sm" />}
                    />
                  );
                })}
              </List>
            </VStack>
          ))}
        </VStack>
      )}
    </SubPage>
  );
}
