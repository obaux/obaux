import * as stylex from '@stylexjs/stylex';
import { Link } from '@astryxdesign/core/Link';
import { HELP_EMAIL } from '../lib/links';
import { website } from '../lib/website.stylex';

const styles = stylex.create({
  // The address can be selected and copied as well as tapped.
  address: {
    userSelect: 'text',
    overflowWrap: 'anywhere',
    fontWeight: 600,
    color: website['--website-text-link'],
    textDecorationLine: 'underline',
    position: 'relative',
    // A finger-sized target around the address without changing the sentence: 48px tall (the 48px rule).
    '::after': { content: '""', position: 'absolute', insetBlock: '-14px', insetInline: '-8px' },
  },
});

/** hello@joinpam.org as a mailto link and as text a person can select and copy. */
export function HelpAddress() {
  return (
    <Link href={`mailto:${HELP_EMAIL}`} xstyle={styles.address}>
      {HELP_EMAIL}
    </Link>
  );
}
