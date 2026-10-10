'use client';

import { useEffect, useState, type ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Card } from '@astryxdesign/core/Card';
import { Divider } from '@astryxdesign/core/Divider';
import { Heading } from '@astryxdesign/core/Heading';
import { HStack } from '@astryxdesign/core/HStack';
import { ProgressBar } from '@astryxdesign/core/ProgressBar';
import { Text } from '@astryxdesign/core/Text';
import { VStack } from '@astryxdesign/core/VStack';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import {
  BookmarkIcon,
  Page,
  PeopleIcon,
  PhoneIcon,
  PlusIcon,
  StarIcon,
  TripsIcon,
} from '@pam/ui';
import { Confetti } from '@pam/ui/SuccessScreen';
import { BadgeArt } from '@pam/ui/BadgeArt';
import { SubPageHeader } from '@pam/ui/SubPage';
import { HelpButton } from '../../screens/HelpButton';
import {
  BADGES,
  CORE_BADGES,
  POINTS_RULES,
  STREAK_POINTS_PER_WEEK,
  badgeForPoints,
  nextBadge,
  type BadgeDefinition,
} from '@pam/config';
import { USE_DUMMY_PEOPLE } from '@pam/config/dummy-flag';
import { DUMMY_EARNED_BADGES } from '@pam/config/dummy-badges';
import { useI18n } from '@/lib/i18n';
import { NotIn } from '../NotIn';
import { useSession } from '@/lib/useSession';
import { usePoints } from '@/lib/usePoints';
import { useRoleView } from '@/lib/useViewedRole';
import { RoleSwitchControl } from '../RoleSwitchControl';

/**
 * What the points are for — a journey, not a table (D-278, Will, 5 October:
 * "This page doesn't feel gamified enough, it doesn't feel exciting at all
 * … make it fit industry standard for gamified journeys", then "make the
 * coming next and list of steps smaller, so it's less scrolling").
 *
 * The shape the gamified apps people know share — where you stand, how close
 * the next step is, how to get there, what you have — in that order:
 *
 *   1. **Where you stand**: a card with the medal of the level reached, its
 *      name large, the points, and a bar to the next level — "350 more to
 *      Builder".
 *   2. **How to get there**: the ways points are earned, from the real rules
 *      (`POINTS_RULES`), each with what it is worth. The screen never used
 *      to say.
 *   3. **The ladder**, one short row a rung: earned, here (a ring that
 *      breathes), or how far. Only the next rung says what it means — the
 *      one somebody is reaching for.
 *   4. **Badges**, as a grid of medals in their own card, greyed until
 *      earned. The newest one earned also sits on the hero card (D-307).
 *
 * A new level is celebrated once: the first time this screen sees it,
 * confetti, and the level read out.
 *
 * The names are Will's (14 September) and stay the point of it — Returned,
 * Rooted, Builder; nothing compares one member to another (§8 forbids
 * leaderboards), and badges nobody can earn yet say "Coming later" rather
 * than being hidden.
 */
const SEEN_KEY = 'pam.points.seenLevel';
const WAY_ICON = { width: 22, height: 22, 'aria-hidden': true } as const;

const breathe = stylex.keyframes({
  '0%': { boxShadow: '0 0 0 0 light-dark(oklch(0.45 0.08 165 / 45%), oklch(0.85 0.15 110 / 45%))' },
  '70%': { boxShadow: '0 0 0 10px light-dark(oklch(0.45 0.08 165 / 0%), oklch(0.85 0.15 110 / 0%))' },
  '100%': { boxShadow: '0 0 0 0 light-dark(oklch(0.45 0.08 165 / 0%), oklch(0.85 0.15 110 / 0%))' },
});

