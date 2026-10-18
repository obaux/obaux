'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { BottomSheet } from '@astryxdesign/core/BottomSheet';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
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
 * - **Saved replies:** a button under the person's name opens a short list. Picking one puts its words in the composer, and
 *   nothing is sent until Send. The words are fixed (Sage's, in seven languages), never edited in the app, and carry no
 *   justice words (Sage, fb410c60). The legal reply waits for a lawyer-read list of free legal help, so it is not offered.
 * - **Close and Reopen:** in the conversation's ⋯ screen, never beside the composer. Closing is undone by Reopen, or by
 *   the person writing again, so it asks nothing first.
 */
const styles = stylex.create({
  bar: { paddingInline: '4px' },
  sheet: { paddingInline: '20px', paddingBlock: '8px 24px' },
  title: { fontSize: '22px', lineHeight: 1.3, fontWeight: 700 },
  done: { fontSize: '17px', lineHeight: 1.4 },
});

export function PamSavedReplies({ onPick }: { readonly onPick: (text: string) => void }) {
  const { t, tPlain } = useI18n();
  const [open, setOpen] = useState(false);
  return (
    <>
      <HStack gap={2} xstyle={styles.bar}>
        <Button label={t('pam.saved.title')} variant="secondary" onClick={() => setOpen(true)} />
      </HStack>
      <BottomSheet isOpen={open} onOpenChange={setOpen} label={tPlain('pam.saved.title')} height="hug" xstyle={sheet.panel}>
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
                  onPick(tPlain(key));
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

/** Close or Reopen this Pam conversation, for the ⋯ screen. Its status is read from the inbox, which the team already has. */
export function PamTeamOptions({ conversationId }: { readonly conversationId: string }) {
  const { t } = useI18n();
  const [refresh, setRefresh] = useState(0);
  const inbox = usePamInbox(true, refresh);
  const [busy, setBusy] = useState(false);
  const [said, setSaid] = useState<'closed' | 'reopened' | 'failed' | null>(null);
  const row = inbox.status === 'ready' ? inbox.rows.find((r) => r.conversationId === conversationId) : undefined;
  if (!row) return null;
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
        label={t('pam.inbox.title')}
        items={[
          {
            id: closing ? 'close' : 'reopen',
            label: t(closing ? 'pam.thread.close' : 'pam.thread.reopen'),
            icon: <MessagesIcon width={26} height={26} aria-hidden />,
            onSelect: busy ? undefined : () => void act(),
          },
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
