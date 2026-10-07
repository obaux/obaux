import * as stylex from '@stylexjs/stylex';
import { Button } from '@astryxdesign/core/Button';
import { Card } from '@astryxdesign/core/Card';
import { HStack } from '@astryxdesign/core/HStack';
import { Icon } from '@astryxdesign/core/Icon';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { textLinkLook } from './TextLink.js';

/**
 * The booked visit, at the top of a place opened from it (Will, 5 October,
 * D-281). It used to be one green row — the day and "10:00 AM · Visit
 * booked" — and that was not enough to say three things at once: that this
 * is *your next visit*, when it is, and that you can move it. So it is a
 * small hero: the label, the day large, the time, and under them a link to
 * change it.
 *
 * Green, like the trip card's confirmed token (D-273), so it reads as done.
 * The card itself is not a link — only "Change appointment" is.
 *
 * Also the booked screen's card (Will, 7 October, D-337: "use the Green card
 * for confirmed booking allowing for changing booking from confirmation
 * screen. Bring in the number of days piece into that card"): there the
 * eyebrow is the program's name, and `countdown` says how soon.
 */
export interface VisitCardProps {
  /** "Your next visit". */
  readonly eyebrow: string;
  /** "Wednesday, October 7". */
  readonly day: string;
  /** "10:00 AM". */
  readonly time: string;
  /** The service the visit is for, after the time: "10:00 AM · GED classes" (D-332). */
  readonly service?: string | null;
  /** How soon, under the time: "Today", "Tomorrow", "In 2 days" (D-337). */
  readonly countdown?: string | null;
  /** "Change appointment" — left out for a visit that has already happened. */
  readonly changeLabel?: string;
  readonly changeHref?: string | null;
}

const styles = stylex.create({
  card: {
    width: '100%',
    backgroundColor: colorVars['--color-background-green'],
    borderColor: 'transparent',
  },
  mark: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '50%',
    backgroundColor: colorVars['--color-background-card'],
    color: colorVars['--color-icon-green'],
  },
  eyebrow: { fontSize: '16px', lineHeight: 1.3, fontWeight: 700, color: colorVars['--color-icon-green'] },
  day: { fontSize: '26px', lineHeight: 1.2, fontWeight: 700, color: colorVars['--color-text-primary'] },
  time: { fontSize: '20px', lineHeight: 1.3, fontWeight: 600, color: colorVars['--color-text-green'] },
  countdown: { fontSize: '16px', lineHeight: 1.3, fontWeight: 700, color: colorVars['--color-icon-green'] },
  rule: {
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border-green'],
    paddingBlockStart: '4px',
  },
  change: {
    alignSelf: 'flex-start',
    minHeight: pam['--pam-touch-target-min'],
    fontSize: '17px',
    fontWeight: 600,
  },
  changeColour: {
    color: { default: colorVars['--color-icon-green'], ':hover': colorVars['--color-text-green'] },
  },
});

export function VisitCard({ eyebrow, day, time, service = null, countdown = null, changeLabel, changeHref = null }: VisitCardProps) {
  return (
    <Card padding={5} xstyle={styles.card}>
      <VStack gap={3}>
        <HStack gap={2} align="center" wrap="nowrap">
          <HStack align="center" justify="center" xstyle={styles.mark}>
            <Icon icon="calendar" size="md" />
          </HStack>
          <Text xstyle={styles.eyebrow}>{eyebrow}</Text>
        </HStack>
        <VStack gap={0.5}>
          <Text xstyle={styles.day}>{day}</Text>
          <Text xstyle={styles.time}>{service ? `${time} · ${service}` : time}</Text>
          {countdown ? <Text xstyle={styles.countdown}>{countdown}</Text> : null}
        </VStack>
        {changeLabel && changeHref ? (
          <VStack xstyle={styles.rule}>
            <Button
              label={changeLabel}
              variant="ghost"
              href={changeHref}
              // A link, not a pill (D-280).
              xstyle={[styles.change, textLinkLook.link, styles.changeColour]}
            />
          </VStack>
        ) : null}
      </VStack>
    </Card>
  );
}
