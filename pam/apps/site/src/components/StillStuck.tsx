import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { HelpRequest } from './HelpRequest';

const styles = stylex.create({
  // A light outline, so the gray card reads as a card on the gray page.
  card: { borderWidth: '1px', borderStyle: 'solid', borderColor: colorVars['--color-border'] },
  // The last stop in a post's "On this page" menu.
  anchor: { scrollMarginTop: 'var(--post-scroll-offset, 24px)' },
});

/**
 * The way to a person, at the end of a post and when a search finds nothing; never first (A28, Will, 11 October:
 * no phone calls, the help desk is email). Words by Sage, signed (a59). The address is a mailto link and plain
 * text. The form that will replace it waits for its switch, which is off.
 */
export function StillStuck() {
  return (
    <VStack id="still-stuck" data-post-section="Still stuck?" tabIndex={-1} xstyle={styles.anchor}>
      <Card padding={6} variant="muted" xstyle={styles.card}>
        <VStack gap={3} maxWidth={720}>
          <Heading level={2}>Still stuck?</Heading>
          <HelpRequest />
        </VStack>
      </Card>
    </VStack>
  );
}
