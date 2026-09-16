'use client';

import * as stylex from '@stylexjs/stylex';
import { VStack } from '@astryxdesign/core/VStack';
import { HStack } from '@astryxdesign/core/HStack';
import { Heading } from '@astryxdesign/core/Heading';
import { Text } from '@astryxdesign/core/Text';
import { Badge } from '@astryxdesign/core/Badge';
import { colorVars, spacingVars } from '@astryxdesign/core/theme/tokens.stylex';
import { AppHeader, BigButton, Notice, Page, PageTitle, StarIcon } from '@pam/ui';
import { BADGES, badgeForPoints, nextBadge, type BadgeDefinition } from '@pam/config';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { HeaderBell } from '../HeaderBell';
import { useSupportPhone } from '@/lib/useSupportPhone';
import { useSession } from '@/lib/useSession';
import { usePoints } from '@/lib/usePoints';

/**
 * What the points are for.
 *
 * A number on the home screen with nowhere to go is a number nobody believes.
 * This is where it means something: the ladder, drawn as a stepper, with the
 * member's own position on it and what the next rung asks for.
 *
 * The names are Will's (14 September) and they are the point of the screen —
 * Returned, Rooted, Elder, Sankofa. The vocabulary a system uses about somebody
 * becomes the vocabulary they use about themselves, and for a returning citizen
 * that is not a small thing. Nothing here compares one member to another: §8
 * forbids leaderboards, and this screen shows one person's ladder, never a
 * position on anybody else's.
 *
 * No reveal-on-scroll here, unlike the card lists. A ladder is one object:
 * rungs fading in one at a time as somebody scrolls reads as the ladder being
 * built under them, and it left the lower half of the screen blank in a
 * screenshot — which is how it was caught.
 *
 * Badges nobody can earn yet say so plainly rather than being hidden. PAM has
 * no buddy system — the only relationships it models are member/mentor and
 * member/case manager — so Elder, Chief and Drum carry "Coming later". Hiding
 * them would mean the day they arrive they appear from nowhere; saying so is
 * how a member knows the ladder has a top they have not seen yet.
 */

const styles = stylex.create({
  intro: { fontSize: '17px', lineHeight: 1.5 },
  group: { fontSize: '17px' },
  /*
   * The stepper's spine: a line down the left, behind the marks. It is drawn on
   * the row rather than as its own element so it cannot fall out of step with
   * the marks it connects.
   */
  step: {
    position: 'relative',
    paddingInlineStart: spacingVars['--spacing-2'],
    paddingBlockEnd: spacingVars['--spacing-5'],
    '::before': {
      content: '""',
      position: 'absolute',
      insetInlineStart: '23px',
      top: '40px',
      bottom: 0,
      width: '2px',
      backgroundColor: colorVars['--color-border'],
    },
  },
  /** The last rung has nothing below it to connect to. */
  lastStep: { paddingBlockEnd: 0, '::before': { content: 'none' } },
  mark: {
    flexShrink: 0,
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '20px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: colorVars['--color-border'],
    color: colorVars['--color-text-secondary'],
    backgroundColor: colorVars['--color-background-card'],
    // Above the spine, so the line runs between marks rather than through them.
    position: 'relative',
    zIndex: 1,
  },
  /** Reached: the brand fills it in. */
  earned: {
    backgroundColor: colorVars['--color-accent'],
    borderColor: colorVars['--color-accent'],
    color: colorVars['--color-on-accent'],
  },
  /** Where the member is standing right now. */
  here: { borderColor: colorVars['--color-accent'], borderWidth: '3px' },
  name: { fontSize: '18px', fontWeight: 600 },
  meaning: { fontSize: '15px', lineHeight: 1.45 },
  need: { fontSize: '15px' },
});

/** One rung. The mark says whether it is reached; the words say what it means. */
function Step({
  badge,
  points,
  isLast,
  t,
}: {
  badge: BadgeDefinition;
  points: number | null;
  isLast: boolean;
  t: (key: string, vars?: Record<string, string | number>) => string;
}) {
  const threshold = badge.minPoints ?? null;
  const isEarned = threshold !== null && points !== null && points >= threshold;
  const isHere =
    threshold !== null && points !== null && badgeForPoints(points).key === badge.key;

  return (
    <HStack gap={3} align="start" wrap="nowrap" xstyle={[styles.step, isLast && styles.lastStep]}>
      <span
        aria-hidden="true"
        {...stylex.props(styles.mark, isEarned && styles.earned, isHere && styles.here)}
      >
        <StarIcon />
      </span>
      <VStack gap={1}>
        <HStack gap={2} align="center" wrap="wrap">
          <Text xstyle={styles.name}>{t(`badge.${badge.key}`)}</Text>
          {isHere ? <Badge variant="neutral" label={t('points.now')} /> : null}
          {badge.blockedBy ? <Badge variant="neutral" label={t('points.soon')} /> : null}
        </HStack>
        <Text type="supporting" xstyle={styles.meaning}>
          {t(`badge.${badge.key}.desc`)}
        </Text>
        {threshold !== null ? (
          <Text type="supporting" xstyle={styles.need}>
            {isEarned
              ? t('points.earned')
              : points !== null
                ? t('points.next', { count: threshold - points })
                : t('points.subtitle', { count: threshold })}
          </Text>
        ) : null}
      </VStack>
    </HStack>
  );
}

export default function PointsPage() {
  const { t } = useI18n();
  const supportPhone = useSupportPhone();
  const { state: session } = useSession();
  const points = usePoints(session.status === 'signed-in' ? session.session.userId : null);

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <AppHeader />
        <PageTitle title={t('points.title')} backHref="/" backLabel={t('nav.back.home')} />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('reminders.signedOut')} />
      </Page>
    );
  }

  const core = BADGES.filter((badge) => badge.group === 'core');
  const category = BADGES.filter((badge) => badge.group === 'category');
  const milestone = BADGES.filter((badge) => badge.group === 'milestone');
  const next = points !== null ? nextBadge(points) : null;

  return (
    <Page gap={4}>
      <AppHeader
        roleLabel={session.status === 'signed-in' ? t(`role.${session.session.role}`) : undefined}
        trailing={<HeaderBell enabled={session.status === 'signed-in'} />}
      />

      <PageTitle
        title={t('points.title')}
        subtitle={
          points !== null
            ? next
              ? `${t('points.subtitle', { count: points })} · ${t('points.next', {
                  count: (next.minPoints ?? 0) - points,
                })}`
              : t('points.subtitle', { count: points })
            : undefined
        }
        backHref="/"
        backLabel={t('nav.back.home')}
      />

      <Text type="supporting" xstyle={styles.intro}>
        {t('points.intro')}
      </Text>

      {/*
        Three groups, in the order a member meets them: the ladder they are on,
        the badges for the kind of help they are getting, and the one-offs.
      */}
      {(
        [
          ['core', core],
          ['category', category],
          ['milestone', milestone],
        ] as const
      ).map(([group, badges]) => (
        <VStack gap={2} key={group}>
          <Heading level={2} xstyle={styles.group}>
            {t(`points.group.${group}`)}
          </Heading>
          <VStack gap={0}>
            {badges.map((badge, index) => (
              <Step
                key={badge.key}
                badge={badge}
                points={points}
                isLast={index === badges.length - 1}
                t={t}
              />
            ))}
          </VStack>
        </VStack>
      ))}
    </Page>
  );
}
