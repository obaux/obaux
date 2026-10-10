'use client';

import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, FlagIcon, MessagesIcon, ShareIcon } from '@pam/ui';
import { roundAction } from '@pam/ui/roundAction';
import { DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';

// The bar's round buttons — save and ⋯ — are `roundAction.plain`: white, with no outline and no
// shadow (Will, 10 October; D-411 had given them both). The back arrow beside them is the only grey one.
const styles = stylex.create({
  saved: { color: colorVars['--color-icon-accent'] },
});

const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;

/**
 * Who to message about a place (D-224): the program lead for it, in the
 * example conversation between them and the example member, while messaging
 * runs on example people; otherwise Messages, where New message is.
 */
export { newMessageFrom } from '@/lib/placeMessages';

/**
 * The conversation with a place's program. Opened from the place's page,
 * it remembers the place (`from=place&place=`), so Back in the thread goes
 * back to the program — text, then return to book (Will, 6 October, D-313).
 */
export function messageHrefFor(placeName: string, placeId?: string): string {
  const lead = DUMMY_PROGRAM_LEADS.find((person) => person.orgName === placeName);
  const fromPlace = placeId ? `&from=place&place=${encodeURIComponent(placeId)}` : '';
  return lead
    ? `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(DUMMY_SELF_ID.member, lead.id))}${fromPlace}`
    : '/messages/';
}

/**
 * The super admin's way to a program's lead from the program's own page
 * (D-349; Will, 7 October: "super admin program messaging"): the
 * conversation between the super admin and that program's lead (0072 allows
 * it both ways), or null when Pam knows no lead for the place.
 */
export function leadMessageFor(
  placeName: string,
  placeId?: string,
): { readonly firstName: string; readonly href: string } | null {
  const lead = DUMMY_PROGRAM_LEADS.find((person) => person.orgName === placeName);
  if (!lead) return null;
  const fromPlace = placeId ? `&from=place&place=${encodeURIComponent(placeId)}` : '';
  return {
    firstName: lead.firstName ?? '',
    href: `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(lead.id, DUMMY_SELF_ID.super_admin))}${fromPlace}`,
  };
}

/**
 * A place's bar for a member (D-224, Will, 2 October): Save, then ⋯ — a
 * secondary menu with Flag something, Share and Message the program, each
 * with its icon. The long column of buttons under the place is gone.
 */
export function PlaceBarActions({
  isSaved,
  onSave,
  onShare,
  flagHref,
  messageHref,
}: {
  readonly isSaved: boolean;
  readonly onSave?: (() => void) | undefined;
  readonly onShare: () => void;
  readonly flagHref: string;
  readonly messageHref: string;
}) {
  const { t } = useI18n();
  const router = useRouter();
  return (
    <>
      {onSave ? (
        <IconButton
          label={isSaved ? t('places.saved') : t('place.save')}
          variant="ghost"
          aria-pressed={isSaved}
          onClick={onSave}
          icon={
            <HStack>
              <BookmarkIcon {...ICON} isFilled={isSaved} />
            </HStack>
          }
          xstyle={[roundAction.plain, isSaved && styles.saved]}
        />
      ) : null}
      <DropdownMenu
        button={{
          label: t('place.more'),
          isIconOnly: true,
          variant: 'ghost',
          icon: <Icon icon="moreHorizontal" size="md" />,
          xstyle: roundAction.plain,
        }}
        hasChevron={false}
        placement="below"
        alignment="end"
        menuWidth={240}
        items={[
          {
            id: 'flag',
            label: t('place.flagSomething'),
            icon: <FlagIcon {...ICON} />,
            onClick: () => router.push(flagHref),
          },
          { id: 'share', label: t('place.share'), icon: <ShareIcon {...ICON} />, onClick: onShare },
          {
            id: 'message',
            label: t('place.messageProgram'),
            icon: <MessagesIcon {...ICON} />,
            onClick: () => router.push(messageHref),
          },
        ]}
      />
    </>
  );
}
