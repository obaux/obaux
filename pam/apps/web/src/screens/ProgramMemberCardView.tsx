'use client';

import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { useRouter } from 'next/navigation';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { List, ListItem } from '@astryxdesign/core/List';
import { BigButton, Loading, MessagesIcon, Notice, Page } from '@pam/ui';
import { DataHeading } from '@pam/ui/DataHeading';
import { MenuList } from '@pam/ui/MenuList';
import { intlLocale } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { openConversation } from '@/lib/openConversation';
import { useProgramMemberCard } from '@/lib/useProgramMemberCard';

/**
 * What a program lead sees of a member linked to their program (D-542, Will 11 October): their first name, the visits planned
 * at THEIR program, and a way to message them. No last name, phone, photo, points, last active or other programs; the database
 * (`program_member_card`) does not return them, so this screen could not show them if it tried.
 */
const styles = stylex.create({
  name: { fontSize: '28px', lineHeight: 1.2 },
  section: { fontSize: '20px' },
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

export function ProgramMemberCardView({ id, header }: { readonly id: string | null; readonly header: (title: string) => ReactNode }) {
  const { t, tPlain, locale } = useI18n();
  const router = useRouter();
  const state = useProgramMemberCard(id, true);

  if (state.status === 'loading') {
    return (
      <Page gap={3}>
        {header(t('person.profile'))}
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (state.status === 'not-linked') {
    return (
      <Page gap={4}>
        {header(t('person.notFound.title'))}
        <Notice
          notice="service_not_available"
          title={t('person.notFound.title')}
          body={t('person.notFound.body')}
          contactLabel={t('help.contact.action')}
        />
        <BigButton label={t('nav.back.home')} href="/" />
      </Page>
    );
  }

  const { card } = state;
  const now = Date.now();
  const upcoming = card.visits.filter((v) => new Date(v.startsAt).getTime() >= now);
  const when = (iso: string) =>
    `${new Intl.DateTimeFormat(intlLocale(locale), { weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso))} · ${new Intl.DateTimeFormat(intlLocale(locale), { hour: 'numeric', minute: '2-digit' }).format(new Date(iso))}`;
  const message = () => {
    void openConversation(card.memberId).then((conversation) =>
      router.push(conversation ? `/messages/thread/?id=${encodeURIComponent(conversation)}` : '/messages/'),
    );
  };

  return (
    <Page gap={4}>
      {header(t('person.profile'))}
      <DataHeading level={1} xstyle={styles.name}>
        {card.firstName}
      </DataHeading>
      <MenuList
        label={tPlain('person.actions.label', { name: card.firstName })}
        items={[
          {
            id: 'message',
            label: t('person.message.action', { name: card.firstName }),
            icon: <MessagesIcon width={26} height={26} />,
            onSelect: message,
          },
        ]}
      />
      <VStack gap={3}>
        <Heading level={2} xstyle={styles.section}>
          {t('person.visits.title')}
        </Heading>
        {upcoming.length > 0 ? (
          <List hasDividers density="spacious" aria-label={t('person.visits.title')}>
            {upcoming.map((v) => (
              <ListItem key={v.id} label={when(v.startsAt)} {...(v.serviceName ? { description: v.serviceName } : {})} />
            ))}
          </List>
        ) : (
          <Text type="supporting" xstyle={styles.meta}>
            {t('person.visits.none')}
          </Text>
        )}
      </VStack>
      <Text type="supporting" xstyle={styles.note}>
        {t('person.card.note')}
      </Text>
    </Page>
  );
}
