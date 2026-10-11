import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { HELP_EMAIL } from '../lib/links';

const styles = stylex.create({
  // A light outline, so the gray card reads as a card on the gray page.
  card: { borderWidth: '1px', borderStyle: 'solid', borderColor: colorVars['--color-border'] },
  // The last stop in a post's "On this page" menu.
  anchor: { scrollMarginTop: 'var(--post-scroll-offset, 24px)' },
  // The address can be selected and copied as well as tapped.
  address: { userSelect: 'text', overflowWrap: 'anywhere', fontWeight: 600 },
});

/** hello@joinpam.org as a mailto link and as text a person can select and copy. */
export function HelpAddress() {
  return (
    <Link href={`mailto:${HELP_EMAIL}`} xstyle={styles.address}>
      {HELP_EMAIL}
    </Link>
  );
}

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
          <Text as="p">
            Write to us at <HelpAddress />. Tell us what happened and what you see on the screen. A person at Pam
            reads every message.
          </Text>
        </VStack>
      </Card>
    </VStack>
  );
}
