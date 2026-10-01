import type { ReactNode } from 'react';
import HomePage from '../../app/page';
import AccountPage from '../../app/account/page';
import AdminPage from '../../app/admin/page';
import DirectoryPage from '../../app/directory/page';
import FlagPage from '../../app/flag/page';
import HelpPage from '../../app/help/page';
import InterestedPage from '../../app/interested/page';
import JoinPage from '../../app/join/page';
import MessagesPage from '../../app/messages/page';
import MessageThreadPage from '../../app/messages/thread/page';
import NotificationsPage from '../../app/notifications/page';
import PersonPage from '../../app/person/page';
import PlacePage from '../../app/place/page';
import PlacesPage from '../../app/places/page';
import PointsPage from '../../app/points/page';
import PrivacyPage from '../../app/privacy/page';
import RemindersPage from '../../app/reminders/page';
import RequestsPage from '../../app/requests/page';
import SavedPage from '../../app/saved/page';
import SignInPage from '../../app/signin/page';
import TermsPage from '../../app/terms/page';
import { ProfileView } from '../../screens/ProfileView';
import { ConnectionsView } from '../../screens/ConnectionsView';
import { TripsView } from '../../screens/TripsView';
import { HomeScreen } from '../../screens/HomeScreen';
import { HeaderActions } from '../shell/HeaderActions';
import { LocalTabBar } from '../shell/LocalTabBar';
import { ROLES, type JourneyRole } from '../journeys/fixtures';
import { prototypeRouter, type PrototypeRoute } from './PrototypeApp';

const screen = (render: () => ReactNode): PrototypeRoute => ({ render });

/** Every route the app has today, exactly as it ships. */
export const TODAY_ROUTES: Readonly<Record<string, PrototypeRoute>> = {
  '/': screen(() => <HomePage />),
  '/signin/': screen(() => <SignInPage />),
  '/join/': screen(() => <JoinPage />),
  '/reminders/': screen(() => <RemindersPage />),
  '/places/': screen(() => <PlacesPage />),
  '/place/': screen(() => <PlacePage />),
  '/saved/': screen(() => <SavedPage />),
  '/flag/': screen(() => <FlagPage />),
  '/points/': screen(() => <PointsPage />),
  '/notifications/': screen(() => <NotificationsPage />),
  '/messages/': screen(() => <MessagesPage />),
  '/messages/thread/': screen(() => <MessageThreadPage />),
  '/admin/': screen(() => <AdminPage />),
  '/directory/': screen(() => <DirectoryPage />),
  '/requests/': screen(() => <RequestsPage />),
  '/interested/': screen(() => <InterestedPage />),
  '/person/': screen(() => <PersonPage />),
  '/account/': screen(() => <AccountPage />),
  '/help/': screen(() => <HelpPage />),
  '/privacy/': screen(() => <PrivacyPage />),
  '/terms/': screen(() => <TermsPage />),
};

/**
 * The redesigned member app (D-210): today's screens where the redesign has
 * not reached yet, the new ones where it has, and Explore as home.
 */
export const REDESIGN_ROUTES: Readonly<Record<string, PrototypeRoute>> = {
  ...TODAY_ROUTES,
  // The first tab (D-212): Explore for a member, the caseload for a case
  // manager, who wants in for a program — whoever the story signed in.
  '/': screen(() => <HomeScreen />),
  '/trips/': screen(() => <TripsView headerActions={<HeaderActions />} />),
  '/profile/': screen(() => (
    <ProfileView
      name="Marcus"
      role="member"
      points={400}
      savedCount={3}
      connectionsCount={3}
      remindersOn={false}
      headerActions={<HeaderActions />}
      onSignOut={() => prototypeRouter.replace('/signin/')}
    />
  )),
  '/connections/': screen(() => (
    <ConnectionsView
      connections={[
        { id: 'c1', firstName: 'Teresa', role: 'admin' },
        { id: 'c2', firstName: 'Alice', role: 'provider', programName: 'Riverside Learning Center' },
        { id: 'c3', firstName: 'Darnell', role: 'provider', programName: 'Philadelphia Works — Center City' },
      ]}
    />
  )),
};

/** Which bottom-bar tab a redesigned path belongs to; `null` hides the bar. */
export function tabFor(pathname: string) {
  switch (pathname) {
    case '/':
    case '/places/':
    case '/place/':
    case '/person/':
    case '/admin/':
    case '/interested/':
      return 'explore' as const;
    case '/saved/':
      return 'saved' as const;
    case '/trips/':
      return 'trips' as const;
    case '/messages/':
      return 'messages' as const;
    case '/profile/':
    case '/connections/':
    case '/account/':
      return 'profile' as const;
    default:
      // The conversation pins its own composer to the bottom (D-192), and
      // sign-in, sign-up, help and the legal pages stand alone.
      return null;
  }
}

/**
 * The redesign's bottom bar, for whoever is signed in (D-212): staff read
 * Home on the first tab. Nothing on screens that stand alone (`tabFor`).
 */
export function redesignChrome(role: JourneyRole) {
  const isHome = role === 'case-manager' || role === 'provider';
  const name = ROLES[role].profile?.first_name ?? '';
  return (pathname: string) => {
    if (role === 'signed-out') return null;
    const tab = tabFor(pathname);
    return tab ? <LocalTabBar current={tab} isHome={isHome} name={name} /> : null;
  };
}
