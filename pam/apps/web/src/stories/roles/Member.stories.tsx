import type { Meta, StoryObj } from '@storybook/nextjs';
import { CONVO_ID } from '../journeys/fixtures';
import { screen, screenWithControls } from './screen';

/**
 * The member app, screen by screen (D-217) — every one on the redesign's two
 * templates, and every one clickable. Tab screens first, in the bar's order;
 * then the screens you tap into; then signing in, which comes before all of
 * it. To walk the app from the start, open Member › Prototype.
 *
 * Three folders (D-325, Will, 6 October): **Created** is a member who signed
 * up from the phone — every screen lives here; **Invited by program** and
 * **Invited by case manager** hold only the screens that path changes.
 */
const meta = { title: 'Member/Created' } satisfies Meta;

export default meta;
type Story = StoryObj;

// The five tabs.
export const Explore: Story = screen('member', 'Explore', '/');
export const Saved: Story = screen('member', 'Saved', '/saved/');
export const Trips: Story = screen('member', 'Trips', '/trips/');
// Just booked, with policies still to sign: the banner on top (D-327).
export const TripsJustBooked: Story = screen('member', 'Trips — just booked', '/trips/', { added: 'dummy-trip-1' });
export const Messages: Story = screen('member', 'Messages', '/messages/');
export const Profile: Story = screen('member', 'Profile', '/profile/');
/** A member who also works at a program (D-374): pick which side to use Pam as. */
export const UseAs: Story = screen('member', 'Use Pam as — member and program', '/use-as/');

// Screens you tap into (the nested-page template, D-213).
export const NewTrip: Story = screen('member', 'New trip', '/trips/new/');
/*
 * A place, as a member sees it (Will, 5 October, D-305: "one storybook story
 * with parameters to switch"). Four kinds (D-313):
 *   - Place profile: services to pick from, then About, then the rows, and
 *     "Plan a trip" once one is picked.
 *   - No services: the same page without the cards; Plan a trip straight away.
 *   - Drop-in: a program that meets on a schedule — "When to come", no
 *     booking, Get directions at the foot.
 *   - Visit profile: a visit booked — "Your next visit" and Change
 *     appointment on top, the visit's service, then address and hours.
 * A new message from the program can wait on the first and last, shown as
 * the "New message" row with a pink dot. Each combination is a real example
 * place, so what is on screen is what the app would show for it.
 */
type PlaceProfileArgs = {
  profile: 'Place profile' | 'No services' | 'Drop-in' | 'Visit profile';
  newMessage: boolean;
};
const PLACE_FOR: Record<string, Record<string, string>> = {
  'Place profile|false': { id: 'dummy-place-library', from: 'explore' },
  'Place profile|true': { id: 'dummy-place-learning', from: 'explore' },
  'No services|false': { id: 'dummy-place-money', from: 'explore' },
  'No services|true': { id: 'dummy-place-money', from: 'explore' },
  'Drop-in|false': { id: 'dummy-place-family', from: 'explore' },
  'Drop-in|true': { id: 'dummy-place-food', from: 'explore' },
  'Visit profile|true': { id: 'dummy-place-learning', from: 'explore', trip: 'dummy-trip-1' },
  'Visit profile|false': { id: 'dummy-place-workforce', from: 'explore', trip: 'dummy-trip-2' },
};
export const PlaceProfile: Story = screenWithControls<PlaceProfileArgs>(
  'member',
  'Place profile',
  '/place/',
  {
    args: { profile: 'Place profile', newMessage: false },
    argTypes: {
      profile: { control: 'inline-radio', options: ['Place profile', 'No services', 'Drop-in', 'Visit profile'] },
      newMessage: { control: 'boolean', name: 'New message from the program' },
    },
  },
  (args) => PLACE_FOR[`${args.profile}|${args.newMessage}`]!,
);
// Booked (D-333): the trip, and Bring a friend folded under it.
export const TripBooked: Story = screen('member', 'Trip booked', '/trips/new/', { booked: 'dummy-trip-1' });
// A program's policies, read and signed by a member (D-270).
export const PlacePolicies: Story = screen('member', 'Policies to sign', '/place/policies/', {
  id: 'dummy-place-learning',
});
export const PlacePolicy: Story = screen('member', 'A policy to sign', '/place/policies/view/', {
  place: 'dummy-place-learning',
  id: 'policy-confidentiality',
});
export const ReportPlace: Story = screen('member', 'Report a place', '/flag/', { place: 'dummy-place-learning' });
export const Conversation: Story = screen('member', 'A conversation', '/messages/thread/', { id: CONVO_ID });
/** With a program (D-276, D-400, D-411): the booked visit pinned under the name, compact; the header as on every nested screen, no fade. */
export const ConversationWithAProgram: Story = screen('member', 'A conversation with a program', '/messages/thread/', {
  id: 'dummy-conv-dummy-m1-dummy-p1',
});
/**
 * A file Pam can't send (D-409): pasted or picked, a GIF — the alert banner in
 * the box, shaken once. Paste or pick another wrong file to see it shake again.
 */
