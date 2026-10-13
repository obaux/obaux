import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { EducationIcon, FamilyServicesIcon, WorkforceIcon } from '@pam/ui/icons';
import { BandViews } from '../components/BandViews';
import { FlipCarousel } from '../components/FlipCarousel';
import { LegalLink } from '../components/LegalLink';
import { PhonePanel } from '../components/PhonePanel';
import { Reveal } from '../components/Reveal';
import { SoftButton } from '../components/SoftButton';
import { WebFrame } from '../components/WebFrame';
import { VISIT_REMINDERS_LIVE } from '../content/flags';
import { HOME } from '../content/home-copy';
import { APP_URL } from '../lib/links';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

const styles = stylex.create({
  page: { backgroundColor: website['--website-surface-page'], color: website['--website-text-primary'], width: '100%' },
  // Hero: words left, the pictures right from 900px; words first below it.
  hero: {
    display: 'grid',
    alignItems: 'center',
    // Tighter on a phone so the pictures, and the Pause control on them, are on the first screen (Iris H1).
    gap: { default: '16px', '@media (min-width: 900px)': '32px' },
    paddingBlock: { default: '24px', '@media (min-width: 900px)': '48px' },
    gridTemplateColumns: { default: 'minmax(0, 1fr)', '@media (min-width: 900px)': 'minmax(0, 1fr) minmax(0, 1fr)' },
  },
  h1: {
    color: website['--website-text-primary'],
    fontFamily: 'var(--font-family-body)',
    fontWeight: 600,
    fontSize: { default: '40px', '@media (min-width: 900px)': '53px' },
    lineHeight: { default: '41px', '@media (min-width: 900px)': '57px' },
    letterSpacing: { default: '-0.64px', '@media (min-width: 900px)': '-1px' },
    margin: 0,
  },
  green: { color: website['--website-brand-primary'] },
  lead: {
    color: website['--website-text-secondary'],
    fontFamily: 'var(--font-family-body)',
    fontWeight: 400,
    fontSize: { default: '17px', '@media (min-width: 900px)': '26px' },
    lineHeight: { default: '24px', '@media (min-width: 900px)': '37px' },
    margin: 0,
  },
  chips: { flexWrap: 'wrap', gap: '12px' },
  // A feature row: words and a phone panel, swapped on alternate rows.
  row: {
    display: 'grid',
    alignItems: 'center',
    gap: { default: '20px', '@media (min-width: 900px)': '60px' },
    paddingBlock: { default: '24px', '@media (min-width: 900px)': '48px' },
    gridTemplateColumns: { default: 'minmax(0, 1fr)', '@media (min-width: 900px)': 'minmax(0, 1fr) minmax(0, 1fr)' },
  },
  rowText: { gap: { default: '20px', '@media (min-width: 900px)': '24px' }, justifyContent: 'space-between', paddingInline: '24px', paddingBlockStart: { default: '24px', '@media (min-width: 900px)': '0px' } },
  rowFlip: { order: { default: 0, '@media (min-width: 900px)': 2 } },
  head: {
    color: website['--website-text-primary'],
    fontFamily: 'var(--font-family-body)',
    fontWeight: 500,
    fontSize: { default: '40px', '@media (min-width: 900px)': '48px' },
    lineHeight: { default: '41px', '@media (min-width: 900px)': '57px' },
    letterSpacing: '-1px',
    margin: 0,
  },
  body: { color: website['--website-text-secondary'], maxWidth: { default: '460px', '@media (min-width: 900px)': '400px' }, margin: 0 },
  smallChip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    minHeight: '40px',
    boxSizing: 'border-box',
    paddingInline: '12px',
    borderRadius: '20px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: website['--website-border-subtle'],
    color: website['--website-text-primary'],
    backgroundColor: website['--website-surface-page'],
  },
  // The two callouts side by side in one soft card.
  callouts: {
    display: 'grid',
    gap: '32px',
    padding: { default: '32px 24px', '@media (min-width: 900px)': '32px' },
    boxSizing: 'border-box',
    borderRadius: '24px',
    backgroundColor: website['--website-surface-muted'],
    gridTemplateColumns: { default: 'minmax(0, 1fr)', '@media (min-width: 900px)': 'minmax(0, 1fr) minmax(0, 1fr)' },
  },
  callout: { gap: { default: '18px', '@media (min-width: 900px)': '12px' }, alignItems: 'center', textAlign: 'center' },
  eyebrow: { color: website['--website-text-muted-strong'], textTransform: 'uppercase', margin: 0 },
  // Bold 17/24 on a phone (Figma "Heading/Small 17"), 20/30 from 900px.
  calloutText: {
    color: website['--website-text-primary'],
    margin: 0,
    maxWidth: '520px',
    fontFamily: 'var(--font-family-body)',
    fontWeight: { default: 700, '@media (min-width: 900px)': 400 },
    fontSize: { default: '17px', '@media (min-width: 900px)': '20px' },
    lineHeight: { default: '24px', '@media (min-width: 900px)': '30px' },
  },
  divided: {
    borderBlockStartWidth: { default: '1px', '@media (min-width: 900px)': '0px' },
    borderInlineStartWidth: { default: '0px', '@media (min-width: 900px)': '1px' },
    // A plain 1px rule on a phone (Figma), dashed beside the other half from 900px.
    borderStyle: { default: 'solid', '@media (min-width: 900px)': 'dashed' },
    borderColor: website['--website-border-strong'],
    paddingBlockStart: { default: '32px', '@media (min-width: 900px)': '0px' },
    paddingInlineStart: { default: '0px', '@media (min-width: 900px)': '32px' },
  },
  // Phone: the callouts sit 48px under the last card and 120px above the footer's edge (Figma).
  calloutsFrame: { marginBlockStart: { default: '24px', '@media (min-width: 900px)': '0px' } },
  gap: { height: { default: '120px', '@media (min-width: 900px)': '48px' } },
});

