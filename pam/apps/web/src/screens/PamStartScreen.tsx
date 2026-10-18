'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Text } from '@astryxdesign/core/Text';
import { Loading, Notice, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { speechLanguageFor } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { navigate } from '@/lib/navigate';
import { pamProgramHasLead, startPamConversation, startPamProgramConversation, usePamInbox, usePamStatus } from '@/lib/pam';
import { ThreadFrame, ThreadHeader, ThreadIntro, ThreadTop } from '../app/messages/ThreadFrame';
import { ThreadViewLazy } from '../app/messages/ThreadViewLazy';
import { NotIn } from '../app/NotIn';

/**
 * Pam writes first (card a100, Will's B; Dot's b5 and b6): `/pam/start/?profile=<id>&name=<first name>` for a person
 * (a member, a case manager or a program lead, from Everyone), or `?service=<id>&name=<program>` for a program (from its
 * page). The first message is what starts it, so this is an empty conversation with Pam's composer.
 *
 * - **A person** has one Pam conversation, ever: if theirs already exists, this opens it instead.
 * - **A program** has no shared conversation: the words go to each of its active leads, in their own (Nico,
 *   `pam_start_program_conversation`). With no active lead it says so in one line and offers no composer
 *   (`pam_program_has_lead`), so nobody writes a message that cannot go.
 *
 * The Pam team only, and only while the switch is on.
 */
export function PamStartScreen() {
  const { t, tPlain, locale } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const profileId = params.get('profile');
  const serviceId = params.get('service');
  const name = params.get('name') ?? '';
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const isTeam = viewedRole === 'super_admin' && trueRole === 'super_admin';
  const pam = usePamStatus(isTeam);
  const live = pam.status === 'ready';
  const inbox = usePamInbox(isTeam && live && profileId !== null);
  const [hasLead, setHasLead] = useState<boolean | null>(null);
  const [sending, setSending] = useState(false);
  const [failed, setFailed] = useState(false);

  // A person with a Pam conversation already: open that one.
  const existing =
    profileId && inbox.status === 'ready' ? inbox.rows.find((row) => row.askerId === profileId)?.conversationId ?? null : null;
  useEffect(() => {
    if (existing) router.replace(`/messages/thread/?id=${encodeURIComponent(existing)}&from=pam`);
  }, [existing, router]);

  useEffect(() => {
    if (!isTeam || !live || !serviceId) return;
    let cancelled = false;
    void pamProgramHasLead(serviceId).then((result) => {
      if (!cancelled) setHasLead(result.ok ? result.value === true : false);
    });
    return () => {
      cancelled = true;
    };
  }, [isTeam, live, serviceId]);

  const back = serviceId
    ? { backHref: `/place/?id=${encodeURIComponent(serviceId)}`, backLabel: t('nav.back.place') }
    : { backHref: '/directory/', backLabel: t('nav.back.directory') };

  if (session.status === 'loading' || (isTeam && pam.status === 'loading')) {
    return (
      <Page gap={3}>
        <SubPageHeader title={name} {...back} />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }
  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <SubPageHeader title={name} {...back} />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
      </Page>
    );
  }
  if (!isTeam || !live || (!profileId && !serviceId)) {
    return (
      <Page gap={4}>
        <SubPageHeader title={name} {...back} />
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          contactLabel={t('help.contact.action')}
        />
      </Page>
    );
  }
  // Waiting to know whether to open an existing conversation, or whether the program has anyone to write to.
  if ((profileId && (inbox.status === 'loading' || existing)) || (serviceId && hasLead === null)) {
    return (
      <Page gap={3}>
        <SubPageHeader title={name} {...back} />
        <Loading label={t('common.loading')} variant="inline" />
      </Page>
    );
  }
  if (serviceId && hasLead === false) {
    return (
      <Page gap={4}>
        <SubPageHeader title={name} {...back} />
        <Text type="supporting">{t('pam.program.noLead')}</Text>
      </Page>
    );
  }

  const send = async (body: string): Promise<boolean> => {
    const text = body.trim();
    if (!text) return false;
    setSending(true);
    setFailed(false);
    if (profileId) {
      const result = await startPamConversation(profileId, text);
      setSending(false);
      if (!result.ok) {
        setFailed(true);
        return false;
      }
      router.replace(`/messages/thread/?id=${encodeURIComponent(result.value)}&from=pam`);
      return true;
    }
    const result = await startPamProgramConversation(serviceId as string, text);
    setSending(false);
    if (!result.ok) {
      setFailed(true);
      if (result.error === 'PAM_NO_ACTIVE_LEAD') setHasLead(false);
      return false;
    }
    navigate(`/pam/messages/?sent=${result.value}`);
    return true;
  };

  return (
    <ThreadFrame>
      <ThreadTop>
        <ThreadHeader name={name} {...back} />
      </ThreadTop>
      <ThreadViewLazy
        messages={[]}
        otherName={name}
        intro={
          <ThreadIntro name={name} context={null}>
            <Text type="supporting" dir="auto">
              {serviceId ? t('pam.start.programNote') : t('pam.start.note', { name })}
            </Text>
            {failed ? (
              <Text type="supporting" role="alert">
                {t('pam.thread.statusFailed')}
              </Text>
            ) : null}
          </ThreadIntro>
        }
        onSend={(body) => send(body)}
        // Pam's first words are words only: nothing to attach before there is a conversation (Nico, 4850ced6).
        placeholder={tPlain('pam.start.placeholder')}
        attachments="none"
        sending={sending}
        speechLanguage={speechLanguageFor(locale)}
      />
    </ThreadFrame>
  );
}
