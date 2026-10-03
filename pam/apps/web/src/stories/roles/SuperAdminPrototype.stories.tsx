import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The super admin's app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Super admin/Prototype' } satisfies Meta;

export default meta;

/**
 * Starts at Sign in (D-249). A super admin is never onboarded through the app
 * (the seeding script makes them), so "Send me a code" goes straight Home.
 */
export const Prototype: StoryObj = screen('super-admin', 'Prototype', '/prototype/signin/');