export const ConversationFileRefused: Story = {
  ...screen('member', "A conversation — a file Pam can't send", '/messages/thread/', { id: CONVO_ID }),
  play: async ({ canvasElement }) => {
    const box = await new Promise<HTMLElement>((resolve) => {
      const look = () => {
        const el = canvasElement.querySelector<HTMLElement>('.astryx-chat-composer-input [contenteditable="true"]');
        if (el) resolve(el);
        else setTimeout(look, 100);
      };
      look();
    });
    const data = new DataTransfer();
    data.items.add(new File(['GIF89a'], 'dance.gif', { type: 'image/gif' }));
    box.focus();
    box.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data }));
  },
};
/** Everything shared in a conversation, from its ⋯ (D-402). */
export const ConversationFiles: Story = screen('member', 'Stuff shared', '/messages/thread/files/', { id: CONVO_ID });
export const ConversationOptions: Story = screen('member', 'Conversation options', '/messages/thread/options/', {
  id: CONVO_ID,
});
/** Reporting the last message (D-177): says who sees it — "Pam and your guide" (D-427). */
export const ReportMessage: Story = screen('member', 'Report a message', '/messages/thread/report/', {
  id: CONVO_ID,
});
export const Notifications: Story = screen('member', 'Notifications', '/notifications/');
export const Connections: Story = screen('member', 'Connections', '/connections/');
export const Points: Story = screen('member', 'Points', '/points/');
export const Reminders: Story = screen('member', 'Text reminders', '/reminders/');
export const TextAlerts: Story = screen('member', 'Text alerts', '/alerts/');
export const Language: Story = screen('member', 'Language', '/language/');
export const GetHelp: Story = screen('member', 'Get help', '/help/');
export const HelpTopics: Story = screen('member', 'What we can help with', '/help/topics/');
export const HelpSafety: Story = screen('member', 'Your safety', '/help/safety/');
export const HelpReportPlace: Story = screen('member', 'Help — report a place', '/help/report-place/');
export const Legal: Story = screen('member', 'Legal', '/legal/');
export const WhatOthersCanSee: Story = screen('member', 'What others can see', '/legal/privacy/');
export const Terms: Story = screen('member', 'Terms', '/terms/');
export const Privacy: Story = screen('member', 'Privacy policy', '/privacy/');

// Before any of it.
export const SignIn: Story = screen('signed-out', 'Sign in', '/signin/');
// Sign up, step by step, is below (D-319); the whole walk, from the phone, here.
export const SignUpWalk: Story = screen('member', 'Sign up — the whole walk', '/prototype/join/', { kind: 'member' });

/** Each sign-up screen, in order, and the `step` the prototype opens on (D-319). */
const SIGN_UP_STEPS = {
  'About you': 'details',
  'What Pam shares': 'privacy',
  Texts: 'texts',
  Welcome: 'done',
} as const;
type SignUpStep = keyof typeof SIGN_UP_STEPS;

/**
 * Signing up, one screen at a time (D-319, Will, 6 October: "I don't see
 * sign up screens for program and case manager staff individual pages").
 * The Onboarding folder walks the whole flow; this opens on any step.
 */
type SignUpArgs = { step: SignUpStep };
export const SignUp: Story = screenWithControls<SignUpArgs>(
  'member',
  'Sign up',
  '/prototype/join/',
  {
    args: { step: 'About you' },
    argTypes: { step: { control: 'select', options: ['About you', 'What Pam shares', 'Texts', 'Welcome'] } },
  },
  (args) => ({ kind: 'member', step: SIGN_UP_STEPS[args.step] }),
);
