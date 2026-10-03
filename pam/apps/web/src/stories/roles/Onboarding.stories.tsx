import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * Creating an account, one story per kind of person (D-253) — kept apart
 * from each role's Prototype, which only signs in (Will, 3 October). The real
 * screens in order, then Home as that role. A member joins from the phone;
 * a case manager and a program from their invite link (D-254). Any code works; nothing is sent or written. A super admin is
 * never onboarded through the app (the seeding script makes them).
 */
const meta = { title: 'Onboarding' } satisfies Meta;

export default meta;

export const Member: StoryObj = screen('member', 'Member', '/prototype/join/', { kind: 'member' });

/**
 * A case manager and a program arrive by an invite link (D-254): its Sign in,
 * the code, then About you with nothing to choose — no code to type, no
 * "which one fits you best" — and on to Home.
 */
export const CaseManager: StoryObj = screen('case-manager', 'Case manager', '/prototype/signin/', {
  invite: 'PAM-7Q4K',
  as: 'case-manager',
  next: 'join',
});

export const ProgramLead: StoryObj = screen('provider', 'Program lead', '/prototype/signin/', {
  invite: 'PAM-7Q4K',
  as: 'program',
  next: 'join',
});
