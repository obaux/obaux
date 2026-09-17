'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Notice } from '@pam/ui';
import { openConversation } from '@/lib/openConversation';

/**
 * A member on a case manager's caseload or in a program's enrollment who has
 * not been messaged yet. Staff-only — a member is never shown this row; see
 * `/messages/page.tsx`.
 *
 * Tapping it does not just navigate — it opens (or finds) the conversation
 * first, because there is no conversation id to link to until one exists. See
 * `openConversation` for why this stays safe under RLS with nothing more than
 * an ordinary insert.
 */
const styles = stylex.create({
  row: { width: '100%', position: 'relative' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  button: {
    color: 'inherit',
    textDecoration: 'none',
    background: 'none',
    border: 'none',
    padding: 0,
    font: 'inherit',
    cursor: 'pointer',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
});

export function StartConversationRow({
  profileId,
  firstName,
  labels,
  supportPhone,
}: {
  readonly profileId: string;
  readonly firstName: string | null;
  readonly labels: {
    readonly someone: string;
    readonly failedTitle: string;
    readonly failedBody: string;
    readonly callSupport: string;
  };
  readonly supportPhone: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const name = firstName ?? labels.someone;

  const start = async () => {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const conversationId = await openConversation(profileId);
    setBusy(false);
    if (!conversationId) {
      setFailed(true);
      return;
    }
    router.push(`/messages/thread/?id=${encodeURIComponent(conversationId)}`);
  };

  return (
    <VStack gap={2}>
      <Card xstyle={styles.row}>
        <HStack gap={3} align="center">
          <Avatar size="lg" name={name} />
          <Heading level={3} xstyle={styles.name}>
            <button type="button" onClick={() => void start()} disabled={busy} {...stylex.props(styles.button)}>
              {name}
            </button>
          </Heading>
        </HStack>
      </Card>
      {failed ? (
        <Notice
          notice="something_went_wrong"
          title={labels.failedTitle}
          body={labels.failedBody}
          supportPhone={supportPhone}
          callLabel={labels.callSupport}
        />
      ) : null}
    </VStack>
  );
}
