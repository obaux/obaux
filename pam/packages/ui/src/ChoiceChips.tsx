'use client';

import * as stylex from '@stylexjs/stylex';
import { Button } from './Button.js';
import { HStack } from '@astryxdesign/core/HStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { pam } from './tokens.stylex.js';
import { TaggedWords } from './OptionTag.js';

/**
 * One choice from a few, as pills (Will, 7 October, D-359, D-366): the
 * chosen one in the secondary green, the rest white with a grey edge — Plan a
 * visit's days and times, sign-up's language, a program's kind and focus.
 * Each is a 48px button with `aria-pressed`; the group carries the question.
 *
 * An option may carry a `tag` ("EN", "PT-BR": a language's short name, always
 * in English, before its words, D-451) and the `lang` its label is written in.
 * `lang` goes on the button itself, because Astryx names a button from its
 * `label` as an `aria-label` once it has children, and an `aria-label` takes
 * the language of the element it is on. `dir` does not: it goes on the words
 * only (`TaggedWords`), so the chip lays out the way the page does and the tag
 * stays first, at the page's start — an Arabic chip on an English page reads
 * "AR  العربية", an English one on an Arabic page "EN  English" (D-455).
 */
export interface ChoiceChipsProps<V extends string> {
  /** The question, read out for the group (shown elsewhere, as a heading). */
  readonly label: string;
  readonly options: readonly {
    readonly value: V;
    readonly label: string;
    /** Shown before the label in a cell of its own, hidden from a screen reader. */
    readonly tag?: string;
    /** The language the label is written in, so it is spoken in that voice. */
    readonly lang?: string;
  }[];
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
            // The spoken name is the button's aria-label, which takes the language of the element it is on,
            // so `lang` is on the button. `dir` is NOT: it would turn the whole chip round, and the tag would
            // sit after the name for a reader of the page ("العربية  AR" on an English page). The words
            // carry their own `dir`; the chip lays out the way the page does, the tag first (D-455).
            {...(option.lang ? { lang: option.lang } : {})}
          >
            {option.tag || option.lang ? (
              <TaggedWords tag={option.tag} lang={option.lang}>
                {option.label}
              </TaggedWords>
            ) : undefined}
          </Button>
        );
      })}
    </HStack>
  );
}
