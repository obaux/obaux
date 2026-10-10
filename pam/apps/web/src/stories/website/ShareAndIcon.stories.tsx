import type { Meta, StoryObj } from '@storybook/nextjs';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import appleTouchIcon from '../../../../site/src/app/apple-icon.png';
import { SITE_URL } from '../../../../site/src/lib/links';
import { SHARE_DESCRIPTION, SHARE_IMAGE, SHARE_TITLE } from '../../../../site/src/lib/share';

/**
 * What the public site looks like when it is shared and when it is bookmarked
 * (D-437). The words come from `apps/site/src/lib/share.ts` and the pictures are
 * the files the site ships — `public/og/social.png` and the favicon — so this is
 * the real thing, not a mock-up of it. Re-draw the social image in
 * `apps/site/social/preview.html`; re-make the icons with `scripts/make-icons.mjs`.
 *
 * The framing of a link card is each app's own (chat apps, social networks,
 * search results); the two here are the usual shapes.
 */
const meta = {
  title: 'Website/Share and icon',
  parameters: { layout: 'padded' },
} satisfies Meta;

export default meta;

const host = new URL(SITE_URL).host;

const styles = stylex.create({
  // A card as chat and social apps draw it: the picture at 1.91:1 over the words.
  large: { width: '100%', maxWidth: '520px', overflow: 'hidden' },
  largePicture: { width: '100%', aspectRatio: '1200 / 630', display: 'block', objectFit: 'cover' },
  // And the compact one: a square thumbnail, which crops the picture to its middle.
  compact: { width: '100%', maxWidth: '520px', overflow: 'hidden' },
  thumb: { width: '96px', height: '96px', flexShrink: 0, objectFit: 'cover', display: 'block', borderRadius: '8px' },
  // A browser tab: the icon at the 16px a tab draws it, then the page title.
  tab: {
    alignItems: 'center',
    paddingInline: '12px',
    height: '36px',
    maxWidth: '260px',
    borderRadius: '10px 10px 0 0',
    backgroundColor: colorVars['--color-background-body'],
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
  },
  tabIcon: { width: '16px', height: '16px', flexShrink: 0, display: 'block' },
  tabTitle: { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' },
  px: { display: 'block', imageRendering: 'pixelated' },
  circle: { width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', display: 'block' },
  round: { width: '96px', height: '96px', borderRadius: '22%', display: 'block' },
});

type Layout = 'Large card' | 'Compact card';

/** The link as it unfurls in a message or a post. Choose the shape in the controls. */
export const LinkPreview: StoryObj<{ layout: Layout }> = {
  name: 'Link preview',
  args: { layout: 'Large card' },
  argTypes: { layout: { control: 'inline-radio', options: ['Large card', 'Compact card'] } },
  render: ({ layout }) => (
    <VStack gap={4}>
      {layout === 'Large card' ? (
        <Card padding={0} elevation="low" xstyle={styles.large}>
          <img src={SHARE_IMAGE.url} alt={SHARE_IMAGE.alt} {...stylex.props(styles.largePicture)} />
          <VStack gap={1} padding={4}>
            <Text type="supporting">{host}</Text>
            <Heading level={3}>{SHARE_TITLE}</Heading>
            <Text type="supporting">{SHARE_DESCRIPTION}</Text>
          </VStack>
        </Card>
      ) : (
        <Card padding={3} elevation="low" xstyle={styles.compact}>
          <HStack gap={3}>
            <img src={SHARE_IMAGE.url} alt="" {...stylex.props(styles.thumb)} />
            <VStack gap={1}>
              <Text type="supporting">{host}</Text>
              <Heading level={3}>{SHARE_TITLE}</Heading>
              <Text type="supporting">{SHARE_DESCRIPTION}</Text>
            </VStack>
          </HStack>
        </Card>
      )}
      <Text type="supporting">
        The compact card crops the picture to a square from its middle. The logo and the tagline sit in exactly
        that square (the green panel), so they survive it; the illustration is only a frame.
      </Text>
    </VStack>
  ),
};

/** The favicon where it is seen: a tab, the sizes browsers ask for, and the home-screen icons. */
export const Icon: StoryObj = {
  render: () => (
    <VStack gap={8}>
      <VStack gap={2}>
        <Heading level={2}>In a browser tab</Heading>
        <HStack gap={2} xstyle={styles.tab}>
          <img src="/favicon.svg" alt="" {...stylex.props(styles.tabIcon)} />
          <Text type="supporting" xstyle={styles.tabTitle}>
            {SHARE_TITLE}
          </Text>
        </HStack>
        <Text type="supporting">Switch Storybook&rsquo;s light and dark in the toolbar to see it on both.</Text>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>The sizes</Heading>
        <HStack gap={6} align="end">
          {[16, 32, 48].map((n) => (
            <VStack key={n} gap={1} align="center">
              <img src="/favicon.svg" alt="" width={n} height={n} {...stylex.props(styles.px)} />
              <Text type="supporting">{n}px</Text>
            </VStack>
          ))}
          <VStack gap={1} align="center">
            <img src="/favicon.svg" alt="" width={180} height={180} {...stylex.props(styles.px)} />
            <Text type="supporting">The SVG, large</Text>
          </VStack>
        </HStack>
      </VStack>

      <VStack gap={2}>
        <Heading level={2}>On a phone&rsquo;s home screen</Heading>
        <HStack gap={6} align="end">
          <VStack gap={1} align="center">
            <img src={appleTouchIcon.src} alt="" {...stylex.props(styles.round)} />
            <Text type="supporting">Apple touch icon, corners rounded by iOS</Text>
          </VStack>
          <VStack gap={1} align="center">
            <img src="/icon-192.png" alt="" {...stylex.props(styles.round)} />
            <Text type="supporting">App icon (the member app&rsquo;s manifest)</Text>
          </VStack>
          <VStack gap={1} align="center">
            <img src="/icon-maskable-512.png" alt="" {...stylex.props(styles.circle)} />
            <Text type="supporting">Maskable, cropped to a circle by Android</Text>
          </VStack>
        </HStack>
      </VStack>
    </VStack>
  ),
};
