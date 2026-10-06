'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
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
 * grey, each a dial and the service's name. Tap one: the dial fills, the
 * card outlines and turns the light green of a secondary button, and the
 * page below becomes about that service — About, the address, the number
 * and site in the rows.
 * With a visit booked, only the visit's service is shown, outlined and
 * still: the page is about that visit.
 */
const styles = stylex.create({
  card: { width: '100%' },
  // Picked: a 2px accent outline (Will: "it outlines, like a selected
  // card"), inside the corner so the radius follows, on the light green a
  // secondary button wears (Will: "change color to that light green… for
  // slight contrast on selected service").
  cardOn: {
    outlineWidth: '2px',
    outlineStyle: 'solid',
    outlineColor: colorVars['--color-accent'],
    outlineOffset: '-2px',
    backgroundColor: colorVars['--color-accent-muted'],
    transitionProperty: 'background-color',
    transitionDuration: '200ms',
  },
  name: { fontSize: '18px', lineHeight: 1.3, fontWeight: 600 },
  // The dial (Will: "dials before the service label… selecting entire
  // card selects the dial"): a ring, filled with a dot when picked. Drawn,
  // not a control — the card is the control, and says so to a screen reader.
  dial: {
    width: '22px',
    height: '22px',
    flexShrink: 0,
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    backgroundColor: colorVars['--color-background-body'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transitionProperty: 'border-color',
    transitionDuration: '150ms',
  },
  dialOn: { borderColor: colorVars['--color-accent'] },
  dot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
    backgroundColor: colorVars['--color-accent'],
    transform: 'scale(0)',
    transitionProperty: 'transform',
    transitionDuration: '150ms',
  },
  dotOn: { transform: 'scale(1)' },
  // The ask, as a heading (Will: "bold and larger, so there's better
  // hierarchy"): "Pick a service", and nothing more.
  hint: { fontSize: '20px', lineHeight: 1.3, fontWeight: 700 },
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
        <Heading level={2} xstyle={styles.hint}>
          {t('place.services.pickFirst')}
        </Heading>
      )}
      <VStack gap={2} aria-label={t('place.services.label')}>
        {shown.map((s) => {
          const isOn = s.id === selectedId;
          const inside = (
            <HStack gap={3} align="center" wrap="nowrap">
              <span aria-hidden {...stylex.props(styles.dial, isOn && styles.dialOn)}>
                <span {...stylex.props(styles.dot, isOn && styles.dotOn)} />
              </span>
              <Text xstyle={styles.name}>{s.name}</Text>
            </HStack>
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
