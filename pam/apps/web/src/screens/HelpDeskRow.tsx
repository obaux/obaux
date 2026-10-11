'use client';

import { GlobeIcon } from '@pam/ui';
import { MenuList, type MenuItem } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';
import { HELP_DESK_URL } from '@/lib/helpDesk';

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
