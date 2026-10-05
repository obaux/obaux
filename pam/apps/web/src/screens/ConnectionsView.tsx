'use client';

import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { BigButton, ConnectionsIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { ConnectionCard, ConnectionStats, type ConnectionStat } from '@pam/ui/ConnectionCard';
import { useI18n } from '@/lib/i18n';

/**
 * Connections — the case manager and program people on a member's side
 * (D-210, as cards since D-213).
 *
 * Exactly the people `can_message()` (0063) relates to the member — their
 * case manager, and a person at each program they are enrolled in — so
 * nobody appears here who could not also be messaged. Each card is a person
 * (Will, 1 October: "focus on people first"), and opens their profile, where
 * the one action is to message them.
 */
export interface Connection {
  readonly id: string;
  readonly firstName: string;
  readonly role: 'admin' | 'provider';
  /** A program admin's organisation, shown under their name. */
  readonly programName?: string | null;
  readonly photoUrl?: string | null;
  /** How they can help — one or two sentences, in the reader's language. */
  readonly help?: string | null;
  readonly yearsHelping?: number;
  readonly peopleHelped?: number;
  /** Written in themselves: "EN · ES". */
  readonly languages?: string;
}

export interface ConnectionsViewProps {
  readonly connections: readonly Connection[];
}

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
  subtitle: { fontSize: '18px', textAlign: 'center' },
  help: { fontSize: '18px', lineHeight: 1.55 },
  heading: { fontSize: '20px', lineHeight: 1.3 },
});

export function connectionSubtitle(person: Connection, t: (key: string) => string): string {
  return person.role === 'provider' ? (person.programName ?? t('role.provider')) : t('role.admin');
}

export function connectionStats(person: Connection, t: (key: string) => string, locale: string): ConnectionStat[] {
  const n = (v: number | undefined) => (v === undefined ? '—' : new Intl.NumberFormat(locale).format(v));
  return [
    { value: n(person.yearsHelping), label: t('connections.stat.years') },
    { value: n(person.peopleHelped), label: t('connections.stat.helped') },
    { value: person.languages ?? '—', label: t('connections.stat.languages') },
  ];
}

export function ConnectionsView({ connections }: ConnectionsViewProps) {
  const { t, locale } = useI18n();
  return (
    <SubPage title={t('connections.title')} backHref="/profile/" backLabel={t('nav.back.profile')}>
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
          <VStack gap={4}>
            {connections.map((person) => {
              const subtitle = connectionSubtitle(person, t);
              return (
                <ConnectionCard
                  key={person.id}
                  name={person.firstName}
                  subtitle={subtitle}
                  photoUrl={person.photoUrl ?? null}
                  help={person.help ?? ''}
                  stats={connectionStats(person, t, locale)}
                  href={`/connections/person/?id=${encodeURIComponent(person.id)}`}
                  label={`${person.firstName}, ${subtitle}`}
                />
              );
            })}
          </VStack>
        </>
      )}
    </SubPage>
  );
}

/**
 * One connection's profile (D-213): who they are, how they can help, the
 * three facts, and one action — message them. On the nested-page template,
 * back to Connections.
 */
export function ConnectionProfileView({
  person,
  messageHref,
}: {
  readonly person: Connection;
  readonly messageHref: string;
}) {
  const { t, locale } = useI18n();
  return (
    <SubPage title={person.firstName} backHref="/connections/" backLabel={t('nav.back.connections')}>
      <VStack gap={2} align="center">
        <Avatar size="xl" name={person.firstName} src={person.photoUrl ?? undefined} tooltip={false} alt="" />
        <Text type="supporting" xstyle={styles.subtitle}>
          {connectionSubtitle(person, t)}
        </Text>
      </VStack>
      <Card padding={4}>
        <ConnectionStats stats={connectionStats(person, t, locale)} />
      </Card>
      {person.help ? (
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.heading}>
            {t('connections.about', { name: person.firstName })}
          </Heading>
          <Text xstyle={styles.help}>{person.help}</Text>
        </VStack>
      ) : null}
      <BigButton label={t('connections.message', { name: person.firstName })} href={messageHref} />
    </SubPage>
  );
}
