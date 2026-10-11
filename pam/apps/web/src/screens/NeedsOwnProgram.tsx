'use client';

import type { ReactNode } from 'react';
import { BigButton, Loading } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { Text } from '@astryxdesign/core/Text';
import { useI18n } from '@/lib/i18n';
import { useProgramSetup } from '@/lib/programSetup';
import { useSession } from '@/lib/useSession';
import { HelpButton } from './HelpButton';

/**
 * A program lead's tools — policies, services, who is coming — are for their
 * own program (D-498). A lead who has not added one has nothing for them to
 * work on, and the example set must not stand in for it: they are asked to add
 * their program first. A demo or story account (example data) and anybody who
 * is not a lead pass straight through.
 */
export function NeedsOwnProgram({ children }: { readonly children: ReactNode }) {
  const { t } = useI18n();
  const { state: session } = useSession();
  const setup = useProgramSetup(session);
  const isLead = session.status === 'signed-in' && session.session.role === 'provider';
  if (!isLead) return children;
  if (setup.isLoading) return <Loading label={t('common.loading')} variant="screen" />;
  if (setup.isExample || setup.hasProgram) return children;
  return (
    <SubPage
      title={t('program.tools.needsProgram.title')}
      backHref="/"
      backLabel={t('nav.back.home')}
      actions={<HelpButton />}
      footer={<BigButton label={t('home.setup.program.title')} href="/programs/new/?from=home" />}
    >
      <Text>{t('program.tools.needsProgram.body')}</Text>
    </SubPage>
  );
}
