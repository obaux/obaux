import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { Link } from '@astryxdesign/core/Link';
import { sectionId } from '../lib/slug';
import { tap } from '../lib/tap';
import { website } from '../lib/website.stylex';
import { type } from '../lib/website-type.stylex';

const linkColor = stylex.create({ text: { color: website['--website-text-link'] } });

const styles = stylex.create({
  // Text keeps a readable line length; the cards (how to find it, pictures) use the full width.
  measure: { maxWidth: '760px' },
  lead: { maxWidth: '760px', fontWeight: 400, color: website['--website-text-primary'] },
  head: { maxWidth: '760px', color: website['--website-text-primary'], margin: 0 },
  // A section a link can scroll to: its top lands clear of whatever is stuck to the top of the screen
  // (`--post-scroll-offset`, set in globals.css: the "On this page" bar on a phone).
  anchor: { scrollMarginTop: 'var(--post-scroll-offset, 24px)' },
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
    <Text as="p" xstyle={[type.lead_large20, styles.lead]}>
      {children}
    </Text>
  );
}

/**
 * A headed section of a post. It is a stop in the post's "On this page" menu: `short` is the label the
 * menu shows (a few words that sum the section up); without one the menu uses the heading.
 */
export function Section({ title, short: shortLabel, children }: { readonly title: string; readonly short?: string; readonly children: ReactNode }) {
  return (
    <VStack gap={3} id={sectionId(title)} data-post-section={menuLabel(shortLabel, title)} tabIndex={-1} xstyle={styles.anchor}>
      <Heading level={2} xstyle={[type.heading_title24, styles.head]}>
        {title}
      </Heading>
      {children}
    </VStack>
  );
}

/** The menu label: the short one, or the heading. */
function menuLabel(label: string | undefined, title: string): string {
  return label && label.length ? label : title;
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
    <VStack>
      <HStack>
        <Link href={href} hasUnderline isStandalone xstyle={[tap.link, linkColor.text]}>
          {label}
        </Link>
      </HStack>
    </VStack>
  );
}
