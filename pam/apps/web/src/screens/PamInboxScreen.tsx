'use client';

import * as stylex from '@stylexjs/stylex';
import { useSearchParams } from 'next/navigation';
import { Avatar } from '@astryxdesign/core/Avatar';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ClockIcon, Loading, MessagesIcon, Notice, Page } from '@pam/ui';
import { MenuList } from '@pam/ui/MenuList';
import { SubPageHeader } from '@pam/ui/SubPage';
import { NOTICES, splitIsolated } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { whenHappened } from '@/lib/when';
import { usePamInbox, usePamStatus, type PamInboxRow } from '@/lib/pam';
import { inboxGroups, waitedFor } from '@/lib/pamInbox';
import { NotIn } from '../app/NotIn';

/**
 * Messages to Pam (card a100, Dot's x5): what people wrote to Pam, for the Pam team. Waiting for Pam comes first,
 * longest waiting first with how long ("Waiting 2 days"), then Answered; Closed is folded under one row at the foot and
 * opens `?show=closed`. A row says only a first name, the role (with the region, or a lead's program) and the last
 * message's first line: what `pam_inbox()` returns, nothing else (D-605).
 *
 * Nothing shows while the switch is off: the screen says there is nothing here, as for an address that does not exist.
 */
const styles = stylex.create({
  // Dot's x5: the section's name in small bold grey above its rows.
  group: { fontSize: '15px', fontWeight: 700, letterSpacing: '0.02em', color: colorVars['--color-text-secondary'] },
  // No padding on the start side, so the avatar lines up with the title (D-411), as on Messages.
  item: { minHeight: '48px', paddingInline: `0px ${spacingVars['--spacing-3']}` },
  name: { fontSize: '19px', fontWeight: 500 },
  nameWaiting: { fontSize: '19px', fontWeight: 700 },
  context: { fontSize: '15px', lineHeight: 1.3 },
  waiting: { fontSize: '15px', fontWeight: 700, lineHeight: 1.3 },
  line: { fontSize: '17px', lineHeight: 1.35, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  // "You:" and the words: the words are cut at their own end, so in Arabic an English message loses its tail, not its start.
  lineSplit: { display: 'flex', columnGap: '0.25em', minWidth: 0 },
  body: { fontSize: 'inherit', color: 'inherit', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  when: { fontSize: '14px', whiteSpace: 'nowrap' },
  sent: { fontSize: '17px', lineHeight: 1.4, fontWeight: 600 },
});

export function PamInboxScreen() {
  const { t, tPlain, locale } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin' && trueRole === 'super_admin';
  // Nico's hooks (`lib/pam.ts`): the switch first, and nothing else is asked while it is off.
  const pam = usePamStatus(isSuperAdmin);
  const live = pam.status === 'ready';
  const state = usePamInbox(isSuperAdmin && live);

  const params = useSearchParams();
  const showClosed = params.get('show') === 'closed';
  // After Pam writes to a program: how many leads it went to (S3).
  const sentTo = Number(params.get('sent') ?? NaN);
  const fromHome = params.get('from') === 'home';
  const back = showClosed
    ? { backHref: fromHome ? '/pam/messages/?from=home' : '/pam/messages/', backLabel: t('pam.inbox.title') }
    : fromHome
      ? { backHref: '/', backLabel: t('nav.back.home') }
      : { backHref: '/messages/', backLabel: t('nav.back.messages') };
  const title = t(showClosed ? 'pam.inbox.closed.title' : 'pam.inbox.title');
  const header = <SubPageHeader title={title} {...back} />;

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
  if (!isSuperAdmin || pam.status === 'off') {
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
  if (pam.status === 'loading' || state.status === 'loading') {
    return (
      <Page gap={3}>
        {header}
        <Loading label={t('common.loading')} variant="inline" />
      </Page>
    );
  }
  if (state.status === 'error') {
    const notice = state.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        {header}
        <Notice notice={notice} title={t(NOTICES[notice].titleKey)} body={t(NOTICES[notice].bodyKey)} contactLabel={t('help.contact.action')} />
      </Page>
    );
  }

  const groups = inboxGroups(state.rows);
  const fromParam = fromHome ? '&from=home' : '';

  const context = (row: PamInboxRow): string =>
    row.role === 'provider'
      ? row.programName
        ? t('pam.inbox.role.lead', { program: row.programName })
        : t('pam.inbox.role.leadNoProgram')
      : [t(row.role === 'admin' ? 'pam.inbox.role.caseManager' : 'pam.inbox.role.member'), row.regionName].filter(Boolean).join(' · ');

  const rows = (list: readonly PamInboxRow[], label: string) => (
    <List aria-label={label}>
      {list.map((row) => {
        const waited = row.waitingSince ? waitedFor(row.waitingSince) : null;
        const preview = row.preview ?? '';
        // The words someone wrote, laid out in their own direction (D-435): in Arabic, "أنت:" stays at the start and an English
        // message keeps its full stop at its own end. Each value `t` wrote in is its own element with dir="auto", an isolate.
        const pieces = row.lastFrom === 'team' ? splitIsolated(t('messages.preview.you', { text: preview })) : null;
        const split = pieces !== null && pieces.some((piece) => piece.isValue);
        const line = split
          ? pieces.map((piece, i) =>
              piece.isValue ? (
                <Text key={i} dir="auto" xstyle={styles.body}>
                  {piece.text}
                </Text>
              ) : (
                piece.text
              ),
            )
          : pieces
            ? pieces.map((piece) => piece.text).join('')
            : preview;
        return (
          <ListItem
            key={row.conversationId}
            href={`/messages/thread/?id=${encodeURIComponent(row.conversationId)}&from=pam${fromParam}`}
            startContent={<Avatar size="lg" name={row.firstName || '?'} tooltip={false} alt="" />}
            label={
              <Text dir="auto" xstyle={waited ? styles.nameWaiting : styles.name}>
                {row.firstName ?? '—'}
              </Text>
            }
            description={
              <VStack gap={0}>
                <Text type="supporting" xstyle={styles.context}>
                  {context(row)}
                </Text>
                {waited ? <Text xstyle={styles.waiting}>{t(`pam.inbox.waiting.${waited.unit}`, { count: waited.count })}</Text> : null}
                <Text dir={split ? undefined : 'auto'} type="supporting" xstyle={[styles.line, split && styles.lineSplit]}>
                  {line}
                </Text>
              </VStack>
            }
            endContent={
              row.lastMessageAt ? (
                <Text type="supporting" xstyle={styles.when}>
                  {whenHappened(row.lastMessageAt, locale, t)}
                </Text>
              ) : undefined
            }
            xstyle={styles.item}
          />
        );
      })}
    </List>
  );

  if (showClosed) {
    return (
      <Page gap={4}>
        {header}
        {groups.closed.length === 0 ? (
          <Text type="supporting">{t('pam.inbox.closed.empty')}</Text>
        ) : (
          rows(groups.closed, tPlain('pam.inbox.closed.title'))
        )}
      </Page>
    );
  }

  const nothingOpen = groups.waiting.length === 0 && groups.answered.length === 0;

  return (
    <Page gap={4}>
      {header}
      {Number.isFinite(sentTo) && sentTo > 0 ? (
        <Text role="status" xstyle={styles.sent}>
          {t('pam.inbox.sent', { count: sentTo })}
        </Text>
      ) : null}
      {nothingOpen ? <Text type="supporting">{t('pam.inbox.empty')}</Text> : null}
      {groups.waiting.length > 0 ? (
        <VStack gap={1}>
          <Text xstyle={styles.group}>{t('pam.inbox.group.waiting')}</Text>
          {rows(groups.waiting, tPlain('pam.inbox.group.waiting'))}
        </VStack>
      ) : null}
      {groups.answered.length > 0 ? (
        <VStack gap={1}>
          <Text xstyle={styles.group}>{t('pam.inbox.group.answered')}</Text>
          {rows(groups.answered, tPlain('pam.inbox.group.answered'))}
        </VStack>
      ) : null}
      {groups.closed.length > 0 ? (
        <MenuList
          label={tPlain('pam.inbox.closed.title')}
          items={[
            {
              id: 'closed',
              label: t('pam.inbox.closed.row'),
              href: `/pam/messages/?show=closed${fromParam}`,
              icon: <MessagesIcon width={26} height={26} aria-hidden />,
              value: String(groups.closed.length),
            },
          ]}
        />
      ) : null}
      {/* When Pam is here: the hours the out-of-hours reply follows (S4). */}
      <MenuList
        label={tPlain('pam.hours.row')}
        items={[{ id: 'hours', label: t('pam.hours.row'), href: '/pam/hours/', icon: <ClockIcon width={26} height={26} aria-hidden /> }]}
      />
    </Page>
  );
}
