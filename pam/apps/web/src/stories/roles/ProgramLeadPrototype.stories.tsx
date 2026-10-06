import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The program lead's app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Program lead/Prototype' } satisfies Meta;

export default meta;

/**
 * Starts where a program arrives (D-254): Sign in opened from an invite
 * link — the black line saying what they were invited to be, and slides
 * about their own work. Then the code, then Home, signed in as this role.
 * Creating the account is its own story, under Onboarding.
 */
export const Prototype: StoryObj = screen('provider', 'Prototype', '/prototype/signin/', { invite: 'PAM-7Q4K', as: 'program' });
