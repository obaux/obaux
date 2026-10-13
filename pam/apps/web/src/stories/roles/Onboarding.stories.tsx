import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';
import { chooseAboutTab, showSlide } from '../support/showSlide';

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
 * The other two welcome lines a case manager and a program lead read on Sign in. A carousel shows
 * one slide at a time, so the stories above draw only the first; these scroll to the second and the
 * third, as a swipe does, so each line is drawn (and the language-fit audit measures it) in every
 * language. `onboarding.admin.2` and `onboarding.provider.3` are the lines that changed on 13 October.
 */
const CASE_MANAGER_SIGN_IN = ['case-manager', 'Case manager', '/prototype/signin/', { invite: 'PAM-7Q4K', as: 'case-manager', next: 'join' }] as const;
const PROGRAM_LEAD_SIGN_IN = ['provider', 'Program lead', '/prototype/signin/', { invite: 'PAM-7Q4K', as: 'program', next: 'join' }] as const;

export const CaseManagerSecondSlide: StoryObj = {
  ...screen(...CASE_MANAGER_SIGN_IN),
  name: 'Case manager, second slide',
  play: ({ canvasElement }) => showSlide(canvasElement, 1),
};
export const CaseManagerThirdSlide: StoryObj = {
  ...screen(...CASE_MANAGER_SIGN_IN),
  name: 'Case manager, third slide',
  play: ({ canvasElement }) => showSlide(canvasElement, 2),
};
export const ProgramLeadSecondSlide: StoryObj = {
  ...screen(...PROGRAM_LEAD_SIGN_IN),
  name: 'Program lead, second slide',
  play: ({ canvasElement }) => showSlide(canvasElement, 1),
};
export const ProgramLeadThirdSlide: StoryObj = {
  ...screen(...PROGRAM_LEAD_SIGN_IN),
  name: 'Program lead, third slide',
  play: ({ canvasElement }) => showSlide(canvasElement, 2),
};

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

/**
 * About Pam with a staff tab chosen, so the audit and a reader see the lines for a case manager and
 * for a program, not only the member's. The tab is chosen by its value, so this holds in every language;
 * the "second slide" and "third slide" ones also scroll to the lines that changed on 13 October.
 */
export const AboutCaseManagers: StoryObj = {
  ...screen('member', 'About Pam', '/about/'),
  name: 'About Pam, Case managers tab',
  play: ({ canvasElement }) => chooseAboutTab(canvasElement, 'admin'),
};
export const AboutCaseManagersSecondSlide: StoryObj = {
  ...screen('member', 'About Pam', '/about/'),
  name: 'About Pam, Case managers tab, second slide',
  play: async ({ canvasElement }) => {
    await chooseAboutTab(canvasElement, 'admin');
    await showSlide(canvasElement, 1);
  },
};
export const AboutPrograms: StoryObj = {
  ...screen('member', 'About Pam', '/about/'),
  name: 'About Pam, Programs tab',
  play: ({ canvasElement }) => chooseAboutTab(canvasElement, 'provider'),
};
export const AboutProgramsThirdSlide: StoryObj = {
  ...screen('member', 'About Pam', '/about/'),
  name: 'About Pam, Programs tab, third slide',
  play: async ({ canvasElement }) => {
    await chooseAboutTab(canvasElement, 'provider');
    await showSlide(canvasElement, 2);
  },
};
