'use client';

import { useId, useRef, useState } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * The sign-in code as a row of small boxes, one per digit (Will, 3 October,
 * D-251), so a pasted or autofilled code drops straight in and somebody
 * typing can see how many digits are left.
 *
 * Underneath it is **one** real field, not six. Six inputs break paste,
 * break the phone's "from Messages" code suggestion (`one-time-code` fills a
 * single field), and make a screen reader announce six unlabelled boxes. So
 * the field stretches transparently over the row and takes every tap; the
 * boxes only draw what it holds, hidden from assistive technology, and the
 * box the next digit goes in is outlined while the field has focus.
 */
export interface CodeBoxesProps {
  /** Said above the boxes, and the field's accessible name. */
  readonly label: string;
  readonly value: string;
  readonly onChange: (next: string) => void;
  /** Digits in the code. Supabase's phone codes are six. */
  readonly length?: number;
  /** Called once when the last digit arrives. */
  readonly onComplete?: (code: string) => void;
  readonly isDisabled?: boolean;
  readonly id?: string;
}

const styles = stylex.create({
  label: { fontSize: '15px', lineHeight: 1.4 },
  frame: { position: 'relative', width: '100%' },
  row: { width: '100%' },
  box: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 0,
    height: '56px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    backgroundColor: colorVars['--color-background-body'],
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    fontWeight: 600,
    fontVariantNumeric: 'tabular-nums',
  },
  boxActive: {
    borderWidth: '2px',
    borderColor: colorVars['--color-accent'],
  },
  // The real field: over the whole row, invisible, taking every tap. 16px so
  // iOS does not zoom the page when it gets focus.
  input: {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    opacity: 0,
    borderWidth: 0,
    padding: 0,
    margin: 0,
    fontSize: '16px',
    color: 'transparent',
    caretColor: 'transparent',
    backgroundColor: 'transparent',
    cursor: 'text',
    // Focus shows on the box the next digit goes in (`boxActive`); the frame
    // ring globals.css would add is turned off there for `data-pam-code`.
    outline: 'none',
  },
});

export function CodeBoxes({
  label,
  value,
  onChange,
  length = 6,
  onComplete,
  isDisabled = false,
  id,
}: CodeBoxesProps) {
  const ownId = useId();
  const fieldId = id ?? ownId;
  const [focused, setFocused] = useState(false);
  const completed = useRef<string | null>(null);
  const digits = value.replace(/\D/g, '').slice(0, length);
  const active = Math.min(digits.length, length - 1);

  return (
    <VStack gap={2} xstyle={styles.frame}>
      <Text type="supporting" xstyle={styles.label}>
        <label htmlFor={fieldId}>{label}</label>
      </Text>
      <VStack data-pam-code="" xstyle={styles.frame}>
        <HStack gap={2} wrap="nowrap" aria-hidden xstyle={styles.row}>
          {Array.from({ length }, (_, i) => (
            <Text key={i} xstyle={[styles.box, focused && i === active && styles.boxActive]}>
              {digits[i] ?? ''}
            </Text>
          ))}
        </HStack>
        <input
          id={fieldId}
          name="code"
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]*"
          // No maxLength: it would cut a pasted "123 456" or "Your code is
          // 123456" short before the digits are picked out below.
          value={digits}
          disabled={isDisabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onChange={(event) => {
            // Pasted "123 456" or "Your code is 123456" still lands as digits.
            const next = event.target.value.replace(/\D/g, '').slice(0, length);
            onChange(next);
            if (next.length === length && completed.current !== next) {
              completed.current = next;
              onComplete?.(next);
            }
          }}
          {...stylex.props(styles.input)}
        />
      </VStack>
    </VStack>
  );
}
