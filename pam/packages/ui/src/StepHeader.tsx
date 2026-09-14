import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';

/**
 * "Step 2 of 5", a bar, and a plain-language title (§2.4).
 *
 * Used in every multi-step flow, and sign-up is the one that matters: the
 * difference between finishing setup and abandoning it is often nothing more
 * than knowing how much is left. So the count is text as well as a bar — a bar
 * on its own is a feeling, and somebody deciding whether they have time for
 * this needs a number.
 *
 * The bar is Astryx's ProgressBar rather than two nested boxes with a width
 * (which is what this was, with a hand-written `role="progressbar"` and a
 * `var(--astryx-color-accent, currentColor)` fallback that was doing the
 * colouring). The component carries the semantics, and the brand green comes
 * from the theme like everything else.
 *
 * It does not animate between steps. A progress bar that slides on mount reads
 * as loading, and the one thing this must never say is "wait".
 */
export interface StepHeaderProps {
  current: number;
  total: number;
  title: string;
  /** Localised "Step {current} of {total}". Pass the translated string. */
  progressLabel: string;
}

const styles = stylex.create({
  progress: {
    fontSize: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.06em',
  },
  title: {
    fontSize: '26px',
    lineHeight: 1.25,
  },
  bar: { width: '100%' },
});

export function StepHeader({ current, total, title, progressLabel }: StepHeaderProps) {
  return (
    <VStack gap={2}>
      {/*
        The same sentence twice would be read out twice, so the eye gets this
        one and the bar below carries the accessible name.
      */}
      <Text aria-hidden="true" type="supporting" xstyle={styles.progress}>
        {progressLabel}
      </Text>
      {/*
        The label is the same sentence as the line above it, so it is hidden
        visually and kept for screen readers — a bar announcing "Step 2 of 5"
        immediately after the text saying so is a stutter, not a second fact.
      */}
      <ProgressBar
        label={progressLabel}
        isLabelHidden
        value={current}
        max={total}
        xstyle={styles.bar}
      />
      <Heading level={1} xstyle={styles.title}>
        {title}
      </Heading>
    </VStack>
  );
}
