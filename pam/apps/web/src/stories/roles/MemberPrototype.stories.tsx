import type { Meta, StoryObj } from '@storybook/nextjs';
import { screen } from './screen';

/**
 * The member app, clickable from the start (D-211, D-217): tap anything — a
 * card, a tab, Back, Help — and the screen it leads to appears, as on a
 * phone. Signed in against the pretend database; nothing reaches the live
 * project.
 */
// A fixed id (D-331): the title moved to Member/Prototype in D-325, which
// changed the id and broke every shared link to the member prototype.
// `id` keeps the old address, `member-app-prototype--prototype`.
const meta = { title: 'Member/Prototype', id: 'member-app-prototype' } satisfies Meta;

export default meta;

/**
 * Starts at Sign in (D-253): the number, then the code, then Home, signed in
 * as this role, where every tap goes where it would on a phone. Creating an
 * account is its own story, under Onboarding.
 */
export const Prototype: StoryObj = screen('member', 'Prototype', '/prototype/signin/');
