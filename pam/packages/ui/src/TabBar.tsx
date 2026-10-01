import * as stylex from '@stylexjs/stylex';
import { HStack } from '@astryxdesign/core/HStack';
import { Tab, TabList } from '@astryxdesign/core/TabList';
import { colorVars } from '@astryxdesign/core/theme/tokens.stylex';
import { HelpBar } from './HelpBar.js';
import type { ReactNode } from 'react';
import { HomeIcon, MeIcon, MeIconFilled, PeopleIcon, PlacesIcon, PlanIcon } from './icons.js';

/**
 * The member app's bottom dock: §3.1's five tabs and Help, in one fixed bar.
 *
 * D-029 settled that the tabs and Help share one container rather than two
 * fixed bars fighting over the bottom of a phone, and D-039 made Help a
 * compact item that takes one slot's room. This is that dock, built on
 * Astryx's `TabList` (`layout="fill"`, link tabs), and composing `HelpBar`
 * rather than duplicating it.
 *
 * Every tab is a real link, so the dock works with no JavaScript — the same
 * rule `HelpBar` keeps. Icon above label, both visible: an icon alone is a
 * guess for somebody who has not used a phone in years.
 *
 * Not yet mounted in the app: it is being shaped in Storybook first
 * (Shell/TabBar, Shell/Member app). Where "People" and "My Plan" lead is
 * still open — see `hrefs`.
 */
export type TabKey = 'home' | 'places' | 'people' | 'plan' | 'me';

export interface TabBarProps {
  /** The tab for the screen being shown, or `null` on a screen with none. */
  readonly current: TabKey | null;
  /** Localised, one or two short words each (`tab.*`). */
  readonly labels: Readonly<Record<TabKey, string>>;
  /** Localised `nav.help`. */
  readonly helpLabel: string;
  /** The landmark's name, e.g. "Main". */
  readonly label: string;
  /** Where each tab leads. Defaults below; "plan" has no screen yet. */
  readonly hrefs?: Partial<Readonly<Record<TabKey, string>>>;
}

const DEFAULT_HREFS: Readonly<Record<TabKey, string>> = {
  home: '/',
  places: '/places/',
  people: '/messages/',
  plan: '/plan/',
  me: '/account/',
};

// 22px: the tab's own default icon slot is 16px, which reads as a speck on a
// phone at arm's length.
const ICON = { width: 22, height: 22, 'aria-hidden': true } as const;
const ICONS: Readonly<Record<TabKey, { icon: ReactNode; selected?: ReactNode }>> = {
  home: { icon: <HomeIcon {...ICON} /> },
  places: { icon: <PlacesIcon {...ICON} /> },
  people: { icon: <PeopleIcon {...ICON} /> },
  plan: { icon: <PlanIcon {...ICON} /> },
  me: { icon: <MeIcon {...ICON} />, selected: <MeIconFilled {...ICON} /> },
};

const ORDER: readonly TabKey[] = ['home', 'places', 'people', 'plan', 'me'];

const styles = stylex.create({
  dock: {
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
  row: { width: '100%', maxWidth: '560px', marginInline: 'auto' },
  tabs: { flexGrow: 1, minWidth: 0 },
  // §2.5: every target clears 48px; the label sits under its icon so five fit
  // at 320px without shrinking the words.
  tab: {
    flexDirection: 'column',
    gap: '2px',
    minHeight: '56px',
    paddingInline: '2px',
    fontSize: '13px',
  },
  // Tighter than HelpBar's own 12px so five tabs still clear 48px at 320px.
  help: { flexShrink: 0, minHeight: '48px', paddingInline: '4px' },
});

export function TabBar({ current, labels, helpLabel, label, hrefs }: TabBarProps) {
  const to = { ...DEFAULT_HREFS, ...hrefs };
  return (
    <footer {...stylex.props(styles.dock)}>
      <HStack gap={0} align="center" wrap="nowrap" xstyle={styles.row}>
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
              icon={ICONS[key].icon}
              selectedIcon={ICONS[key].selected}
              xstyle={styles.tab}
            />
          ))}
        </TabList>
        <HelpBar label={helpLabel} variant="compact" xstyle={styles.help} />
      </HStack>
    </footer>
  );
}
