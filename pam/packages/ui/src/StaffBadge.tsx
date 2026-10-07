'use client';

import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Button } from '@astryxdesign/core/Button';
import { Popover } from '@astryxdesign/core/Popover';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { pam } from './tokens.stylex.js';

/**
 * The person at a program, as a face (D-335, Will, 7 October): on a booked
 * place's open/closed row, at its right. Tapping it says who they are, their
 * name and title, in a small popover. A tooltip only shows on hover and a
 * phone has none, so it is Astryx's `Popover`, which opens on a tap.
 *
 * Their photo when Pam has one; otherwise their initials, as everywhere.
 */
export interface StaffBadgeProps {
  /** "Sandra". */
  readonly name: string;
  /** "Program lead". */
  readonly title: string;
  readonly photoUrl?: string | null;
  /** The button's accessible name: "Sandra, Program lead. Who you'll meet". */
  readonly label: string;
}

const styles = stylex.create({
  // A 48px target around the 40px face (§2.5).
  trigger: {
    width: pam['--pam-touch-target-min'],
    height: pam['--pam-touch-target-min'],
    minHeight: pam['--pam-touch-target-min'],
    padding: 0,
    borderRadius: '50%',
    flexShrink: 0,
  },
  card: { paddingBlock: '10px', paddingInline: '14px' },
  name: { fontSize: '17px', fontWeight: 700, lineHeight: 1.3 },
  title: { fontSize: '15px', lineHeight: 1.3 },
});

export function StaffBadge({ name, title, photoUrl = null, label }: StaffBadgeProps) {
  return (
    <Popover
      label={label}
      placement="below"
      alignment="end"
      content={
        <VStack gap={0.5} xstyle={styles.card}>
          <Text xstyle={styles.name}>{name}</Text>
          <Text type="supporting" xstyle={styles.title}>
            {title}
          </Text>
        </VStack>
      }
    >
      <Button
        label={label}
        variant="ghost"
        isIconOnly
        icon={<Avatar size={40} name={name} {...(photoUrl ? { src: photoUrl } : {})} tooltip={false} alt="" />}
        xstyle={styles.trigger}
      />
    </Popover>
  );
}
