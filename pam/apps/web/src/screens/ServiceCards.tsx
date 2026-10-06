'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { displayPhone } from '@pam/config';
import type { DummyService } from '@pam/config/dummy-services';
import { GlobeIcon, PhoneIcon, PlacesIcon, TextLink } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { siteName } from '@/lib/siteName';

/**
 * A program's services as cards to flip through (D-313, Will, 6 October:
 * "a horizontal card carousel with all of the details small inside card…
 * If user has selected a card, it outlines… when they press plan trip it
 * carries over their service selection"). On both of a member's place
 * profiles: with nothing booked, the card they pick is the service Plan a
 * trip is for, and the rows above (Call, Website, Get directions) follow
 * it; with a visit booked, the visit's service is the one outlined, and
 * the page is about it.
 *
 * Each card is small on purpose: the name, a line or two, and only what
 * differs from the program — its own number, site, address. "Details"
 * under the card opens the service's own page (`ServiceView`).
 */
const META = { width: 16, height: 16, 'aria-hidden': true } as const;

const styles = stylex.create({
  // Full-bleed past the page's side padding, so cards run off the edge
  // and say there are more; each snaps into place.
  rail: {
    marginInline: '-16px',
    paddingInline: '16px',
    paddingBlockEnd: '4px',
    overflowX: 'auto',
    scrollSnapType: 'x mandatory',
    scrollbarWidth: 'none',
  },
  slot: { flexShrink: 0, width: '250px', scrollSnapAlign: 'start' },
  card: { width: '100%' },
  // Picked: a 2px accent outline (Will: "it outlines, like a selected
  // card"), inside the corner so the radius follows, over the component's
  // own quieter ring.
  cardOn: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: colorVars['--color-accent'],
    outlineOffset: '-2px',
  },
  words: { minWidth: 0 },
  name: { fontSize: '17px', lineHeight: 1.3, fontWeight: 600 },
  body: {
    fontSize: '14px',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
  },
  meta: { fontSize: '13px', lineHeight: 1.35, minWidth: 0 },
  metaIcon: { flexShrink: 0, color: colorVars['--color-text-secondary'] },
  details: { alignSelf: 'flex-start' },
  hint: { fontSize: '15px', lineHeight: 1.5 },
});

export function ServiceCards({
  services,
  selectedId,
  onSelect,
  detailsHref,
  isLocked = false,
}: {
  readonly services: readonly DummyService[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  readonly detailsHref: (service: DummyService) => string;
  /** A visit booked: the outlined card is the visit's, and stays (D-313). */
  readonly isLocked?: boolean;
}) {
  const { t } = useI18n();
  if (services.length === 0) return null;
  return (
    <VStack gap={2}>
      {isLocked ? null : (
        <Text type="supporting" xstyle={styles.hint}>
          {t('place.services.pick')}
        </Text>
      )}
      <HStack gap={3} wrap="nowrap" align="stretch" xstyle={styles.rail} aria-label={t('place.services.label')}>
        {services.map((s) => {
          const isOn = s.id === selectedId;
          return (
            <VStack key={s.id} gap={1} xstyle={styles.slot}>
              <SelectableCard
                label={isOn ? `${s.name} · ${t('place.services.selected')}` : s.name}
                isSelected={isOn}
                isDisabled={isLocked && !isOn}
                onChange={(on) => {
                  if (isLocked) return;
                  onSelect(on ? s.id : null);
                }}
                padding={4}
                xstyle={[styles.card, isOn && styles.cardOn]}
              >
                <VStack gap={2} xstyle={styles.words}>
                  <Text xstyle={styles.name}>{s.name}</Text>
                  {s.description ? (
                    <Text type="supporting" xstyle={styles.body}>
                      {s.description}
                    </Text>
                  ) : null}
                  <VStack gap={1}>
                    {s.phone ? (
                      <HStack gap={1} align="center" wrap="nowrap">
                        <PhoneIcon {...META} {...stylex.props(styles.metaIcon)} />
                        <Text type="supporting" xstyle={styles.meta}>
                          {displayPhone(s.phone)}
                        </Text>
                      </HStack>
                    ) : null}
                    {s.website ? (
                      <HStack gap={1} align="center" wrap="nowrap">
                        <GlobeIcon {...META} {...stylex.props(styles.metaIcon)} />
                        <Text type="supporting" xstyle={styles.meta}>
                          {siteName(s.website)}
                        </Text>
                      </HStack>
                    ) : null}
                    <HStack gap={1} align="center" wrap="nowrap">
                      <PlacesIcon {...META} {...stylex.props(styles.metaIcon)} />
                      <Text type="supporting" xstyle={styles.meta}>
                        {s.address ?? t('place.services.atProgram')}
                      </Text>
                    </HStack>
                  </VStack>
                </VStack>
              </SelectableCard>
              <TextLink label={`${t('place.services.details')}: ${s.name}`} href={detailsHref(s)} size="quiet" />
            </VStack>
          );
        })}
      </HStack>
    </VStack>
  );
}
