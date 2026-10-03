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
import ConnectPage from '../../app/person/connect/page';
import PastTripsPage from '../../app/person/past/page';
import SavedByPage from '../../app/person/saved/page';
import PlacePage from '../../app/place/page';
import PlacesPage from '../../app/places/page';
import PointsPage from '../../app/points/page';
import PrivacyPage from '../../app/privacy/page';
import RemindersPage from '../../app/reminders/page';
import RequestsPage from '../../app/requests/page';
import SavedPage from '../../app/saved/page';
import SignInPage from '../../app/signin/page';
import { PrototypeSignIn } from './PrototypeSignIn';
import { PrototypeJoin } from './PrototypeJoin';
import TermsPage from '../../app/terms/page';
import { ProfileScreen } from '../../screens/ProfileScreen';
import { ViewAsView } from '../../screens/ViewAsView';
import { InviteView } from '../../screens/InviteView';
import { AddProgramView } from '../../screens/AddProgramView';
import { ProgramScreen } from '../../screens/ProgramView';
import NewTripPage from '../../app/trips/new/page';
import { ExploreScreen } from '../../screens/ExploreScreen';
import { TripsScreen } from '../../screens/TripsView';
import { HomeScreen } from '../../screens/HomeScreen';
import { LegalView } from '../../screens/LegalView';
import { LanguageView } from '../../screens/LanguageView';
import { DataCopyView, DeleteAccountView, PrivacyControlsView } from '../../screens/PrivacyViews';
import { HelpReportPlaceView, HelpSafetyView, HelpTopicsView } from '../../screens/HelpViews';
import { ConnectionProfileScreen, ConnectionsScreen } from '../../screens/ConnectionsScreen';
import { SavedScreen } from '../../screens/SavedView';
import { ThreadOptionsView, ThreadReportView } from '../../screens/ThreadOptionsViews';
import { MessagesScreen } from '../../screens/MessagesScreen';
import { HeaderActions } from '../shell/HeaderActions';
import { LocalTabBar } from '../shell/LocalTabBar';
import type { Role } from '@pam/config';
import { ROLES, type JourneyRole } from '../journeys/fixtures';
import type { PrototypeRoute } from './PrototypeApp';

const screen = (render: () => ReactNode): PrototypeRoute => ({ render });

/**
 * Every route the app has, each drawn by the page that ships. Since D-217
 * every one of them is on the redesign's templates; the redesign table below
 * only swaps in the tab screens that are not routed in the app yet.
 */
export const APP_ROUTES: Readonly<Record<string, PrototypeRoute>> = {
  '/': screen(() => <HomePage />),
  '/signin/': screen(() => <SignInPage />),
  // Where each role's prototype starts (D-253): Sign in, the code, Home.
  // Joining is the Onboarding stories' own route.
  '/prototype/signin/': screen(() => <PrototypeSignIn />),
  '/prototype/join/': screen(() => <PrototypeJoin />),
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
  '/person/connect/': screen(() => <ConnectPage />),
  '/person/past/': screen(() => <PastTripsPage />),
  '/person/saved/': screen(() => <SavedByPage />),
  '/account/': screen(() => <AccountPage />),
  '/help/': screen(() => <HelpPage />),
  '/privacy/': screen(() => <PrivacyPage />),
  '/terms/': screen(() => <TermsPage />),
  // Added with the nested-page template (D-213) — real routes in the app.
  '/legal/': screen(() => <LegalView />),
  '/language/': screen(() => <LanguageView />),
  '/legal/privacy/': screen(() => <PrivacyControlsView />),
  '/legal/privacy/copy/': screen(() => <DataCopyView />),
  '/legal/privacy/delete/': screen(() => <DeleteAccountView />),
  '/help/topics/': screen(() => <HelpTopicsView />),
  '/help/safety/': screen(() => <HelpSafetyView />),
  '/help/report-place/': screen(() => <HelpReportPlaceView />),
  '/connections/': screen(() => <ConnectionsScreen />),
  '/messages/thread/options/': screen(() => <ThreadOptionsView />),
  '/messages/thread/report/': screen(() => <ThreadReportView />),
  '/connections/person/': screen(() => <ConnectionProfileScreen />),
  '/view-as/': screen(() => <ViewAsView />),
  // D-218: Invite someone, All programs and Add a program, and a program
  // lead's own Program tab.
  '/invite/': screen(() => <InviteView />),
  '/programs/': screen(() => <ExploreScreen mode="programs" />),
  '/programs/new/': screen(() => <AddProgramView />),
  '/program/': screen(() => <ProgramScreen />),
  // D-225: planning a visit, from the + on Trips.
  '/trips/new/': screen(() => <NewTripPage />),
};

