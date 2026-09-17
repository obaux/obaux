'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';
import { TextArea } from '@astryxdesign/core/TextArea';
import {
  AppHeader,
  BigButton,
  Loading,
  Notice,
  Page,
  PageTitle,
  TextLink,
} from '@pam/ui';
import { PersonDetailSkeleton } from '@pam/ui/Skeletons';
import { NOTICES } from '@pam/config';
import { DUMMY_EVERYONE, type DummyPerson } from '@pam/config/dummy-people';
import { DUMMY_SAVED_BY_PERSON } from '@pam/config/dummy-places';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';
import { sendDemoMessage, type DemoSender } from '@/lib/demoMessages';
import { ProgramBadge } from '../ProgramBadge';

/**
 * One person, for a case manager or a program to look at.
 *
 * The list a case manager, a program or a super admin already reads — the
 * caseload, "interested in your program", the directory — says five facts a
 * row at a time. This is the screen a row opens onto, with room for the one
 * thing none of those rows have space for: what a *member* saved, so a case
 * manager helping them plan a week can see it without asking.
 *
 * **Real people have no profile yet, on purpose.** Everything below the header
 * comes from `@pam/config/dummy-people` and only ever resolves for a dummy id.
 * A case manager reading a real member's real saved places is not on the
 * §4.1 `ADMIN_CAN_SEE` list — see `packages/config/transparency.ts` — and
 * widening that list is Will's call to make deliberately, with members told
 * first, not a side effect of this screen existing. Until that happens, a
 * real id here answers "we could not find that person", exactly as a mistyped
 * one does.
 *
 * **"Send a message" here is a demo simulation, not a real send (D-173).**
 * A case manager or program admin previewing this screen for a dummy member
 * can compose a line of text; it is stored client-side only
 * (`@/lib/demoMessages`) and never reaches `openConversation`, `messages`,
 * or `conversations`. D-171 — a super admin cannot send or start any *real*
 * message — is untouched by this: nothing on this screen is a real account
 * sending to a real person, the same way nothing else on this dummy-only
 * page is a real write. Switching "Viewing as" to Member and opening
 * `/messages/` shows the composed text having "arrived", by design — see
 * `DummyConversations` in `../messages/DummyRows.tsx`.
 */

const styles = stylex.create({
  title: { fontSize: '26px', lineHeight: 1.2 },
  card: { width: '100%', position: 'relative' },
  section: { fontSize: '17px' },
  name: { fontSize: '18px' },
  meta: { fontSize: '16px' },
  note: { fontSize: '15px', lineHeight: 1.5 },
  // Stretched-link pattern (same as `PersonRow`): the heading is a real
  // anchor, widened over the whole card with `::after`, so the card is one
  // tap target rather than a link buried inside otherwise-dead space.
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
  compose: { width: '100%' },
});

/**
 * The demo-only compose box (D-173). `sender` is the previewed staff role —
 * always `admin` or `provider`, since this only ever renders for one of
 * those two (see the render site below) — and is what `sendDemoMessage`
 * keys the stored message by, not the specific dummy person on screen; see
 * `@/lib/demoMessages` for why.
 */
function DemoMessageComposer({
  sender,
  name,
  t,
}: {
  readonly sender: DemoSender;
  readonly name: string;
  readonly t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const [draft, setDraft] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    sendDemoMessage(sender, draft);
    setDraft('');
    setSent(true);
  };

  return (
    <VStack gap={2}>
      <Heading level={2} xstyle={styles.section}>
        {t('person.message.title')}
      </Heading>
      <Text type="supporting" xstyle={styles.note}>
        {t('person.message.demoNote', { name })}
      </Text>
      <TextArea
        label={t('person.message.placeholder')}
        isLabelHidden
        placeholder={t('person.message.placeholder')}
        value={draft}
        onChange={(next) => {
          setDraft(next);
          setSent(false);
        }}
        rows={2}
        width="100%"
        xstyle={styles.compose}
      />
      <BigButton
        label={t('person.message.send')}
        onPress={submit}
        isDisabled={draft.trim() === ''}
      />
      {sent ? (
        <Text type="supporting" xstyle={styles.note}>
          {t('person.message.sent')}
        </Text>
      ) : null}
    </VStack>
  );
}

function lookup(id: string | null): DummyPerson | null {
  if (!id) return null;
  return DUMMY_EVERYONE.find((person) => person.id === id) ?? null;
}

function whenLastActive(iso: string | null, locale: string): string | null {
  if (!iso) return null;
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(new Date(iso));
}

