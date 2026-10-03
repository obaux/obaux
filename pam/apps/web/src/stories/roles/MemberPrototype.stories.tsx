import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The member app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
const meta = { title: 'Member app/Prototype' } satisfies Meta;

export default meta;

/**
 * Starts at Sign in (D-248): pressing "Send me a code" goes straight to this
 * role's Home, signed in — so the whole app can be previewed from the door.
 */
export const SignIn: StoryObj = screen('member', 'Sign in', '/prototype/signin/');

export const Prototype: StoryObj = screen('member', 'Signed in', '/');

/** Not signed in yet: the app starts at Sign in. */
export const SignedOut: StoryObj = { ...screen('signed-out', 'Not signed in', '/signin/') };
