'use client';

import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import * as stylex from '@stylexjs/stylex';
import {
  AppHeader,
  BigButton,
  BellIcon,
  HelpBar,
  NavTile,
  Notice,
  NotificationBell,
  PeopleIcon,
  Page,
  PlacesIcon,
  PlanIcon,
} from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useNotifications } from '@/lib/useNotifications';

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
});

export default function HomePage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const signedIn = session.status === 'signed-in';
  const { state: notifications } = useNotifications(signedIn);
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
        <Text type="supporting" xstyle={styles.intro}>
          {t('places.loading')}
        </Text>
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
   * Signed out — and "no profile" with it, which is an account that exists in
   * the sign-in system and has no PAM record yet. Both need the same thing: say
   * what PAM is for in one line, and offer the one door. No tiles, because
   * every one of them would ask for a sign-in on arrival.
   */
  if (session.status === 'signed-out' || session.status === 'no-profile') {
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
        <BigButton label={t('signin.title')} href="/signin/" />
        <HelpBar label={t('nav.help')} variant="block" />
      </Page>
    );
  }

  const { session: me } = session;
  const isStaff = me.role !== 'member';

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${me.role}`)}
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
      <Heading level={1} xstyle={styles.title}>
        {me.firstName ? t('home.greeting', { name: me.firstName }) : t('home.title')}
      </Heading>

      <VStack gap={2}>
        {isStaff ? (
          <NavTile
            href="/admin/"
            icon={<PeopleIcon />}
            label={t('admin.title')}
            description={t('home.go.caseload')}
          />
        ) : null}

        <NavTile
          href="/places/"
          icon={<PlacesIcon />}
          label={t('places.title')}
          description={t('home.go.places')}
        />

        <NavTile
          href="/notifications/"
          icon={<BellIcon />}
          label={t('notify.title')}
          description={t('home.go.notifications')}
          alertLabel={unread > 0 ? t('notify.unread', { count: unread }) : undefined}
        />

        <NavTile
          href="/reminders/"
          icon={<PlanIcon />}
          label={t('reminders.title')}
          description={t('home.go.reminders')}
        />
      </VStack>

      {/* §0 — a visible way to get help, on the screen everybody starts from. */}
      <HelpBar label={t('nav.help')} variant="block" />
    </Page>
  );
}
