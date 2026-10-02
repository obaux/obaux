import type { ReactNode } from 'react';
import * as stylex from '@stylexjs/stylex';
import { Avatar } from '@astryxdesign/core/Avatar';
import { HStack } from '@astryxdesign/core/HStack';
import { StatusDot } from '@astryxdesign/core/StatusDot';
import { VStack } from '@astryxdesign/core/VStack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { BookmarkIcon, ExploreIcon, HomeIcon, MessagesIcon, TripsIcon } from './icons.js';

/**
 * The app's bottom navigation: five places, always one tap away (D-210).
 *
 * Will's redesign of 1 October, modelled on the reference he gave: Explore
 * (the new home), Saved, Trips (the visits somebody plans — empty until that
 * exists), Messages, and Profile, drawn as the person's own avatar. Messages
 * carries a dot when something is unread.
 *
 * **Help moved out of this bar**, superseding where D-029/D-039 put it. It
 * is not gone: every screen built on the new frame carries a Help button in
 * its header beside the bell (`LargeTitleHeader`), and Profile lists "Get
 * help" — so §0's "a visible way to get help on every screen" still holds,
 * one tap from anywhere, without spending a sixth of the bar on it.
 *
 * Every tab is a real link, so the bar works with no JavaScript. Icon above
 * label, both visible. Not yet mounted in the app — shaped in Storybook first.
 */
export type TabKey = 'explore' | 'saved' | 'trips' | 'messages' | 'profile';

export interface TabBarProps {
  /** The tab for the screen being shown, or `null` on a screen with none. */
  readonly current: TabKey | null;
  /** Localised, one short word each (`nav.tab.*`). */
  readonly labels: Readonly<Record<TabKey, string>>;
  /** The landmark's name, e.g. "Main". */
  readonly label: string;
  /** The person's first name, for the Profile tab's initials. */
  readonly name: string;
  readonly photoUrl?: string | null;
  /** Something unread in Messages: draws the dot, and is read out. */
  readonly unreadLabel?: string | null;
  readonly hrefs?: Partial<Readonly<Record<TabKey, string>>>;
  /**
   * The first tab is Home, drawn as a house, not Explore (D-212): a case
   * manager's or a program's first screen is their list of people, not a
   * search for places. Its key stays `explore` — same slot, same route.
   */
  readonly isHome?: boolean;
}

const DEFAULT_HREFS: Readonly<Record<TabKey, string>> = {
  explore: '/',
  saved: '/saved/',
  trips: '/trips/',
  messages: '/messages/',
  profile: '/profile/',
};

const ORDER: readonly TabKey[] = ['explore', 'saved', 'trips', 'messages', 'profile'];

// 26px: a tab's own icon slot is 16px, a speck on a phone at arm's length.
// Each icon sits in its own wrapper, or the slot shrinks the SVG back to 16px.
const ICON = { width: 26, height: 26, 'aria-hidden': true } as const;

const styles = stylex.create({
  bar: {
    position: 'fixed',
    insetInline: 0,
    bottom: 0,
    zIndex: 10,
    backgroundColor: colorVars['--color-background-body'],
    borderTopWidth: '1px',
    borderTopStyle: 'solid',
    borderTopColor: colorVars['--color-border'],
    paddingBottom: 'env(safe-area-inset-bottom, 0px)',
  },
  inner: { width: '100%', maxWidth: '560px', marginInline: 'auto' },
  // Holds the bar's height in the page, so the end of a long list scrolls
  // clear of it instead of sitting underneath.
  spacer: {
    height: 'calc(66px + env(safe-area-inset-bottom, 0px))',
    flexShrink: 0,
  },
  tabs: { flexGrow: 1, minWidth: 0 },
  // Quieter labels, a little more air (Will, 2 October): 12px at regular
  // weight, a step further from the icon, and the secondary grey unless it is
  // the tab you are on — the icon carries the bar, the word confirms it.
  tab: {
    flexDirection: 'column',
    gap: '8px',
    minHeight: '64px',
    paddingInline: '2px',
    fontSize: '12px',
    fontWeight: 400,
    color: colorVars['--color-text-secondary'],
  },
  tabOn: { color: colorVars['--color-text-primary'], fontWeight: 600 },
  iconWrap: { position: 'relative' },
  dot: { position: 'absolute', top: '-2px', insetInlineEnd: '-4px' },
  // The selected Profile tab rings the avatar in the brand, as the reference
  // rings it in its own colour.
  avatarRing: {
    borderRadius: '50%',
    padding: '2px',
    borderWidth: '2px',
    borderStyle: 'solid',
    borderColor: 'transparent',
  },
  avatarRingOn: { borderColor: colorVars['--color-accent'] },
});

export function TabBar({ current, labels, label, name, photoUrl, unreadLabel, hrefs, isHome = false }: TabBarProps) {
  const to = { ...DEFAULT_HREFS, ...hrefs };

  const icons: Readonly<Record<TabKey, ReactNode>> = {
    explore: <HStack xstyle={styles.iconWrap}>{isHome ? <HomeIcon {...ICON} /> : <ExploreIcon {...ICON} />}</HStack>,
    saved: (
      <HStack xstyle={styles.iconWrap}>
        <BookmarkIcon {...ICON} isFilled={current === 'saved'} />
      </HStack>
    ),
    trips: (
      <HStack xstyle={styles.iconWrap}>
        <TripsIcon {...ICON} />
      </HStack>
    ),
    messages: (
      <HStack xstyle={styles.iconWrap}>
        <MessagesIcon {...ICON} />
        {unreadLabel ? <StatusDot variant="error" label={unreadLabel} xstyle={styles.dot} /> : null}
      </HStack>
    ),
    profile: (
      <HStack xstyle={[styles.avatarRing, current === 'profile' && styles.avatarRingOn]}>
        <Avatar size="sm" name={name} src={photoUrl ?? undefined} tooltip={false} alt="" />
      </HStack>
    ),
  };

  return (
    <>
      <VStack aria-hidden xstyle={styles.spacer} />
      <footer {...stylex.props(styles.bar)}>
        <HStack align="center" wrap="nowrap" xstyle={styles.inner}>
          <TabList
            value={current ?? ''}
            onChange={() => {}}
            layout="fill"
            overflow="visible"
            aria-label={label}
            xstyle={styles.tabs}
          >
            {ORDER.map((key) => (
              <Tab
                key={key}
                value={key}
                label={labels[key]}
                href={to[key]}
                icon={icons[key]}
                xstyle={[styles.tab, key === current && styles.tabOn]}
              />
            ))}
          </TabList>
        </HStack>
      </footer>
    </>
  );
}
