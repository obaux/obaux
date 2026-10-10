import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@astryxdesign/core/Link';

const styles = stylex.create({
  // Text keeps a readable line length; the cards (how to find it, pictures) use the full width.
  measure: { maxWidth: '760px' },
  lead: { maxWidth: '760px', fontWeight: 400 },
});

/**
 * The small set of pieces a help post is made of, so every post has the same
 * rhythm: a lead sentence, then headed sections of short paragraphs, steps, a
 * table or a screenshot. Plain words, short sentences, one idea each.
 */
export function Body({ children }: { readonly children: ReactNode }) {
  return (
    <VStack gap={10}>
      {children}
    </VStack>
  );
}

/** The one-or-two-sentence answer, before anything else. */
export function Lead({ children }: { readonly children: ReactNode }) {
  return (
    <Text type="large" as="p" xstyle={styles.lead}>
      {children}
    </Text>
  );
}

export function Section({ title, children }: { readonly title: string; readonly children: ReactNode }) {
  return (
    <VStack gap={3}>
      <Heading level={2} xstyle={styles.measure}>
        {title}
      </Heading>
      {children}
    </VStack>
  );
}

export function P({ children }: { readonly children: ReactNode }) {
  return (
    <Text as="p" xstyle={styles.measure}>
      {children}
    </Text>
  );
}

/**
 * A link to another post or page, on a line of its own. Always underlined, so a person can
 * see it is a link (a quiet text link read as plain text on a phone), with room above and
 * below to tap.
 */
export function ReadMore({ label, href }: { readonly label: string; readonly href: string }) {
  return (
    <VStack paddingBlock={2}>
      <HStack>
        <Link href={href} hasUnderline isStandalone>
          {label}
        </Link>
      </HStack>
    </VStack>
  );
}
