import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Breadcrumbs, BreadcrumbItem } from '@astryxdesign/core/Breadcrumbs';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Frame } from '@/components/Frame';
import { POSTS, formatDate, postBySlug } from '@/content/posts';
import { CaseManagerAssignments } from '@/content/CaseManagerAssignments';

/** The body of each post. A new post is a new entry here and in `content/posts.ts`. */
const BODIES: Record<string, () => React.JSX.Element> = {
  'case-manager-assignments': CaseManagerAssignments,
};

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const post = postBySlug((await params).slug);
  return post ? { title: post.title, description: post.summary } : {};
}

export default async function SupportPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = postBySlug(slug);
  const Body = BODIES[slug];
  if (!post || !Body) notFound();

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
