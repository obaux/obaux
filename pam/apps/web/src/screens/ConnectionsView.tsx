'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { EmptyState } from '@astryxdesign/core/EmptyState';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { ConnectionsIcon } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { ConnectionCard, type ConnectionStat } from '@pam/ui/ConnectionCard';
import { useI18n } from '@/lib/i18n';

/**
 * Connections — the case manager and program people on a member's side
 * (D-210, as cards since D-213).
 *
 * Exactly the people `can_message()` (0063) relates to the member — their
 * case manager, and a person at each program they are enrolled in — so
 * nobody appears here who could not also be messaged. Each card is a person
 * (Will, 1 October: "focus on people first"). Since D-272 the card is the
 * whole profile — there is no page behind it: message them from the round
 * button, open their program from its name, and see who connected you.
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
  /** The program's place, for the link under the name (D-272). */
  readonly placeId?: string | null;
  /** The example conversation with them, or wherever a message starts. */
  readonly messageHref: string;
  /** Who connected the member to this person — their case manager (D-272). */
  readonly connectedBy?: { readonly firstName: string; readonly photoUrl?: string | null } | null;
}

export interface ConnectionsViewProps {
  readonly connections: readonly Connection[];
}

const styles = stylex.create({
  intro: { fontSize: '18px', lineHeight: 1.5 },
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
                  subtitleHref={
                    person.role === 'provider' && person.placeId
                      ? `/place/?id=${encodeURIComponent(person.placeId)}&from=connections`
                      : null
                  }
                  photoUrl={person.photoUrl ?? null}
                  help={person.help ?? ''}
                  stats={connectionStats(person, t, locale)}
                  messageHref={person.messageHref}
                  messageLabel={t('connections.message', { name: person.firstName })}
                  connectedBy={
                    person.role === 'provider' && person.connectedBy
                      ? {
                          label: t('connections.connectedBy', { name: person.connectedBy.firstName }),
                          name: person.connectedBy.firstName,
                          photoUrl: person.connectedBy.photoUrl ?? null,
                        }
                      : null
                  }
                />
              );
            })}
          </VStack>
        </>
      )}
    </SubPage>
  );
}
