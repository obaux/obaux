'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { SelectableCard } from '@astryxdesign/core/SelectableCard';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import type { DummyService } from '@pam/config/dummy-services';
import { useI18n } from '@/lib/i18n';

/**
 * A program's services as cards to pick from (D-313, Will, 6 October:
 * "almost like an ecommerce feel to checkout, select type, and continue";
 * then "simplify the selection cards… only say service name… a cool
 * effect when selected, like a gradient skeleton loader animation in
 * background color, gray and white that shines on the card").
 *
 * Before a visit is booked the cards come first on the page, stacked,
 * grey, each just the service's name. Tap one: it outlines, a soft
 * grey-and-white shine runs across it, and the page below becomes about
 * that service — About, the address, the number and site in the rows.
 * With a visit booked, only the visit's service is shown, outlined and
 * still: the page is about that visit.
 */
/**
 * The shine (Will): a band of white sweeping across the grey, like a
 * skeleton loading — a thing is happening to this card. Slow and soft, and
 * none at all for somebody who asked their phone for less motion.
 */
const shine = stylex.keyframes({
  '0%': { backgroundPosition: '150% 0' },
  '100%': { backgroundPosition: '-50% 0' },
});

const styles = stylex.create({
  card: { width: '100%' },
  // Picked: a 2px accent outline (Will: "it outlines, like a selected
  // card"), inside the corner so the radius follows, and the shine.
  cardOn: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: colorVars['--color-accent'],
    outlineOffset: '-2px',
    backgroundImage: `linear-gradient(100deg, ${colorVars['--color-background-muted']} 30%, ${colorVars['--color-background-body']} 50%, ${colorVars['--color-background-muted']} 70%)`,
    backgroundSize: '200% 100%',
    backgroundRepeat: 'no-repeat',
    animationName: shine,
    animationDuration: '2.2s',
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  name: { fontSize: '18px', lineHeight: 1.3, fontWeight: 600 },
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
          const inside = <Text xstyle={styles.name}>{s.name}</Text>;
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
