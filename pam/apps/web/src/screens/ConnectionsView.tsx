'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Icon } from '@astryxdesign/core/Icon';
import { List, ListItem } from '@astryxdesign/core/List';
import { Text } from '@astryxdesign/core/Text';
import { ConnectionsIcon, Page, PageTitle } from '@pam/ui';
import { useI18n } from '@/lib/i18n';

/**
 * Connections — the case manager and programs on a member's side (D-210).
 *
 * Reached from Profile's tile. Exactly the people `can_message()` (0063)
 * says this account has a real relationship with — a case manager on whose
 * caseload they are, a program they are enrolled in — so nobody appears here
 * who could not also be messaged. Each row leads to Messages.
 */
export interface Connection {
  readonly id: string;
  readonly firstName: string;
  readonly role: 'admin' | 'provider';
  /** A program admin's organisation, shown under their name. */
  readonly programName?: string | null;
}

export interface ConnectionsViewProps {
  readonly connections: readonly Connection[];
  /** The bell and Help, from the caller. */
  readonly headerActions?: ReactNode;
}

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  row: { minHeight: '72px', fontSize: '18px' },
  list: { width: '100%' },
});

export function ConnectionsView({ connections }: ConnectionsViewProps) {
  const { t } = useI18n();
  return (
    <Page gap={4}>
      <PageTitle title={t('connections.title')} backHref="/profile/" backLabel={t('profile.title')} />
      {connections.length === 0 ? (
        <Card padding={5}>
          <EmptyState
            title={t('connections.empty.title')}
            description={t('connections.empty.body')}
            icon={<ConnectionsIcon width={48} height={48} aria-hidden />}
            headingLevel={2}
          />
        </Card>
      ) : (
        <>
          <Text type="supporting" xstyle={styles.intro}>
            {t('connections.intro')}
          </Text>
          <Card padding={2}>
            <List aria-label={t('connections.title')} xstyle={styles.list}>
              {connections.map((person) => (
                <ListItem
                  key={person.id}
                  label={person.firstName}
                  description={
                    person.role === 'provider' ? (person.programName ?? t('role.provider')) : t('role.admin')
                  }
                  href="/messages/"
                  startContent={<Avatar size="lg" name={person.firstName} tooltip={false} alt="" />}
                  endContent={<Icon icon="chevronRight" size="md" />}
                  xstyle={styles.row}
                />
              ))}
            </List>
          </Card>
        </>
      )}
    </Page>
  );
}
