import type { ReactNode } from 'react';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { TextLink } from '@pam/ui/TextLink';

/**
 * The small set of pieces a help post is made of, so every post has the same
 * rhythm: a lead sentence, then headed sections of short paragraphs, steps, a
 * table or a screenshot. Plain words, short sentences, one idea each.
 */
export function Body({ children }: { readonly children: ReactNode }) {
  return (
    <VStack gap={8} maxWidth={720}>
      {children}
    </VStack>
  );
}

/** The one-or-two-sentence answer, before anything else. */
export function Lead({ children }: { readonly children: ReactNode }) {
  return (
    <Text type="large" as="p">
      {children}
    </Text>
  );
}

export function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <VStack gap={3}>
      <Heading level={2}>{title}</Heading>
      {children}
    </VStack>
  );
}

export function P({ children }: { readonly children: ReactNode }) {
  return <Text as="p">{children}</Text>;
}

/** A link to another post or page, on a line of its own. */
export function ReadMore({ label, href }: { readonly label: string; readonly href: string }) {
  return (
    <HStack>
      <TextLink label={label} href={href} />
    </HStack>
  );
}
