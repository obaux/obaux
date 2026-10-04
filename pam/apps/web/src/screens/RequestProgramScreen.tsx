'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { categoryLabelKey, type Category } from '@pam/config';
import { Loading, PlaceDetail } from '@pam/ui';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { goBack } from '@/lib/navigate';
import { useSession } from '@/lib/useSession';
import { useStaffRequests } from '@/lib/useStaffRequests';
import { useRoleView } from '@/lib/useViewedRole';
import { HelpButton } from './HelpButton';
import { TextRequesterButton } from './TextRequesterButton';

/**
 * The program somebody asked to lead, before it is approved (Will, 4 October,
 * D-262: "there needs to be a way to view program profile if asking to
 * approve/deny"). The same page a member would see once it is listed
 * (`PlaceDetail`), drawn from what they typed at sign-up (0056), with who
 * asked and a way to text them. Approve and Deny stay on the request card,
 * where the city is picked; this page is for looking before deciding.
 */
const styles = stylex.create({
  who: { fontSize: '17px', lineHeight: 1.45 },
  card: { width: '100%' },
});

export function RequestProgramScreen({ userId }: { readonly userId: string | null }) {
  const { t } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { viewedRole } = useRoleView(trueRole);
  const { state } = useStaffRequests(viewedRole === 'super_admin');

  const row = state.status === 'ready' ? state.requests.find((r) => r.userId === userId) : undefined;
  const program = row?.program ?? null;
  const back = { onBack: () => goBack('/requests/'), backLabel: t('nav.back.requests') };

  if (state.status === 'loading' || session.status === 'loading') {
    return (
      <SubPage title={t('requests.program.title')} {...back} actions={<HelpButton />}>
        <Loading label={t('common.loading')} variant="screen" />
      </SubPage>
    );
  }

  if (!row || !program) {
    return (
      <SubPage title={t('requests.program.title')} {...back} actions={<HelpButton />}>
        <Text xstyle={styles.who}>{t('requests.program.gone')}</Text>
      </SubPage>
    );
  }

  const requester = [row.firstName, row.lastName].filter(Boolean).join(' ') || t('requests.renewals.someone');

  return (
    <SubPage title={program.name} subtitle={t('requests.program.subtitle')} {...back} actions={<HelpButton />}>
      <Card padding={6} xstyle={styles.card}>
        <VStack gap={3} align="start">
          <Text xstyle={styles.who}>{t('requests.program.askedBy', { name: requester })}</Text>
          <TextRequesterButton userId={row.userId} firstName={row.firstName} />
        </VStack>
      </Card>
      <PlaceDetail
        category={(program.category ?? 'family_services') as Category}
        categoryLabel={t(categoryLabelKey(program.category ?? ''))}
        description={program.description}
        address={program.address}
        phone={program.phone}
        website={program.website}
        labels={{
          directions: t('place.directions'),
          call: t('place.call'),
          website: t('place.website'),
          hours: t('place.hours'),
          hoursOnGoogle: t('place.hoursOnGoogle'),
          about: t('place.about'),
          address: t('place.address'),
          save: t('place.save'),
          saved: t('places.saved'),
          share: t('place.share'),
          flag: t('place.flag'),
        }}
      />
    </SubPage>
  );
}