const styles = stylex.create({
  // 1. Where you stand.
  hero: { width: '100%' },
  // The level's own picture, as a medal (D-295).
  medal: { flexShrink: 0 },
  level: { fontSize: '28px', lineHeight: 1.15, fontWeight: 800 },
  heroPoints: { fontSize: '17px', fontWeight: 600 },
  heroNext: { fontSize: '15px', lineHeight: 1.4 },
  bar: { width: '100%' },
  section: { fontSize: '20px', lineHeight: 1.3 },
  // The newest badge, under the bar (D-307).
  newest: { minWidth: 0 },
  newestName: { fontSize: '17px', lineHeight: 1.3, fontWeight: 700 },
  newestNote: { fontSize: '14px', lineHeight: 1.35 },
  // 2. Ways to earn: one line each.
  way: { width: '100%', minHeight: '48px' },
  wayIcon: {
    width: '40px',
    height: '40px',
    flexShrink: 0,
    borderRadius: '12px',
    backgroundColor: colorVars['--color-background-muted'],
    color: colorVars['--color-icon-accent'],
  },
  wayLabel: { flexGrow: 1, minWidth: 0, fontSize: '17px' },
  wayPoints: { fontSize: '16px', fontWeight: 700, color: colorVars['--color-text-accent'], whiteSpace: 'nowrap' },
  // 3. The ladder, compact.
  rung: { width: '100%', minHeight: '44px', position: 'relative' },
  // Each rung is its badge's picture (Will, 5 October, D-295), grey until
  // earned; the breathing ring still says which one is yours.
  mark: { width: '36px', height: '36px', flexShrink: 0, borderRadius: '50%' },
  markHere: {
    animationName: breathe,
    animationDuration: '2.4s',
    animationIterationCount: 'infinite',
    '@media (prefers-reduced-motion: reduce)': { animationName: 'none' },
  },
  rungWords: { flexGrow: 1, minWidth: 0 },
  rungName: { fontSize: '17px', fontWeight: 600 },
  rungNameHere: { color: colorVars['--color-text-accent'], fontWeight: 800 },
  rungMeaning: { fontSize: '14px', lineHeight: 1.35 },
  rungStatus: { fontSize: '14px', whiteSpace: 'nowrap' },
  rungStatusEarned: { color: colorVars['--color-text-accent'], fontWeight: 600 },
  // 4. Badges, in a card of their own, set further from the ladder, title
  // centred (Will, 5 October, D-307).
  // Slim padding and no column gap, so the columns are as wide as they
  // were outside the card and "Cornerstone" still fits.
  badges: { width: '100%', marginBlockStart: '16px', paddingBlockStart: '20px' },
  badgesTitle: { fontSize: '20px', lineHeight: 1.3, textAlign: 'center', width: '100%' },
  // Four across — shorter to scroll past (Will, D-278).
  grid: { width: '100%', display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', columnGap: '0px', rowGap: '4px' },
  badge: { minWidth: 0, paddingBlock: '8px' },
  badgeMark: { width: '52px', height: '52px' },
  badgeName: { fontSize: '13px', lineHeight: 1.25, fontWeight: 600, textAlign: 'center', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  badgeNote: { fontSize: '12px', lineHeight: 1.25, textAlign: 'center' },
  badgeNoteEarned: { color: colorVars['--color-text-accent'], fontWeight: 600 },
  live: { position: 'absolute', width: '1px', height: '1px', overflow: 'hidden', clipPath: 'inset(50%)' },
});

type T = (key: string, vars?: Record<string, string | number>) => string;


function Rung({ badge, points, t }: { badge: BadgeDefinition; points: number | null; t: T }) {
  const min = badge.minPoints ?? 0;
  const isEarned = points !== null && points >= min;
  const isHere = points !== null && badgeForPoints(points).key === badge.key;
  const isNext = points !== null && nextBadge(points)?.key === badge.key;
  const status = badge.blockedBy
    ? t('points.soon')
    : isEarned
      ? t('points.earned')
      : points !== null
        ? t('points.next', { count: min - points })
        : t('points.subtitle', { count: min });
  return (
    <HStack gap={3} align="center" wrap="nowrap" xstyle={styles.rung}>
      <HStack
        aria-hidden
        align="center"
        justify="center"
        xstyle={[styles.mark, isHere && styles.markHere]}
      >
        <BadgeArt badgeKey={badge.key} size={36} isLocked={!isEarned} />
      </HStack>
      <VStack gap={0} xstyle={styles.rungWords}>
        <Text xstyle={[styles.rungName, isHere && styles.rungNameHere]}>
          {t(badge.labelKey)}
          {isHere ? ` · ${t('points.now')}` : ''}
        </Text>
        {isNext ? (
          <Text type="supporting" xstyle={styles.rungMeaning}>
            {t(`${badge.labelKey}.desc`)}
          </Text>
        ) : null}
      </VStack>
      <Text type="supporting" xstyle={[styles.rungStatus, isEarned && !badge.blockedBy && styles.rungStatusEarned]}>
        {status}
      </Text>
    </HStack>
  );
}

export default function PointsPage() {
  const { t, tPlain } = useI18n();
  const { state: session } = useSession();
  const trueRole = session.status === 'signed-in' ? session.session.role : null;
  const { demoRole, setViewAs } = useRoleView(trueRole);
  const points = usePoints(session.status === 'signed-in' ? session.session.userId : null);
  // Nothing awards a badge yet; the example member has earned Scholar
  // (D-307), shown where the rest of the example data is.
  const earned: readonly string[] = USE_DUMMY_PEOPLE && (demoRole ?? trueRole) === 'member' ? DUMMY_EARNED_BADGES : [];
  const [celebrate, setCelebrate] = useState(false);

  const current = points !== null ? badgeForPoints(points) : null;
  const next = points !== null ? nextBadge(points) : null;

  // A new level, celebrated once: the first time this screen sees it.
  useEffect(() => {
    if (!current) return;
    const index = CORE_BADGES.findIndex((b) => b.key === current.key);
    try {
      const seen = window.localStorage.getItem(SEEN_KEY);
      const seenIndex = seen === null ? -1 : CORE_BADGES.findIndex((b) => b.key === seen);
      if (seen !== null && index > seenIndex) setCelebrate(true);
      window.localStorage.setItem(SEEN_KEY, current.key);
    } catch {
      // No storage: no celebration, and nothing else changes.
    }
  }, [current]);

  if (session.status === 'signed-out' || session.status === 'no-profile' || session.status === 'suspended') {
    return (
      <Page gap={4}>
        <SubPageHeader title={t('points.title')} backHref="/profile/" backLabel={t('nav.back.profile')} />
        <NotIn status={session.status} title={t('directory.signedOut.title')} body={t('reminders.signedOut')} />
      </Page>
    );
  }

  const others = BADGES.filter((badge) => badge.group !== 'core');
  const earnedOthers = others.filter((badge) => earned.includes(badge.key));
  const newest = earnedOthers.at(-1) ?? null;
  const from = current?.minPoints ?? 0;
  const to = next?.minPoints ?? from;
  const ways: { id: string; icon: ReactNode; label: string; worth: string }[] = [
    {
      // The most one action earns (D-330): a friend who joins from your link.
      id: 'friend',
      icon: <PeopleIcon {...WAY_ICON} />,
      label: t('points.way.friend'),
      worth: t('points.way.plus', { count: POINTS_RULES.refer_someone.points }),
    },
    {
      id: 'attend',
      icon: <TripsIcon {...WAY_ICON} />,
      label: t('points.way.attend'),
      worth: t('points.way.plus', { count: POINTS_RULES.attend_appointment_verified.points }),
    },
    {
      // In the app's own words (Will): a trip is how a member signs up.
      id: 'plan',
      icon: <PlusIcon {...WAY_ICON} />,
      label: t('points.way.plan'),
      worth: t('points.way.plus', { count: POINTS_RULES.self_reported_signup.points }),
    },
    {
      // A return, not a weekly streak (Will, 5 October): Pam cannot know how
      // each program runs its weeks, only that somebody went back.
      id: 'return',
      icon: <StarIcon {...WAY_ICON} />,
      label: t('points.way.return'),
      worth: t('points.way.plus', { count: STREAK_POINTS_PER_WEEK }),
    },
    {
      id: 'call',
      icon: <PhoneIcon {...WAY_ICON} />,
      label: t('points.way.call'),
      worth: t('points.way.plus', { count: POINTS_RULES.call_service.points }),
    },
    {
      id: 'save',
      icon: <BookmarkIcon {...WAY_ICON} />,
      label: t('points.way.save'),
      worth: t('points.way.plus', { count: POINTS_RULES.save_place.points }),
    },
  ];

  return (
    <>
      {celebrate ? <Confetti /> : null}
      <Page gap={4}>
        <SubPageHeader
          title={t('points.title')}
          backHref="/profile/"
          backLabel={t('nav.back.profile')}
          actions={
            <>
              {trueRole === 'super_admin' ? (
                <RoleSwitchControl trueRole={trueRole} viewedRole={demoRole ?? trueRole} onChange={setViewAs} />
              ) : null}
              <HelpButton />
            </>
          }
        />

        {/* 1. Where you stand. */}
        {current && points !== null ? (
          <Card padding={6} xstyle={styles.hero}>
            <VStack gap={4}>
              <HStack gap={4} align="center" wrap="nowrap">
                <HStack align="center" justify="center" xstyle={styles.medal}>
                  <BadgeArt badgeKey={current.key} size={72} />
                </HStack>
                <VStack gap={0.5}>
                  <Text xstyle={styles.level}>{t(current.labelKey)}</Text>
                  <Text type="supporting" xstyle={styles.heroPoints}>
                    {t('points.subtitle', { count: points })}
                  </Text>
                </VStack>
              </HStack>
              {next ? (
                <VStack gap={2}>
                  <ProgressBar
                    label={tPlain('points.hero.toNext', { count: to - points, next: t(next.labelKey) })}
                    isLabelHidden
                    value={points - from}
                    max={Math.max(1, to - from)}
                    variant="accent"
                    xstyle={styles.bar}
                  />
                  <Text type="supporting" xstyle={styles.heroNext}>
                    {t('points.hero.toNext', { count: to - points, next: t(next.labelKey) })}
                  </Text>
                </VStack>
              ) : (
                <Text type="supporting" xstyle={styles.heroNext}>
                  {t('points.hero.top')}
                </Text>
              )}
              {newest ? (
                <>
                  <Divider />
                  <HStack gap={3} align="center" wrap="nowrap">
                    <HStack align="center" justify="center" xstyle={styles.medal} aria-hidden>
                      <BadgeArt badgeKey={newest.key} size={44} />
                    </HStack>
                    <VStack gap={0} xstyle={styles.newest}>
                      <Text xstyle={styles.newestName}>{t(newest.labelKey)}</Text>
                      <Text type="supporting" xstyle={styles.newestNote}>
                        {t('points.hero.newest', { count: earnedOthers.length, total: others.length })}
                      </Text>
                    </VStack>
                  </HStack>
                </>
              ) : null}
            </VStack>
          </Card>
        ) : null}
        <Text role="status" xstyle={styles.live}>
          {celebrate && current ? t('points.levelUp', { level: t(current.labelKey) }) : ''}
        </Text>

        {/* 2. How to get there. */}
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.section}>
            {t('points.waysTitle')}
          </Heading>
          <VStack gap={1}>
            {ways.map((way) => (
              <HStack key={way.id} gap={3} align="center" wrap="nowrap" xstyle={styles.way}>
                <HStack align="center" justify="center" xstyle={styles.wayIcon}>
                  {way.icon}
                </HStack>
                <Text xstyle={styles.wayLabel}>{way.label}</Text>
                <Text xstyle={styles.wayPoints}>{way.worth}</Text>
              </HStack>
            ))}
          </VStack>
        </VStack>

        {/* 3. The ladder, one short row a rung. */}
        <VStack gap={2}>
          <Heading level={2} xstyle={styles.section}>
            {t('points.group.core')}
          </Heading>
          <VStack gap={1}>
            {CORE_BADGES.map((badge) => (
              <Rung key={badge.key} badge={badge} points={points} t={t} />
            ))}
          </VStack>
        </VStack>

        {/* 4. Badges, as medals, in their own card. */}
        <Card padding={3} xstyle={styles.badges}>
          <VStack gap={3}>
            <Heading level={2} xstyle={styles.badgesTitle}>
              {t('points.badgesTitle')}
            </Heading>
            <VStack xstyle={styles.grid}>
              {others.map((badge) => {
                const isEarned = earned.includes(badge.key);
                return (
                  <VStack key={badge.key} gap={1} align="center" xstyle={styles.badge}>
                    <HStack align="center" justify="center" xstyle={styles.badgeMark}>
                      {/* In colour once earned, grey until then (D-295). */}
                      <BadgeArt badgeKey={badge.key} size={52} isLocked={!isEarned} />
                    </HStack>
                    <Text xstyle={styles.badgeName}>{t(badge.labelKey)}</Text>
                    <Text type="supporting" xstyle={[styles.badgeNote, isEarned && styles.badgeNoteEarned]}>
                      {isEarned ? t('points.earned') : badge.blockedBy ? t('points.soon') : t('points.locked')}
                    </Text>
                  </VStack>
                );
              })}
            </VStack>
          </VStack>
        </Card>
      </Page>
    </>
  );
}
