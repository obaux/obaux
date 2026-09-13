'use client';

import { useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { AppHeader, BigButton, Notice, NotificationBell, Page, PageTitle, TextLink } from '@pam/ui';
import { NOTICES } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession, signOut } from '@/lib/useSession';
import { useCaseload, createInvite, type CreatedInvite } from '@/lib/useCaseload';
import { useNotifications } from '@/lib/useNotifications';

/**
 * The case manager's screen (§4.1).
 *
 * Two jobs, in this order: see the people you are responsible for, and bring
 * somebody new in. Everything else an admin can do — turning a feature off,
 * pausing an account, making an introduction — hangs off a member and belongs
 * on a member's own screen, which is the next piece.
 *
 * What is deliberately on this page and easy to miss: a standing statement of
 * what an admin can and cannot see. Members are shown that same list at
 * onboarding and asked to trust it. An admin should be looking at it too, so
 * that the promise is visible from both sides rather than only the side that
 * has to take it on faith.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  // A secondary button, which is a button and not a link: it keeps the 48px
  // floor but reads as an action.
  secondary: { minHeight: '48px', fontSize: '17px' },
  region: { fontSize: '17px' },
  card: { width: '100%' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  // The code is read aloud down a phone line. It is the largest thing here.
  code: {
    fontSize: '40px',
    lineHeight: 1.1,
    letterSpacing: '0.12em',
    fontVariantNumeric: 'tabular-nums',
  },
  note: { fontSize: '15px', lineHeight: 1.5 },
});

/**
 * What the status chip should say.
 *
 * "Some things turned off" is the member's wording, and on a caseload it
 * answers nothing: off how, and which? A case manager needs the specifics,
 * because the next thing they do is either explain it or undo it. Beyond two
 * features the names stop fitting a chip, so it becomes a count and the detail
 * moves to the member's own screen.
 */
