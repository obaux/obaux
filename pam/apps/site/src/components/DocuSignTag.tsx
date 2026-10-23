import * as stylex from '@stylexjs/stylex';
import { Badge } from '@astryxdesign/core/Badge';
import { HStack } from '@astryxdesign/core/HStack';
import { DOCUSIGN } from '../content/docusign';
import { DOCUSIGN_LIVE } from '../content/flags';

const styles = stylex.create({
  row: { flexWrap: 'wrap', alignItems: 'center', gap: '8px' },
  // DocuSign's own file, shown at one height and never altered.
  logo: { display: 'block', height: '16px', width: 'auto' },
});

/** The small "Signing with DocuSign" tag on the Home page's programs row: DocuSign's logo and its name, then "Coming soon" until signing is live. */
export function DocuSignTag() {
  return (
    <HStack xstyle={styles.row}>
      <Badge
        variant="neutral"
        label={DOCUSIGN.label}
        {...(DOCUSIGN.logo ? { icon: <img src={DOCUSIGN.logo} alt={DOCUSIGN.logoAlt} {...stylex.props(styles.logo)} /> } : {})}
      />
      {DOCUSIGN_LIVE ? null : <Badge variant="neutral" label={DOCUSIGN.soon} />}
    </HStack>
  );
}
