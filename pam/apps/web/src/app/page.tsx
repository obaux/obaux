'use client';

import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@astryxdesign/core/Button';
import * as stylex from '@stylexjs/stylex';
import {
  AppHeader,
  BigButton,
  CardEnter,
  HelpBar,
  Loading,
  NavTile,
  Notice,
  NotificationBell,
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
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useNotifications } from '@/lib/useNotifications';
import { useSavedPlaces } from '@/lib/useSavedPlaces';
import { usePoints } from '@/lib/usePoints';
import { useViewAs } from '@/lib/useViewAs';
import { SavedStripLazy } from './SavedStripLazy';
import { RoleSwitchLazy } from './RoleSwitchLazy';

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
 * `NavTile`, `Notice`, `BigButton`, `HelpBar`, and the icon set. Nothing is
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
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const { state: notifications } = useNotifications(signedIn);
  const { state: saved, unsave, failed: saveFailed } = useSavedPlaces(signedIn);
  const points = usePoints(session.status === 'signed-in' ? session.session.userId : null);
  const { viewAs, setViewAs } = useViewAs(
    session.status === 'signed-in' ? session.session.role : null,
  );
  const unread =
    notifications.status === 'ready'
      ? notifications.items.filter((item) => !item.isRead).length
      : 0;

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
   * Signed out, half signed up, or paused. Say what PAM is for in one line and
   * offer the one door that is right for that person — which used to be the
   * same "Sign in" for all three, and for a verified phone with no account yet
   * that was the door they had just walked through. No tiles, because every
   * one of them would ask for a sign-in on arrival.
   */
  if (
    session.status === 'signed-out' ||
    session.status === 'no-profile' ||
    session.status === 'suspended'
  ) {
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
        {/*
          Three people, three doors: sign in, finish signing up, or — for a
          paused account — a plain statement and the way to sign out.
        */}
        {session.status === 'signed-out' ? (
          <BigButton label={t('signin.title')} href="/signin/" />
        ) : (
          <NotIn status={session.status} title={t('app.name')} body={t('app.tagline')} />
        )}
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
        trailing={
          notifications.status === 'ready' ? (
            <NotificationBell
              href="/notifications/"
              label={t('notify.title')}
              unreadCount={unread}
              unreadLabel={t('notify.unread', { count: unread })}
            />
          ) : null
        }
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
              href: '/saved/',
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

      {viewAs && viewAs !== me.role ? (
        <Notice
          notice="admin_out_of_region"
          title={t('view.as', { role: t(`role.${viewed}`) })}
          body={t('view.notice', { role: t(`role.${viewed}`) })}
        />
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