function statusChip(
  member: { accessStatus: string; featuresOff: string[] },
  t: (key: string, vars?: Record<string, string | number>) => string,
): { label: string; tone: 'error' | 'warning' } | null {
  if (member.accessStatus === 'suspended') {
    return { label: t('admin.status.suspended'), tone: 'error' };
  }
  if (member.accessStatus !== 'limited') return null;

  const names = member.featuresOff.map((f) => t(`feature.${f}`));
  if (names.length === 0) return { label: t('admin.status.limited'), tone: 'warning' };
  if (names.length <= 2) {
    return { label: t('admin.status.off', { features: names.join(', ') }), tone: 'warning' };
  }
  return { label: t('admin.status.offCount', { count: names.length }), tone: 'warning' };
}

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export default function AdminPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  const isAdmin = session.status === 'signed-in' && session.session.role === 'admin';
  const { state: caseload, refresh } = useCaseload(isAdmin);
  const { state: notifications } = useNotifications(isAdmin);

  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFailed, setInviteFailed] = useState(false);
  const [copied, setCopied] = useState(false);

  const makeInvite = async (role: 'member' | 'provider') => {
    setInviteBusy(true);
    setInviteFailed(false);
    const created = await createInvite(role);
    setInviteBusy(false);
    if (created) {
      setInvite(created);
      setCopied(false);
      refresh();
    } else {
      setInviteFailed(true);
    }
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
          <AppHeader />
          <Text type="supporting" xstyle={styles.region}>
            {t('places.loading')}
          </Text>
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile') {
    return (
      <Page gap={4}>
          <AppHeader />
          <Notice
            notice="service_not_available"
            title={t('admin.signedOut.title')}
            body={t('admin.signedOut.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
          <BigButton label={t('signin.title')} href="/signin/" />
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
      </Page>
    );
  }

  if (!isAdmin) {
    // Not a permission error to scold somebody with — a plain statement of what
    // this screen is, and a way to get it fixed if it is wrong (§0).
    return (
      <Page gap={4}>
          <AppHeader roleLabel={t(`role.${session.session.role}`)} />
          <Notice
            notice="service_not_available"
            title={t('admin.notAdmin.title')}
            body={t('admin.notAdmin.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
          {/*
            A super admin lands here from habit, not by mistake: this is the
            staff screen they knew about. Say where their own list is rather
            than leaving them at a closed door (§0).
          */}
          {session.session.role === 'super_admin' ? (
            <TextLink label={t('directory.title')} href="/directory/" />
          ) : null}
          <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  const { session: me } = session;

  return (
    <Page gap={4}>
        {/*
          The bell says how many things need this case manager; the list is a
          screen of its own. A glance belongs in the header, the work does not
          (D-084). What reaches it: a place one of their people saved was
          flagged, or a message in their caseload was reported. Nothing else,
          and no row carries anybody's words (A7 / D-080).
        */}
        <AppHeader
          roleLabel={t('role.admin')}
          trailing={
            notifications.status === 'ready' ? (
              <NotificationBell
                href="/notifications/"
                label={t('notify.title')}
                unreadCount={notifications.items.filter((i) => !i.isRead).length}
                unreadLabel={t('notify.unread', {
                  count: notifications.items.filter((i) => !i.isRead).length,
                })}
              />
            ) : null
          }
        />

        <PageTitle
          title={t('admin.title')}
          subtitle={me.regionName ? t('admin.subtitle', { region: me.regionName }) : undefined}
          backHref="/"
          backLabel={t('nav.back.home')}
        />

        {invite ? (
          <Card xstyle={styles.card}>
            <VStack gap={3}>
              <Text type="supporting" xstyle={styles.note}>
                {t('admin.invite.ready')}
              </Text>
              <Text xstyle={styles.code}>{invite.code}</Text>
              <Text type="supporting" xstyle={styles.note}>
                {t('admin.invite.expires', {
                  date: new Intl.DateTimeFormat(locale, {
                    month: 'long',
                    day: 'numeric',
                  }).format(new Date(invite.expiresAt)),
                })}
              </Text>
              <HStack gap={2} wrap="wrap">
                <Button
                  label={copied ? t('admin.invite.copied') : t('admin.invite.copy')}
                  variant="secondary"
                  onClick={() => {
                    void navigator.clipboard?.writeText(invite.code).then(() => setCopied(true));
                  }}
                  xstyle={styles.secondary}
                />
                <TextLink label={t('admin.invite.another')} onClick={() => setInvite(null)} />
              </HStack>
            </VStack>
          </Card>
        ) : (
          <VStack gap={2}>
            <BigButton
              label={inviteBusy ? t('admin.invite.creating') : t('admin.invite.member')}
              onPress={() => void makeInvite('member')}
              isDisabled={inviteBusy}
            />
            <Button
              label={t('admin.invite.provider')}
              variant="secondary"
              onClick={() => void makeInvite('provider')}
              isDisabled={inviteBusy}
              xstyle={styles.secondary}
            />
          </VStack>
        )}

        {inviteFailed ? (
          <Notice
            notice="something_went_wrong"
            title={t('admin.invite.failed.title')}
            body={t('admin.invite.failed.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {caseload.status === 'loading' ? (
          <Text type="supporting" xstyle={styles.region}>
            {t('places.loading')}
          </Text>
        ) : null}

        {caseload.status === 'empty' ? (
          <Notice
            notice="no_caseload_members"
            title={t('admin.caseload.empty.title')}
            body={t('admin.caseload.empty.body')}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {caseload.status === 'error' ? (
          <Notice
            notice={caseload.offline ? 'offline' : 'something_went_wrong'}
            title={t(NOTICES[caseload.offline ? 'offline' : 'something_went_wrong'].titleKey)}
            body={t(NOTICES[caseload.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
            supportPhone={supportPhone}
            callLabel={t('help.callSupport')}
          />
        ) : null}

        {caseload.status === 'ready' ? (
          <VStack gap={3}>
            {caseload.members.map((member) => {
              const when = whenLastActive(member.lastActiveAt, locale);
              const chip = statusChip(member, t);
              return (
                <Card key={member.id} xstyle={styles.card}>
                  <VStack gap={2}>
                    {/*
                      A face, or the initial standing in for one. Astryx draws
                      the fallback from the name, so the list reads as people
                      rather than rows before anybody has uploaded a photo.

                      No `src`: a member's photo is not on the §4.1 list of what
                      an admin may see, and fetching it here would widen the
                      contract by a column. The initial is PAM's own rendering
                      of a name the admin is already entitled to.
                    */}
                    <HStack gap={3} align="center">
                      <Avatar size="lg" name={member.firstName ?? '?'} />
                      <Heading level={3} xstyle={styles.name}>
                        {member.firstName ?? '—'}
                      </Heading>
                    </HStack>
                    <HStack gap={2} wrap="wrap" align="center">
                      {chip ? <Badge variant={chip.tone} label={chip.label} /> : null}
                      {member.points !== null ? (
                        <Text type="supporting" xstyle={styles.meta}>
                          {t('admin.points', { count: member.points })}
                        </Text>
                      ) : null}
                      <Text type="supporting" xstyle={styles.meta}>
                        {when ? t('admin.lastActive', { when }) : t('admin.lastActive.never')}
                      </Text>
                    </HStack>
                  </VStack>
                </Card>
              );
            })}
          </VStack>
        ) : null}

        {/*
          The transparency contract, on the admin's side of it. Members agree to
          this list at onboarding; an admin should see the same words.
        */}
        <Card xstyle={styles.card}>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.name}>
              {t('admin.seeing.title')}
            </Heading>
            <Text type="supporting" xstyle={styles.note}>
              {t('admin.seeing.body')}
            </Text>
          </VStack>
        </Card>

        <HStack gap={2} wrap="wrap">
          <TextLink label={t('admin.back')} href="/" />
          <TextLink label={t('signin.signout')} onClick={() => void signOut().then(() => window.location.reload())} />
        </HStack>
    </Page>
  );
}
