'use client';

import { useState } from 'react';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, Loading } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { navigate } from '@/lib/navigate';
import { useProgramRequest } from '@/lib/useProgramRequest';
import { useSession } from '@/lib/useSession';
import { AddProgramView } from './AddProgramView';
import { HelpButton } from './HelpButton';

/**
 * "Add my program", from a member's Profile (D-525; Will, 11 October 2026: "anyone
 * should be able to create a program"). The same questions a program lead answers,
 * sent as a request Pam's team checks by hand; the member keeps their member side
 * and gains the program when it is approved (D-491).
 *
 * Where it stands decides what this page is: no request yet is the questions;
 * being checked is a short status; turned down is a status with a way to change
 * it and ask again, which opens the questions with what was sent; approved goes
 * back to Profile, where "Use Pam as" now has the program.
 */
export function AddMyProgramScreen() {
  const { t } = useI18n();
  const { state: session } = useSession();
  const { state, refresh } = useProgramRequest(session);
  const [asking, setAsking] = useState(false);
  const [justSent, setJustSent] = useState(false);

  const back = { backHref: '/profile/', backLabel: t('nav.back.profile') };

  if (session.status === 'loading' || state.status === 'loading') {
    return (
      <SubPage title={t('profile.menu.addProgram')} {...back} actions={<HelpButton />}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }
  if (state.status === 'approved') {
    navigate('/profile/');
    return null;
  }

  if (justSent) {
    return (
      <SubPage
        title={t('addProgram.ask.sent.title')}
        {...back}
        actions={<HelpButton />}
        footer={<BigButton label={t('nav.back.profile')} href="/profile/" />}
      >
        <Text>{t('addProgram.ask.sent.body')}</Text>
      </SubPage>
    );
  }

  if (state.status === 'none' || asking) {
    return (
      <AddProgramView
        mode="ask"
        {...(state.status === 'denied' ? { initial: state.details } : {})}
        onAsked={() => {
          setAsking(false);
          setJustSent(true);
          refresh();
        }}
      />
    );
  }

  const denied = state.status === 'denied';
  return (
    <SubPage
      title={t(denied ? 'addProgram.ask.denied.title' : 'addProgram.ask.waiting.title')}
      subtitle={state.details.name || undefined}
      {...back}
      actions={<HelpButton />}
      footer={denied ? <BigButton label={t('addProgram.ask.again')} onPress={() => setAsking(true)} /> : undefined}
    >
      <VStack gap={3}>
        <Text>{t(denied ? 'addProgram.ask.denied.body' : 'addProgram.ask.waiting.body')}</Text>
      </VStack>
    </SubPage>
  );
}
