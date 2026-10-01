'use client';

import type { ReactNode } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Divider } from '@astryxdesign/core/Divider';
import type { Role } from '@pam/config';
import {
  ConnectionsIcon,
  HelpIcon,
  LegalIcon,
  Page,
  SettingsIcon,
  ShieldIcon,
  SignOutIcon,
  StarIcon,
  TripsIcon,
} from '@pam/ui';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { FeatureTile, FeatureTileRow, ProfileSummary, PromoCard } from '@pam/ui/ProfileCards';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';

/**
 * Profile — the redesign's first screen (D-210, Will, 1 October).
 *
 * Who you are and your numbers; two doors (past trips, and Connections — the
 * case manager and programs on your side); one offer (text reminders); then
 * a plain list: settings, help, what others can see, privacy, terms, sign out.
 *
 * A view, not a route yet: it takes what it shows as props, so Storybook can
 * draw every state and the data wiring lands when the redesign is agreed.
 */
export interface ProfileViewProps {
  readonly name: string;
  readonly role: Role;
  readonly points: number;
  readonly savedCount: number;
  readonly connectionsCount: number;
  /** Whether this account has said yes to text reminders. */
  readonly remindersOn: boolean;
  /** The bell and Help, from the caller — they read live data. */
  readonly headerActions: ReactNode;
  readonly onSignOut?: () => void;
}

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;
const ART = { width: 44, height: 44, 'aria-hidden': true } as const;

export function ProfileView({
  name,
  role,
  points,
  savedCount,
  connectionsCount,
  remindersOn,
  headerActions,
  onSignOut,
}: ProfileViewProps) {
  const { t, locale } = useI18n();
  const number = (n: number) => new Intl.NumberFormat(locale).format(n);

  return (
    <Page gap={4}>
      <LargeTitleHeader title={t('profile.title')} actions={headerActions} />

      <ProfileSummary
        name={name}
        roleLabel={t(`role.${role}`)}
        stats={[
          { value: number(points), label: t('profile.stat.points') },
          { value: number(savedCount), label: t('profile.stat.saved') },
          { value: number(connectionsCount), label: t('profile.stat.connections') },
        ]}
      />

      <FeatureTileRow>
        <FeatureTile label={t('profile.tile.trips')} href="/trips/" art={<TripsIcon {...ART} />} />
        <FeatureTile
          label={t('profile.tile.connections')}
          href="/connections/"
          art={<ConnectionsIcon {...ART} />}
        />
      </FeatureTileRow>

      {remindersOn ? null : (
        <PromoCard
          title={t('profile.promo.reminders.title')}
          body={t('profile.promo.reminders.body')}
          href="/reminders/"
          art={<StarIcon {...ART} />}
        />
      )}

      <VStack gap={2}>
        <MenuList
          label={t('profile.menu.label')}
          items={[
            { id: 'account', label: t('profile.menu.account'), href: '/account/', icon: <SettingsIcon {...ICON} /> },
            { id: 'help', label: t('profile.menu.help'), href: '/help/', icon: <HelpIcon {...ICON} /> },
            {
              id: 'visibility',
              label: t('profile.menu.visibility'),
              href: '/privacy/#who-can-see',
              icon: <ShieldIcon {...ICON} />,
            },
          ]}
        />
        <Divider />
        <MenuList
          label={t('profile.menu.label')}
          items={[
            { id: 'privacy', label: t('profile.menu.privacy'), href: '/privacy/', icon: <LegalIcon {...ICON} /> },
            { id: 'terms', label: t('profile.menu.terms'), href: '/terms/', icon: <LegalIcon {...ICON} /> },
            {
              id: 'sign-out',
              label: t('profile.menu.signOut'),
              onSelect: onSignOut,
              icon: <SignOutIcon {...ICON} />,
            },
          ]}
        />
      </VStack>
    </Page>
  );
}
