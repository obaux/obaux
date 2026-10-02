'use client';

import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { DropdownMenu } from '@astryxdesign/core/DropdownMenu';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, FlagIcon, MessagesIcon, ShareIcon } from '@pam/ui';
import { DUMMY_PROGRAM_LEADS } from '@pam/config/dummy-people';
import { DUMMY_SELF_ID, dummyConversationIdBetween } from '@pam/config/dummy-conversations';
import { useI18n } from '@/lib/i18n';

const styles = stylex.create({
  // White with a thin grey edge, like the bell and Help (D-216).
  round: {
    width: '48px',
    height: '48px',
    minWidth: '48px',
    borderRadius: '50%',
    paddingInline: '0px',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    color: colorVars['--color-text-primary'],
  },
  saved: { color: colorVars['--color-icon-accent'] },
});

const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;

/**
 * Who to message about a place (D-224): the program lead for it, in the
 * example conversation between them and the example member, while messaging
 * runs on example people; otherwise Messages, where New message is.
 */
export function messageHrefFor(placeName: string): string {
  const lead = DUMMY_PROGRAM_LEADS.find((person) => person.orgName === placeName);
  return lead
    ? `/messages/thread/?id=${encodeURIComponent(dummyConversationIdBetween(DUMMY_SELF_ID.member, lead.id))}`
    : '/messages/';
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
          xstyle={[styles.round, isSaved && styles.saved]}
        />
      ) : null}
      <DropdownMenu
        button={{
          label: t('place.more'),
          isIconOnly: true,
          variant: 'ghost',
          icon: <Icon icon="moreHorizontal" size="md" />,
          xstyle: styles.round,
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