/**
 * The redesigned member app (D-210): today's screens where the redesign has
 * not reached yet, the new ones where it has, and Explore as home.
 */
export const REDESIGN_ROUTES: Readonly<Record<string, PrototypeRoute>> = {
  ...APP_ROUTES,
  // The first tab (D-212): Explore for a member, the caseload for a case
  // manager, who wants in for a program — whoever the story signed in.
  '/': screen(() => <HomeScreen />),
  // The old Places list is Explore now (D-216): a link from a screen the
  // redesign has not reached yet lands on Explore, not the old design.
  '/places/': screen(() => <HomeScreen />),
  '/trips/': screen(() => <TripsScreen />),
  // Saved and Messages on the tab-screen frame (D-213).
  '/saved/': screen(() => <SavedScreen />),
  '/messages/': screen(() => <MessagesScreen />),
  // Profile for whoever is signed in (D-217); the Account screen is gone
  // from the redesign (D-213), so its old address opens Profile too.
  '/profile/': screen(() => <ProfileScreen />),
  '/account/': screen(() => <ProfileScreen />),
  // A program's list is its Home now (D-212), so the old address opens it.
  '/interested/': screen(() => <HomeScreen />),
  // The old caseload-and-invites page is Invite someone now (D-218).
  '/admin/': screen(() => <InviteView />),
};

/**
 * Which bottom-bar tab a redesigned path belongs to; `null` hides the bar.
 * Only the five tab screens draw it (D-213): anything you tap into — a
 * place, a person, a conversation, Legal, Get help — is a nested screen on
 * the template, with its own way back and no bar, as in Will's references.
 */
export function tabFor(pathname: string) {
  switch (pathname) {
    case '/':
    case '/places/':
    case '/interested/':
      return 'explore' as const;
    case '/saved/':
      return 'saved' as const;
    case '/trips/':
      return 'trips' as const;
    case '/program/':
      return 'program' as const;
    case '/messages/':
      return 'messages' as const;
    case '/profile/':
    case '/account/':
      return 'profile' as const;
    default:
      return null;
  }
}

/**
 * The redesign's bottom bar, for whoever is signed in (D-212, D-218): each
 * role's own tabs (`tabsFor`), staff reading Home on the first. A super admin
 * previewing a role (D-108) gets that role's bar from the next screen on.
 * Nothing on screens that stand alone (`tabFor`).
 */
export function redesignChrome(role: JourneyRole) {
  const name = ROLES[role].profile?.first_name ?? '';
  return (pathname: string) => {
    const own = ROLES[role].profile?.role;
    if (!own) return null;
    const tab = tabFor(pathname);
    return tab ? <LocalTabBar current={tab} role={viewedRole(own)} name={name} /> : null;
  };
}

/** The role a super admin is previewing, if any — the same key `useViewAs` reads. */
function viewedRole(own: Role): Role {
  if (own !== 'super_admin') return own;
  try {
    const preview = sessionStorage.getItem('pam.view-as');
    return preview === 'member' || preview === 'admin' || preview === 'provider' ? preview : own;
  } catch {
    return own;
  }
}
