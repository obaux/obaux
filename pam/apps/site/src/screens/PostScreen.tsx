import * as stylex from '@stylexjs/stylex';
import { Banner } from '@astryxdesign/core/Banner';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Link } from '@astryxdesign/core/Link';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { tap } from '../lib/tap';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';
import { Frame } from '../components/Frame';
import { PostNav } from '../components/PostNav';
import { StillStuck } from '../components/StillStuck';
import { lastBlockGap } from '../lib/last-block-gap';
import { STILL_STUCK, collectSections } from '../lib/sections';
import { BODIES } from '../content/bodies';
import { anyPostBySlug, formatDate, postBySlug } from '../content/posts';

const crumbLink = stylex.create({ text: { color: website['--website-text-link'] } });

const styles = stylex.create({
  // The post and, from 1180px, its "On this page" column beside it.
  layout: {
    display: 'grid',
    gridTemplateColumns: { default: 'minmax(0, 1fr)', '@media (min-width: 1180px)': 'minmax(0, 860px) 220px' },
    columnGap: '40px',
    justifyContent: 'center',
    alignItems: 'start',
    width: '100%',
  },
  // One centred reading column for the whole post, as on Figma Learn: header, who it is for, body.
  // The menu comes first in the page (so Tab reaches it before the post, Iris SP4) and sits in the right-hand column; the post takes the first free cell.
  // From 1180px the menu cell runs 56px past the end of the post, into the gap above the footer (nothing else is in that column):
  // a menu taller than the space left above the end of a short post is then not pushed up off the screen at the very bottom, and
  // the last entries stay in view while they are the current one (Iris SP1/SP3; Mira, 23 October). The 120px between the
  // "Still stuck?" card and the footer (a83) is not touched.
  menuCell: {
    alignSelf: 'stretch',
    gridColumn: { default: 'auto', '@media (min-width: 1180px)': 2 },
    gridRow: 1,
    minWidth: 0,
    marginBlockEnd: { default: 0, '@media (min-width: 1180px)': '-56px' },
  },
  column: { width: '100%', maxWidth: '920px', marginInline: 'auto', minWidth: 0 },
  header: { alignItems: 'center', textAlign: 'center' },
  crumbs: { alignItems: 'center', justifyContent: 'center', flexWrap: 'wrap' },
  // The page you are on, as a small gray pill at the end of the path.
  here: {
    paddingBlock: '4px',
    paddingInline: '10px',
    borderRadius: '8px',
    backgroundColor: website['--website-surface-gray'],
    color: website['--website-text-primary'],
    fontWeight: 600,
    // On a phone the title is right below, so the path stops at "Support" (it read three times at 320px).
    display: { default: 'inline-block', '@media (max-width: 519px)': 'none' },
  },
  arrow: { display: { default: 'inline-block', '@media (max-width: 519px)': 'none' } },
  title: { maxWidth: '24ch', color: website['--website-text-primary'], margin: 0 },
  // "Who this is for": an outlined box under the title, like Figma's "Who can use this feature".
  meta: {
    width: '100%',
    boxSizing: 'border-box',
    padding: '20px 24px',
    borderRadius: '12px',
    borderWidth: '1px',
    borderStyle: 'solid',
    borderColor: website['--website-border-strong'],
    backgroundColor: website['--website-surface-page'],
  },
  audience: { alignItems: 'center' },
  metaTitle: { fontWeight: 700 },
  icon: { flexShrink: 0, width: '20px', height: '20px', color: website['--website-icon-primary'] },
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
  // The sections, read from the body's own element: the menu is in the first paint.
  const withStuck = post.stillStuck !== false;
  const sections = withStuck ? [...collectSections(Body(), slug), STILL_STUCK] : collectSections(Body(), slug);
  return (
    <Frame width="wide" gap={6}>
      <div {...stylex.props(styles.layout)}>
      <div {...stylex.props(styles.menuCell)}>
        <PostNav sections={sections} variant="side" />
      </div>
      <VStack as="article" gap={10} xstyle={[styles.column, lastBlockGap.end]} data-page="post">
        {post.status === 'draft' ? (
          <Banner status="warning" title="Draft, not published: held until the feature ships. Not on the site, in Support or in search." />
        ) : null}
        <VStack gap={6} paddingBlockStart={8}>
          <VStack gap={4} xstyle={styles.header}>
            <HStack as="nav" gap={2} xstyle={styles.crumbs} aria-label="Breadcrumb">
              <Link href="/support/" hasUnderline xstyle={[tap.link, crumbLink.text]}>Support</Link>
              <Text type="supporting" aria-hidden xstyle={styles.arrow}>
                →
              </Text>
              <Text aria-current="page" xstyle={styles.here}>
                {post.title}
              </Text>
            </HStack>
            <Heading level={1} xstyle={[type.heading_title35, styles.title]}>
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
        <PostNav sections={sections} variant="bar" />
        <Body />
        {withStuck ? <StillStuck /> : null}
      </VStack>
      </div>
    </Frame>
  );
}