const CAROUSEL = [
  {
    src: '/art/hero-city.webp',
    alt: 'Find a place. See what your city has to offer: Learning, Earning, and Family Support.',
  },
  {
    src: '/art/hero-phone.webp',
    alt: 'Talk to a real person. A real person can point you to the right one and answer questions.',
  },
  {
    src: '/art/hero-sneakers.webp',
    alt: VISIT_REMINDERS_LIVE
      ? 'Keep going. Pam keeps your planned visits in one place, and texts you a reminder before you go.'
      : 'Keep going. Pam keeps your planned visits in one place. Texts that remind you are coming.',
  },
].map((slide, i) => ({ id: `hero-${i + 1}`, width: 900, height: 1102, ...slide }));

const CHIP_ICON = [WorkforceIcon, FamilyServicesIcon, EducationIcon] as const;

/** The new Home (Figma "Pam — Website", Home 24:575 desktop, 7:3 phone). Its words are `content/home-copy.ts`. `showAbout` is kept for Storybook's walker and ignored: the design's Home has no About section. */
export function HomeScreen(_props: { readonly showAbout?: boolean } = {}) {
  return (
    <VStack xstyle={styles.page}>
      <WebFrame>
        <div {...stylex.props(styles.hero)}>
          <VStack gap={6}>
            <Heading level={1} xstyle={styles.h1}>
              {HOME.hero.before}
              <span {...stylex.props(styles.green)}>{HOME.hero.green1}</span>
              {HOME.hero.middle}
              <span {...stylex.props(styles.green)}>{HOME.hero.green2}</span>
            </Heading>
            <Text as="p" xstyle={styles.lead}>
              {HOME.hero.lead}
            </Text>
          </VStack>
          <FlipCarousel slides={CAROUSEL} label={HOME.hero.pictures} />
        </div>
      </WebFrame>

      <WebFrame edge="card">
        <Reveal>
          <BandViews />
        </Reveal>
      </WebFrame>

      {HOME.rows.map((row, i) => (
        <WebFrame key={row.id} edge="card">
          <Reveal>
            <div {...stylex.props(styles.row)}>
              <VStack xstyle={styles.rowText}>
                <Heading level={2} xstyle={styles.head}>
                  {row.head}
                </Heading>
                {'chips' in row && row.chips ? (
                  <HStack xstyle={styles.chips} aria-label="Kinds of help">
                    {row.chips.map((label, k) => {
                      const Icon = CHIP_ICON[k]!;
                      return (
                        <span key={label} {...stylex.props(type.label_14, styles.smallChip)}>
                          <Icon width={20} height={20} aria-hidden />
                          {label}
                        </span>
                      );
                    })}
                  </HStack>
                ) : null}
                <Text as="p" xstyle={[type.lead_17, styles.body]}>
                  {row.body}
                </Text>
                <HStack>
                  <SoftButton label={row.cta.label} href={row.cta.href === 'app' ? `${APP_URL}/` : row.cta.href} pill />
                </HStack>
              </VStack>
              <div {...stylex.props(i % 2 === 0 ? undefined : styles.rowFlip)}>
                <PhonePanel name={row.image} alt={row.alt} {...('bubble' in row && row.bubble ? { bubble: row.bubble } : {})} />
              </div>
            </div>
          </Reveal>
        </WebFrame>
      ))}

      <WebFrame edge="card">
        <Reveal>
          <div {...stylex.props(styles.calloutsFrame, styles.callouts)}>
            {HOME.callouts.map((callout, i) => (
              <VStack key={callout.eyebrow} xstyle={[styles.callout, i === 1 && styles.divided]}>
                <Text xstyle={[type.eyebrow_13, styles.eyebrow]}>{callout.eyebrow}</Text>
                <Text as="p" xstyle={[styles.calloutText]}>
                  {callout.text}
                </Text>
                {callout.cta.href === 'privacy' ? (
                  <LegalLink kind="privacy" label={callout.cta.label} variant="soft" />
                ) : (
                  <SoftButton label={callout.cta.label} href={callout.cta.href} compact />
                )}
              </VStack>
            ))}
          </div>
        </Reveal>
      </WebFrame>
      <div {...stylex.props(styles.gap)} />
    </VStack>
  );
}
