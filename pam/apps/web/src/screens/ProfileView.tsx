'use client';

import type { ReactNode } from 'react';
import { VStack } from '@astryxdesign/core/VStack';
import { Divider } from '@astryxdesign/core/Divider';
import { LANGUAGE_TAGS, badgeForPoints, type Role, intlLocale } from '@pam/config';
import {
  BellIcon,
  FlagIcon,
  GlobeIcon,
  HelpIcon,
  LegalIcon,
  Page,
  PeopleIcon,
  PlacesIcon,
  ShieldIcon,
  SignOutIcon,
} from '@pam/ui';
import { Banner } from '@astryxdesign/core/Banner';
import { LargeTitleHeader } from '@pam/ui/LargeTitleHeader';
import { FeatureTile, FeatureTileRow, ProfileSummary, PromoCard } from '@pam/ui/ProfileCards';
import { SetupArt } from '@pam/ui/SetupArt';
import { BadgeArt, ConnectionsArt } from '@pam/ui/BadgeArt';
import { MenuList } from '@pam/ui/MenuList';
import { useI18n } from '@/lib/i18n';

/**
 * Profile — the redesign's first screen (D-210, Will, 1 October).
 *
 * Who you are and your numbers; two doors (your award level since D-274, and Connections — the
 * case manager and programs on your side); one offer (text reminders); then
 * a plain list. Since D-213 the list is shorter: Language (the one thing the
 * old Account screen held that Profile did not), text reminders once they
 * are on, Get help, Legal (terms, privacy and who can see what, behind one
 * row), and sign out. The Account screen is gone from the redesign.
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
  /**
   * A super admin's own account, whatever role it is previewing — keeps the
   * "See the app as" row, so a preview is never a one-way door (D-217).
   */
  readonly canViewAs?: boolean;
  /**
   * A member who also works at a program (D-374): the "Use Pam as" row,
   * which opens its own page. Never shown to a single-role account.
   */
  readonly canUseAs?: boolean;
  /** This account's photo (D-345). */
  readonly photoUrl?: string | null;
  /** Staff only: a photo was picked from the camera button. */
  readonly onPhotoPick?: (file: File) => void;
  readonly isPhotoBusy?: boolean;
  /** Said under the card when a photo did not upload. */
  readonly photoNotice?: string | null;
}

const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

