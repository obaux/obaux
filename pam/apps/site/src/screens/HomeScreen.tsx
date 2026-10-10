import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Grid } from '@astryxdesign/core/Grid';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@pam/ui/Button';
import { Frame } from '../components/Frame';
import { ABOUT, ABOUT_ART, ABOUT_ON_HOME, aboutPath } from '../content/about';
import { ReadMore } from '../components/Prose';
import { SIGN_IN_URL } from '../lib/links';

const styles = stylex.create({
  hero: { paddingBlock: '48px 16px' },
  title: { maxWidth: '18ch' },
  lede: { maxWidth: '56ch' },
  actions: { flexWrap: 'wrap' },
  // The pictures are the app's own sign-in illustrations, cropped to a banner.
  about: { width: '100%', height: 'auto', display: 'block', borderRadius: '12px', aspectRatio: '8 / 3' },
  picture: { width: '100%', height: '180px', objectFit: 'cover', display: 'block', borderRadius: '12px' },
});

const HOW = [
  {
    image: '/art/hero-city.webp',
    title: 'Find a place',
    body: 'See what your city has to offer: Learning, Earning, and Family Support.',
  },
  {
    image: '/art/hero-phone.webp',
    title: 'Talk to a real person',
    body: 'A real person can point you to the right one and answer questions.',
  },
  {
    image: '/art/hero-sneakers.webp',
    title: 'Keep going',
    body: 'Pam reminds you before you go, so nothing gets missed.',
  },
] as const;

const WHO = [
  {
    title: 'Members',
    body: 'For someone coming home: find a place, plan a visit, and keep going with a person in your corner.',
  },
  {
    title: 'Case managers',
    body: 'Know where your people are going, and connect them in a tap.',
  },
  {
    title: 'Programs',
    body: 'See who is coming, keep them coming, and get people sent your way.',
  },
] as const;

/**
 * `showAbout` is the "About Pam" section. It follows the English post's sign-off
 * (`content/about.ts`): hidden until Will signs it. Storybook's "Home with About Pam"
 * story turns it on to show it.
 */
export function HomeScreen({ showAbout = ABOUT_ON_HOME }: { readonly showAbout?: boolean }) {
  return (
    <Frame gap={10}>
      <VStack gap={4} xstyle={styles.hero}>
        <Heading level={1} type="display-2" xstyle={styles.title}>
          Pam helps you find people and places that can help.
        </Heading>
        <Text type="large" color="secondary" xstyle={styles.lede}>
          Pam connects people coming home with the programs, mentors and case managers who can help:
          learning, earning and family support, in one app.
        </Text>
        <HStack gap={3} xstyle={styles.actions}>
          <Button label="Sign in" variant="primary" size="lg" href={SIGN_IN_URL} />
          <Button label="How Pam works" variant="secondary" size="lg" href="/support/" />
        </HStack>
      </VStack>

      <VStack gap={4}>
        <Heading level={2}>How Pam helps</Heading>
        <Grid columns={{ minWidth: 260 }} gap={4}>
          {HOW.map((item) => (
            <Card key={item.title} padding={4}>
              <VStack gap={3}>
                <img src={item.image} alt="" {...stylex.props(styles.picture)} />
                <Heading level={3}>{item.title}</Heading>
                <Text as="p">{item.body}</Text>
              </VStack>
            </Card>
          ))}
        </Grid>
      </VStack>

      {showAbout ? (
        <Card padding={6} variant="muted">
          <Grid columns={{ minWidth: 280 }} gap={6}>
            <img src={ABOUT_ART.wide} alt={ABOUT.en.artAlt} width={1600} height={600} {...stylex.props(styles.about)} />
            <VStack gap={2}>
              <Heading level={2}>{ABOUT.en.title}</Heading>
              <Text as="p">{ABOUT.en.lead}</Text>
              <ReadMore label="Read more about Pam" href={aboutPath('en')} />
            </VStack>
          </Grid>
        </Card>
      ) : null}

      <VStack gap={4}>
        <Heading level={2}>Who Pam is for</Heading>
        <Grid columns={{ minWidth: 260 }} gap={4}>
          {WHO.map((item) => (
            <Card key={item.title} padding={6} variant="muted">
              <VStack gap={2}>
                <Heading level={3}>{item.title}</Heading>
                <Text as="p">{item.body}</Text>
              </VStack>
            </Card>
          ))}
        </Grid>
      </VStack>

      <Card padding={8} variant="muted">
        <VStack gap={3}>
          <Heading level={2}>Pam has a lot of moving parts</Heading>
          <Text as="p">
            The Support page explains how it works in plain language, including who can do what.
          </Text>
          <HStack>
            <Button label="Go to Support" variant="secondary" href="/support/" />
          </HStack>
        </VStack>
      </Card>
    </Frame>
  );
}
