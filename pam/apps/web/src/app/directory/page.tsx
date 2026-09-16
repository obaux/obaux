'use client';

import { useEffect, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Selector } from '@astryxdesign/core/Selector';
import { Button } from '@astryxdesign/core/Button';
import { RadioList, RadioListItem } from '@astryxdesign/core/RadioList';
import {
  AppHeader,
  BigButton,
  Loading,
  Notice,
  Page,
  PageTitle,
  ScrollReveal,
  TextLink,
} from '@pam/ui';
import { PersonRowSkeletonList } from '@pam/ui/Skeletons';
import { NOTICES, ROLES, type Role } from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_EVERYONE } from '@pam/config/dummy-people';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { PersonRow } from '../PersonRow';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useDirectory } from '@/lib/useDirectory';
import { createInvite, listRegions, type CreatedInvite } from '@/lib/useCaseload';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';

/**
 * Everyone on PAM, for the person running it.
 *
 * The first screen a super admin has ever had. Until now the role existed in
 * the database — it decides flagged places (0032) and receives reports (A7) —
 * and had nowhere to go: opening the case manager screen said "this screen is
 * for case managers", which was true and useless.
 *
 * **The filter lives in the header** (Will, 13 September), not above the list.
 * What you are looking at is the same kind of fact as which area the Places
 * screen is measuring from: true of every row below it, and worth a corner of
 * the header rather than a row of the page. It is a Selector rather than a row
 * of chips because there are five choices and a 320px phone, and a wrapping
 * chip row would cost two lines before the first person.
 *
 * What this screen is not: a way into anybody. It shows the five facts the
 * caseload already shows — name, role, region, status, last active — and
 * nothing a member wrote, planned or was enrolled in. The database function
 * behind it returns those five columns and no others, and refuses everybody who
 * is not a super admin (0043). A member's own screen, when it exists, stays
 * bound by §4.1 the same way the case manager's is.
 */

