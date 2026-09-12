import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';

/**
 * "Step 2 of 4" plus a plain-language title (§2.4).
 *
 * Used in every multi-step flow. Knowing how much is left is the difference
 * between finishing setup and abandoning it, so the count comes first and is
 * announced to screen readers as part of the heading's context.
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
  bar: {
    height: '8px',
    borderRadius: '4px',
    backgroundColor: 'var(--astryx-color-surface-sunken, rgba(0,0,0,0.08))',
    width: '100%',
    overflow: 'hidden',
  },
  // A StyleX dynamic style, not an inline `style={{}}`: §2.3 allows overrides
  // only through stylex.create + xstyle, and a width that varies per render is
  // exactly what dynamic styles are for.
  fill: (percent: number) => ({
    height: '100%',
    borderRadius: '4px',
    backgroundColor: 'var(--astryx-color-accent, currentColor)',
    width: `${percent}%`,
    // No transition: a progress bar that animates on mount reads as loading.
  }),
});

export function StepHeader({ current, total, title, progressLabel }: StepHeaderProps) {
  const percent = total > 0 ? Math.min(100, Math.max(0, (current / total) * 100)) : 0;

  return (
    <VStack gap={2}>
      <Text type="supporting" xstyle={styles.progress}>
        {progressLabel}
      </Text>
      <div
        role="progressbar"
        aria-valuenow={current}
        aria-valuemin={1}
        aria-valuemax={total}
        aria-label={progressLabel}
        {...stylex.props(styles.bar)}
      >
        <div {...stylex.props(styles.fill(percent))} />
      </div>
      <Heading level={1} xstyle={styles.title}>
        {title}
      </Heading>
    </VStack>
  );
}
