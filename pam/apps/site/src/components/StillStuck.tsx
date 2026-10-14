import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { website } from '../lib/website.stylex';
import { HelpRequest } from './HelpRequest';

const styles = stylex.create({
  // The design's "Still stuck block": a soft grey card, radius 24, 32px inside, a hairline.
  card: {
    padding: '32px',
    boxSizing: 'border-box',
    borderRadius: '24px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: website['--website-border-subtle'],
    backgroundColor: website['--website-surface-muted'],
    color: website['--website-text-primary'],
  },
  // The last stop in a post's "On this page" menu.
  anchor: {
    scrollMarginTop: 'var(--post-scroll-offset, 24px)',
  },
});

/**
 * The way to a person, at the end of a post and when a search finds nothing; never first (A28, Will, 11 October:
 * no phone calls, the help desk is email). Words by Sage, signed (a59). The address is a mailto link and plain
 * text. The form that will replace it waits for its switch, which is off.
 */
export function StillStuck() {
  return (
    <VStack id="still-stuck" data-post-section="Still stuck?" tabIndex={-1} xstyle={styles.anchor}>
      <VStack gap={3} xstyle={styles.card}>
        <VStack gap={3} maxWidth={720}>
          <HelpRequest />
        </VStack>
      </VStack>
    </VStack>
  );
}
