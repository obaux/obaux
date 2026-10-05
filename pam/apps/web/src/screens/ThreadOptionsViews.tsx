'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import { Text } from '@astryxdesign/core/Text';
import { BigButton, FlagIcon, Notice, PlacesIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { MenuList } from '@pam/ui/MenuList';
import { MESSAGE_REPORT_REASONS, type MessageReportReason } from '@pam/config';
import { dummyConversationPair } from '@pam/config/dummy-conversations';
import { dummyConnection } from '@pam/config/dummy-connections';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { useConversations } from '@/lib/useConversations';
import { useRoleView } from '@/lib/useViewedRole';
import { useSession } from '@/lib/useSession';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useThread } from '@/lib/useThread';
import { reportMessage } from '@/lib/reportMessage';

/**
 * A conversation's ⋯ page (D-213, Will, 1 October): the thread's secondary
 * actions, moved off the messages themselves and onto the nested-page
 * template — report suspicious activity, and the program's details.
 */
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  body: { fontSize: '18px', lineHeight: 1.5 },
});

function isExample(id: string) {
  return id.startsWith('dummy-conv-');
}

function ThreadOptions() {
  const { t } = useI18n();
  const id = useSearchParams().get('id') ?? '';
  const threadHref = `/messages/thread/?id=${encodeURIComponent(id)}`;
  // The staff side of an example pair runs a program with a page of its
  // own (D-272: the connection profile page is gone); a real thread's
  // program is on Connections.
  const pair = isExample(id) ? dummyConversationPair(id) : null;
  const person = pair ? dummyConnection(pair.staffId) : null;
  const programHref = person?.placeId
    ? `/place/?id=${encodeURIComponent(person.placeId)}&from=messages`
    : '/connections/';

  // "View program details" only when the other side is a program (Will,
  // 3 October, D-235): a member or a case manager talking to a program lead.
  // A program lead talking to a member has no program to show there.
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const { state: conversations } = useConversations(!pair && session.status === 'signed-in');
  const otherIsProgram = pair
    ? DUMMY_EVERYONE.find((p) => p.id === (viewedRole === 'member' ? pair.staffId : pair.memberId))?.role ===
      'provider'
    : conversations.status === 'ready' &&
      conversations.conversations.find((c) => c.id === id)?.otherRole === 'provider';

  return (
    <SubPage title={t('messages.options.title')} backHref={threadHref} backLabel={t('messages.options.back')}>
      <MenuList
        label={t('messages.options.title')}
        items={[
          {
            id: 'report',
            label: t('messages.options.report'),
            href: `/messages/thread/report/?id=${encodeURIComponent(id)}`,
            icon: <FlagIcon {...ICON} />,
          },
          ...(otherIsProgram
            ? [{ id: 'program', label: t('messages.options.program'), href: programHref, icon: <PlacesIcon {...ICON} /> }]
            : []),
        ]}
      />
    </SubPage>
  );
}

export function ThreadOptionsView() {
  return (
    <Suspense fallback={null}>
      <ThreadOptions />
    </Suspense>
  );
}

/**
 * Report suspicious activity: the same four reasons and the same
 * `report_message()` as before (D-177). With the button gone from each
 * message, what is reported is the other person's latest message — the
 * report still carries one message and nothing else from the chat, which is
 * what the words say. An example conversation sends nothing.
 */
function ThreadReport() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const id = useSearchParams().get('id') ?? '';
  const example = isExample(id);
  const { state: session } = useSession();
  const { state } = useThread(!example && session.status === 'signed-in' ? id : null);
  const [reason, setReason] = useState<MessageReportReason>(MESSAGE_REPORT_REASONS[0]);
  const [phase, setPhase] = useState<'choosing' | 'sending' | 'done' | 'failed'>('choosing');

  const latest =
    state.status === 'ready' ? [...state.messages].reverse().find((m) => !m.mine) ?? null : null;
  const nothingToReport = !example && state.status === 'ready' && latest === null;

  const send = async () => {
    if (example) {
      setPhase('done');
      return;
    }
    if (!latest) return;
    setPhase('sending');
    setPhase((await reportMessage(latest.id, reason)) ? 'done' : 'failed');
  };

  const back = `/messages/thread/options/?id=${encodeURIComponent(id)}`;

  return (
    <SubPage title={t('messages.options.report')} backHref={back} backLabel={t('nav.back.options')}>
      {phase === 'done' ? (
        <>
          <Notice
            notice="service_not_available"
            title={t('messages.report.done.title')}
            body={example ? t('messages.report.example') : t('messages.report.done.body')}
          />
          <BigButton label={t('messages.options.back')} href={`/messages/thread/?id=${encodeURIComponent(id)}`} />
        </>
      ) : nothingToReport ? (
        <Text xstyle={styles.body}>{t('messages.report.nothing')}</Text>
      ) : (
        <>
          <Text type="supporting" xstyle={styles.body}>
            {t('messages.report.thread.intro')}
          </Text>
          <RadioList
            label={t('messages.report.title')}
            isLabelHidden
            value={reason}
            onChange={(next) => setReason(next as MessageReportReason)}
          >
            {MESSAGE_REPORT_REASONS.map((key) => (
              <RadioListItem key={key} value={key} label={t(`messages.report.reason.${key}`)} />
            ))}
          </RadioList>
          {phase === 'failed' ? (
            <Notice
              notice="something_went_wrong"
              title={t('messages.report.failed.title')}
              body={t('messages.report.failed.body')}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}
          <BigButton
            label={phase === 'sending' ? t('messages.report.sending') : t('messages.report.send')}
            onPress={() => void send()}
            isDisabled={phase === 'sending' || (!example && state.status !== 'ready')}
          />
        </>
      )}
    </SubPage>
  );
}

export function ThreadReportView() {
  return (
    <Suspense fallback={null}>
      <ThreadReport />
    </Suspense>
  );
}
