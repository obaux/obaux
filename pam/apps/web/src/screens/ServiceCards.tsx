'use client';

import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Card } from '@astryxdesign/core/Card';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { displayPhone } from '@pam/config';
import type { DummyService } from '@pam/config/dummy-services';
import { GlobeIcon, PhoneIcon, PlacesIcon } from '@pam/ui';
import { useI18n } from '@/lib/i18n';
import { siteName } from '@/lib/siteName';

/**
 * A program's services as cards to pick from (D-313, Will, 6 October:
 * "almost like an ecommerce feel to checkout, select type, and continue,
 * this takes priority over program info… the services simply laid out in
 * selectable cards, and a different color (gray) so they stick out").
 *
 * Before a visit is booked the cards come first on the page, stacked,
 * grey, each small: the name, a line or two, and only what differs from
 * the program — its own number, site, address. Tap one and it outlines;
 * the rows below follow it and Plan a trip is for it. With a visit
 * booked, only the visit's service is shown, outlined and still: the page
 * is about that visit.
 */
const META = { width: 16, height: 16, 'aria-hidden': true } as const;

const styles = stylex.create({
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
  name: { fontSize: '18px', lineHeight: 1.3, fontWeight: 600 },
  body: {
    fontSize: '15px',
    lineHeight: 1.4,
    display: '-webkit-box',
    WebkitBoxOrient: 'vertical',
    WebkitLineClamp: 2,
    overflow: 'hidden',
  },
  meta: { fontSize: '14px', lineHeight: 1.35, minWidth: 0 },
  metaIcon: { flexShrink: 0, color: colorVars['--color-text-secondary'] },
  hint: { fontSize: '16px', lineHeight: 1.5 },
  eyebrow: { fontSize: '15px', fontWeight: 600 },
});

export function ServiceCards({
  services,
  selectedId,
  onSelect,
  isLocked = false,
}: {
  readonly services: readonly DummyService[];
  readonly selectedId: string | null;
  readonly onSelect: (id: string | null) => void;
  /** A visit booked: only its service is shown, outlined, still (D-313). */
  readonly isLocked?: boolean;
}) {
  const { t } = useI18n();
  const shown = isLocked ? services.filter((s) => s.id === selectedId) : services;
  if (shown.length === 0) return null;
  return (
    <VStack gap={2}>
      {isLocked ? (
        <Text xstyle={styles.eyebrow}>{t('place.services.booked')}</Text>
      ) : (
        <Text type="supporting" xstyle={styles.hint}>
          {t('place.services.pickFirst')}
        </Text>
      )}
      <VStack gap={2} aria-label={t('place.services.label')}>
        {shown.map((s) => {
          const isOn = s.id === selectedId;
          const inside = (
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
          );
          return (
            <VStack key={s.id} gap={1}>
              {isLocked ? (
                // The visit's service, said and still — not a choice any more.
                <Card variant="muted" padding={4} xstyle={[styles.card, styles.cardOn]}>
                  {inside}
                </Card>
              ) : (
                <SelectableCard
                  label={isOn ? `${s.name} · ${t('place.services.selected')}` : s.name}
                  isSelected={isOn}
                  onChange={(on) => onSelect(on ? s.id : null)}
                  variant="muted"
                  padding={4}
                  xstyle={[styles.card, isOn && styles.cardOn]}
                >
                  {inside}
                </SelectableCard>
              )}
            </VStack>
          );
        })}
      </VStack>
    </VStack>
  );
}
