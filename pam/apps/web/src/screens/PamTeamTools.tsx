'use client';

import { useEffect, useRef, useState, type ComponentProps } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Button } from '@pam/ui/Button';
import { MenuList } from '@pam/ui/MenuList';
import { MessagesIcon } from '@pam/ui';
import { sheet } from '@pam/ui/sheet';
import { PAM_SAVED_REPLIES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { setPamThreadStatus, usePamInbox } from '@/lib/pam';

/**
 * The Pam team's tools in a Pam conversation (card a100, D-605; Dot's x6). Only the team sees them; the person never does.
 *
 * - **Saved replies:** a button above the composer opens a short list. Picking one puts its words in the composer where the
 *   cursor was, after what was already typed (Iris T2), and nothing is sent until Send. The words are fixed (Sage's, in seven languages), never edited in the app, and carry no
 *   justice words (Sage, fb410c60). The legal reply waits for a lawyer-read list of free legal help, so it is not offered.
 * - **Close and Reopen:** in the conversation's ⋯ screen, never beside the composer. Closing is undone by Reopen, or by
 *   the person writing again, so it asks nothing first.
 */
const styles = stylex.create({
  bar: { paddingInline: '4px' },
  // Clear of the sheet's grab handle, as the New message sheet is.
  sheet: { width: '100%', paddingBlockStart: spacingVars['--spacing-6'], paddingBlockEnd: spacingVars['--spacing-4'] },
  title: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, paddingInline: spacingVars['--spacing-4'] },
  done: { fontSize: '17px', lineHeight: 1.4 },
});

export function PamSavedReplies({ onPick }: { readonly onPick: (text: string) => void }) {
  const { t, tPlain } = useI18n();
  const [open, setOpen] = useState(false);
  const bar = useRef<HTMLDivElement>(null);
  // When the sheet closes, focus goes back to the message box, not to this button (Iris T2): the box is beside it in the composer.
  const box = useRef<HTMLElement | null>(null);
  // The reply goes in once the sheet has really closed. While it is open the page behind it is inert (a modal dialog), so the
  // message box cannot take the focus and the words could not go in where the cursor was. So: wait, frame by frame, until no
  // dialog is open, then put the words in.
  const picked = useRef<string | null>(null);
  const pick = useRef(onPick);
  pick.current = onPick;
  useEffect(() => {
    if (open || picked.current === null) return;
    const text = picked.current;
    picked.current = null;
    let frame = 0;
    let tries = 0;
    const whenClosed = () => {
      if (document.querySelector('dialog[open]') && tries++ < 60) {
        frame = requestAnimationFrame(whenClosed);
        return;
      }
      pick.current(text);
    };
    frame = requestAnimationFrame(whenClosed);
    return () => cancelAnimationFrame(frame);
  }, [open]);
  const openSheet = () => {
    box.current = bar.current?.parentElement?.querySelector<HTMLElement>('[contenteditable="true"]') ?? null;
    setOpen(true);
  };
  return (
    <>
      <HStack ref={bar} gap={2} xstyle={styles.bar}>
        <Button label={t('pam.saved.title')} variant="secondary" onClick={openSheet} />
      </HStack>
      <BottomSheet
        isOpen={open}
        onOpenChange={setOpen}
        label={tPlain('pam.saved.title')}
        height="hug"
        finalFocusRef={box}
        xstyle={sheet.panel}
      >
        {open ? (
          <VStack gap={2} xstyle={styles.sheet}>
            <Heading level={2} xstyle={styles.title}>
              {t('pam.saved.title')}
            </Heading>
            <MenuList
              label={tPlain('pam.saved.title')}
              hasDividers
              items={PAM_SAVED_REPLIES.map((key) => ({
                id: key,
                label: t(key),
                icon: <MessagesIcon width={26} height={26} aria-hidden />,
                onSelect: () => {
                  // What is sent is plain text: no invisible isolates in someone's message (D-435).
                  picked.current = tPlain(key);
                  setOpen(false);
                },
              }))}
            />
          </VStack>
        ) : null}
      </BottomSheet>
    </>
  );
}

type MenuItem = ComponentProps<typeof MenuList>['items'][number];

/**
 * Close or Reopen this Pam conversation, for the ⋯ screen, at the head of one list with the screen's other rows (`more`). Its
 * status is read from the inbox, which the team already has.
 */
export function PamTeamOptions({ conversationId, more = [] }: { readonly conversationId: string; readonly more?: readonly MenuItem[] }) {
  const { t } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const inbox = usePamInbox(true, refresh);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<'closed' | 'reopened' | 'failed' | null>(null);
  const row = inbox.status === 'ready' ? inbox.rows.find((r) => r.conversationId === conversationId) : undefined;
  if (!row) return <MenuList label={t('messages.options.title')} items={[...more]} />;
  const closing = row.status === 'open';

  const act = async () => {
    setBusy(true);
    const result = await setPamThreadStatus(conversationId, closing ? 'closed' : 'open');
    setBusy(false);
    setSaid(result.ok ? (closing ? 'closed' : 'reopened') : 'failed');
    if (result.ok) setRefresh((n) => n + 1);
  };

  return (
    <VStack gap={2}>
      <MenuList
        label={t('messages.options.title')}
        items={[
          {
            id: closing ? 'close' : 'reopen',
            label: t(closing ? 'pam.thread.close' : 'pam.thread.reopen'),
            icon: <MessagesIcon width={26} height={26} aria-hidden />,
            onSelect: busy ? undefined : () => void act(),
          },
          ...more,
        ]}
      />
      {said ? (
        <Text role="status" xstyle={styles.done}>
          {t(said === 'failed' ? 'pam.thread.statusFailed' : said === 'closed' ? 'pam.thread.closed' : 'pam.thread.reopened')}
        </Text>
      ) : null}
    </VStack>
  );
}
