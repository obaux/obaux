import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Frame } from '../components/Frame';
import { BODIES } from '../content/bodies';
import { formatDate, postBySlug } from '../content/posts';

/** One support post: breadcrumb, title, date, then its body. `null` for an unknown slug. */
export function PostScreen({ slug }: { readonly slug: string }) {
  const post = postBySlug(slug);
  const Body = BODIES[slug];
  if (!post || !Body) return null;
  return (
    <Frame width="wide" gap={6}>
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
