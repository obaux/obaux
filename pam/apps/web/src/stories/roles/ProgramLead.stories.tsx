import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen, screenWithControls } from './screen';
import { withSetup } from '../journeys/journey';

/**
 * A program lead's app, screen by screen (D-217, D-218). Their bar is Home
 * (who is coming in — day, week or month — with Invite someone in its + menu),
 * Program (their listing, with Edit), Messages and Profile. All programs and
 * Add a program are a Profile row away.
 */
const meta = { title: 'Program lead/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

export const Home: Story = screen('provider', 'Home — coming in', '/');

/*
 * Home for a lead who has just signed up (D-352): what the sign-up journey
 * lands on. The prototype above shows a program in use; these show it new.
 */
const soon = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
};
const bookedFor = (n: number, name: string, days: number, hour: number) => ({
  id: `added-story-${n}`,
  placeId: 'dummy-place-learning',
  placeName: 'Example Learning Center',
  category: 'education',
  lat: 39.95,
  lon: -75.16,
  startsAt: soon(days, hour),
  note: '',
  forMemberId: `dummy-m${n}`,
  forName: name,
});
export const HomeGetStarted: Story = withSetup(screen('provider', 'Home — getting started', '/'), {});
export const HomeProgramAdded: Story = withSetup(screen('provider', 'Home — getting started, program added', '/'), {
  done: ['program'],
});
export const HomeFolded: Story = withSetup(screen('provider', 'Home — first bookings, photo still to add', '/'), {
  done: ['program'],
  booked: [bookedFor(1, 'Marcus', 1, 10), bookedFor(2, 'Tanya', 2, 13), bookedFor(3, 'Luis', 3, 11)],
});
export const NotificationsNone: Story = withSetup(screen('provider', 'Notifications — none yet', '/notifications/'), {});
export const MessagesNone: Story = withSetup(screen('provider', 'Messages — none yet', '/messages/'), {});
export const CalendarPreview: Story = withSetup(screen('provider', 'Home — calendar preview', '/home/calendar/'), {});
export const Program: Story = screen('provider', 'Program', '/program/');
export const EditService: Story = screen('provider', 'Program — edit a service', '/program/service/', { id: 'service-ged' });
export const NewService: Story = screen('provider', 'Program — new service', '/program/service/');
export const Policies: Story = screen('provider', 'Policies for participants', '/program/policies/');
export const Policy: Story = screen('provider', 'A policy', '/program/policies/view/', { id: 'policy-confidentiality' });
export const Messages: Story = screen('provider', 'Messages', '/messages/');
export const Profile: Story = screen('provider', 'Profile', '/profile/');
export const Member: Story = screen('provider', 'A member', '/person/', { id: 'dummy-m1' });
export const MemberPolicies: Story = screen('provider', 'A member — policies signed', '/person/policies/', { id: 'dummy-m2' });
export const Invite: Story = screen('provider', 'Invite someone', '/invite/');
export const BookForMember: Story = screen('provider', 'Book a visit for a member', '/program/book/');
export const AddPerson: Story = screen('provider', 'Add a person', '/program/book/new/');
export const AllPrograms: Story = screen('provider', 'All programs', '/programs/');
export const AddProgram: Story = screen('provider', 'Add a program', '/programs/new/');
export const Notifications: Story = screen('provider', 'Notifications', '/notifications/');
export const Place: Story = screen('provider', 'A place', '/place/', { id: 'dummy-place-learning', from: 'explore' });
export const TextAlerts: Story = screen('provider', 'Text alerts', '/alerts/');
export const GetHelp: Story = screen('provider', 'Get help', '/help/');

/** Each sign-up screen, in order, and the `step` the prototype opens on (D-319). */
// Staff sign-up is three steps and ends Home (D-353): no program, no texts, no welcome.
const SIGN_UP_STEPS = {
  'About you': 'details',
  'What to expect': 'privacy',
} as const;
type SignUpStep = keyof typeof SIGN_UP_STEPS;

/**
 * Signing up, one screen at a time (D-319, Will, 6 October: "I don't see
 * sign up screens for program and case manager staff individual pages").
 * The Onboarding folder walks the whole flow; this opens on any step.
 */
type SignUpArgs = { step: SignUpStep };
export const SignUp: Story = screenWithControls<SignUpArgs>(
  'provider',
  'Sign up',
  '/prototype/join/',
  {
    args: { step: 'About you' },
    argTypes: { step: { control: 'select', options: ['About you', 'What to expect'] } },
  },
  (args) => ({ kind: 'provider', invite: 'PAM-7Q4K', step: SIGN_UP_STEPS[args.step] }),
);
