import type { Meta, StoryObj } from '@storybook/nextjs';
import { userEvent, within } from 'storybook/test';
import en from '@pam/config/locales/en.json';
import es from '@pam/config/locales/es.json';
import ptBR from '@pam/config/locales/pt-BR.json';
import zhCN from '@pam/config/locales/zh-CN.json';
import zhHK from '@pam/config/locales/zh-HK.json';
import ru from '@pam/config/locales/ru.json';
import ar from '@pam/config/locales/ar.json';
import { screen } from './screen';

/**
 * The super admin's app, screen by screen (D-217). Home is the requests
 * waiting on them (D-257); from a request they can look at the program it
 * describes and text the person, and in Messages they talk with staff
 * (D-262). Everyone and Programs are Profile rows.
 */
const meta = { title: 'Super admin/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('super-admin', 'Home — Requests', '/');
export const Messages: Story = screen('super-admin', 'Messages', '/messages/');
export const Profile: Story = screen('super-admin', 'Profile', '/profile/');
export const ReportedPlaces: Story = screen('super-admin', 'Reported places — Keep it or take it off', '/places/reported/');
/**
 * The states of a decision, for the fit audit (Lena): the last card is the one with the long name and the note, and each
 * story acts on it. The buttons are found by their words in the Language toolbar's locale; the dialog is in the page's
 * portal, not the canvas.
 */
const WORDS = { en, es, 'pt-BR': ptBR, 'zh-CN': zhCN, 'zh-HK': zhHK, ru, ar } as Record<string, Record<string, string>>;
const wordFor = (globals: Record<string, unknown>, key: string): string =>
  (WORDS[String(globals['locale'] ?? 'en')] ?? (en as Record<string, string>))[key] ?? key;
const reportedCard = screen('super-admin', 'Reported places', '/places/reported/');
export const ReportedPlacesConfirmRemove: Story = {
  ...reportedCard,
  name: 'Reported places — Take it off the list? (long name)',
  play: async ({ canvasElement, globals }) => {
    const takes = await within(canvasElement).findAllByRole('button', { name: wordFor(globals, 'places.reported.remove') });
    await userEvent.click(takes.at(-1)!);
  },
};
export const ReportedPlacesKept: Story = {
  ...reportedCard,
  name: 'Reported places — after Keep it (long name)',
  play: async ({ canvasElement, globals }) => {
    const keeps = await within(canvasElement).findAllByRole('button', { name: wordFor(globals, 'places.reported.keep') });
    await userEvent.click(keeps.at(-1)!);
    canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
  },
};
export const ReportedPlacesRemoved: Story = {
  ...reportedCard,
  name: 'Reported places — after Take it off the list (long name)',
  play: async ({ canvasElement, globals }) => {
    const takes = await within(canvasElement).findAllByRole('button', { name: wordFor(globals, 'places.reported.remove') });
    await userEvent.click(takes.at(-1)!);
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: wordFor(globals, 'places.reported.remove') }));
    canvasElement.ownerDocument.defaultView?.scrollTo(0, 0);
  },
};
export const ReportedPlacesFromTheBell: Story = screen('super-admin', 'Reported places, from the bell', '/places/reported/', {
  from: 'notifications',
});
export const Everyone: Story = screen('super-admin', 'Everyone', '/directory/');
// The page the "Reply by text" link in a help-request email opens (A28, D-524). The number is an invented one
// (555-01xx is never assigned); the story never sends, as no journey writes.
export const AnswerByText: Story = screen('super-admin', 'Answer a help request by text', '/reply/', {
  to: '+12155550142',
  // In a real link these ride after the `#`; Storybook has no such address, so it passes them as ordinary values.
  q: 'I signed up for the welding class but I cannot find where it meets. Can someone tell me?',
  at: '2026-10-15T14:05:00Z',
});
// A link with only the number: the number and the box, nothing above it.
export const AnswerByTextNumberOnly: Story = screen('super-admin', 'Answer a help request by text — a link with only the number', '/reply/', {
  to: '+12155550199',
});
export const Requests: Story = screen('super-admin', 'Staff requests', '/requests/');
export const RequestReview: Story = screen('super-admin', 'A request to review', '/requests/review/', { id: 'r-2' });
// The programs leaders have sent for Pam to check (D-386, part 6).
export const ProgramsToCheck: Story = screen('super-admin', 'Programs to check', '/programs/review/');
export const ProgramToCheckNew: Story = screen('super-admin', 'A new program to check (waiting four days)', '/programs/review/item/', { id: 'check-1' });
export const ProgramToCheckChange: Story = screen('super-admin', 'A change to a live program', '/programs/review/item/', { id: 'check-2' });
export const ProgramToCheckWithdrawn: Story = screen('super-admin', 'A request the leader deleted to start over', '/programs/review/item/', { id: 'check-3' });
export const ProgramToCheckSentAgain: Story = screen('super-admin', 'The request sent again', '/programs/review/item/', { id: 'check-4' });
export const RequestProgram: Story = screen('super-admin', 'A requested program', '/requests/program/', { id: 'r-2' });
export const Thread: Story = screen('super-admin', 'A conversation with a case manager', '/messages/thread/', {
  id: 'dummy-conv-dummy-a1-dummy-s1',
});
/** From a program's page, "Message Sandra" (D-349): a new thread with its lead. */
export const ThreadWithProgramLead: Story = screen('super-admin', 'A conversation with a program lead', '/messages/thread/', {
  id: 'dummy-conv-dummy-p1-dummy-s1',
  from: 'place',
  place: 'dummy-place-learning',
});
export const InvitesLog: Story = screen('super-admin', 'Invited people', '/invites/');
export const Invite: Story = screen('super-admin', 'Invite someone', '/invite/');
export const InviteOne: Story = screen('super-admin', 'A link for a member', '/invite/new/', { role: 'member' });
export const InviteCaseManager: Story = screen('super-admin', 'A link for a case manager', '/invite/new/', { role: 'admin' });
export const Person: Story = screen('super-admin', 'A person', '/person/', { id: 'dummy-m1' });
export const Notifications: Story = screen('super-admin', 'Notifications', '/notifications/');
export const Place: Story = screen('super-admin', 'A place', '/place/', { id: 'dummy-place-learning', from: 'explore' });