function PersonScreen() {
  const { t, locale } = useI18n();
  const supportPhone = useSupportPhone();
  const params = useSearchParams();
  const { state: session } = useSession();

  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole, setViewAs } = useRoleView(trueRole);
  // The same audience the three lists that link here already gate on.
  const canView = viewedRole === 'admin' || viewedRole === 'provider' || viewedRole === 'super_admin';

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
        <NotIn status={session.status} title={t('person.signedOut.title')} body={t('person.signedOut.body')} />
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

  if (!canView) {
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
          title={t('person.notAllowed.title')}
          body={t('admin.notAdmin.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <TextLink label={t('admin.back')} href="/" />
      </Page>
    );
  }

  const person = lookup(params.get('id'));

  if (!person) {
    return (
      <Page gap={4}>
        <AppHeader
          roleLabel={t(`role.${viewedRole}`)}
          roleControl={
            trueRole === 'super_admin' ? (
              <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
            ) : undefined
          }
          trailing={<HeaderBell enabled role={viewedRole} />}
        />
        <PageTitle title={t('person.notFound.title')} backHref="/" backLabel={t('nav.back.home')} />
        <Notice
          notice="service_not_available"
          title={t('person.notFound.title')}
          body={t('person.notFound.body')}
          supportPhone={supportPhone}
          callLabel={t('help.callSupport')}
        />
        <BigButton label={t('nav.back.home')} href="/" />
      </Page>
    );
  }

  const when = whenLastActive(person.lastActiveAt, locale);
  const saved = DUMMY_SAVED_BY_PERSON[person.id] ?? [];

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={t(`role.${viewedRole}`)}
        roleControl={
          trueRole === 'super_admin' ? (
            <RoleSwitchControl trueRole={trueRole} viewedRole={viewedRole} onChange={setViewAs} />
          ) : undefined
        }
        trailing={<HeaderBell enabled role={viewedRole} />}
      />
      <PageTitle title={person.firstName} backHref="/" backLabel={t('nav.back.home')} />

      <VStack gap={4}>
        {/*
          The name is not repeated here (Will, 16 September) — the page title
          already is it. What this row adds is what the title cannot say:
          where they are, and which language PAM answers them in.
        */}
        <HStack gap={2} align="center" wrap="wrap">
          <Avatar size="lg" name={person.firstName} />
          <Text type="supporting" xstyle={styles.meta}>
            {t(`role.${person.role}`)} · {person.regionName} · {t(`language.${person.language}`)}
          </Text>
        </HStack>

        <HStack gap={2} wrap="wrap" align="center">
          {person.accessStatus === 'suspended' ? (
            <Badge variant="error" label={t('admin.status.suspended')} />
          ) : null}
          {person.accessStatus === 'limited' ? (
            <Badge variant="warning" label={t('admin.status.limited')} />
          ) : null}
          {person.orgName ? <Badge variant="neutral" label={person.orgName} /> : null}
          {person.program ? (
            <ProgramBadge name={person.program.name} serviceId={person.program.serviceId} />
          ) : null}
          {person.points !== undefined ? (
            <Text type="supporting" xstyle={styles.meta}>
              {t('admin.points', { count: person.points })}
            </Text>
          ) : null}
          <Text type="supporting" xstyle={styles.meta}>
            {when ? t('admin.lastActive', { when }) : t('admin.lastActive.never')}
          </Text>
        </HStack>

        {person.role === 'member' ? (
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.section}>
              {t('person.savedPlaces.title')}
            </Heading>
            {saved.length === 0 ? (
              <Text type="supporting" xstyle={styles.meta}>
                {t('person.savedPlaces.empty')}
              </Text>
            ) : (
              <VStack gap={2}>
                {saved.map((place) => (
                  <Card key={place.id} xstyle={styles.card}>
                    <VStack gap={1}>
                      <Heading level={3} xstyle={styles.name}>
                        <a href={`/place/?id=${encodeURIComponent(place.id)}`} {...stylex.props(styles.link)}>
                          {place.name}
                        </a>
                      </Heading>
                      <Text type="supporting" xstyle={styles.meta}>
                        {place.address}
                      </Text>
                      <Text xstyle={styles.meta}>{place.description}</Text>
                    </VStack>
                  </Card>
                ))}
              </VStack>
            )}
          </VStack>
        ) : null}

        {/*
          Demo-only "Send a message" (D-173) — only for a case manager or
          program admin (the two roles messaging actually lets start a
          conversation, per `/messages/`) looking at a dummy member. Never
          for `super_admin` previewing "as itself": D-171 already settled
          that a super admin does not message at all, real or simulated.
        */}
        {person.role === 'member' && (viewedRole === 'admin' || viewedRole === 'provider') ? (
          <DemoMessageComposer sender={viewedRole} name={person.firstName} t={t} />
        ) : null}

        <Text type="supporting" xstyle={styles.note}>
          {t('example.people.note')}
        </Text>
      </VStack>
    </Page>
  );
}

/** `useSearchParams` needs a Suspense boundary in an exported app (see `/place/`). */
export default function PersonPage() {
  return (
    <Suspense
      fallback={
        <Page gap={4}>
          <AppHeader />
          <PersonDetailSkeleton label="Loading" />
        </Page>
      }
    >
      <PersonScreen />
    </Suspense>
  );
}
