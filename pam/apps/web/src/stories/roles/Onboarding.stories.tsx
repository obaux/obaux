import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * Creating an account, one story per kind of person (D-253) — kept apart
 * from each role's Prototype, which only signs in (Will, 3 October). The real
 * join screens in order: the phone, the code, About you, (a program lead's
 * program), what PAM shares, (a member's texts), and the welcome, then Home
 * as that role. Any code works; nothing is sent or written. A super admin is
 * never onboarded through the app (the seeding script makes them).
 */
const meta = { title: 'Onboarding' } satisfies Meta;

export default meta;

export const Member: StoryObj = screen('member', 'Member', '/prototype/join/', { kind: 'member' });

export const CaseManager: StoryObj = screen('case-manager', 'Case manager', '/prototype/join/', { kind: 'admin' });

export const ProgramLead: StoryObj = screen('provider', 'Program lead', '/prototype/join/', { kind: 'provider' });
