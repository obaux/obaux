import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { Frame } from '../components/Frame';
import { StillStuck } from '../components/StillStuck';
import { BODIES } from '../content/bodies';
import { anyPostBySlug, formatDate, postBySlug } from '../content/posts';

const styles = stylex.create({
  // One centred reading column for the whole post, as on Figma Learn: header, who it is for, body.
  column: { width: '100%', maxWidth: '920px', marginInline: 'auto' },
  header: { alignItems: 'center', textAlign: 'center' },
  crumbs: { alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  // The page you are on, as a small gray pill at the end of the path.
  here: {
    paddingBlock: '4px',
    paddingInline: '10px',
    borderRadius: '8px',
    backgroundColor: colorVars['--color-background-gray'],
    fontWeight: 600,
  },
  title: { maxWidth: '24ch' },
  // "Who this is for": an outlined box under the title, like Figma's "Who can use this feature".
  meta: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '20px 24px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border-emphasized'],
    backgroundColor: colorVars['--color-background-card'],
  },
  audience: { alignItems: 'center' },
  metaTitle: { fontWeight: 700 },
  icon: { flexShrink: 0, width: '20px', height: '20px', color: colorVars['--color-icon-gray'] },
});

function PeopleGlyph() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...stylex.props(styles.icon)}
    >
      <circle cx="9" cy="8" r="3.2" />
      <path d="M3 19c.5-3.2 3-5 6-5s5.5 1.8 6 5" />
      <circle cx="17" cy="9" r="2.4" />
      <path d="M16.5 14.2c2.3.2 4 1.6 4.5 4.3" />
    </svg>
  );
}

function sentence(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * One support post: path, title, who it is for, then its body, in one centred column. `null` for an
 * unknown slug. `allowDraft` is Storybook's: the site never passes it, so a draft is `null` there and
 * the route does not exist.
 */
export function PostScreen({ slug, allowDraft = false }: { readonly slug: string; readonly allowDraft?: boolean }) {
  const post = allowDraft ? anyPostBySlug(slug) : postBySlug(slug);
  const Body = BODIES[slug];
  if (!post || !Body) return null;
  return (
    <Frame width="wide" gap={6}>
      <VStack gap={10} xstyle={styles.column}>
        {post.status === 'draft' ? (
          <Banner status="warning" title="Draft, not published: held until the feature ships. Not on the site, in Support or in search." />
        ) : null}
        <VStack gap={6} paddingBlockStart={8}>
          <VStack gap={4} xstyle={styles.header}>
            <HStack as="nav" gap={2} xstyle={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/support/">Support</Link>
              <Text type="supporting" aria-hidden>
                →
              </Text>
              <Text aria-current="page" xstyle={styles.here}>
                {post.title}
              </Text>
            </HStack>
            <Heading level={1} type="display-3" xstyle={styles.title}>
              {post.title}
            </Heading>
          </VStack>
          <VStack as="section" aria-label="About this post" gap={2} xstyle={styles.meta}>
            <Text xstyle={styles.metaTitle}>Who this is for</Text>
            <HStack gap={2} xstyle={styles.audience}>
              <PeopleGlyph />
              <Text>{sentence(post.audience)}</Text>
            </HStack>
            <Text type="supporting">Updated {formatDate(post.updated)}</Text>
          </VStack>
        </VStack>
        <Body />
        <StillStuck />
      </VStack>
    </Frame>
  );
}
