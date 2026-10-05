import type { Meta, StoryObj } from '@storybook/nextjs';
import { CONVO_ID } from '../journeys/fixtures';
import { screen } from './screen';

/**
 * The member app, screen by screen (D-217) — every one on the redesign's two
 * templates, and every one clickable. Tab screens first, in the bar's order;
 * then the screens you tap into; then signing in, which comes before all of
 * it. To walk the app from the start, open Member app › Prototype.
 */
const meta = { title: 'Member app/Screens' } satisfies Meta;

export default meta;
type Story = StoryObj;

// The five tabs.
export const Explore: Story = screen('member', 'Explore', '/');
export const Saved: Story = screen('member', 'Saved', '/saved/');
export const Trips: Story = screen('member', 'Trips', '/trips/');
export const Messages: Story = screen('member', 'Messages', '/messages/');
export const Profile: Story = screen('member', 'Profile', '/profile/');

// Screens you tap into (the nested-page template, D-213).
export const NewTrip: Story = screen('member', 'New trip', '/trips/new/');
export const Place: Story = screen('member', 'A place', '/place/', { id: 's1', from: 'explore' });
// A place with a visit booked, opened from Trips: policies on top (D-271).
export const PlaceFromTrip: Story = screen('member', 'A place, from a trip', '/place/', {
  id: 'dummy-place-learning',
  from: 'trips',
});
// A program's policies, read and signed by a member (D-270).
export const PlacePolicies: Story = screen('member', 'Policies to sign', '/place/policies/', {
  id: 'dummy-place-learning',
});
export const PlacePolicy: Story = screen('member', 'A policy to sign', '/place/policies/view/', {
  place: 'dummy-place-learning',
  id: 'policy-confidentiality',
});
export const ReportPlace: Story = screen('member', 'Report a place', '/flag/', { place: 's1' });
export const Conversation: Story = screen('member', 'A conversation', '/messages/thread/', { id: CONVO_ID });
export const ConversationOptions: Story = screen('member', 'Conversation options', '/messages/thread/options/', {
  id: CONVO_ID,
});
export const Notifications: Story = screen('member', 'Notifications', '/notifications/');
export const Connections: Story = screen('member', 'Connections', '/connections/');
export const ConnectionProfile: Story = screen('member', 'A connection', '/connections/person/', { id: 'dummy-p1' });
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
export const SignUp: Story = screen('signed-out', 'Sign up', '/join/');
