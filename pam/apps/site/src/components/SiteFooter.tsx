import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HOME } from '../content/home-copy';
import { ABOUT_ON_HOME, aboutPath } from '../content/about';
import { HELP_EMAIL } from '../lib/links';
import { tap } from '../lib/tap';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { LegalLink } from './LegalLink';
import { WebFrame } from './WebFrame';
import { Wordmark } from './Wordmark';

const styles = stylex.create({
  foot: {
    marginBlockStart: '64px',
    paddingBlock: '64px 40px',
    backgroundColor: website['--website-surface-brand-deep'],
    color: website['--website-text-on-brand-deep'],
  },
  columns: { justifyContent: 'space-between', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' },
  links: { flexWrap: 'wrap', gap: '16px' },
  link: { color: website['--website-text-on-brand-deep'], textDecorationLine: 'underline', minWidth: '48px', justifyContent: 'center' },
  small: { color: website['--website-text-on-brand-deep'] },
  // The wordmark is dark green on a light page; on the deep green band it is drawn white.
  mark: { filter: 'brightness(0) invert(1)' },
  side: { alignItems: 'flex-end', gap: '8px' },
});

/** The footer of the new site: the deep green band with the links, the copyright, and the wordmark with its tagline. */
export function SiteFooter() {
  return (
    <VStack as="footer" xstyle={styles.foot}>
      <WebFrame>
        <HStack xstyle={styles.columns}>
          <VStack gap={2}>
            <HStack xstyle={styles.links}>
              <a href="/support/" {...stylex.props(type.label_15, styles.link, tap.link)}>
                Support
              </a>
              {ABOUT_ON_HOME ? (
                <a href={aboutPath('en')} {...stylex.props(type.label_15, styles.link, tap.link)}>
                  About Pam
                </a>
              ) : null}
              <FooterLegal kind="privacy" label="Privacy" />
              <FooterLegal kind="terms" label="Terms" />
              <a href={`mailto:${HELP_EMAIL}`} {...stylex.props(type.label_15, styles.link, tap.link)}>
                Contact
              </a>
            </HStack>
            <Text xstyle={[type.caption_12, styles.small]}>{HOME.footer.copyright}</Text>
          </VStack>
          <VStack xstyle={styles.side}>
            <span {...stylex.props(styles.mark)}>
              <Wordmark />
            </span>
            <Text xstyle={[type.caption_12, styles.small]}>{HOME.footer.tagline}</Text>
          </VStack>
        </HStack>
      </WebFrame>
    </VStack>
  );
}

function FooterLegal({ kind, label }: { readonly kind: 'privacy' | 'terms'; readonly label: string }) {
  return <LegalLink kind={kind} label={label} variant="footer" />;
}
