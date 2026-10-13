import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HOME } from '../content/home-copy';
import { ABOUT_ON_HOME, aboutPath } from '../content/about';
import { HELP_EMAIL } from '../lib/links';
import { footerLink } from '../lib/footer-link';
import { tap } from '../lib/tap';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { LegalLink } from './LegalLink';
import { WebFrame } from './WebFrame';
import { Wordmark } from './Wordmark';

const styles = stylex.create({
  foot: {
    marginBlockStart: { default: '0px', '@media (min-width: 900px)': '64px' },
    paddingBlock: { default: '64px', '@media (min-width: 900px)': '64px 40px' },
    backgroundColor: website['--website-surface-brand-deep'],
    color: website['--website-text-on-brand-deep'],
  },
  // On a phone one centred column, as drawn (wordmark and tagline, the links, the copyright); side by side from 900px.
  columns: {
    flexDirection: { default: 'column', '@media (min-width: 900px)': 'row' },
    justifyContent: 'space-between',
    alignItems: { default: 'center', '@media (min-width: 900px)': 'flex-start' },
    gap: '12px',
    flexWrap: 'wrap',
  },
  left: { alignItems: { default: 'center', '@media (min-width: 900px)': 'flex-start' }, order: { default: 1, '@media (min-width: 900px)': 0 }, gap: '8px' },
  links: { flexDirection: { default: 'column', '@media (min-width: 900px)': 'row' }, alignItems: 'center', flexWrap: 'wrap', gap: { default: '0px', '@media (min-width: 900px)': '16px' } },
  small: { color: website['--website-text-on-brand-deep'] },
  copyright: { color: website['--website-text-on-brand-deep'], opacity: 0.7, paddingBlock: '12px' },
  // The wordmark is dark green on a light page; on the deep green band it is drawn white.
  mark: { filter: 'brightness(0) invert(1)' },
  side: { alignItems: { default: 'center', '@media (min-width: 900px)': 'flex-end' }, gap: '12px', order: { default: 0, '@media (min-width: 900px)': 1 } },
});

/** The footer of the new site: the deep green band with the links, the copyright, and the wordmark with its tagline. */
export function SiteFooter() {
  return (
    <VStack as="footer" xstyle={styles.foot}>
      <WebFrame>
        <HStack xstyle={styles.columns}>
          <VStack xstyle={styles.left}>
            <HStack xstyle={styles.links}>
              <a href="/support/" {...stylex.props(footerLink.link, tap.link)}>
                Support
              </a>
              {ABOUT_ON_HOME ? (
                <a href={aboutPath('en')} {...stylex.props(footerLink.link, tap.link)}>
                  About Pam
                </a>
              ) : null}
              <FooterLegal kind="privacy" label="Privacy" />
              <FooterLegal kind="terms" label="Terms" />
              <a href={`mailto:${HELP_EMAIL}`} {...stylex.props(footerLink.link, tap.link)}>
                Contact
              </a>
            </HStack>
            <Text xstyle={[type.caption_12, styles.copyright]}>{HOME.footer.copyright}</Text>
          </VStack>
          <VStack xstyle={styles.side}>
            <span {...stylex.props(styles.mark)}>
              <Wordmark tall />
            </span>
            <Text xstyle={[type.body_14, styles.small]}>{HOME.footer.tagline}</Text>
          </VStack>
        </HStack>
      </WebFrame>
    </VStack>
  );
}

function FooterLegal({ kind, label }: { readonly kind: 'privacy' | 'terms'; readonly label: string }) {
  return <LegalLink kind={kind} label={label} variant="footer" />;
}
