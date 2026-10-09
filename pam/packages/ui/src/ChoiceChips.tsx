'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from './Button.js';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';

/**
 * One choice from a few, as pills (Will, 7 October, D-359, D-366): the
 * chosen one in the secondary green, the rest white with a grey edge — Plan a
 * visit's days and times, sign-up's language, a program's kind and focus.
 * Each is a 48px button with `aria-pressed`; the group carries the question.
 */
export interface ChoiceChipsProps<V extends string> {
  /** The question, read out for the group (shown elsewhere, as a heading). */
  readonly label: string;
  readonly options: readonly { readonly value: V; readonly label: string }[];
  readonly value: V | null;
  readonly onChange: (value: V) => void;
}

const styles = stylex.create({
  group: { width: '100%' },
  chip: {
    minHeight: pam['--pam-touch-target-min'],
    paddingInline: '18px',
    fontSize: '16px',
    borderRadius: '999px',
  },
  off: {
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  on: { fontWeight: 600 },
});

export function ChoiceChips<V extends string>({ label, options, value, onChange }: ChoiceChipsProps<V>) {
  return (
    <HStack gap={2} wrap="wrap" role="group" aria-label={label} xstyle={styles.group}>
      {options.map((option) => {
        const isOn = option.value === value;
        return (
          <Button
            key={option.value}
            label={option.label}
            variant="secondary"
            aria-pressed={isOn}
            onClick={() => onChange(option.value)}
            xstyle={[styles.chip, isOn ? styles.on : styles.off]}
          />
        );
      })}
    </HStack>
  );
}
