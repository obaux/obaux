'use client';

import { GlobeIcon, MessagesIcon } from '@pam/ui';
import { MenuList, type MenuItem } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { HELP_DESK_URL } from '@/lib/helpDesk';
import { usePamStatus } from '@/lib/pam';
import { useSession } from '@/lib/useSession';

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

/**
 * The way to Pam: a row that opens the help desk on the website in a new tab (A28, Will, 11 October
 * 2026). Pam has no phone line, so no screen dials one; a person who is stuck is shown answers first,
 * and the help desk's "Still stuck?" is the way to an email to Pam after that.
 *
 * It is a plain link, so the screens that carry it work with no JavaScript, no session and no database.
 */
export function useHelpDeskItem(id = 'desk'): MenuItem {
  const { t } = useI18n();
  return {
    id,
    label: t('help.desk.label'),
    description: t('help.desk.body'),
    href: HELP_DESK_URL,
    isExternal: true,
    icon: <GlobeIcon {...ICON} />,
  };
}

/** The help-desk row on its own, for a screen whose only way on is to ask Pam. */
export function HelpDeskRow({ label }: { readonly label: string }) {
  const item = useHelpDeskItem();
  return <MenuList label={label} items={[item]} />;
}

/**
 * "Write to Pam" (D-605, Will's a100: "update the help routes so they can reach Pam within the app, not just by filling out the
 * 'still stuck' form"): the last row of Help, after the answers, for a signed-in person when messaging Pam is on. It opens their
 * conversation with Pam. Everything else on Help is static and works with no session; this one row is added when there is a session
 * and Pam is on, and is simply not there otherwise (signed out, switched off, or the Pam team, who are Pam).
 */
export function useWriteToPamItem(): MenuItem | null {
  const { t } = useI18n();
  const { state: session } = useSession();
  const signedIn = session.status === 'signed-in' && session.session.role !== 'super_admin';
  const pam = usePamStatus(signedIn);
  if (!signedIn || pam.status !== 'ready') return null;
  return { id: 'pam', label: t('help.writeToPam'), href: '/messages/thread/?pam=1', icon: <MessagesIcon {...ICON} /> };
}