export function ProfileView({
  name,
  role,
  points,
  savedCount,
  connectionsCount,
  remindersOn,
  headerActions,
  onSignOut,
  canViewAs = false,
  canUseAs = false,
  photoUrl = null,
  onPhotoPick,
  isPhotoBusy = false,
  photoNotice = null,
}: ProfileViewProps) {
  const { t, locale } = useI18n();
  const number = (n: number) => new Intl.NumberFormat(intlLocale(locale)).format(n);
  const isMember = role === 'member';

  const staffRows = [
    // Invite someone, a second way in for a case manager beside the strip
    // on Home (D-226); the super admin's only way in (D-315).
    ...(role === 'admin' || role === 'super_admin'
      ? [{ id: 'invite', label: t('profile.menu.invite'), href: '/invite/', icon: <PeopleIcon {...ICON} /> }]
      : []),
    // Every program, a secondary path for staff (D-218): where to look one
    // up, save it, or add a new one.
    // A super admin too, now that Home is their requests (D-257).
    ...(role === 'admin' || role === 'provider' || role === 'super_admin'
      ? [
          {
            id: 'programs',
            // A program lead browses the others: "Programs in Pam" (D-237).
            label: t(role === 'provider' ? 'profile.menu.programsInPam' : 'profile.menu.programs'),
            href: '/programs/',
            icon: <PlacesIcon {...ICON} />,
          },
        ]
      : []),
    ...(role === 'super_admin'
      ? [
          { id: 'everyone', label: t('profile.menu.everyone'), href: '/directory/', icon: <PeopleIcon {...ICON} /> },
          { id: 'requests', label: t('profile.menu.requests'), href: '/requests/', icon: <ShieldIcon {...ICON} /> },
        ]
      : []),
    // The places somebody reported, for the people who review them (D-189):
    // a nested screen, also reached from the bell's "a place was reported" row.
    ...(role === 'admin' || role === 'super_admin'
      ? [{ id: 'reported', label: t('places.reported.title'), href: '/places/reported/', icon: <FlagIcon {...ICON} /> }]
      : []),
    ...(canViewAs
      ? [{ id: 'view-as', label: t('profile.menu.viewAs'), href: '/view-as/', icon: <GlobeIcon {...ICON} /> }]
      : []),
  ];

  return (
    <Page gap={4}>
      <LargeTitleHeader title={t('profile.title')} actions={headerActions} />

      <ProfileSummary
        name={name}
        roleLabel={t(`role.${role}`)}
        photoUrl={photoUrl}
        // Staff put up their own face (Will, D-345); a member's stays theirs.
        {...(!isMember && onPhotoPick
          ? { onPhotoPick, photoLabel: t(photoUrl ? 'profile.photo.change' : 'profile.photo.add'), isPhotoBusy }
          : {})}
        stats={
          isMember
            ? [
                { value: number(points), label: t('profile.stat.points') },
                { value: number(savedCount), label: t('profile.stat.saved') },
                { value: number(connectionsCount), label: t('profile.stat.connections') },
              ]
            : []
        }
      />
      {photoNotice ? <Banner status="warning" title={photoNotice} /> : null}

      {/*
        Points, trips and connections are a member's (D-217): staff are not
        given points, do not plan visits, and are the connections. Their
        Profile is who they are, their tools, and the same settings.
      */}
      {isMember ? (
        <FeatureTileRow>
          {/*
            Their award, not past trips (Will, 5 October, D-274): the rung of
            the ladder their points have reached — the same names as Points
            (D-278: it said "Getting Going" while Points said "Rooted") —
            opening Points. Past visits are still on Trips.
          */}
          <FeatureTile
            label={t(badgeForPoints(points).labelKey)}
            hint={t('profile.tile.badgeHint')}
            href="/points/"
            // The level's own picture (D-295) — Rooted is a seedling.
            art={<BadgeArt badgeKey={badgeForPoints(points).key} size={88} shape="square" />}
          />
          <FeatureTile label={t('profile.tile.connections')} href="/connections/" art={<ConnectionsArt size={88} />} />
        </FeatureTileRow>
      ) : null}

      {remindersOn || role === 'super_admin' ? null : (
        // A member is reminded about visits they plan; staff plan none, so
        // theirs is an alert when somebody needs them (Will, 3 October, D-256).
        // The person running Pam has neither: Text alerts and Reminders are
        // for the roles that get them, and /alerts/ would treat them as a
        // member (D-444).
        <PromoCard
          title={t(role === 'admin' || role === 'provider' ? 'profile.promo.alerts.title' : 'profile.promo.reminders.title')}
          body={t(
            role === 'admin'
              ? 'profile.promo.alerts.body.adminList'
              : role === 'provider'
                ? 'profile.promo.alerts.body.providerList'
                : 'profile.promo.reminders.body',
          )}
          // Staff choose per kind on Text alerts (D-256, D-260). A member's
          // first yes is still the reminders screen — the one the SMS carrier
          // reviewed — and their switches are a row in settings after that.
          href={role === 'member' ? '/reminders/' : '/alerts/'}
          // A bell, for texts, for everyone (D-274) — drawn now, in the
          // illustration set, not an icon on a tint (Will, 7 October, D-360).
          art={<SetupArt kind="alerts" size={72} />}
        />
      )}

      <VStack gap={2}>
        {/*
          The staff screens that are not a tab (D-217): a case manager's
          invites, a super admin's Everyone and staff requests, and the role
          preview. They lived on the old home's tiles; Profile is where an
          account's own tools are now.
        */}
        {staffRows.length > 0 ? (
          <>
            <MenuList label={t('profile.menu.label')} items={staffRows} />
            <Divider />
          </>
        ) : null}
        <MenuList
          label={t('profile.menu.label')}
          items={[
            // First, so the side you are on is the first thing the settings
            // say (D-374); a page of its own, so nobody switches by accident.
            ...(canUseAs
              ? [
                  {
                    id: 'use-as',
                    label: t('profile.menu.useAs'),
                    value: t(role === 'provider' ? 'useAs.provider' : 'useAs.member'),
                    href: '/use-as/',
                    icon: <PeopleIcon {...ICON} />,
                  },
                ]
              : []),
            {
              id: 'language',
              label: t('profile.menu.language'),
              value: t(`language.${locale}`),
              valueTag: LANGUAGE_TAGS[locale],
              valueLang: locale,
              href: '/language/',
              icon: <GlobeIcon {...ICON} />,
            },
            ...(remindersOn
              ? [
                  {
                    id: 'reminders',
                    label: t('profile.menu.reminders'),
                    // One switch per kind, for everyone (D-260).
                    href: '/alerts/',
                    icon: <BellIcon {...ICON} />,
                  },
                ]
              : []),
            { id: 'help', label: t('profile.menu.help'), href: '/help/', icon: <HelpIcon {...ICON} /> },
          ]}
        />
        <Divider />
        <MenuList
          label={t('profile.menu.label')}
          items={[
            { id: 'legal', label: t('profile.menu.legal'), href: '/legal/', icon: <LegalIcon {...ICON} /> },
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
