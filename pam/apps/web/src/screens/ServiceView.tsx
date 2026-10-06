'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { displayPhone } from '@pam/config';
import { DUMMY_PLACES_BY_ID } from '@pam/config/dummy-places';
import { placeAsksForPolicies } from '@pam/config/dummy-policies';
import { policiesForService, servicesFor } from '@pam/config/dummy-services';
import { BigButton, BookIcon, GlobeIcon, PhoneIcon, PlacesIcon, SignedIcon, directionsHref } from '@pam/ui';
import { MenuList, type MenuItem } from '@pam/ui/MenuList';
import { SubPage } from '@pam/ui/SubPage';
import { useI18n } from '@/lib/i18n';
import { useMySignatures } from '@/lib/useMySignatures';
import { usePolicies } from '@/lib/usePolicies';
import { useServices } from '@/lib/useServices';
import { siteName } from '@/lib/siteName';
import { HelpButton } from './HelpButton';
import { policiesHref } from './MemberPoliciesView';

/**
 * One service of a program, from the member's side (D-313, Will, 6
 * October: "multi service program detail with unique phone, website, and
 * policies for each"). Opened from the Services card on the program's
 * page. The same shape as the place: the name large, then rows — Call,
 * Website, Policies to sign — then what it is, with Plan a trip at the
 * foot (D-326), already set to this service.
 *
 * A service without its own number or site falls back to the program's,
 * and the row says so, so nobody rings the wrong desk thinking it is the
 * right one.
 */
const QUICK = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  card: { width: '100%' },
  section: { fontSize: '17px' },
  body: { fontSize: '17px', lineHeight: 1.5 },
  missing: { fontSize: '18px', lineHeight: 1.5 },
});

export function ServiceView({ placeId, serviceId }: { readonly placeId: string; readonly serviceId: string }) {
  const { t } = useI18n();
  const { services } = useServices();
  const { policies } = usePolicies();
  const { progress } = useMySignatures();
  const place = DUMMY_PLACES_BY_ID[placeId] ?? null;
  const here = servicesFor(placeId, services);
  const service = here.find((s) => s.id === serviceId) ?? null;
  const placeName = place?.name ?? '';
  const backHref = `/place/?id=${encodeURIComponent(placeId)}`;

  if (!service) {
    return (
      <SubPage title={t('place.services')} backHref={backHref} backLabel={t('service.back')} actions={<HelpButton />}>
        <Text type="supporting" xstyle={styles.missing}>
          {t('service.notFound')}
        </Text>
        <BigButton label={t('service.back')} href={backHref} />
      </SubPage>
    );
  }

  const phone = service.phone ?? place?.phone ?? null;
  const website = service.website ?? null;
  // Where it happens: its own address, or the program's (Will, D-313).
  const address = service.address ?? place?.address ?? null;
  const directions = service.address
    ? directionsHref(service.address, null, null, null)
    : place
      ? directionsHref(place.address, place.lat, place.lon, null)
      : undefined;
  const asksToSign = placeAsksForPolicies(placeId) && policies.length > 0;
  const toSign = asksToSign ? policiesForService(service, policies, here) : [];
  const { signed, total } = progress(placeId, toSign);
  const allSigned = total > 0 && signed === total;

  const rows: MenuItem[] = [
    ...(directions
      ? [
          {
            id: 'directions',
            label: t('place.quick.directions'),
            description: address ?? t('place.quick.directions.body'),
            icon: <PlacesIcon {...QUICK} />,
            href: directions,
            isExternal: true,
          },
        ]
      : []),
    ...(phone
      ? [
          {
            id: 'call',
            label: t('place.quick.call'),
            // The program's number when the service has none, said so.
            description: service.phone ? displayPhone(phone) : `${displayPhone(phone)} · ${t('service.phone.program')}`,
            icon: <PhoneIcon {...QUICK} />,
            href: `tel:${phone}`,
          },
        ]
      : []),
    ...(website
      ? [
          {
            id: 'website',
            label: t('place.quick.website'),
            description: siteName(website),
            icon: <GlobeIcon {...QUICK} />,
            href: website,
            isExternal: true,
          },
        ]
      : []),
    ...(asksToSign
      ? [
          {
            id: 'policies',
            label: t('place.policies'),
            description:
              total === 0
                ? t('service.policies.none')
                : allSigned
                  ? t('place.policies.allSigned', { total })
                  : t('service.policies.hint', { signed, total }),
            icon: allSigned ? <SignedIcon {...QUICK} /> : <BookIcon {...QUICK} />,
            ...(total > 0 ? { href: policiesHref(placeId, placeName, service.id) } : {}),
          },
        ]
      : []),
  ];

  const planHref = `/trips/new/?${new URLSearchParams({
    place: placeId,
    ...(place ? { name: place.name, category: place.category, ...(place.address ? { address: place.address } : {}) } : {}),
    service: service.id,
  }).toString()}`;

  return (
    <SubPage
      title={service.name}
      subtitle={placeName || undefined}
      backHref={backHref}
      backLabel={t('service.back')}
      actions={<HelpButton />}
      footer={<BigButton label={t('service.plan')} href={planHref} />}
    >
      {rows.length > 0 ? (
        <Card padding={1} xstyle={styles.card}>
          <MenuList label={t('service.quick.label')} hasDividers items={rows} />
        </Card>
      ) : null}
      {service.description ? (
        <Card padding={6} xstyle={styles.card}>
          <VStack gap={2}>
            <Heading level={2} xstyle={styles.section}>
              {t('service.about')}
            </Heading>
            <Text xstyle={styles.body}>{service.description}</Text>
          </VStack>
        </Card>
      ) : null}
    </SubPage>
  );
}
