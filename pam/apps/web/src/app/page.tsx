'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import * as stylex from '@stylexjs/stylex';
import {
  AppHeader,
  CardEnter,
  HelpBar,
  Loading,
  NavTile,
  Notice,
  Page,
  PageEnter,
  PeopleIcon,
  PlacesIcon,
  Press,
  StarIcon,
  TextLink,
} from '@pam/ui';
import { categoryLabelKey, NOTICES, ROLES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from './NotIn';
import { HeaderBell } from './HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useDemoView } from '@/lib/useDemoView';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { usePoints } from '@/lib/usePoints';
import { useViewAs } from '@/lib/useViewAs';
import { SavedStripLazy } from './SavedStripLazy';
import { RoleSwitchLazy } from './RoleSwitchLazy';
import { HomePeoplePreviewLazy } from './HomePeoplePreviewLazy';

/**
 * Home.
 *
 * This route was the Phase 0 demo — every component rendered once against real
 * strings, with sample places and a points counter wired to a `+100` button. It
 * proved the foundation and then stayed up long enough to be the first thing a
 * member would have seen, which is a demo asking somebody to trust it with
 * their phone number.
 *
 * What replaces it is a menu, and nothing else. PAM's home is not a feed and
 * not a dashboard of numbers: it is the shortest list of places to go, each one
 * named in the member's own words, with what is waiting shown as a count rather
 * than implied by a coloured dot. Points, a plan and a next step belong here
 * eventually (§3.1) — when there is a real one to show. A home screen that
 * invents its own content is worse than a short one.
 *
 * Every piece is from the component library: `AppHeader`, `NotificationBell`,
 * `NavTile`, `Notice`, `HelpBar`, and the icon set. Nothing is
 * styled here that is not layout, and no sentence on the screen is typed into
 * this file — every string comes through i18n, so Spanish keeps up key for key.
 *
 * Role decides the tiles, not the route: a case manager gets their caseload, a
 * member gets places. Both get the same screen underneath, which is what makes
 * the role chip in the header worth having.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  intro: { fontSize: '18px', lineHeight: 1.5 },
  section: { fontSize: '17px' },
  // A chip, not a call to action: 48px to hit like everything else, and quiet
  // enough that it does not compete with the tiles below it.
  points: { minHeight: '48px', fontSize: '15px' },
});

export default function HomePage() {
  const { t } = useI18n();
  const router = useRouter();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  /*
   * Nobody signed in has no reason to see Home at all (Will, 17 September:
   * "kill this screen... just go straight to login screen") — the door was
   * already the one thing this screen offered somebody in that state, so
   * skipping straight to it removes a stop, not a choice. `no-profile` and
   * `suspended` stay on this screen below: neither is "not logged in" —
   * one is mid-signup, the other is a paused account — and each needs its
   * own explanation `NotIn` gives, not a silent redirect.
   */
  useEffect(() => {
    if (session.status === 'signed-out') router.replace('/signin/');
  }, [session.status, router]);

  const signedIn = session.status === 'signed-in';
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewAs, setViewAs } = useViewAs(trueRole);
  // See useSavedPlaces: a preview is a demo, not a second account. Only a
  // super admin can ever have `viewAs` set at all (useViewAs enforces that),
  // so this only ever routes real members' and staff's own saves for real.
  const demoRole = viewAs && viewAs !== trueRole ? viewAs : null;
  const isDemo = useDemoView(session);
  const { state: saved, unsave, failed: saveFailed } = useSavedPlaces(
    signedIn,
    demoRole ?? (isDemo ? trueRole : null),
  );
  const points = usePoints(session.status === 'signed-in' ? session.session.userId : null);

  /*
   * The first paint, before the session is known — and the whole screen for
   * anybody whose JavaScript never runs.
   *
   * It carries the way to get help, which is not decoration here: this state is
   * what a dying connection actually shows somebody, and a screen with nothing
   * on it but the word "loading" is the dead end §0 forbids.
   *
   * It does not offer sign-in. Whether that is the right next step is exactly
   * what is still being worked out, and a link that may be about to be replaced
   * by a different one in the same place is how somebody ends up tapping the
   * wrong thing.
   */
  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  if (session.status === 'error') {
    const key = session.offline ? 'offline' : 'something_went_wrong';
    return (
      <Page gap={4}>
        <AppHeader />
        <Notice
          notice={key}
          title={t(NOTICES[key].titleKey)}
          body={t(NOTICES[key].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  /*
   * The redirect above hasn't landed yet (or JavaScript never runs at all,
   * where it never will) — same shape as the `loading` state above, so
   * somebody on a slow connection sees "something is happening," not a
   * flash of a screen about to be replaced. Never a dead end either way:
   * the help bar is still here for whoever's redirect this is not.
   */
  if (session.status === 'signed-out') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  /*
   * Half signed up, or paused. Say what PAM is for in one line and explain
   * the one thing that's true for that person — a verified phone with no
   * account yet, or a paused account and the way to sign out. No tiles,
   * because either one would ask for a sign-in on arrival.
   */
  if (session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <VStack gap={1}>
          <Heading level={1} xstyle={styles.title}>
            {t('app.name')}
          </Heading>
          <Text type="supporting" xstyle={styles.intro}>
            {t('app.tagline')}
          </Text>
        </VStack>
        <NotIn status={session.status} title={t('app.name')} body={t('app.tagline')} />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  const { session: me } = session;

  /*
   * A super admin can look at the screen the way each role gets it (D-108).
   * `viewAs` changes what is drawn and nothing else: every query above already
   * ran, as them, under the same rules. Nobody else's data is anywhere near
   * this screen.
   */
  const viewed = viewAs ?? me.role;
  const isCaseManager = viewed === 'admin';
  const isSuperAdmin = viewed === 'super_admin';
  const isProvider = viewed === 'provider';

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${viewed}`)}
        roleControl={
          me.role === 'super_admin' ? (
            <RoleSwitchLazy
              value={viewed}
              ownValue={me.role}
              label={t('view.switch')}
              viewingLabel={(roleLabel) => t('view.as', { role: roleLabel })}
              options={ROLES.map((role) => ({ value: role, label: t(`role.${role}`) }))}
              onChange={(next) => setViewAs(next as typeof me.role)}
            />
          ) : undefined
        }
        trailing={<HeaderBell enabled={signedIn} role={viewed} />}
      />

      {/*
        Their own name if PAM has one. It often does not — a member can be
        invited and signed in before onboarding asks — so the fallback is the
        screen's plain name rather than "Hi, there", which reads like a mail
        merge that failed.
      */}
      {/*
        The name and the points on one line (Will, 13 September). The balance is
        a link to the points screen, which is where the badges and the ladder
        are — a number with nowhere to go is a number nobody believes.

        It is absent, not zero, while the balance is unknown or the call fails.
        A points chip is the least important thing on this screen and a "0" that
        turns into "35" a second later reads as losing something.
      */}
      <HStack gap={2} align="center" justify="between" wrap="wrap">
        <Heading level={1} xstyle={styles.title}>
          {me.firstName ? t('home.greeting', { name: me.firstName }) : t('home.title')}
        </Heading>
        {points !== null ? (
          <Button
            label={t('points.summary', { count: points })}
            variant="secondary"
            href="/points/"
            icon={<StarIcon />}
            xstyle={styles.points}
          />
        ) : null}
      </HStack>

      {/*
        The places they kept, before the menu. Somebody who has saved anything
        has said what matters to them, and a home screen that makes them tap
        twice to see it is a home screen answering its own questions first.
      */}
      {saved.status === 'ready' && saved.places.length > 0 ? (
        <VStack gap={2}>
          <HStack gap={2} align="center" justify="between" wrap="nowrap">
            <Heading level={2} xstyle={styles.section}>
              {t('saved.title')}
            </Heading>
            <TextLink label={t('saved.seeAll')} href="/saved/" size="quiet" />
          </HStack>
          <SavedStripLazy
            places={saved.places.map((place) => ({
              id: place.id,
              name: place.name,
              categoryLabel: t(categoryLabelKey(place.category)),
              href: `/place/?id=${encodeURIComponent(place.id)}&from=home`,
            }))}
            label={t('saved.title')}
            removeLabel={(name) => t('saved.remove', { name })}
            onRemove={(id) => void unsave(id)}
          />
        </VStack>
      ) : null}

      {saveFailed ? (
        <Notice
          notice="something_went_wrong"
          title={t('saved.failed.title')}
          body={t('saved.failed.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {/*
        A taste of the people list, while previewing a role that has one
        (Will, 16 September: "pull in the dummy names for viewing modes into
        the dashboard home page"). Only while a preview is genuinely active —
        `demoRole` — never for a real account's own Home, real or empty; the
        full example roster already lives on the screen each role tile below
        leads to. A member's own preview shows nothing here: a member has no
        people list to preview.
      */}
      {demoRole === 'admin' || demoRole === 'super_admin' || demoRole === 'provider' ? (
        <HomePeoplePreviewLazy role={demoRole} />
      ) : null}

      {/*
        Two tiles came off this screen (Will, 14 September). Notifications is
        the bell in the header — the same destination twice is a menu arguing
        with itself. Text reminders belongs to signing up: it is the one
        question PAM asks once, and a permanent tile invites somebody to
        re-answer a decision that is already made.
      */}
      <VStack gap={2}>
        {isCaseManager ? (
          <NavTile
            href="/admin/"
            icon={<PeopleIcon />}
            label={t('admin.title')}
            description={t('home.go.caseload')}
          />
        ) : null}

        {/*
          A super admin's list is everybody, not a caseload — a different screen
          with a different promise behind it (D-101).
        */}
        {isSuperAdmin ? (
          <NavTile
            href="/directory/"
            icon={<PeopleIcon />}
            label={t('directory.title')}
            description={t('home.go.directory')}
          />
        ) : null}

        {/*
          A program's own list — who wants in, not a caseload and not
          everyone (Will, 16 September). No real query behind it yet: see
          `/interested/` and `@pam/config/dummy-people`.
        */}
        {isProvider ? (
          <NavTile
            href="/interested/"
            icon={<PeopleIcon />}
            label={t('interested.title')}
            description={t('home.go.interested')}
          />
        ) : null}

        <NavTile
          href="/places/"
          icon={<PlacesIcon />}
          label={t('places.title')}
          description={t('home.go.places')}
        />

      </VStack>

      {/* §0 — a visible way to get help, on the screen everybody starts from. */}
      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
