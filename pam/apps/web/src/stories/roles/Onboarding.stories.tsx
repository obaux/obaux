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

/**
 * An invite link that has run out (D-258): Sign in sees it has expired and
 * opens its own page — who sent it, and a way to ask for it to be renewed,
 * which reaches the super admin's Requests.
 */
export const ExpiredLink: StoryObj = screen('provider', 'Expired link', '/prototype/signin/', {
  invite: 'PAM-OLD1',
  as: 'program',
});

/**
 * A staff invite for a number that already has a Pam account (D-373): one
 * number is one account until the next phase, so Pam tells the person — not
 * the inviter — and asks for the invite to go to another number.
 */
export const NumberAlreadyInPam: StoryObj = screen('member', 'Number already in Pam', '/invite/in-use/');

/**
 * A member's number, invited to a program in their own city (D-374): add the
 * program to the account they have — one account, both sides.
 */
export const AddYourProgram: StoryObj = screen('member', 'Add your program to your account', '/invite/add/');

/** About Pam (D-259): what Pam is and how it helps each kind of person, from Sign in's footer. */
export const About: StoryObj = screen('member', 'About Pam', '/about/');
