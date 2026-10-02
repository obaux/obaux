'use client';

import { useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { HStack } from '@astryxdesign/core/HStack';
import { IconButton } from '@astryxdesign/core/IconButton';
import { List } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { ExploreIcon, MessagesIcon, NoResultsIcon, Page } from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { SearchField } from '@pam/ui/SearchPill';
import { useI18n } from '@/lib/i18n';
import { Avatar } from '@astryxdesign/core/Avatar';
import { ListItem } from '@astryxdesign/core/List';
import { VisuallyHidden } from '@astryxdesign/core/VisuallyHidden';

/**
 * Messages, on the tab-screen frame (D-213, from the references Will gave on
 * 1 October): the large title that shrinks into the bar as the list scrolls
 * — the same frame as Saved and Profile — with search, the bell and Help in
 * the bar.
 *
 * **Search** takes over the top of the screen: the title gives way to one
 * field, focused, and a Cancel that puts it back. The list narrows as you
 * type (a name, or words from the last message); nothing is sent anywhere —
 * the list is already on the phone. Nothing found says so, with the way out.
 *
 * **Empty** — nobody has written yet — says who will, in the reader's terms.
 */
export interface MessageRow {
  readonly id: string;
  readonly name: string;
  readonly context: string | null;
  readonly preview: string;
  readonly when: string | null;
  readonly unread: boolean;
  readonly href: string;
}

export interface MessagesViewProps {
  readonly rows: readonly MessageRow[];
  /** The empty state's line — what a member, or staff, should expect. */
  readonly emptyBody: string;
  /** The bell and Help. */
  readonly headerActions?: ReactNode;
  /** Under the list — "These are example people". */
  readonly note?: string | null;
  /** Open in search mode (for a story). */
  readonly initialSearch?: string | null;
}

const styles = stylex.create({
  round: {
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    flexShrink: 0,
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  searchRow: {
    position: 'sticky',
    top: 0,
    zIndex: 5,
    marginTop: '-12px',
    paddingBlock: '12px 8px',
    backgroundColor: colorVars['--color-background-body'],
  },
  field: { flexGrow: 1, minWidth: 0 },
  cancel: { flexShrink: 0, fontSize: '17px', fontWeight: 600 },
  state: { paddingBlock: '48px' },
  stateIcon: { width: '64px', height: '64px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  list: { width: '100%' },
  // The row Will picked (1 October): name, one quiet line, a subtle time.
  name: { fontSize: '18px', lineHeight: 1.3 },
  nameUnread: { fontWeight: 700 },
  line: {
    fontSize: '16px',
    lineHeight: 1.35,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  when: { fontSize: '13px', whiteSpace: 'nowrap', alignSelf: 'flex-start', paddingBlockStart: '4px' },
  row: { minHeight: '72px' },
});

/**
 * One conversation: the avatar, the name, one line under it — who they are to
 * you (a member's case manager, a program's name), or for staff, the last
 * thing said — and the time, quietly, at the end. Unread is the name in bold,
 * and said aloud. Nothing else: no badge, no chevron.
 */
function MessageListRow({ row, newLabel }: { readonly row: MessageRow; readonly newLabel: string }) {
  return (
    <ListItem
      href={row.href}
      startContent={<Avatar size="lg" name={row.name} tooltip={false} alt="" />}
      label={
        <Text xstyle={[styles.name, row.unread && styles.nameUnread]}>
          {row.name}
          {row.unread ? <VisuallyHidden>, {newLabel}</VisuallyHidden> : null}
        </Text>
      }
      description={
        <Text type="supporting" xstyle={styles.line}>
          {row.context ?? row.preview}
        </Text>
      }
      endContent={
        row.when ? (
          <Text type="supporting" xstyle={styles.when}>
            {row.when}
          </Text>
        ) : undefined
      }
      xstyle={styles.row}
    />
  );
}

const matches = (row: MessageRow, text: string) => {
  const q = text.trim().toLowerCase();
  return !q || `${row.name} ${row.context ?? ''} ${row.preview}`.toLowerCase().includes(q);
};

export function MessagesView({ rows, emptyBody, headerActions, note, initialSearch = null }: MessagesViewProps) {
  const { t } = useI18n();
  const [query, setQuery] = useState<string | null>(initialSearch);
  const searching = query !== null;
  const shown = rows.filter((row) => matches(row, query ?? ''));

  return (
    <Page gap={4}>
      {searching ? (
        <HStack gap={2} align="center" wrap="nowrap" xstyle={styles.searchRow}>
          <VStack xstyle={styles.field}>
            <SearchField
              label={t('messages.search.label')}
              placeholder={t('messages.search.placeholder')}
              value={query ?? ''}
              onChange={setQuery}
              hasAutoFocus
            />
          </VStack>
          <Button label={t('messages.search.cancel')} variant="ghost" onClick={() => setQuery(null)} xstyle={styles.cancel} />
        </HStack>
      ) : (
        <LargeTitleHeader
          title={t('messages.title')}
          actions={
            <>
              <IconButton
                label={t('messages.search.open')}
                variant="ghost"
                icon={
                  <HStack>
                    <ExploreIcon width={22} height={22} aria-hidden />
                  </HStack>
                }
                onClick={() => setQuery('')}
                xstyle={styles.round}
              />
              {headerActions}
            </>
          }
        />
      )}

      {rows.length === 0 && !searching ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<MessagesIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t('messages.empty.redesign.title')}
          description={emptyBody}
        />
      ) : null}

      {searching && shown.length === 0 ? (
        <EmptyState
          headingLevel={2}
          xstyle={styles.state}
          icon={<NoResultsIcon {...stylex.props(styles.stateIcon)} aria-hidden />}
          title={t('messages.search.empty.title')}
          description={t('messages.search.empty.body')}
          actions={<Button label={t('explore.search.clear')} variant="secondary" onClick={() => setQuery('')} />}
        />
      ) : null}

      {shown.length > 0 ? (
        <VStack gap={2}>
          <List hasDividers xstyle={styles.list}>
            {shown.map((row) => (
              <MessageListRow key={row.id} row={row} newLabel={t('notify.new')} />
            ))}
          </List>
          {note ? (
            <Text type="supporting" xstyle={styles.note}>
              {note}
            </Text>
          ) : null}
        </VStack>
      ) : null}
    </Page>
  );
}
