'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import type { RankedPerson } from '@pam/config/people-activity';
import { TextLink } from '@pam/ui';
import { PeopleStrip } from '@pam/ui/PeopleStrip';
import { useI18n } from '@/lib/i18n';

/**
 * The people strip on Home, drawn from a ranked list (D-198): a heading, a
 * "see all" link to the full screen, the strip itself, and — for the
 * example set only — the note saying so. `HomePeople` (real accounts) and
 * `HomePeoplePreview` (a super admin's preview) both render this, so the
 * two cannot look different.
 *
 * Where a tap goes is decided here from the ring's reason: an unread
 * message opens that conversation, because it is the thing waiting for an
 * answer; a new save, or no ring, opens the person. The conversation id is
 * the caller's — real from `useConversations`, or an example
 * `dummy-conv-…` id the thread screen recognises.
 */

const styles = stylex.create({
  section: { fontSize: '17px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export interface HomePeopleSectionPerson {
  readonly id: string;
  readonly firstName: string;
  /** The conversation with an unread message from them, when `reason` is `message`. */
  readonly conversationId: string | null;
}

export const CONTENT: Record<
  'admin' | 'super_admin' | 'provider',
  { readonly titleKey: string; readonly seeAllHref: string }
> = {
  admin: { titleKey: 'admin.members.title', seeAllHref: '/admin/' },
  super_admin: { titleKey: 'directory.title', seeAllHref: '/directory/' },
  provider: { titleKey: 'interested.title', seeAllHref: '/interested/' },
};

export function HomePeopleSection({
  role,
  ranked,
  isExample,
}: {
  readonly role: 'admin' | 'super_admin' | 'provider';
  readonly ranked: readonly RankedPerson<HomePeopleSectionPerson>[];
  readonly isExample: boolean;
}) {
  const { t } = useI18n();
  const { titleKey, seeAllHref } = CONTENT[role];

  return (
    <VStack gap={2}>
      <HStack gap={2} align="center" justify="between" wrap="nowrap">
        <Heading level={2} xstyle={styles.section}>
          {t(titleKey)}
        </Heading>
        <TextLink label={t('saved.seeAll')} href={seeAllHref} size="quiet" />
      </HStack>
      <PeopleStrip
        label={t(titleKey)}
        people={ranked.map(({ person, reason }) => ({
          id: person.id,
          firstName: person.firstName,
          href:
            reason === 'message' && person.conversationId
              ? `/messages/thread/?id=${encodeURIComponent(person.conversationId)}`
              : `/person/?id=${encodeURIComponent(person.id)}`,
          hasActivity: reason !== null,
          activityLabel: reason ? t(`people.new.${reason}`) : undefined,
        }))}
      />
      {isExample ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('example.people.note')}
        </Text>
      ) : null}
    </VStack>
  );
}
