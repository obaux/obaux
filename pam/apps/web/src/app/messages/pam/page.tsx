'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loading, Page } from '@pam/ui';
import { SubPageHeader } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { openPamConversation } from '@/lib/pam';
import { useSession } from '@/lib/useSession';

/**
 * Your conversation with Pam, at a fixed address (D-605; the merge desk, 18 October): `/messages/pam/`. The website's "Open Pam"
 * button, Help's "Write to Pam" and Contact Pam all come here, so none of them needs to know a conversation's id.
 *
 *   * Signed out: through Sign in, and back (`?next=/messages/pam/`, kept for the length of the sign-in like Add my program's).
 *   * Signed in with messaging Pam on: opens the person's one Pam conversation (made with Pam's welcome the first time) and shows it.
 *   * Switched off, or the Pam team (who are Pam and have no conversation with themselves): lands on Messages.
 */
export default function PamEntryPage() {
  const { t } = useI18n();
  const router = useRouter();
  const { state: session } = useSession();

  useEffect(() => {
    if (session.status === 'signed-out') {
      router.replace('/signin/?next=/messages/pam/');
      return;
    }
    if (session.status !== 'signed-in') return;
    if (session.session.role === 'super_admin') {
      router.replace('/messages/');
      return;
    }
    let cancelled = false;
    void openPamConversation().then((id) => {
      if (cancelled) return;
      router.replace(id ? `/messages/thread/?id=${encodeURIComponent(id)}` : '/messages/');
    });
    return () => {
      cancelled = true;
    };
  }, [session, router]);

  // Never a dead end: the same bar as every screen you tap into, with a way back, while it opens.
  return (
    <Page gap={4}>
      <SubPageHeader title={t('messages.title')} backHref="/messages/" backLabel={t('nav.back.messages')} />
      <Loading label={t('common.loading')} variant="inline" />
    </Page>
  );
}
