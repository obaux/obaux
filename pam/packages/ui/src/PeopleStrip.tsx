'use client';

import * as stylex from '@stylexjs/stylex';
import { Carousel } from '@astryxdesign/core/Carousel';
import { VStack } from '@astryxdesign/core/VStack';
import { Text } from '@astryxdesign/core/Text';
import { Avatar } from '@astryxdesign/core/Avatar';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';

/**
 * A row of people, read at a glance rather than one row at a time (Will, 16
 * September: "copying a similar layout to IG stories strip of circle avatars
 * with small label below it"). Replaces the vertical `PersonRow` list this
 * screen used to show — a case manager or a program's own list can be long
 * enough that a full row per person, all showing at once, is most of a
 * phone screen before the menu underneath it is even reached. A strip
 * answers the same question — "who's here" — in the height of one row.
 *
 * The ring means "something new from this person" (D-198): an unread
 * message to the viewer, or a place they saved since the viewer last looked.
 * Which, and the order — lit people first, newest first — is decided by
 * `rankPeople` in `@pam/config/people-activity`, not here; this component
 * only draws what it is told. It was a mock until 21 September (Will: "Mock
 * this highlight/activity border... for display purposes"); it is real now,
 * on the real strip and the example one alike.
 *
 * Same masking technique as `SavedStrip`: the row runs past the page's own
 * gutter and fades at the edge rather than being cut, and a CSS mask rather
 * than an overlay so it holds on whatever the page is painted underneath.
 */

export interface PeopleStripPerson {
  readonly id: string;
  readonly firstName: string;
  readonly href: string;
  /** Something new from this person — see the file comment. */
  readonly hasActivity?: boolean;
  /**
   * Read to a screen reader after the name when the ring is lit, e.g. "new
   * message" — a coloured border is not a label.
   */
  readonly activityLabel?: string;
}

export interface PeopleStripProps {
  readonly people: readonly PeopleStripPerson[];
  /** Names the row for a screen reader, e.g. "Members". */
  readonly label: string;
}

const styles = stylex.create({
  region: {
    width: 'calc(100% + 32px)',
    marginInline: '-16px',
    containerType: 'inline-size',
    maskImage: 'linear-gradient(to right, black calc(100% - 48px), transparent)',
  },
  track: { paddingInline: '16px' },
  tile: {
    width: '72px',
    flexShrink: 0,
    textDecoration: 'none',
    color: 'inherit',
    // §2.5's floor is about a target's shortest side; the tile is 72px wide
    // and the avatar plus its name clears 48px tall, so the whole tile — not
    // just the circle — is what somebody's thumb has to land on.
  },
  ring: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginInline: 'auto',
  },
  ringActive: {
    // The accent, not a semantic status colour: this says "look here first",
    // not "warning" or "error" — the same distinction Badge's own docs draw
    // between a status and something that just wants attention.
    borderColor: colorVars['--color-accent'],
  },
  srOnly: {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clipPath: 'inset(50%)',
    whiteSpace: 'nowrap',
  },
  name: {
    fontSize: '13px',
    lineHeight: 1.3,
    textAlign: 'center',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    width: '100%',
  },
});

export function PeopleStrip({ people, label }: PeopleStripProps) {
  return (
    <section aria-label={label} {...stylex.props(styles.region)}>
      <Carousel gap={2} hasButtons={false} hasEdgeFade={false} xstyle={styles.track}>
        {people.map((person) => (
          <a key={person.id} href={person.href} {...stylex.props(styles.tile)}>
            <VStack gap={1} align="center">
              <span {...stylex.props(styles.ring, person.hasActivity && styles.ringActive)}>
                <Avatar size="lg" name={person.firstName} tooltip={false} />
              </span>
              <Text xstyle={styles.name}>{person.firstName}</Text>
              {person.hasActivity && person.activityLabel ? (
                <span {...stylex.props(styles.srOnly)}>{person.activityLabel}</span>
              ) : null}
            </VStack>
          </a>
        ))}
      </Carousel>
    </section>
  );
}
