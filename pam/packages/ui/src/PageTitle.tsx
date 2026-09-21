import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { VStack } from '@astryxdesign/core/VStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Icon } from '@astryxdesign/core/Icon';
import { pam } from './tokens.stylex.js';

/**
 * A screen's name, with the way back beside it.
 *
 * §0 says never dead-end, and the back arrow had been landing wherever each
 * screen felt like putting it — top-left on notifications, at the foot of the
 * page on Places and the case manager screen, nowhere at all on a few. Beside
 * the title is where a phone puts it and where a thumb looks for it, and one
 * component means the next screen does not get a vote (Will, 13 September).
 *
 * A real link, not `history.back()`: it survives a cold open from a text
 * message, where there is no history to go back through, and it tells somebody
 * where they are about to land rather than "wherever you were".
 *
 * The arrow carries no visible word, so its accessible name has to say where it
 * goes — "Back to Home", not "Back".
 */
export interface PageTitleProps {
  readonly title: string;
  /** A line under the title. Optional; it is context, never the point. */
  readonly subtitle?: string;
  /** Where back goes. Omit on a screen that is the start of things. */
  readonly backHref?: string;
  /** The arrow's accessible name, e.g. "Back to Home". Required with `backHref`. */
  readonly backLabel?: string;
  /**
   * A control drawn in the title's place — Messages' section switcher
   * (D-197), a `DropdownMenu` whose trigger reads as the title. Still inside
   * the `<h1>`, so the screen keeps one heading and it names the section.
   */
  readonly titleControl?: ReactNode;
}

const styles = stylex.create({
  title: { fontSize: pam.titleSize, lineHeight: 1.2 },
  subtitle: { fontSize: '17px' },
  // Pulled toward the edge of the page so the arrow lines up with the content
  // below it rather than sitting indented from everything.
  back: {
    minHeight: pam.touchTargetMin,
    minWidth: pam.touchTargetMin,
    marginInlineStart: '-10px',
    fontSize: '22px',
  },
});

export function PageTitle({ title, subtitle, backHref, backLabel, titleControl }: PageTitleProps) {
  return (
    <VStack gap={1}>
      <HStack gap={1} align="center" wrap="nowrap">
        {backHref ? (
          <IconButton
            label={backLabel ?? title}
            icon={<Icon icon="chevronLeft" />}
            variant="ghost"
            href={backHref}
            xstyle={styles.back}
          />
        ) : null}
        <Heading level={1} xstyle={styles.title}>
          {titleControl ?? title}
        </Heading>
      </HStack>
      {subtitle ? (
        <Text type="supporting" xstyle={styles.subtitle}>
          {subtitle}
        </Text>
      ) : null}
    </VStack>
  );
}
