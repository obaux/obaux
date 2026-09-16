'use client';

import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { Heading } from '@astryxdesign/core/Heading';
import { Badge } from '@astryxdesign/core/Badge';
import { Avatar } from '@astryxdesign/core/Avatar';

/**
 * One person, on a list a case manager, a program, or a super admin reads.
 *
 * The row `admin/page.tsx` already drew for a caseload, pulled out so the
 * same shape can be reused for "Program leads", the directory, and "People
 * interested in your program" rather than three near-identical `<Card>`s
 * drifting apart the first time one of them changes.
 *
 * No photo, real person or fictional: `Avatar` draws initials from
 * `firstName` alone. A member's photo is not on the §4.1 list of what an
 * admin may see, and fetching one would widen the contract by a column — see
 * `@pam/config/dummy-people` for why a fictional person gets the same rule.
 *
 * `href` is only ever set for a dummy person (see the file that renders this
 * — real people have no profile to open yet; §4.1 does not currently let a
 * case manager or a program read a member's saved places for real, and that
 * is a contract change for Will to make deliberately, not a side effect of
 * this component existing).
 */
export interface PersonRowProps {
  readonly firstName: string | null;
  readonly href?: string;
  readonly chip?: { readonly label: string; readonly tone: 'error' | 'warning' } | null;
  /** Extra facts, in order — points, an org name, last active, and so on. */
  readonly meta: readonly string[];
}

const styles = stylex.create({
  card: { width: '100%', position: 'relative' },
  name: { fontSize: '20px', lineHeight: 1.3 },
  meta: { fontSize: '16px' },
  link: {
    color: 'inherit',
    textDecoration: 'none',
    '::after': { content: '""', position: 'absolute', inset: 0 },
  },
});

export function PersonRow({ firstName, href, chip, meta }: PersonRowProps) {
  return (
    <Card xstyle={styles.card}>
      <VStack gap={2}>
        <HStack gap={3} align="center">
          <Avatar size="lg" name={firstName ?? '?'} />
          <Heading level={3} xstyle={styles.name}>
            {href ? (
              <a href={href} {...stylex.props(styles.link)}>
                {firstName ?? '—'}
              </a>
            ) : (
              (firstName ?? '—')
            )}
          </Heading>
        </HStack>
        <HStack gap={2} wrap="wrap" align="center">
          {chip ? <Badge variant={chip.tone} label={chip.label} /> : null}
          {meta.map((line) => (
            <Text key={line} type="supporting" xstyle={styles.meta}>
              {line}
            </Text>
          ))}
        </HStack>
      </VStack>
    </Card>
  );
}
