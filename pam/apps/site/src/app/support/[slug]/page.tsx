import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { BODIES } from '../../../content/bodies';
import { POSTS, postBySlug } from '../../../content/posts';
import { PostScreen } from '../../../screens/PostScreen';

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
  if (!postBySlug(slug) || !BODIES[slug]) notFound();
  return <PostScreen slug={slug} />;
}
