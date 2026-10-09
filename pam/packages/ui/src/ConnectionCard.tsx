import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { Card } from '@astryxdesign/core/Card';
import { Icon } from '@astryxdesign/core/Icon';
import { IconButton } from '@astryxdesign/core/IconButton';
import { Token } from '@astryxdesign/core/Token';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { MessagesIcon } from './icons.js';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';

/**
 * A person on a member's side, as a card (D-213, from the reference Will gave
 * on 1 October): a large photo, their name, where they work, a short line on
 * how they can help, and three facts across the bottom.
 *
 * Since D-272 (Will, 5 October) the card is the whole profile: a round
 * message button top right, the program as a link to its page, and for a
 * program person, who connected the member to them.
 *
 * People first: the program is the line under the name, not the headline.
 */
export interface ConnectionStat {
  readonly value: string;
  readonly label: string;
}

export interface ConnectionCardProps {
  readonly name: string;
  /** "Case manager", or the program's name. */
  readonly subtitle: string;
  /**
   * The program's own page (D-272): the subtitle becomes a one-line link
   * with a chevron. Omitted for a case manager, who has no program.
   */
  readonly subtitleHref?: string | null;
  readonly photoUrl?: string | null;
  readonly help: string;
  /** Three, shown in a row under a rule. */
  readonly stats: readonly ConnectionStat[];
  /** The round message button, top right (D-272). */
  readonly messageHref: string;
  /** "Message Sandra". */
  readonly messageLabel: string;
  /**
   * For a program person: who connected the member to them — "Connected by
   * Teresa" — with that person's face, under the facts (D-272).
   */
  readonly connectedBy?: { readonly label: string; readonly name: string; readonly photoUrl?: string | null } | null;
}

const styles = stylex.create({
  card: { width: '100%', position: 'relative' },
  // Top right, round (D-272), lifted off the card with the search pill's
  // layered shadow — a tight one where it touches, a soft one around it —
  // in place of a grey outline (Will, 5 October: "the realistic shadow").
  message: {
    position: 'absolute',
    top: '16px',
    insetInlineEnd: '16px',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    borderWidth: 0,
    backgroundColor: 'light-dark(#FFFFFF, #262626)',
    boxShadow:
      '0 1px 2px light-dark(oklch(0 0 0 / 8%), oklch(0 0 0 / 30%)), 0 4px 14px light-dark(oklch(0 0 0 / 14%), oklch(0 0 0 / 45%)), inset 0 0 0 1px light-dark(oklch(0 0 0 / 4%), oklch(1 0 0 / 10%))',
  },
  // The program, as a link: one line, ending in "…", with a chevron.
  programLink: {
    maxWidth: '100%',
    minHeight: '32px',
    color: colorVars['--color-text-secondary'],
    textDecorationLine: { default: 'none', ':hover': 'underline' },
    textUnderlineOffset: '3px',
  },
  programName: {
    fontSize: '16px',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    // Its own direction (D-422): a program's name is written in whatever language its
    // people use, and an English name in an Arabic screen must lose its end to the
    // ellipsis, not its beginning.
    unicodeBidi: 'plaintext',
    minWidth: 0,
  },
  chevron: { flexShrink: 0 },
  // Readable at arm's length: Astryx's largest token is still 12px text.
  connected: { alignSelf: 'center', fontSize: '15px', minHeight: '36px', paddingInline: '10px', gap: '8px', borderRadius: '999px' },
  full: { width: '100%', minWidth: 0 },
  name: { fontSize: '24px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  subtitle: { fontSize: '16px', textAlign: 'center' },
  help: {
    fontSize: '17px',
    lineHeight: 1.45,
    textAlign: 'center',
    display: '-webkit-box',
    // Six lines, not three (D-422). Three held English; "Ayuda con currículums,
    // entrevistas y ofertas de trabajo que se publican cada semana. Sin cita."
    // is four in Spanish and its last words — walk-ins welcome — are the ones
    // somebody acts on. A longer description than six lines is cut, not the
    // translation of a short one.
    WebkitLineClamp: 6,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
    overflowWrap: 'anywhere',
  },
  stat: { flexGrow: 1, flexBasis: 0, minWidth: 0 },
  value: { fontSize: '20px', lineHeight: 1.2, fontWeight: 700, textAlign: 'center' },
  label: { fontSize: '14px', lineHeight: 1.3, textAlign: 'center' },
});

/** Three facts in a row — shared by the card and the profile. */
export function ConnectionStats({ stats }: { readonly stats: readonly ConnectionStat[] }) {
  return (
    <HStack gap={2} align="start" wrap="nowrap">
      {stats.slice(0, 3).map((stat) => (
        <VStack key={stat.label} gap={0.5} align="center" xstyle={styles.stat}>
          <Text xstyle={styles.value}>{stat.value}</Text>
          <Text type="supporting" xstyle={styles.label}>
            {stat.label}
          </Text>
        </VStack>
      ))}
    </HStack>
  );
}

export function ConnectionCard({
  name,
  subtitle,
  subtitleHref = null,
  photoUrl,
  help,
  stats,
  messageHref,
  messageLabel,
  connectedBy = null,
}: ConnectionCardProps) {
  // Not a card you tap into any more (D-272): what was on the profile page
  // is all here, and the card's two ways on are its own controls.
  return (
    <Card padding={6} xstyle={styles.card}>
      <VStack gap={4}>
        <VStack gap={2} align="center">
          <Avatar size="xl" name={name} src={photoUrl ?? undefined} tooltip={false} alt="" />
          <VStack gap={0.5} align="center" xstyle={styles.full}>
            <Heading level={2} xstyle={styles.name}>
              {name}
            </Heading>
            {subtitleHref ? (
              <a href={subtitleHref} {...stylex.props(styles.programLink)}>
                <HStack gap={1} align="center" justify="center" wrap="nowrap">
                  <Text type="supporting" xstyle={styles.programName}>
                    {subtitle}
                  </Text>
                  <Icon icon="chevronRight" size="sm" color="secondary" xstyle={styles.chevron} />
                </HStack>
              </a>
            ) : (
              <Text type="supporting" xstyle={styles.subtitle}>
                {subtitle}
              </Text>
            )}
          </VStack>
          <Text xstyle={styles.help}>{help}</Text>
        </VStack>
        <Divider />
        <ConnectionStats stats={stats} />
        {connectedBy ? (
          <Token
            size="lg"
            label={connectedBy.label}
            icon={<Avatar size="sm" name={connectedBy.name} src={connectedBy.photoUrl ?? undefined} tooltip={false} alt="" />}
            xstyle={styles.connected}
          />
        ) : null}
      </VStack>
      <IconButton
        label={messageLabel}
        href={messageHref}
        variant="ghost"
        // Wrapped, or Astryx sizes the drawing down to its own small icon.
        icon={
          <HStack>
            <MessagesIcon width={22} height={22} aria-hidden />
          </HStack>
        }
        xstyle={styles.message}
      />
    </Card>
  );
}
