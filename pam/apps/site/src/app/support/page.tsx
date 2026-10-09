import type { Metadata } from 'next';
import { Card } from '@astryxdesign/core/Card';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Button } from '@pam/ui/Button';
import { Frame } from '@/components/Frame';
import { POSTS, formatDate } from '@/content/posts';

export const metadata: Metadata = {
  title: 'Support',
  description: 'How Pam works, in plain language: who can do what, and why.',
};

export default function SupportPage() {
  return (
    <Frame width="wide" gap={6}>
      <VStack gap={2} paddingBlockStart={8} maxWidth={720}>
        <Heading level={1}>Support</Heading>
        <Text type="large" color="secondary">
          Pam has a lot of moving parts. These pages explain how it works, in plain language: who can
          do what, and why.
        </Text>
      </VStack>

      <VStack gap={3} maxWidth={720}>
        {POSTS.map((post) => (
          <Card key={post.slug} padding={6}>
            <VStack gap={3}>
              <Text type="supporting">Updated {formatDate(post.updated)}</Text>
              <Heading level={2}>{post.title}</Heading>
              <Text as="p">{post.summary}</Text>
              <HStack>
                <Button label={`Read: ${post.title}`} variant="secondary" href={`/support/${post.slug}/`} />
              </HStack>
            </VStack>
          </Card>
        ))}
      </VStack>

      <Text type="supporting" as="p">
        Can’t find your answer? Ask the person who invited you to Pam, or a staff member who guides you.
      </Text>
    </Frame>
  );
}
