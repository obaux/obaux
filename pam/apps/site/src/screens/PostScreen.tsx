import { Banner } from '@astryxdesign/core/Banner';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Frame } from '../components/Frame';
import { BODIES } from '../content/bodies';
import { anyPostBySlug, formatDate, postBySlug } from '../content/posts';

/**
 * One support post: breadcrumb, title, date, then its body. `null` for an unknown
 * slug. `allowDraft` is Storybook's: the site never passes it, so a draft is
 * `null` there and the route does not exist.
 */
export function PostScreen({ slug, allowDraft = false }: { readonly slug: string; readonly allowDraft?: boolean }) {
  const post = allowDraft ? anyPostBySlug(slug) : postBySlug(slug);
  const Body = BODIES[slug];
  if (!post || !Body) return null;
  return (
    <Frame width="wide" gap={6}>
      {post.status === 'draft' ? (
        <Banner status="warning" title="Draft, not published: held until the feature ships. Not on the site, in Support or in search." />
      ) : null}
      <VStack gap={3} paddingBlockStart={8} maxWidth={720}>
        <Breadcrumbs variant="supporting">
          <BreadcrumbItem href="/support/">Support</BreadcrumbItem>
          <BreadcrumbItem>{post.title}</BreadcrumbItem>
        </Breadcrumbs>
        <Heading level={1}>{post.title}</Heading>
        <Text type="supporting">Updated {formatDate(post.updated)}</Text>
      </VStack>
      <Body />
    </Frame>
  );
}
