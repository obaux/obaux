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
 * Starts at Sign in (D-253): the number, then the code, then Home, signed in
 * as this role, where every tap goes where it would on a phone. Creating an
 * account is its own story, under Onboarding.
 */
export const Prototype: StoryObj = screen('provider', 'Prototype', '/prototype/signin/');