const styles = stylex.create({
  title: { fontSize: '28px', lineHeight: 1.2 },
  count: { fontSize: '17px' },
  meta: { fontSize: '15px' },
  name: { fontSize: '18px' },
  card: { width: '100%' },
  // The header is a tight row: the filter gives way before the mark does.
  filter: { maxWidth: '48vw' },
  code: { fontSize: '32px', fontWeight: 700, letterSpacing: '0.12em', fontVariantNumeric: 'tabular-nums' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  secondary: { minHeight: '48px' },
});

/** "All", then one option per role, in the order somebody thinks of them. */
const FILTERS = ['all', ...ROLES] as const;
type Filter = (typeof FILTERS)[number];

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

export default function DirectoryPage() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();

  // See admin/page.tsx: the same preview a super admin picks on Home now
  // follows them here, so "Viewing as Program" and then opening this screen
  // shows what a program actually sees (D-108, useViewedRole) — the same
  // door everyone else meets — rather than the full directory regardless.
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  const isSuperAdmin = viewedRole === 'super_admin';
  const [filter, setFilter] = useState<Filter>('all');
  const { state: directory } = useDirectory(isSuperAdmin, filter as Role | 'all');
  // The filter is real: it asks the same question of the example set that it
  // asks the database, so switching it while the real directory is empty
  // still demonstrates what it does.
  const dummyPeople =
    filter === 'all' ? DUMMY_EVERYONE : DUMMY_EVERYONE.filter((p) => p.role === filter);

  /**
   * Bringing somebody in.
   *
   * The person running PAM is the only one who can make a case manager (0049),
   * and they have no city of their own, so the card asks which city first. The
   * code is the product: read down the phone or texted, eight characters that
   * survive being said out loud.
   */
  const [regions, setRegions] = useState<{ id: string; name: string }[]>([]);
  const [regionId, setRegionId] = useState<string>('');
  const [invite, setInvite] = useState<CreatedInvite | null>(null);
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteFailed, setInviteFailed] = useState<'city' | 'failed' | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isSuperAdmin) return;
    let cancelled = false;
    void listRegions().then((list) => {
      if (cancelled) return;
      setRegions(list);
      if (list.length === 1) setRegionId(list[0]!.id);
    });
    return () => {
      cancelled = true;
    };
  }, [isSuperAdmin]);

  const makeInvite = async (role: 'member' | 'provider' | 'admin') => {
    if (!regionId) {
      setInviteFailed('city');
      return;
    }
    setInviteBusy(true);
    setInviteFailed(null);
    const created = await createInvite(role, regionId);
    setInviteBusy(false);
    if (created) {
      setInvite(created);
      setCopied(false);
    } else {
      setInviteFailed('failed');
    }
  };

  if (session.status === 'loading') {
    return (
      <Page gap={3}>
        <AppHeader />
        <Loading label={t('common.loading')} variant="screen" />
      </Page>
    );
  }

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('directory.signedOut.body')} />
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

  if (!isSuperAdmin) {
    // A plain statement of what this screen is, and a way back — not a scolding
    // and not a blank page (§0).
    return (
      <Page gap={4}>
        <AppHeader
          roleLabel={viewedRole ? t(`role.${viewedRole}`) : undefined}
          roleControl={
            trueRole === 'super_admin' ? (
              <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
            ) : undefined
          }
          trailing={<HeaderBell enabled={trueRole !== null} role={viewedRole} />}
        />
        <Notice
          notice="service_not_available"
          title={t('directory.notSuper.title')}
          body={t('directory.notSuper.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t('role.super_admin')}
        roleControl={<RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />}
        trailing={
          <HStack gap={1} align="center" wrap="nowrap">
            {/*
              The filter, in the header, where the fact it changes belongs: what
              kind of person this whole list is about.
            */}
            <Selector
              label={t('directory.filter')}
              isLabelHidden
              variant="ghost"
              size="lg"
              value={filter}
              options={FILTERS.map((option) => ({
                value: option,
                label: t(`directory.filter.${option}`),
              }))}
              onChange={(next) => setFilter(next as Filter)}
              xstyle={styles.filter}
            />
            <HeaderBell enabled={isSuperAdmin} role={viewedRole} />
          </HStack>
        }
      />

      <PageTitle
        title={t('directory.title')}
        subtitle={
          directory.status === 'ready'
            ? t('directory.count', { count: directory.people.length })
            : directory.status === 'empty' && USE_DUMMY_PEOPLE
              ? t('directory.count', { count: dummyPeople.length })
              : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      <Card xstyle={styles.card}>
        <VStack gap={3}>
          <Heading level={2} xstyle={styles.name}>
            {t('directory.invite.title')}
          </Heading>
          {invite ? (
            <>
              <Text type="supporting" xstyle={styles.note}>
                {t('admin.invite.ready')}
              </Text>
              <Text xstyle={styles.code}>{invite.code}</Text>
              <Text type="supporting" xstyle={styles.note}>
                {t('admin.invite.expires', {
                  date: new Intl.DateTimeFormat(locale, { month: 'long', day: 'numeric' }).format(
                    new Date(invite.expiresAt),
                  ),
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
            </>
          ) : (
            <>
              {regions.length > 1 ? (
                <RadioList
                  label={t('directory.invite.city')}
                  value={regionId}
                  onChange={(next) => setRegionId(String(next))}
                >
                  {regions.map((region) => (
                    <RadioListItem key={region.id} value={region.id} label={region.name} />
                  ))}
                </RadioList>
              ) : null}
              {inviteFailed === 'city' ? (
                <Text type="supporting" xstyle={styles.note}>
                  {t('directory.invite.pickCity')}
                </Text>
              ) : null}
              <VStack gap={2}>
                <BigButton
                  label={inviteBusy ? t('admin.invite.creating') : t('directory.invite.admin')}
                  onPress={() => void makeInvite('admin')}
                  isDisabled={inviteBusy}
                />
                <Button
                  label={t('directory.invite.provider')}
                  variant="secondary"
                  onClick={() => void makeInvite('provider')}
                  isDisabled={inviteBusy}
                  xstyle={styles.secondary}
                />
                <Button
                  label={t('directory.invite.member')}
                  variant="secondary"
                  onClick={() => void makeInvite('member')}
                  isDisabled={inviteBusy}
                  xstyle={styles.secondary}
                />
              </VStack>
            </>
          )}
          {inviteFailed === 'failed' ? (
            <Notice
              notice="something_went_wrong"
              title={t('admin.invite.failed.title')}
              body={t('admin.invite.failed.body')}
              supportPhone={supportPhone}
              callLabel={t('help.callSupport')}
            />
          ) : null}
        </VStack>
      </Card>

      {directory.status === 'loading' ? (
        <PersonRowSkeletonList label={t('common.loading')} />
      ) : null}

      {directory.status === 'empty' && !USE_DUMMY_PEOPLE ? (
        <Notice
          notice="no_caseload_members"
          title={t('directory.empty.title')}
          body={t('directory.empty.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {directory.status === 'error' ? (
        <Notice
          notice={directory.offline ? 'offline' : 'something_went_wrong'}
          title={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].titleKey)}
          body={t(NOTICES[directory.offline ? 'offline' : 'something_went_wrong'].bodyKey)}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
      ) : null}

      {directory.status === 'ready' ? (
        <VStack gap={3}>
          {directory.people.map((person, index) => {
            const when = whenLastActive(person.lastActiveAt, locale);
            return (
              <ScrollReveal key={person.id} index={index}>
                <PersonRow
                  firstName={person.firstName}
                  chip={
                    person.accessStatus === 'suspended'
                      ? { label: t('admin.status.suspended'), tone: 'error' }
                      : person.accessStatus === 'limited'
                        ? { label: t('admin.status.limited'), tone: 'warning' }
                        : null
                  }
                  meta={[
                    person.regionName ? `${t(`role.${person.role}`)} · ${person.regionName}` : t(`role.${person.role}`),
                    when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                  ]}
                />
              </ScrollReveal>
            );
          })}
        </VStack>
      ) : null}

      {/*
        The real directory is empty — nobody has actually signed up yet — so
        this is the example set, filtered the same way the real one would be
        (Will, 16 September). Disappears the moment `useDirectory` stops
        returning `'empty'`; see `@pam/config/dummy-people`.
      */}
      {directory.status === 'empty' && USE_DUMMY_PEOPLE ? (
        <VStack gap={3}>
          {dummyPeople.map((person, index) => {
            const when = whenLastActive(person.lastActiveAt, locale);
            return (
              <ScrollReveal key={person.id} index={index}>
                <PersonRow
                  firstName={person.firstName}
                  href={`/person/?id=${person.id}`}
                  chip={
                    person.accessStatus === 'suspended'
                      ? { label: t('admin.status.suspended'), tone: 'error' }
                      : person.accessStatus === 'limited'
                        ? { label: t('admin.status.limited'), tone: 'warning' }
                        : null
                  }
                  meta={[
                    `${t(`role.${person.role}`)} · ${person.regionName}`,
                    when ? t('admin.lastActive', { when }) : t('admin.lastActive.never'),
                  ]}
                />
              </ScrollReveal>
            );
          })}
          <Text type="supporting" xstyle={styles.note}>
            {t('example.people.note')}
          </Text>
        </VStack>
      ) : null}

    </Page>
  );
}
